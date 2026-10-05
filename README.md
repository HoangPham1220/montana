# Montana

Ứng dụng web quản lý tài chính cá nhân (Vite + React + TypeScript + Tailwind v4). Dữ liệu lưu ngay trên trình duyệt và có thể đồng bộ lên Google Sheet của chính bạn thông qua Google Apps Script.

Tài liệu khác: [Hướng dẫn sử dụng](HUONG-DAN-SU-DUNG.md) · [Tài liệu cho developer](docs/DEVELOPER.md)

## Tính năng

- **Quản lý thu chi**: ghi giao dịch thu/chi theo danh mục, đặt ngân sách hằng tháng cho từng danh mục chi.
- **Danh mục con**: chia nhỏ danh mục thu/chi theo từng nhóm; báo cáo tổng hợp chi tiêu lên danh mục cha.
- **Hệ số nhập tiền**: cấu hình mã tiền và hệ số trong Cài đặt; mọi ô tiền nhân hệ số khi nhập, còn dữ liệu lưu và báo cáo vẫn theo VND.
- **Nguồn tiền**: quản lý các nguồn tiền (tiền mặt, ngân hàng, ví điện tử, thẻ tín dụng) với số dư ban đầu, số dư tự tính từ thu/chi, chuyển tiền giữa các nguồn (không tính vào thu/chi), lưu trữ nguồn không dùng nữa. Số dư được cộng vào Tổng tài sản. Cần cập nhật `Code.gs` và deploy New version để đồng bộ tab `accounts` (xem mục Cấu trúc Google Sheet).
- **Quản lý tài sản**: theo dõi tài sản theo danh mục (tiền mặt, tiết kiệm, cổ phiếu, vàng, crypto, bất động sản...), xem phân bổ thực tế so với phân bổ mục tiêu, lịch sử giá trị tài sản. Số dư Nguồn tiền hiện ở nhóm "Tiền mặt & tài khoản" (chỉ đọc), lãi/lỗ chỉ tính trên tài sản đầu tư.
- **Offline-first**: mọi thao tác đều ghi vào bộ nhớ trình duyệt (localStorage) trước, dùng được khi không có mạng.
- **Đồng bộ Google Sheet**: đẩy thay đổi và kéo dữ liệu về từ Google Sheet của bạn, dùng được trên nhiều thiết bị.

## Chạy local

```bash
npm install
npm run dev      # chạy môi trường phát triển
npm run build    # build bản production vào thư mục dist/
```

## Cài đặt đồng bộ Google Sheet

1. Tạo một Google Sheet mới tại <https://sheets.google.com> (đặt tên tuỳ ý, ví dụ "Montana").
2. Vào menu **Tiện ích mở rộng (Extensions) → Apps Script**.
3. Xoá nội dung mặc định của `Code.gs`, dán toàn bộ nội dung file [`apps-script/Code.gs`](apps-script/Code.gs) rồi lưu.
4. Vào **Cài đặt dự án (Project Settings)** (biểu tượng bánh răng), bật **Show "appsscript.json" manifest file in editor**. Quay lại Editor, mở `appsscript.json` và dán nội dung file [`apps-script/appsscript.json`](apps-script/appsscript.json), lưu lại.
5. Chọn hàm `setupToken` ở thanh công cụ và bấm **Run**. Cấp quyền khi Google yêu cầu (Review permissions → chọn tài khoản → Advanced → Go to ... → Allow). Mở **Execution log** để xem và **copy token** vừa tạo. Hàm này cũng tạo sẵn các tab dữ liệu.
   - Có thể lấy lại token bất cứ lúc nào từ menu **Montana → Tạo/hiện token** trong Google Sheet (tải lại trang Sheet nếu chưa thấy menu).
6. Bấm **Deploy → New deployment**, biểu tượng bánh răng chọn loại **Web app**:
   - **Execute as**: Me (tài khoản của bạn)
   - **Who has access**: Anyone
   
   Bấm **Deploy** và copy **Web app URL** (kết thúc bằng `/exec`).
7. Mở app Montana, vào **Cài đặt**, dán URL `/exec` và token.
8. Bấm **Kiểm tra kết nối**, nếu thành công thì bấm **Đồng bộ**.

