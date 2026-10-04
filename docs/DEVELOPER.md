# Montana - Tài liệu cho developer

Tài liệu này mô tả kiến trúc, mô hình dữ liệu, thuật toán đồng bộ và cách mở rộng Montana. Mọi mô tả bám sát code hiện tại (đường dẫn tính từ thư mục gốc dự án). Hướng dẫn cài đặt cho người dùng cuối nằm ở `README.md`.

## Mục lục

1. [Tổng quan và kiến trúc](#1-tổng-quan-và-kiến-trúc)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [Mô hình dữ liệu](#3-mô-hình-dữ-liệu)
4. [Store API](#4-store-api)
5. [Thuật toán đồng bộ](#5-thuật-toán-đồng-bộ)
6. [API contract](#6-api-contract)
7. [Backend Code.gs](#7-backend-codegs)
8. [Hướng dẫn mở rộng](#8-hướng-dẫn-mở-rộng)
9. [UI conventions](#9-ui-conventions)
10. [Kiểm thử](#10-kiểm-thử)
11. [Việc còn tồn đọng / TODO](#11-việc-còn-tồn-đọng--todo)

---

## 1. Tổng quan và kiến trúc

Stack: Vite 8, React 19, TypeScript, Tailwind v4, recharts 3, react-router-dom 7 (`HashRouter`). Không có server riêng: dữ liệu sống trong `localStorage` của trình duyệt và (tuỳ chọn) được đồng bộ với một Google Sheet của chính người dùng qua Google Apps Script Web App.

```
┌────────────────────┐  useStore / upsert / remove   ┌──────────────────────────┐
│  React (pages,     │ ────────────────────────────► │  src/lib/store.ts        │
│  components)       │ ◄──────────────────────────── │  state = tables + dirty  │
└────────────────────┘   useSyncExternalStore        │        + settings + sync │
                                                     └───────┬──────────────────┘
                                                             │ persist() mỗi lần setState
                                                             ▼
                                              localStorage["montana:v1"]
                                                             │
                     sync(): push dirty rows / pull all      │  fetch POST (text/plain, JSON)
                                                             ▼
                                        ┌─────────────────────────────────┐
                                        │ Apps Script Web App (Code.gs)   │
                                        │ doPost -> handle_ -> LockService │
                                        └───────────────┬─────────────────┘
                                                        │ SpreadsheetApp
                                                        ▼
                                        Google Sheet: 6 tab (accounts, categories, transactions,
                                        assetCategories, assets, assetSnapshots)
```

Nguyên tắc: **UI chỉ đọc/ghi qua store**, không bao giờ gọi mạng trực tiếp. Mọi thao tác ghi vào localStorage trước (offline-first), rồi sync nền.

Vì sao Apps Script:
- Không cần server, không cần OAuth flow phía client (script chạy dưới quyền chủ Sheet, `executeAs: USER_DEPLOYING`), miễn phí, dữ liệu nằm trong Sheet của người dùng nên xem/sửa/backup bằng tay được.
- Đổi lại: bảo mật chỉ dựa vào một token bí mật (Web App mở `ANYONE_ANONYMOUS`), và có giới hạn quota/độ trễ của Apps Script.

Vì sao `HashRouter` + `base: './'` (`vite.config.ts`): output `dist/` là file tĩnh, chạy được ở mọi nơi (GitHub Pages ở sub-path `/repo/`, `file`-like hosting, thư mục con của Apache/Nginx) mà không cần rewrite rule phía server. `HashRouter` giữ route sau dấu `#` nên server không bao giờ thấy đường dẫn con; `base: './'` làm mọi URL asset trong `dist/index.html` thành tương đối (`./assets/...`, `./favicon.svg`).

---

## 2. Cấu trúc thư mục

| Đường dẫn | Vai trò |
|---|---|
| `index.html` | Entry HTML của Vite (`lang="vi"`, mount `#root`). |
| `vite.config.ts` | `base: './'`, plugin react + `@tailwindcss/vite`, `chunkSizeWarningLimit: 1000`. |
| `tsconfig.app.json` | TS strict-ish cho `src/` (`noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `verbatimModuleSyntax`). Build chạy `tsc -b`. |
| `.oxlintrc.json` | Cấu hình oxlint (`react/rules-of-hooks` error, `react/only-export-components` warn). |
| `public/` | Asset tĩnh copy nguyên vào `dist/` (`favicon.svg`, `icons.svg`). |
| `src/main.tsx`, `src/index.css` | Bootstrap React, import Tailwind. |
| `src/App.tsx` | `HashRouter`, mảng `NAV` (mục có `mobile: false`, hiện là Danh mục, bị ẩn khỏi bottom nav mobile; truy cập qua link "Danh mục" ở trang Thu chi), sidebar (desktop) + bottom nav (mobile), `SyncBadge`, các trigger sync (load, focus, online). |
| `src/lib/types.ts` | Kiểu bản ghi, `Tables`, `TABLE_NAMES`, `SHEET_COLUMNS`, kiểu `ApiRequest`/`ApiResponse`. Nguồn sự thật của data contract. |
| `src/lib/store.ts` | Store ngoài React: state, localStorage, migration seed `accounts`, `useStore`, `useTable`, `upsert`, `remove`, `importTables`, sync. |
| `src/lib/accounts.ts` | Toán số dư Nguồn tiền dùng chung (xem mục 4). |
| `src/lib/defaults.ts` | Dữ liệu mặc định với id cố định: `DEFAULT_CATEGORIES`, `DEFAULT_ASSET_CATEGORIES`, `DEFAULT_ACCOUNTS`, `DEFAULT_ACCOUNT_ID` (`acc-cash`). |
| `src/lib/format.ts` | `formatVND`, `formatNumber`, `formatPercent`, `parseMoney`, `today`, `monthOf`, `formatDate`. |
| `src/components/ui/index.tsx` | Primitive UI dùng chung: `Card`, `Button`, `Field`, `Input`, `Select`, `MoneyInput`, `Modal`, `EmptyState`. |
| `src/components/dashboard/` | `Charts.tsx` (Pie/Bar recharts), `StatCard.tsx`, `compact.ts` (`formatCompact`; re-export helper tháng từ `lib/format.ts`). |
| `src/components/accounts/` | `AccountCard` (thẻ số dư + nút Chuyển tiền/Lịch sử/Sửa), `AccountForm` (thêm/sửa/lưu trữ/xoá nguồn tiền). |
| `src/components/expenses/` | `TransactionForm` (có chế độ chuyển tiền và nhớ nguồn tiền dùng gần nhất), `CategoryForm`, `CategoryDot`, `TypeToggle` (`allowTransfer`), `MonthPicker`. |
| `src/components/assets/` | `AllocationCard`, `AssetFormModal`, `AssetGroups` (nhận thêm `accounts` chỉ đọc trong mỗi nhóm), `CategoriesModal`, `HistoryCard`, `QuickValueModal`, `SummaryCards`, `utils.ts` (`saveAsset`, `saveSnapshot`, `buildHistory` có tham số `extra` để cộng số dư nguồn tiền...). |
| `src/components/settings/` | `ConnectionCard` (URL, token, test, sync), `DataTools` (xuất/nhập JSON, CSV, xoá dữ liệu), `dataIO.ts` (xuất CSV có cột Nguồn tiền/Đến). |
| `src/pages/` | `Dashboard`, `Transactions`, `Accounts`, `Categories`, `Assets`, `Settings`, `Guide` (mỗi file = một route). |
| `apps-script/Code.gs` | Backend Apps Script (dán vào Sheet, xem mục 7). |
| `apps-script/appsscript.json` | Manifest: timezone `Asia/Ho_Chi_Minh`, runtime V8, webapp `USER_DEPLOYING` + `ANYONE_ANONYMOUS`. |
| `scripts/test-apps-script.cjs` | Test backend bằng mock (mục 10). |
| `scripts/seed.html` | Trang nạp dữ liệu mẫu vào localStorage cho UI smoke test. |
| `docs/DEVELOPER.md` | Tài liệu này. |
| `dist/` | Output build (bị `.gitignore`). |

---

## 3. Mô hình dữ liệu

Định nghĩa trong `src/lib/types.ts`. Mỗi bảng tương ứng một tab Sheet cùng tên; dòng 1 của tab là tên field theo thứ tự `SHEET_COLUMNS`.

Quy ước chung (`BaseRecord`):

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `id` | `string` | UUID từ `crypto.randomUUID()` (`newId()`), riêng bản ghi mặc định dùng id cố định (xem dưới). |
| `updatedAt` | `string` (ISO 8601) | Mốc last-write-wins (LWW). Mọi `upsert`/`remove` đặt lại bằng `new Date().toISOString()`. |
| `deleted` | `boolean?` | Xoá mềm: `remove()` chỉ đặt `deleted: true`, để việc xoá lan sang thiết bị khác. `useTable` lọc các bản ghi này ra. |

### Các bảng

**`accounts`** (Nguồn tiền): `name: string`, `kind: 'cash' | 'bank' | 'ewallet' | 'credit'` (`AccountKind`), `openingBalance: number` (VND, **có thể âm**, thẻ tín dụng đang nợ thì âm), `color: string`, `icon: string`, `archived: boolean` (ẩn khỏi danh sách chọn và khỏi tổng; khác `deleted`).

**`categories`** (thu/chi): `name: string`, `type: 'expense' | 'income'`, `parentId?: string` (rỗng/thiếu = danh mục cấp cao nhất; danh mục con chỉ trỏ tới danh mục cấp cao nhất), `color: string`, `icon: string`, `budget: number` (VND/tháng, 0 = không đặt; chỉ có nghĩa với `expense`).

**`transactions`**: `date: string` (`YYYY-MM-DD`), `type: TransactionType` (`'expense' | 'income' | 'transfer'`; `TxType` = chỉ hai giá trị đầu và vẫn là kiểu của `Category.type`), `amount: number` (VND, luôn dương), `categoryId: string`, `accountId: string`, `toAccountId: string`, `note: string`.

- `accountId` là nguồn tiền của giao dịch (với chuyển tiền là nguồn **đi**). `''` (dòng cũ, tạo trước khi có Nguồn tiền) nghĩa là nguồn mặc định `acc-cash`; **không ghi lại dữ liệu cũ**, quy ước đọc qua `txAccountId(t)`.
- `type: 'transfer'`: `accountId` -> `toAccountId`, `categoryId = ''`. Với thu/chi `toAccountId = ''`.
- Chuyển tiền **không** tính vào thống kê thu/chi và ngân sách (`Dashboard` bỏ qua `transfer`; ba ô tổng của `Transactions` lọc bằng `isIncomeOrExpense`). Mọi báo cáo thu/chi mới phải lọc tương tự.

**`assetCategories`** (loại tài sản): `name: string`, `color: string`, `targetPercent: number` (0-100, 0 = không đặt).

**`assets`**: `name: string`, `categoryId: string` (trỏ `assetCategories.id`), `quantity: number`, `unit: string`, `costBasis: number` (tổng vốn bỏ vào, VND), `currentValue: number` (giá trị thị trường hiện tại, VND), `note: string`.

**`assetSnapshots`** (lịch sử giá trị): `assetId: string`, `date: string` (`YYYY-MM-DD`), `value: number`.

`Tables` là object `{ accounts, categories, transactions, assetCategories, assets, assetSnapshots }`; `TableName = keyof Tables`; `RecordOf<T>` = kiểu phần tử của bảng `T`; `TABLE_NAMES` là mảng thứ tự duyệt.

### SHEET_COLUMNS

```ts
export const SHEET_COLUMNS: { [K in TableName]: (keyof RecordOf<K>)[] } = {
  accounts:        ['id','name','kind','openingBalance','color','icon','archived','updatedAt','deleted'],
  categories:      ['id','name','type','parentId','color','icon','budget','updatedAt','deleted'],
  transactions:    ['id','date','type','amount','categoryId','accountId','toAccountId','note','updatedAt','deleted'],
  assetCategories: ['id','name','color','targetPercent','updatedAt','deleted'],
  assets:          ['id','name','categoryId','quantity','unit','costBasis','currentValue','note','updatedAt','deleted'],
  assetSnapshots:  ['id','assetId','date','value','updatedAt','deleted'],
}
```

Kiểu `(keyof RecordOf<K>)[]` giúp TypeScript bắt lỗi gõ sai tên field phía client. **Bản sao trong `apps-script/Code.gs` không được kiểm tra bởi compiler**, phải sửa tay cả hai chỗ (xem mục 8).

### Dữ liệu mặc định (seed)

`src/lib/defaults.ts` có 12 `categories` (id `cat-food`, `cat-salary`, ...), 6 `assetCategories` (id `acat-cash`, `acat-savings`, `acat-stock`, `acat-gold`, `acat-crypto`, `acat-realestate`) và 1 `accounts` (`DEFAULT_ACCOUNTS`: `acc-cash` "Tiền mặt", `kind: 'cash'`, `openingBalance: 0`; `DEFAULT_ACCOUNT_ID = 'acc-cash'`). Ở lần chạy đầu (không có `montana:v1`), `load()` seed chúng với **`updatedAt = new Date(0).toISOString()` (epoch 0)** và đánh dấu dirty.

Lý do dùng id cố định + epoch 0: nếu hai thiết bị cùng chạy lần đầu, cả hai đều tạo `cat-food`... với cùng id, nên khi sync chúng **gộp** thành một dòng thay vì nhân đôi. Epoch 0 đảm bảo bất kỳ chỉnh sửa thật nào của người dùng (đổi tên, đặt budget) đều mới hơn bản seed và thắng LWW, bất kể thiết bị nào seed sau.

**Migration state cũ:** `load()` đọc `montana:v1` đã lưu trước khi có Nguồn tiền: nếu `saved.tables.accounts` rỗng/thiếu thì seed `DEFAULT_ACCOUNTS` (epoch 0) và đánh dấu dirty; đồng thời chuẩn hoá mọi transaction cũ thành `accountId ?? ''`, `toAccountId ?? ''` (không gán `acc-cash` vào dữ liệu, chỉ đọc qua `txAccountId`).

---

## 4. Store API

`src/lib/store.ts` là store tự viết (không Redux/Zustand), state là object bất biến: `State = { tables, dirty, settings, sync }`.

- `tables: Tables`
- `dirty: Record<TableName, string[]>`: id đã đổi cục bộ kể từ lần push thành công gần nhất.
- `settings: { apiUrl, token, autoSync }` (mặc định `autoSync: true`).
- `sync: { status: 'idle'|'syncing'|'error', lastSyncAt, error }`.

Khoá localStorage: `montana:v1`. `persist()` ghi `{ tables, dirty, settings, lastSyncAt }` sau **mỗi** `setState` (trạng thái `syncing`/`error` không được lưu). Lỗi quota/private mode bị nuốt, app tiếp tục chạy trong bộ nhớ.

### `useStore(selector)`

```ts
const status = useStore((s) => s.sync.status)          // primitive: OK
const settings = useStore((s) => s.settings)           // tham chiếu có sẵn trong state: OK
const pending = useStore(pendingCount)                 // trả number: OK
```

Hook là `useSyncExternalStore(subscribe, () => selector(state))`. React gọi `getSnapshot` nhiều lần mỗi render và so sánh kết quả bằng `Object.is`; nếu hai lần gọi liên tiếp trả về giá trị khác nhau, React coi store "đã đổi" và render lại vô hạn (cảnh báo "The result of getSnapshot should be cached" / "Maximum update depth exceeded"). Vì vậy **selector phải trả primitive hoặc một tham chiếu ổn định đã nằm sẵn trong state**. Tuyệt đối không tạo object/mảng mới trong selector:

```ts
// SAI: filter/map/{...} tạo tham chiếu mới mỗi lần gọi -> vòng lặp render vô hạn
const live = useStore((s) => s.tables.transactions.filter((t) => !t.deleted))
const pair = useStore((s) => ({ a: s.sync, b: s.settings }))

// ĐÚNG: lấy tham chiếu ổn định rồi tính toán bên ngoài selector (useMemo/useTable)
const rows = useStore((s) => s.tables.transactions)
const live = useMemo(() => rows.filter((t) => !t.deleted), [rows])
```

### `useTable(table)`

Trả các dòng chưa xoá của một bảng. Bên trong lấy `s.tables[table]` (tham chiếu ổn định) rồi lọc `!r.deleted`, cache kết quả trong `WeakMap` khoá theo **mảng gốc** (`liveCache`). Nhờ vậy cùng một mảng gốc luôn cho cùng một mảng đã lọc, ổn định giữa các render và an toàn để đưa vào dependency của `useMemo`/`useEffect`. Khi bảng đổi (`upsert`, `remove`, sync), mảng gốc mới sinh mảng lọc mới.

### Ghi dữ liệu

```ts
import { upsert, remove, newId } from '../lib/store'

// Tạo mới (id tự sinh) hoặc sửa (truyền id). updatedAt luôn do store đặt.
const saved = upsert('transactions', {
  date: '2026-09-30', type: 'expense', amount: 50000, categoryId: 'cat-food', note: 'phở',
})
upsert('transactions', { ...saved, amount: 60000 })   // sửa: merge vào dòng cũ theo id

remove('transactions', saved.id)                      // xoá mềm: deleted=true + updatedAt mới
```

- `upsert(table, draft)`: `draft = Omit<RecordOf<T>, 'id'|'updatedAt'> & { id? }`. Nếu id đã tồn tại thì `{...cũ, ...mới}`, nếu chưa thì append. Trả về bản ghi đã lưu. Đánh dấu dirty và gọi `scheduleSync()`.
- `remove(table, id)`: xoá mềm, cũng đánh dấu dirty (kể cả khi id không tồn tại, khi đó là no-op về dữ liệu nhưng id vẫn vào `dirty`; server bỏ qua dòng thiếu field nhưng vẫn tạo dòng rỗng, xem mục 11).
- `importTables(incoming: Partial<Tables>): number`: nhập backup. Mỗi dòng đi qua `normalize()`, giữ `updatedAt` của chính nó (thiếu thì lấy "bây giờ"), gộp LWW: **bỏ qua dòng nếu bản trong máy mới hơn hẳn (`cur.updatedAt > rec.updatedAt`)**, còn lại (kể cả bằng nhau) được áp dụng và đánh dấu dirty. Chỉ ghi state một lần, sync một lần. Trả về số dòng đã áp dụng.
- `updateSettings(patch)`: merge vào `settings`, không tự kích hoạt sync.

### Nguồn tiền: `src/lib/accounts.ts`

Toán số dư dùng chung mọi trang (không lưu số dư, luôn tính lại từ `openingBalance` + giao dịch):

```ts
export const ACCOUNTS_ASSET_CATEGORY_ID = 'acat-cash'            // nhóm Tài sản chứa số dư nguồn tiền
export const ACCOUNT_KIND_LABEL: Record<AccountKind, string>      // cash/bank/ewallet/credit -> nhãn tiếng Việt
export function txAccountId(t: Transaction): string               // t.accountId || DEFAULT_ACCOUNT_ID
export function isIncomeOrExpense(t: Transaction): boolean        // t.type !== 'transfer'
export function accountDelta(t: Transaction, accountId: string): number
  // thu +amount / chi -amount nếu là nguồn của t; chuyển: -amount cho nguồn đi, +amount cho nguồn đến; from === to -> 0
export function computeBalances(accounts: Account[], txs: Transaction[], asOf?: string): Map<string, number>
  // openingBalance + mọi delta; bỏ qua tx deleted, tx có date > asOf (asOf gồm cả ngày đó, YYYY-MM-DD), tx trỏ tới id không có trong `accounts`
export function totalCashBalance(accounts: Account[], txs: Transaction[], asOf?: string): number
  // tổng số dư các account KHÔNG archived
export function useAccountBalances(): { accounts: Account[]; balances: Map<string, number>; total: number }
  // hook: accounts live sắp xếp (chưa archive trước, rồi kind, rồi tên), số dư hiện tại, total (bỏ archived)
```

Công thức: **số dư = openingBalance + thu − chi ± chuyển** (`accountDelta` / `computeBalances`). Số dư tính ở client từ **toàn bộ** transactions mỗi lần dữ liệu đổi (`useMemo`), không cache lâu dài.

Cách dùng trong UI:
- `Accounts` (`/accounts`): thẻ theo loại, tổng số dư, tách **Tài sản tiền / Nợ thẻ tín dụng** khi có nguồn âm, mục "Đã lưu trữ", nút Chuyển tiền (mở `TransactionForm` với `defaultType="transfer"`, `defaultAccountId`) và Lịch sử (`/transactions?account=<id>`).
- `AccountForm`: `openingBalance = debt ? -opening : opening` (checkbox "Đang nợ"; chọn kind `credit` tự bật). **Xoá** bị chặn với nguồn mặc định `acc-cash` và với nguồn còn giao dịch tham chiếu (`accountId`/`toAccountId`, hoặc `accountId === ''` cho `acc-cash`), khi đó phải dùng archive; còn lại `remove('accounts', id)` (xoá mềm).
- `Transactions`: bộ lọc nguồn tiền khởi tạo từ query `?account=` (`useSearchParams`), lọc `txAccountId(t) === id || t.toAccountId === id`; khi có bộ lọc, tổng ngày và dấu số tiền dùng `accountDelta`; chuyển tiền hiển thị `Chuyển tiền: A → B` (icon 🔁); link "Danh mục" ở đầu trang (Danh mục ẩn khỏi bottom nav mobile).
- `TransactionForm`: `TypeToggle allowTransfer`; chuyển tiền bắt buộc chọn nguồn đi/đến khác nhau, `categoryId: ''`; nguồn archived vẫn hiện nếu form đang tham chiếu; nguồn mặc định của giao dịch mới = `defaultAccountId ?? localStorage['montana:lastAccount'] ?? 'acc-cash'`, ghi lại sau mỗi lần lưu.
- `Assets`/`Dashboard`: `Tổng tài sản = Σ assets.currentValue + Σ số dư nguồn tiền chưa archive`. Nhóm `acat-cash` nhận thêm các dòng nguồn tiền chỉ đọc (`Group.accounts`; nếu danh mục `acat-cash` bị xoá thì rơi vào nhóm "Chưa phân loại"). Lãi/lỗ (`SummaryCards`) chỉ tính trên tài sản đầu tư (`Σ currentValue − Σ costBasis`), không có nguồn tiền. Lịch sử tài sản ròng: `buildHistory(..., { dates: [today()], valueAt: d => totalCashBalance(accounts, allTxs, d) })` cộng số dư nguồn tiền tại mỗi ngày và thêm điểm hôm nay.
- Nếu người dùng từng nhập tài khoản ngân hàng như một `asset`, tiền bị **tính trùng** khi tạo thêm nguồn tiền tương ứng; app không tự phát hiện, hướng dẫn người dùng chuyển sang Nguồn tiền rồi xoá asset.
- `dataIO.exportTransactionsCsv`: cột `Ngày, Loại (Chi/Thu/Chuyển), Danh mục, Nguồn tiền, Đến, Số tiền, Ghi chú`.

### Đồng bộ và tiện ích

- `sync(): Promise<void>`: đẩy dirty rồi kéo về và gộp (mục 5). Dedupe bằng `inFlight`; không có `apiUrl` thì resolve ngay.
- `testConnection(): Promise<string>`: gửi `ping`, trả `serverTime`, ném lỗi nếu `ok: false`. **Đọc `state.settings` đã lưu**, nên UI phải `updateSettings` trước khi gọi (`ConnectionCard.test` làm vậy).
- `pendingCount(s: State): number`: tổng số id dirty; dùng làm selector: `useStore(pendingCount)`.
- `getState(): State`: đọc state ngoài React (event handler, effect). Không tự subscribe.
- `newId(): string`.

---

## 5. Thuật toán đồng bộ

Toàn bộ nằm trong `doSync()` (`src/lib/store.ts`).

### Các bước

1. **Đặt trạng thái**: `sync.status = 'syncing'`, xoá `error`.
2. **Chụp dirty**: `pushed = state.dirty`. Với mỗi bảng có id dirty, lấy các dòng tương ứng vào `changes[table]` và ghi nhớ `pushedVersions["table:id"] = updatedAt` tại thời điểm gửi.
3. **Push hay pull**: nếu có `changes` gửi `action: 'push'`, ngược lại gửi `action: 'pull'`. Cả hai đều trả về **toàn bộ dữ liệu** server (`data`).
4. **Server (`upsertRows_`)**: dòng mới thì append; dòng đã có thì chỉ ghi đè khi `incomingUpdatedAt >= storedUpdatedAt` (so sánh chuỗi ISO; **bằng nhau thì bên gửi thắng**, `>=`). Dòng cũ hơn bị bỏ qua.
5. **Client merge** (chạy trên `state` *hiện tại*, vì người dùng có thể đã sửa trong lúc chờ mạng): với mỗi bảng, dựng `Map` từ dữ liệu server (qua `normalize()`), rồi với mỗi dòng local: nếu server không có, hoặc `local.updatedAt > remote.updatedAt` (**local chỉ thắng khi mới hơn hẳn**), thì giữ bản local. Bằng nhau thì lấy bản server.
6. **Tính lại dirty**: giữ id trong `state.dirty[t]` nếu dòng đã biến mất, hoặc `pushedVersions.get(key) !== cur.updatedAt`. Tức là dòng **được sửa sau khi đã chụp để gửi vẫn dirty** và sẽ đi ở lần sync sau; id chưa từng gửi (thêm giữa chừng) cũng còn dirty. Dòng được gửi nguyên vẹn thì hết dirty.
7. **Ghi state**: `status: 'idle'`, `lastSyncAt = res.serverTime`. Lỗi bất kỳ (mạng, HTTP không ok, `ok: false`, thiếu `data`) chuyển `status: 'error'` kèm message, **giữ nguyên** `tables` và `dirty` nên lần sau thử lại được.

### Trigger

| Nguồn | Điều kiện |
|---|---|
| Mở app (`App.tsx` `useEffect`) | `apiUrl && autoSync` |
| Sự kiện `window` `focus` và `online` | `apiUrl && autoSync` |
| Nút `SyncBadge` / "Đồng bộ ngay" | luôn (nếu có `apiUrl`) |
| Auto-sync `scheduleSync()` sau `upsert`/`remove`/`importTables` | `settings.autoSync && settings.apiUrl`, **debounce 1500 ms** (`clearTimeout` rồi `setTimeout`) |

`inFlight`: nếu đang có sync chạy, `sync()` trả lại chính Promise đó (không chạy song song). Thay đổi phát sinh lúc đang sync vẫn được đảm bảo nhờ bước 6 nhưng sẽ chờ lượt sync kế tiếp (do debounce timer hoặc trigger sau).

`autoSync = false` tắt mọi trigger tự động; chỉ còn đồng bộ thủ công (badge / "Đồng bộ ngay").

### Hạn chế đã biết

- **Lệch đồng hồ giữa các thiết bị**: LWW dùng `new Date()` của thiết bị (`updatedAt` do client đặt), nên máy chạy nhanh có thể thắng sai. Không có logical clock hay giờ server.
- **Tombstone không bao giờ bị dọn**: dòng `deleted=true` nằm mãi trong Sheet và localStorage (xoá tay trong Sheet chỉ an toàn khi mọi thiết bị đã sync, nếu không thiết bị cũ sẽ đẩy lại dòng).
- **Mỗi lần sync kéo toàn bộ dataset** (và `push` cũng trả toàn bộ, đồng thời server ghi lại toàn bộ vùng dữ liệu của bảng có thay đổi). Ổn với vài nghìn dòng, không phù hợp 100k dòng.
- **Không có UI xử lý xung đột**: bản có `updatedAt` cũ hơn bị thay thế âm thầm.
- So sánh `updatedAt` là so sánh chuỗi: chỉ đúng khi mọi giá trị cùng định dạng ISO UTC (`...Z`). Định dạng khác (ví dụ `...00Z` so với `...00.000Z` cùng giây) có thể so sai; sửa tay trong Sheet phải dùng ISO đầy đủ.

---

## 6. API contract

Định nghĩa kiểu ở cuối `src/lib/types.ts`; client ở `call()` trong `store.ts`; server ở `doPost` trong `Code.gs`.

### Request

`POST <Web App URL>` (kết thúc `/exec`), body là JSON:

```jsonc
{ "token": "<API_TOKEN>", "action": "ping" }
{ "token": "<API_TOKEN>", "action": "pull" }
{ "token": "<API_TOKEN>", "action": "push",
  "changes": { "transactions": [ { "id": "…", "date": "2026-09-30", "type": "expense",
               "amount": 50000, "categoryId": "cat-food", "accountId": "acc-cash",
               "toAccountId": "", "note": "phở",
               "updatedAt": "2026-09-30T01:00:00.000Z", "deleted": false } ] } }
```

`changes` là `Partial<Tables>`: chỉ gồm các bảng có dòng dirty.

Client gửi header `Content-Type: text/plain;charset=utf-8` và `redirect: 'follow'`:
- **`text/plain` để tránh CORS preflight.** Apps Script Web App không trả header `Access-Control-Allow-*` cho `OPTIONS`; với `application/json` trình duyệt sẽ gửi preflight và thất bại. `text/plain` là "simple request", không có preflight, và server vẫn tự `JSON.parse(e.postData.contents)`.
- **`redirect: 'follow'`**: `/exec` trả 302 sang `script.googleusercontent.com/...` nơi chứa kết quả thực; trình duyệt theo redirect và response đó có CORS header cho phép đọc.

### Response

```jsonc
{ "ok": true, "serverTime": "2026-09-30T01:00:00.000Z" }                        // ping
{ "ok": true, "serverTime": "…", "data": { "accounts": [...], "categories": [...], "transactions": [...],
  "assetCategories": [...], "assets": [...], "assetSnapshots": [...] } }         // pull, push
{ "ok": false, "error": "Unauthorized" }                                          // lỗi
```

Các chuỗi lỗi từ server: `Unauthorized` (sai/thiếu token, hoặc chưa có `API_TOKEN`), `Unknown action`, `Bad request: <message>` (JSON hỏng hoặc exception trong handler). Client cũng ném `HTTP <status>` nếu `!res.ok`, và `Phản hồi thiếu dữ liệu` nếu `push`/`pull` không có `data`.

`push` trả về toàn bộ dữ liệu **sau khi áp dụng** thay đổi, để client gộp mà không cần request `pull` thứ hai.

### doGet

`doGet` (mở URL `/exec` bằng trình duyệt) trả `{ ok: true, service: 'montana', serverTime }`, không cần token và không lộ dữ liệu. Dùng để kiểm tra deploy còn sống.

---

## 7. Backend Code.gs

File `apps-script/Code.gs` (container-bound vào Google Sheet). Đọc dưới dạng ES5 (`var`, `function`) nhưng chạy trên runtime V8.

### Hàm chính

| Hàm | Vai trò |
|---|---|
| `doGet`, `doPost` | Entry point Web App. `doPost` bọc `try/catch`, mọi exception thành `{ok:false, error:'Bad request: …'}`. |
| `json_(obj)` | `ContentService` output với MIME JSON. |
| `authorized_(token)` | So sánh token với Script Property `API_TOKEN`, so sánh từng ký tự bằng XOR (không thoát sớm). Chưa có `API_TOKEN` thì luôn từ chối. |
| `handle_(req)` | Điều phối `ping` / `pull` / `push`. `push` bọc `LockService.getScriptLock().waitLock(30000)` và `finally releaseLock()`. |
| `ensureSheets_(force)` | Tạo tab thiếu; đọc header, **append cột thiếu vào cuối**; đặt `@` (Plain text) cho header và cho cột text ở các dòng dữ liệu; freeze dòng 1, in đậm header. Chạy ở mỗi `pull`/`push` (chỉ làm việc thật khi thiếu gì đó, hoặc `force`). |
| `readAll_` / `readTable_` | Đọc cả bảng bằng **một** `getValues()`, ánh xạ **theo tên header** (`header.indexOf(col)`), bỏ dòng không có `id`. |
| `applyChanges_` / `upsertRows_` | Ghi. Xem "Batching" bên dưới. |
| `fromCell_` / `toCell_` | Ép kiểu khi đọc/ghi. |
| `setupToken`, `showToken`, `initSheets`, `onOpen` | Tiện ích cho chủ Sheet. |

### Ép kiểu

- **Cột text ở định dạng `@`** (mọi field không nằm trong `NUMBER_FIELDS`/`BOOLEAN_FIELDS`): để Sheets không tự biến `2026-09-30` thành Date, `=abc` thành công thức, `0123` thành số.
- `NUMBER_FIELDS = amount, budget, targetPercent, quantity, costBasis, currentValue, value, openingBalance` -> `Number(v)`, không hữu hạn thì `0` (`openingBalance` được phép âm).
- `BOOLEAN_FIELDS = deleted, archived` -> đọc: `true` hoặc chuỗi `'true'` (không phân biệt hoa thường); ghi: `true`/`'true'`/`'TRUE'`.
- **Date -> chuỗi**: nếu ô đọc ra là `Date` (Sheets tự chuyển kiểu, thường do người dùng gõ tay): field `date` thành `yyyy-MM-dd` theo `Session.getScriptTimeZone()`, field khác (vd `updatedAt`) thành `toISOString()`. Date không hợp lệ thành `''`.
- Còn lại `String(v)`, `null/undefined` thành `''`.

### Cột lạ, thứ tự cột

Đọc/ghi luôn tra vị trí theo tên header, nên đổi thứ tự cột hay thêm cột riêng của người dùng (ví dụ `myNote`) đều không sao: cột lạ nằm ngoài `SHEET_COLUMNS` không được đọc vào API và **được giữ nguyên** khi ghi (dòng mới được điền `''` cho cột lạ; dòng cũ chỉ ghi đè các cột thuộc schema).

### Batching

`upsertRows_` đọc toàn bộ vùng dữ liệu một lần (`existing`), dựng `byId`, áp dụng mọi dòng đến trong bộ nhớ (id lặp trong cùng push thì dòng sau ghi đè dòng trước, kể cả dòng vừa append), mở rộng số dòng nếu cần (`insertRowsAfter`), rồi **một** `setValues` cho cả vùng `2..total` và một `setNumberFormat('@')` mỗi cột text. Số lời gọi Sheets API không phụ thuộc số dòng gửi lên, nhưng mỗi lần push có thay đổi sẽ ghi lại toàn bộ bảng đó.

### Menu và hàm public

Menu tuỳ chỉnh `Montana` (tạo trong `onOpen`) gọi **`initSheets`** và **`showToken`**. Hàm gọi từ menu bắt buộc là hàm global **không** kết thúc bằng `_`: Apps Script coi hàm có hậu tố `_` là private và menu/trigger không gọi được. Vì lý do đó `ensureSheets_`, `handle_`... có `_` còn hai hàm menu thì không. `showToken` gọi `setupToken()` rồi `SpreadsheetApp.getUi().alert(...)`; `initSheets` gọi `ensureSheets_(true)`.

`setupToken()`: nếu chưa có `API_TOKEN` thì tạo bằng `Utilities.getUuid()` và lưu Script Properties; **luôn** log token ra Execution log, và chạy `ensureSheets_(true)`. Chạy từ editor lần đầu để cấp quyền.

### Deploy phiên bản mới (giữ nguyên URL)

Sửa `Code.gs` **không** có hiệu lực với URL `/exec` cho đến khi tạo version mới:

1. Dán code mới vào editor, lưu.
2. **Deploy -> Manage deployments -> biểu tượng bút chì (Edit) -> Version: New version -> Deploy.**
3. URL `/exec` giữ nguyên, app không cần cấu hình lại. (Chọn "New deployment" sẽ sinh URL mới, tránh làm vậy trừ khi cần.)

Nếu thêm cột trong `SHEET_COLUMNS`, sau khi deploy chỉ cần `pull`/`push` một lần là `ensureSheets_` tự thêm cột thiếu. Ví dụ với tính năng Nguồn tiền: tab `accounts` được tạo mới, còn `transactions` cũ được append `accountId`, `toAccountId` vào cuối header (dòng cũ đọc ra `''`).

**Bắt buộc với người dùng đã có Sheet trước khi có Nguồn tiền:** phải dán `Code.gs` mới và deploy New version. Bản `Code.gs` cũ lặp qua `TABLE_NAMES` **cũ** (không có `accounts`) nên `applyChanges_` bỏ qua im lặng `changes.accounts` (không báo lỗi), `readAll_` không trả bảng `accounts`, và `readTable_` chỉ đọc các cột trong `SHEET_COLUMNS` cũ nên bỏ `accountId`/`toAccountId`. Hệ quả ở client (suy ra từ code, `doSync`): push vẫn "thành công" và các id dirty được xoá dù server không lưu; `res.data.accounts ?? []` rỗng nên nguồn tiền chỉ còn ở máy hiện tại (máy khác/sau khi xoá dữ liệu local sẽ chỉ có `acc-cash` mặc định); giao dịch pull về có `accountId = ''`, và vì `updatedAt` bằng nhau thì bản server thắng, nên `accountId`/`toAccountId` trong máy bị ghi đè về `''` (mọi giao dịch về Tiền mặt, chuyển tiền mất nguồn đến).

### Đổi (rotate) token

1. Apps Script -> **Project Settings -> Script Properties** -> sửa giá trị `API_TOKEN` (hoặc xoá key rồi chạy `setupToken` để sinh UUID mới).
2. Không cần deploy lại (đọc Script Properties mỗi request).
3. Cập nhật token trong **Cài đặt** của app trên mọi thiết bị; đến lúc đó sync sẽ báo `Unauthorized`. Dữ liệu local không mất, chỉ cần lưu token mới rồi bấm "Đồng bộ ngay".

---

## 8. Hướng dẫn mở rộng

### Thêm field vào bảng có sẵn

Ví dụ thêm `tag: string` vào `transactions` (tiền lệ thực tế: `accountId`, `toAccountId` thêm vào `transactions` khi làm Nguồn tiền; `normalize()` ép `''` nếu thiếu và `load()` chuẩn hoá state cũ).

- [ ] `src/lib/types.ts`: thêm vào interface (`tag: string`) và vào `SHEET_COLUMNS.transactions` (đặt **trước** `updatedAt`, `deleted` cho gọn).
- [ ] `apps-script/Code.gs`: thêm vào **`SHEET_COLUMNS` của Code.gs** (bản sao thủ công, compiler không bắt được lệch). Nếu là số thì thêm vào `NUMBER_FIELDS` (ví dụ `openingBalance` của `accounts`); boolean thì `BOOLEAN_FIELDS` (ví dụ `archived`); ngày dạng `YYYY-MM-DD` thì `DATE_FIELDS`. Text thì không cần gì thêm (tự thành định dạng `@`).
- [ ] `src/lib/store.ts` `normalize()`: field số thêm vào danh sách số (`amount, budget, ...`); field chuỗi thêm vào danh sách chuỗi (`id, updatedAt, date, name, ...`). Nếu bỏ sót, giá trị từ Sheet (có thể là `''` hoặc số) sẽ không được ép kiểu. Field kiểu ngày cần thêm xử lý `slice(0, 10)` như `transactions`/`assetSnapshots`.
- [ ] Nơi tạo bản ghi: `src/lib/defaults.ts` nếu là danh mục mặc định (type `Seed<T>` sẽ báo thiếu field), form (`TransactionForm`...), hàm helper (`saveAsset`...) và trang hiển thị.
- [ ] Tab Sheet cũ: không cần thao tác tay, `ensureSheets_` append cột mới. Bản ghi cũ đọc ra `''` hoặc `0`.
- [ ] **Deploy version mới** của Apps Script (mục 7), nếu không server sẽ bỏ qua field mới (không có trong `SHEET_COLUMNS` phía server nên không được ghi).
- [ ] Cập nhật bảng cột trong `README.md` và tài liệu này; `parseBackup`/`importTables` tự nhận field mới qua `normalize`.

### Thêm bảng mới

Ví dụ `budgets` (tiền lệ thực tế: `accounts` - Nguồn tiền).

- [ ] `types.ts`: interface `extends BaseRecord`; thêm vào `Tables`; thêm tên vào `TABLE_NAMES`; thêm khoá vào `SHEET_COLUMNS` (kiểu mapped type sẽ báo lỗi nếu thiếu).
- [ ] `store.ts`: thêm `budgets: []` vào `emptyTables()`. Nếu bảng cần dữ liệu mặc định (như `accounts` với `acc-cash`), seed ở `load()` cho **cả** lần chạy đầu và migration state cũ (`saved.tables.<bảng>` rỗng), kèm đánh dấu dirty. `emptyDirty()`, `importTables`, `doSync` duyệt `TABLE_NAMES` nên tự bao phủ. Cập nhật `normalize()` cho field mới. `load()` merge `{ ...base.tables, ...saved.tables }` nên dữ liệu cũ không có bảng mới vẫn chạy.
- [ ] `Code.gs`: thêm vào `SHEET_COLUMNS` và `TABLE_NAMES`, cùng `NUMBER_FIELDS`, `BOOLEAN_FIELDS`... nếu cần. **Deploy version mới** và nhắc người dùng làm (nếu không server bỏ qua im lặng bảng lạ, xem mục 7). Cập nhật `scripts/test-apps-script.cjs` (số tab, header, round trip).
- [ ] Cập nhật CSV export (`dataIO.ts`), hướng dẫn người dùng (`HUONG-DAN-SU-DUNG.md` + `src/components/guide/content.tsx`, đánh số/tiêu đề mục phải khớp) và `README.md` (bảng cột Sheet).
- [ ] `dataIO.ts` (`parseBackup`) duyệt `TABLE_NAMES` nên tự nhận bảng mới.
- [ ] UI: page/component đọc bằng `useTable('budgets')`, ghi bằng `upsert('budgets', …)`.

### Thêm trang mới

- [ ] Tạo `src/pages/Foo.tsx` (`export default function Foo()`).
- [ ] `src/App.tsx`: import; thêm `<Route path="/foo" element={<Foo />} />`; nếu muốn hiện trên menu thì thêm phần tử vào `NAV` (`{ to, label, icon }`), `NAV` render cả sidebar desktop lẫn bottom nav mobile; thêm `mobile: false` để ẩn khỏi bottom nav (như Danh mục, khi đó nhớ có đường vào khác trên mobile); trang phụ như `/guide` được render riêng.
- [ ] Route dùng `HashRouter` nên URL thực là `#/foo`. Nội dung trang bọc theo pattern của các trang khác (`space-y-4`, `Card`...).
- [ ] Giữ nội dung trang chừa chỗ cho bottom nav: `App.tsx` đã thêm `pb-20 sm:pb-0` ở vùng nội dung, trang không cần tự thêm.

---

## 9. UI conventions

### Primitive (`src/components/ui/index.tsx`)

Dùng lại thay vì tự viết class trong trang:

| Component | Ghi chú |
|---|---|
| `Card({ title?, action?, children, className? })` | `rounded-2xl border bg-white p-4 shadow-sm`, có `dark:`. |
| `Button({ variant })` | `primary` (emerald), `secondary`, `danger` (rose), `ghost`. |
| `Field({ label })`, `Input`, `Select` | Chung `inputCls` (viền slate, focus ring emerald). |
| `MoneyInput({ value, onChange })` | Xem dưới. |
| `Modal({ open, title, onClose })` | Bottom sheet trên mobile, hộp giữa trên `sm:`; đóng bằng Esc hoặc bấm nền. |
| `EmptyState` | Dòng chữ mờ cho danh sách rỗng. |

### `MoneyInput` và `parseMoney`

`MoneyInput` hiển thị số có dấu nhóm (`formatNumber`, locale `vi-VN`), khi gõ gọi `parseMoney` (`src/lib/format.ts`) ra số nguyên; blur thì chuẩn hoá lại chuỗi hiển thị. `parseMoney` hiểu:

| Nhập | Kết quả |
|---|---|
| `50k` | 50.000 |
| `1,5tr` / `1.5tr` / `1,5m` | 1.500.000 |
| `2 tỷ` / `2ty` | 2.000.000.000 |
| `1.500.000` (không hậu tố) | 1.500.000 (mọi `.` `,` bị coi là dấu nhóm) |

Hậu tố `k`, `tr`, `m` (triệu), `ty`, `tỷ`. Phần số dạng nhóm nghìn (`/^\d{1,3}([.,]\d{3})+$/`, ví dụ `1.500.000`, `1.500k`) thì bỏ dấu; còn lại dấu `,`/`.` là thập phân (`1,5tr`). Kết quả làm tròn tới đồng (`1.5` → `2`).

### Tailwind

- Màu chính **emerald** (`emerald-600` nút chính/tiêu đề, `emerald-50/700` nav active). Chi = `rose`, cảnh báo = `amber`, trung tính = `slate`.
- Card `rounded-2xl`, input/nút `rounded-lg`.
- Luôn kèm biến thể `dark:` (`dark:bg-slate-900`, `dark:border-slate-800`...).
- Layout: `mx-auto max-w-6xl`, sidebar `hidden sm:block`, bottom nav `sm:hidden` cố định đáy; vùng nội dung có **`pb-20 sm:pb-0`** để nội dung không bị bottom nav che.

### Biểu đồ (recharts)

- **Mọi series (`Pie`, `Bar`, `Area`...) phải đặt `isAnimationActive={false}`.** Khi test headless (Chrome screenshot) animation không chạy xong nên biểu đồ ra trống; tắt animation cho kết quả nhất quán. Ví dụ hiện có: `Charts.tsx`, `AllocationCard.tsx`, `HistoryCard.tsx`.
- Số trục/tooltip rút gọn dùng `formatCompact` trong `src/components/dashboard/compact.ts` (`1,5tr`, `200k`, `2,3 tỷ`); số đầy đủ dùng `formatVND`.
- Nhãn tháng: `monthLabel`, `shiftMonth`, `currentMonth` trong `src/lib/format.ts` (dùng chung cho Dashboard và `MonthPicker`).

---

## 10. Kiểm thử

Dự án **cố ý không có framework unit test**; kiểm tra bằng type-check, lint, một test mock cho backend và smoke test UI thủ công.

### Build, type-check, lint

```bash
npm run build                          # tsc -b && vite build -> dist/
npx tsc -p tsconfig.app.json --noEmit  # chỉ type-check
npx oxlint src                         # lint (hiện còn vài warning, xem mục 11)
```

### Test backend bằng mock

```bash
node scripts/test-apps-script.cjs      # chạy từ thư mục gốc dự án
```

Script nạp nguyên văn `apps-script/Code.gs` vào `vm` context cùng các bản giả của `SpreadsheetApp` (sheet trong bộ nhớ, giới hạn `maxRows` như thật), `PropertiesService`, `LockService`, `ContentService`, `Utilities`, `Session`. In `PASS`/`FAIL` cho từng kiểm tra, `process.exitCode = 1` nếu có `FAIL`. Nó kiểm tra:

- `doGet`; sai token / token cùng độ dài nhưng khác / thiếu token; JSON hỏng; `action` lạ; `ping`.
- `pull` tạo đủ 6 tab (gồm `accounts`) với header đúng, `transactions` có `accountId`, `toAccountId`.
- `push`: chèn mới; kiểu dữ liệu khứ hồi; LWW (cũ thua, mới thắng, **bằng nhau thì thắng**); xoá mềm giữ dòng; bỏ dòng không có id; id lặp trong một push; số không hợp lệ thành `0`.
- `accounts`: khứ hồi gồm `openingBalance` âm/lẻ, `archived` boolean (kể cả chuỗi `"false"`), lưu đúng kiểu number/boolean trong sheet; giao dịch `transfer` giữ `accountId`/`toAccountId`, `categoryId = ''`.
- **Migration Sheet cũ**: sheet `transactions` chỉ có header cũ được append `accountId`, `toAccountId` ở cuối; dòng cũ đọc ra `''`; sửa dòng cũ / thêm dòng mới ghi đúng cột; dòng không đụng tới giữ nguyên.
- Ô kiểu `Date` trong Sheet: cột `date` ra `yyyy-MM-dd`, cột khác ra ISO.
- Cột lạ do người dùng thêm vẫn còn sau push và không lọt vào response.
- Push 1500 dòng (sheet phải tự mở rộng vượt `maxRows` ban đầu).
- `setupToken` (tạo/giữ token), hàm menu là hàm global không có hậu tố `_`.

Migration state localStorage phía client (`load()` seed `accounts`, chuẩn hoá `accountId`) và toán số dư (`lib/accounts.ts`) **chưa có test tự động**, kiểm tra thủ công: nạp `montana:v1` cũ (không có `accounts`), mở app, xác nhận có `Tiền mặt`, giao dịch cũ tính vào đó; thử chuyển tiền và so số dư hai nguồn.

Mock không mô phỏng: quota, độ trễ, `LockService` thật, hành vi auto-format ngày của Sheets thật. Sau khi sửa `Code.gs` vẫn nên thử một vòng trên Sheet thật.

### UI smoke test bằng Chrome headless

```bash
npm run build
cp scripts/seed.html dist/
npx vite preview --port 4173 &         # phục vụ dist/ tại http://localhost:4173

UD=$(mktemp -d)                        # cùng --user-data-dir cho mọi bước để giữ localStorage
CH="google-chrome --headless=new --no-sandbox --disable-gpu --user-data-dir=$UD --window-size=1280,900 --virtual-time-budget=8000"

$CH --dump-dom http://localhost:4173/ >/dev/null            # 1) mở app 1 lần để tạo montana:v1 (+ seed mặc định)
$CH --dump-dom http://localhost:4173/seed.html | grep '<title>'   # 2) nạp dữ liệu mẫu, title "seeded 12"
$CH --screenshot=/tmp/dashboard.png "http://localhost:4173/#/"
$CH --screenshot=/tmp/assets.png "http://localhost:4173/#/assets"
$CH --screenshot=/tmp/mobile.png --window-size=390,844 "http://localhost:4173/#/transactions"

kill %1                                # dừng vite preview
```

Lưu ý:
- `seed.html` ghi đè `transactions`, `assets`, `assetSnapshots` (không tạo `accounts`; `load()` tự seed `acc-cash` khi state cũ thiếu bảng này), đặt budget cho vài danh mục và `targetPercent` cho loại tài sản, trong `localStorage['montana:v1']`. Nó **đọc state có sẵn** nên phải mở app ít nhất một lần trước (bước 1), cùng origin và cùng `--user-data-dir`.
- Dữ liệu mẫu dùng ngày tháng 4-9/2026 và `updatedAt` cố định, nên Dashboard (tháng hiện tại) chỉ có số liệu nếu tháng hiện tại nằm trong khoảng đó; xem thêm bằng MonthPicker hoặc sửa script.
- Hash route được phục vụ từ cùng `index.html`, nên chỉ cần đổi phần `#/...`.
- Thiếu biểu đồ trong ảnh thường là do animation chưa tắt (mục 9).

---

## 11. Việc còn tồn đọng / TODO

**Hiệu năng / build**
- Bundle chính ~720 kB (recharts nặng). Tách bằng `React.lazy` + `Suspense` cho các page có biểu đồ (`Dashboard`, `Assets`); hiện `vite.config.ts` chỉ nâng `chunkSizeWarningLimit` lên 1000 để ẩn cảnh báo.
- Sync kéo toàn bộ dataset mỗi lần; cần delta sync (`since=lastSyncAt`) nếu dữ liệu lớn.

**Lint (`npx oxlint src`)**
- `set-state-in-effect` trong `QuickValueModal.tsx` (`useEffect(() => setValue(...), [asset])`) và `MoneyInput` (đồng bộ `text` từ `value` trong effect). Cách sửa: dùng `key` để remount, hoặc tính state dẫn xuất khi render.

**Dữ liệu**
- Dọn tombstone (`deleted=true` cũ): cần cơ chế purge an toàn khi mọi thiết bị đã sync (ví dụ mốc `purgeBefore` phía server).
- Đa tiền tệ: hiện mọi số tiền là VND (`formatVND`, `unit` của tài sản chỉ là nhãn); Nguồn tiền cũng chỉ một đơn vị VND, chuyển tiền không có tỷ giá.
- Số dư Nguồn tiền tính ở client từ **toàn bộ** transactions (O(số giao dịch) mỗi lần dữ liệu đổi; `computeBalances` chạy thêm một lượt cho mỗi mốc ngày của lịch sử tài sản ròng). Chưa có số dư chốt/đối soát; sai `openingBalance` hoặc giao dịch cũ (mặc định vào `acc-cash`) làm lệch số dư.
- Chuyển tiền đến thẻ tín dụng được hiểu là trả nợ (số dư thẻ tăng về 0); không có khái niệm hạn mức, kỳ sao kê, lãi.
- Không tự phát hiện tài khoản ngân hàng đã nhập như `asset` (tính trùng trong Tổng tài sản).
- Nguồn tiền chỉ có `archived` để ẩn, không có gộp nguồn hay chuyển hàng loạt giao dịch sang nguồn khác; xoá chỉ khi chưa có giao dịch nào.
- Người dùng phải tự cập nhật `Code.gs` + New version; app không phát hiện backend cũ (xem hệ quả ở mục 7).
- Xử lý xung đột / lịch sử thay đổi (hiện LWW âm thầm), và lệch đồng hồ giữa thiết bị.

**Sản phẩm**
- PWA / cài offline (service worker, manifest).
- Trang hướng dẫn trong app: `src/pages/Guide.tsx`, nội dung ở `src/components/guide/content.tsx`; nhớ cập nhật cùng `HUONG-DAN-SU-DUNG.md`.

**Dự án**
- Chưa `git init`; `.gitignore` đã sẵn sàng.

### Điểm nhỏ còn lại

- `remove(table, id)` với id không tồn tại vẫn thêm id vào `dirty` (tốn một request, vô hại; id bị dọn ở bước merge).
- `index.html` dùng `href="/favicon.svg"` tuyệt đối; build với `base: './'` tự viết lại nên `dist/` đúng, nhưng dev server ở sub-path thì không.
- So sánh `updatedAt` bằng chuỗi (client và server) chỉ đúng khi mọi giá trị cùng định dạng ISO UTC (xem mục 5).

Đã sửa sau khi viết tài liệu: `autoSync` áp dụng cho mọi trigger tự động; `parseMoney` hiểu nhóm nghìn khi có hậu tố; thông báo nhập JSON đúng với LWW; README mô tả `doGet` đúng; helper tháng gộp về `src/lib/format.ts`.