> **Lưu ý khi sửa Code.gs:** mỗi lần chỉnh sửa code, phải vào **Deploy → Manage deployments → Edit (biểu tượng bút chì) → Version: New version → Deploy**. URL `/exec` giữ nguyên, không cần cấu hình lại app. Bản này thêm cột `parentId` cho tab `categories`; nếu đang dùng Google Sheets, hãy cập nhật và deploy `Code.gs` mới để đồng bộ danh mục con.

## Bảo mật

- Token là lớp bảo vệ **duy nhất**: URL Web app công khai (Anyone), ai có cả URL và token đều đọc/ghi được dữ liệu. Không chia sẻ, không commit URL + token lên nơi công khai.
- Request không có token đúng chỉ nhận về `Unauthorized`; `GET` vào URL chỉ trả về `ok`, tên service và giờ server để kiểm tra, không lộ dữ liệu.
- Muốn đổi token: Apps Script → **Project Settings → Script Properties**, sửa giá trị `API_TOKEN` (hoặc xoá rồi chạy lại `setupToken`), sau đó cập nhật token trong Cài đặt của app trên mọi thiết bị.

## Cơ chế đồng bộ

- Mỗi bản ghi có `id` (UUID) và `updatedAt` (ISO timestamp).
- App đánh dấu bản ghi đã thay đổi cục bộ, sau đó `push` lên server; server upsert theo `id`: bản ghi mới thì thêm vào cuối, bản ghi đã có chỉ bị ghi đè khi `updatedAt` gửi lên **lớn hơn hoặc bằng** giá trị đang lưu (**last-write-wins**).
- Server trả về toàn bộ dữ liệu, app gộp lại theo cùng nguyên tắc (bản có `updatedAt` mới hơn thắng).
- **Xoá mềm**: khi xoá, bản ghi được đặt `deleted = TRUE` thay vì xoá dòng, để việc xoá lan sang các thiết bị khác. Có thể xoá hẳn dòng thủ công trong Sheet nếu muốn dọn dẹp (chỉ nên làm khi mọi thiết bị đã đồng bộ).
- Server dùng khoá script (`LockService`) khi ghi để tránh ghi đè đồng thời.
- Có thể sửa trực tiếp trong Sheet, nhưng nhớ cập nhật cột `updatedAt` (ISO, ví dụ `2026-01-31T10:00:00.000Z`) thành giá trị mới hơn thì thay đổi mới được app nhận.

## Deploy frontend tĩnh

```bash
npm run build
```

Upload thư mục `dist/` lên GitHub Pages, Netlify, Vercel hoặc bất kỳ web server tĩnh nào. App dùng `HashRouter` nên **không cần cấu hình rewrite rule**. Nếu deploy vào thư mục con (ví dụ GitHub Pages `/repo/`), đặt `base` tương ứng trong `vite.config.ts`.

## Cấu trúc Google Sheet

Mỗi bảng là một tab cùng tên, dòng 1 là tiêu đề (được tạo tự động; nếu thiếu cột, script tự thêm vào cuối). Script đọc theo tên cột nên thứ tự cột không quan trọng.

| Tab | Các cột |
|---|---|
| `accounts` | id, name, kind, openingBalance, color, icon, archived, updatedAt, deleted |
| `categories` | id, name, type, parentId, color, icon, budget, updatedAt, deleted |
| `transactions` | id, date, type, amount, categoryId, accountId, toAccountId, note, updatedAt, deleted |
| `assetCategories` | id, name, color, targetPercent, updatedAt, deleted |
| `assets` | id, name, categoryId, quantity, unit, costBasis, currentValue, note, updatedAt, deleted |
| `assetSnapshots` | id, assetId, date, value, updatedAt, deleted |

Ghi chú: `date` định dạng `YYYY-MM-DD`; `id`, `date`, `updatedAt` và các cột văn bản được lưu dạng text để Sheets không tự chuyển thành ngày/công thức; `deleted` và `archived` là TRUE/FALSE; `type` của giao dịch là `expense`, `income` hoặc `transfer` (chuyển tiền: `accountId` -> `toAccountId`); `kind` của nguồn tiền là `cash`, `bank`, `ewallet` hoặc `credit`; `openingBalance` có thể âm; sheet cũ thiếu cột `accountId`/`toAccountId` sẽ được script tự thêm vào cuối (dòng cũ để trống); số tiền tính bằng VND.
