// Nội dung hướng dẫn dạng dữ liệu. Sửa văn bản ở đây, phần hiển thị nằm trong pages/Guide.tsx.
// Trong chuỗi văn bản, **chữ đậm** được hiển thị in đậm.

export interface GuideAction {
  label: string
  to: string
  variant?: 'primary' | 'secondary'
}

export type GuideBlock =
  | { t: 'p'; text: string }
  | { t: 'steps'; items: string[] }
  | { t: 'list'; items: string[] }
  | { t: 'note'; text: string; tone?: 'info' | 'warn' }
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'actions'; items: GuideAction[] }
  | { t: 'status' }
  | { t: 'faq'; items: { q: string; a: string }[] }

export interface GuideSection {
  id: string
  icon: string
  title: string
  blocks: GuideBlock[]
}

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'bat-dau-nhanh',
    icon: '🚀',
    title: 'Bắt đầu nhanh (5 phút)',
    blocks: [
      { t: 'p', text: 'Montana lưu dữ liệu ngay trên trình duyệt của bạn nên dùng được ngay, không cần tài khoản và không cần mạng. Làm theo các bước sau:' },
      {
        t: 'steps',
        items: [
          'Vào **Nguồn tiền**: app có sẵn nguồn **Tiền mặt** (số dư ban đầu 0). Thêm ví, tài khoản ngân hàng, thẻ tín dụng của bạn và nhập **Số dư ban đầu** (xem mục "Nguồn tiền & chuyển tiền").',
          'Vào **Danh mục** để xem các danh mục chi và thu có sẵn (Ăn uống, Di chuyển, Lương, Thưởng...). Bấm **+ Thêm** nếu muốn bổ sung. Trên điện thoại, mở Danh mục bằng liên kết **Danh mục** ở góc trên trang **Thu chi**.',
          'Vào **Thu chi**, bấm **+ Thêm** (trên điện thoại là nút tròn **+** màu xanh góc dưới bên phải) để ghi khoản chi hoặc thu đầu tiên.',
          'Vào **Tài sản**, bấm **+ Thêm** để nhập tiết kiệm, vàng, cổ phiếu... của bạn (tiền trong tài khoản ngân hàng, ví thì nhập ở **Nguồn tiền**, đừng nhập ở đây).',
          'Quay lại **Tổng quan** để xem thu, chi, tiết kiệm và tổng tài sản của tháng.',
          'Muốn có bản lưu an toàn và dùng trên nhiều thiết bị: vào **Cài đặt** và kết nối Google Sheet (xem mục "Kết nối Google Sheet").',
        ],
      },
      { t: 'note', text: 'Dữ liệu nằm trong trình duyệt của thiết bị đang dùng. Nếu chưa kết nối Google Sheet, hãy thỉnh thoảng bấm **Xuất JSON** trong **Cài đặt** để sao lưu.', tone: 'warn' },
      {
        t: 'actions',
        items: [
          { label: 'Mở Thu chi', to: '/transactions' },
          { label: 'Mở Tài sản', to: '/assets', variant: 'secondary' },
          { label: 'Mở Cài đặt', to: '/settings', variant: 'secondary' },
        ],
      },
    ],
  },
  {
    id: 'ghi-thu-chi',
    icon: '💸',
    title: 'Ghi thu chi',
    blocks: [
      { t: 'p', text: 'Mở trang **Thu chi**. Chọn tháng ở góc trên (có nút để chuyển tháng), rồi bấm **+ Thêm**. Form giao dịch gồm các ô: **Loại** (Chi, Thu hoặc Chuyển tiền), **Số tiền (VND)**, **Danh mục** (không có khi chuyển tiền), **Nguồn tiền**, **Ngày** và **Ghi chú** (tuỳ chọn). **Nguồn tiền** mặc định là nguồn bạn dùng lần trước (lần đầu là Tiền mặt), hoặc nguồn đang lọc.' },
      { t: 'p', text: 'Ô số tiền hiểu cách viết tắt, bạn không cần gõ đủ số 0:' },
      {
        t: 'table',
        head: ['Bạn gõ', 'App hiểu là'],
        rows: [
          ['50k', '50.000'],
          ['200k', '200.000'],
          ['3tr (hoặc 3m)', '3.000.000'],
          ['1,5tr', '1.500.000'],
          ['2tỷ (hoặc 2ty)', '2.000.000.000'],
          ['1.500.000', '1.500.000'],
        ],
      },
      { t: 'note', text: 'Lưu ý: dấu chấm/phẩy đứng trước đúng 3 chữ số là **dấu ngăn cách hàng nghìn** (1.500.000, 1.500k = một triệu rưỡi); còn lại là **dấu thập phân** (1,5tr = 1 triệu rưỡi). Số tiền luôn làm tròn tới đồng. Ô sẽ tự định dạng lại khi bạn bấm ra ngoài.' },
      { t: 'p', text: 'Danh sách giao dịch được nhóm theo ngày. Dùng các bộ lọc **Tất cả / Chi / Thu / Chuyển tiền**, **Tất cả nguồn tiền**, **Mọi danh mục** và ô **Tìm ghi chú...** để tìm nhanh. Bấm vào một giao dịch để **Sửa** hoặc **Xoá** (có hỏi xác nhận). Ba ô **Tổng thu / Tổng chi / Chênh lệch** không tính chuyển tiền. Trang có liên kết **Danh mục** ở góc trên để mở trang Danh mục (trang này không có trên thanh dưới cùng của điện thoại).' },
      { t: 'actions', items: [{ label: 'Mở Thu chi', to: '/transactions' }] },
    ],
  },
  {
    id: 'nguon-tien',
    icon: '👛',
    title: 'Nguồn tiền & chuyển tiền',
    blocks: [
      { t: 'p', text: '**Nguồn tiền** là nơi tiền của bạn đang nằm: tiền mặt, tài khoản ngân hàng, ví điện tử, thẻ tín dụng. Mỗi khoản thu/chi thuộc về một nguồn tiền nên app tính được số dư từng nguồn.' },
      { t: 'p', text: '**Số dư = số dư ban đầu + thu − chi ± chuyển tiền** (nhận vào thì cộng, chuyển đi thì trừ), tính trên mọi giao dịch của nguồn đó, không phụ thuộc tháng đang xem.' },
      { t: 'note', text: 'App có sẵn nguồn **Tiền mặt** (không xoá được, chỉ đổi tên hoặc lưu trữ). Mọi giao dịch cũ, tạo trước khi có tính năng này, được tính vào **Tiền mặt**; dữ liệu cũ không bị sửa. Nếu tiền thực tế nằm ở ngân hàng, hãy đặt lại số dư ban đầu hoặc sửa nguồn tiền của các giao dịch cũ.' },
      { t: 'steps', items: [
        'Vào **Nguồn tiền**, bấm **+ Thêm nguồn tiền**.',
        'Nhập **Tên** (ví dụ Vietcombank, Momo), chọn **Loại** (Tiền mặt, Ngân hàng, Ví điện tử, Thẻ tín dụng), chọn **Biểu tượng** và **Màu**.',
        'Nhập **Số dư ban đầu**: số tiền đang có tại thời điểm bạn bắt đầu dùng app.',
        'Thẻ tín dụng đang nợ: bật **Đang nợ (số dư ban đầu âm)** và nhập số nợ (ví dụ 5tr), hoặc nhập số âm như -5tr. Chọn loại Thẻ tín dụng thì ô này tự bật.',
        'Bấm **Lưu**.',
      ] },
      { t: 'p', text: 'Đầu trang là **Tổng số dư** của các nguồn đang dùng; khi có nguồn đang âm, trang tách thêm **Tài sản tiền** và **Nợ thẻ tín dụng**. Mỗi thẻ có nút **Chuyển tiền**, **Lịch sử** (mở trang Thu chi đã lọc theo nguồn đó) và **Sửa**.' },
      { t: 'p', text: '**Chuyển tiền:** bấm **Chuyển tiền** trên một thẻ (hoặc trong form giao dịch chọn loại **Chuyển tiền**), chọn nguồn **Từ** và **Đến** (phải khác nhau), nhập số tiền. Nguồn đi giảm, nguồn đến tăng đúng bằng số tiền đó. Chuyển tiền **không tính vào thu hay chi** và không ảnh hưởng ngân sách. Ví dụ: rút 2 triệu từ ngân hàng ra tiền mặt là chuyển tiền, không phải chi.' },
      { t: 'note', text: 'Trả nợ thẻ tín dụng = chuyển tiền từ tài khoản ngân hàng **đến** thẻ tín dụng (số dư thẻ tăng dần về 0). Khi quẹt thẻ mua hàng, ghi là **Chi** với nguồn là thẻ tín dụng.' },
      { t: 'list', items: [
        '**Lưu trữ** (tick ô Lưu trữ khi sửa): nguồn bị ẩn khỏi danh sách chọn và **không tính vào Tổng số dư, Tổng tài sản**; nằm trong mục **Đã lưu trữ** cuối trang, giao dịch cũ vẫn được giữ.',
        '**Xoá** chỉ được khi nguồn chưa có giao dịch nào. Nguồn đã có giao dịch (kể cả chuyển tiền) phải dùng **Lưu trữ**. Nguồn Tiền mặt mặc định không xoá được.',
        'Số dư nguồn tiền được cộng vào **Tổng tài sản** (Tổng quan và Tài sản) và hiện trong nhóm **Tiền mặt & tài khoản** của trang Tài sản dưới dạng dòng chỉ đọc. **Lãi/lỗ** chỉ tính trên tài sản đầu tư. Biểu đồ diễn biến tài sản ròng cộng thêm số dư nguồn tiền theo từng ngày.',
        'File **Xuất CSV giao dịch** có thêm cột **Nguồn tiền** và **Đến**.',
      ] },
      { t: 'note', text: 'Cảnh báo tính trùng: nếu trước đây bạn đã nhập tài khoản ngân hàng/ví/tiền mặt như một **tài sản**, đừng giữ cả hai nơi. Hãy chuyển sang Nguồn tiền (nhập số dư ban đầu) rồi **xoá tài sản** đó ở trang Tài sản, nếu không Tổng tài sản bị tính hai lần.', tone: 'warn' },
      { t: 'note', text: 'Đồng bộ Google Sheet: Nguồn tiền lưu ở tab mới **accounts**, tab **transactions** thêm cột accountId, toAccountId. Bạn phải dán lại **apps-script/Code.gs** mới và **Deploy → Manage deployments → Edit → Version: New version → Deploy**, nếu không Nguồn tiền sẽ không lên Sheet.', tone: 'warn' },
      { t: 'actions', items: [{ label: 'Mở Nguồn tiền', to: '/accounts' }, { label: 'Mở Thu chi', to: '/transactions', variant: 'secondary' }] },
    ],
  },
  {
    id: 'danh-muc-ngan-sach',
    icon: '🏷️',
    title: 'Danh mục & ngân sách',
    blocks: [
      { t: 'p', text: 'Trang **Danh mục** (trên điện thoại: liên kết **Danh mục** ở góc trên trang Thu chi) có hai nhóm: **Danh mục chi** và **Danh mục thu**. Mỗi nhóm có nút **+ Thêm**. Mỗi danh mục có **Tên danh mục**, **Biểu tượng (emoji)** và **Màu**.' },
      { t: 'p', text: 'Danh mục chi có thêm ô **Ngân sách tháng (VND, 0 = không đặt)**. Khi đặt ngân sách, danh sách hiện "đã chi / ngân sách" cùng thanh tiến độ, và hiện **Vượt ...** màu đỏ nếu chi quá mức.' },
      { t: 'list', items: ['Bấm vào một danh mục để sửa hoặc xoá.', 'Xoá danh mục đang có giao dịch: các giao dịch vẫn được giữ nhưng sẽ hiện "Không rõ". App sẽ hỏi lại trước khi xoá.', 'Danh mục chi đã dùng ≥ 80% ngân sách sẽ được cảnh báo ở trang **Tổng quan**.'] },
      { t: 'actions', items: [{ label: 'Mở Danh mục', to: '/categories' }] },
    ],
  },
  {
    id: 'quan-ly-tai-san',
    icon: '🏦',
    title: 'Quản lý tài sản',
    blocks: [
      { t: 'p', text: 'Trang **Tài sản** cho biết bạn đang có bao nhiêu và tiền nằm ở đâu. Trang gồm thẻ **Tổng tài sản** (gồm cả số dư Nguồn tiền), **Vốn đầu tư**, **Lãi/lỗ đầu tư** (chỉ tính trên tài sản bạn nhập ở đây), biểu đồ **Phân bổ tài sản**, **Diễn biến tài sản ròng** và **Danh sách tài sản** chia theo nhóm.' },
      { t: 'steps', items: [
        'Bấm **+ Thêm** trong **Danh sách tài sản**.',
        'Nhập **Tên tài sản** (ví dụ Vàng SJC), chọn **Danh mục**, nhập **Số lượng** và **Đơn vị** nếu cần.',
        'Nhập **Vốn đã bỏ ra (VND)** để app tính lãi/lỗ. Nhập **Giá trị hiện tại (VND)**, hoặc nhập **Giá hiện tại / đơn vị** để app tự tính giá trị = giá × số lượng.',
        'Bấm **Lưu**.',
      ] },
      { t: 'p', text: 'Khi giá thay đổi, bấm nút **Cập nhật** cạnh tài sản, nhập **Giá trị mới (VND)** rồi **Lưu**. Mỗi lần cập nhật được ghi lại để vẽ biểu đồ diễn biến tài sản ròng.' },
      { t: 'p', text: 'Bấm nút **Danh mục** (trong Danh sách tài sản) để quản lý nhóm tài sản. Mặc định có: Tiền mặt & tài khoản, Tiết kiệm, Cổ phiếu / Quỹ, Vàng, Crypto, Bất động sản. Mỗi nhóm có ô **Tỷ trọng mục tiêu (%, 0 = không đặt)**; biểu đồ phân bổ sẽ so sánh **Thực tế** với **Mục tiêu** và cho thấy độ **Lệch**.' },
      { t: 'note', text: 'Xoá một tài sản thì lịch sử giá trị của nó vẫn được giữ lại. Xoá nhóm tài sản đang có tài sản thì các tài sản đó chuyển sang "Chưa phân loại".' },
      { t: 'actions', items: [{ label: 'Mở Tài sản', to: '/assets' }] },
    ],
  },
  {
    id: 'doc-tong-quan',
    icon: '📊',
    title: 'Đọc trang Tổng quan',
    blocks: [
      { t: 'p', text: 'Trang **Tổng quan** tóm tắt tình hình theo tháng. Dùng nút ‹ và › để đổi tháng, bấm vào tên tháng để về tháng hiện tại.' },
      { t: 'table', head: ['Thẻ / biểu đồ', 'Ý nghĩa'], rows: [
        ['Thu tháng này', 'Tổng các khoản thu trong tháng đang chọn (không tính chuyển tiền).'],
        ['Chi tháng này', 'Tổng các khoản chi trong tháng đang chọn (không tính chuyển tiền).'],
        ['Tiết kiệm', 'Thu trừ chi, kèm tỷ lệ tiết kiệm (% so với thu). Màu đỏ nghĩa là chi nhiều hơn thu.'],
        ['Tổng tài sản', 'Tổng giá trị hiện tại của mọi tài sản cộng số dư Nguồn tiền; bấm "Nguồn tiền: ..." để mở trang Nguồn tiền, "Xem tài sản →" để mở trang Tài sản.'],
        ['Chi theo danh mục', 'Biểu đồ tròn cho biết tiền chi đi đâu nhiều nhất.'],
        ['Cảnh báo ngân sách', 'Danh mục chi đã dùng từ 80% ngân sách trở lên.'],
        ['Thu và chi 6 tháng gần nhất', 'So sánh thu và chi qua 6 tháng để thấy xu hướng.'],
        ['Giao dịch gần đây', '5 giao dịch mới nhất; bấm Xem tất cả để mở trang Thu chi.'],
      ] },
      { t: 'note', text: 'Khi chưa có giao dịch hay tài sản nào, trang hiện lời chào "Chào mừng đến với Montana" kèm nút để thêm giao dịch đầu tiên.' },
      { t: 'actions', items: [{ label: 'Mở Tổng quan', to: '/' }] },
    ],
  },
  {
    id: 'ket-noi-google-sheet',
    icon: '🔗',
    title: 'Kết nối Google Sheet',
    blocks: [
      { t: 'p', text: 'Kết nối để dữ liệu được lưu trên Google Sheet của chính bạn và dùng được trên nhiều thiết bị. Chỉ cần làm một lần.' },
      { t: 'status' },
      { t: 'steps', items: [
        'Tạo một Google Sheet mới tại sheets.google.com (đặt tên tuỳ ý, ví dụ "Montana").',
        'Vào **Tiện ích mở rộng (Extensions) → Apps Script**.',
        'Xoá nội dung mặc định của **Code.gs**, dán toàn bộ nội dung file **apps-script/Code.gs** của dự án rồi lưu.',
        'Vào **Cài đặt dự án (Project Settings)**, bật **Show "appsscript.json" manifest file in editor**, mở **appsscript.json** và dán nội dung file **apps-script/appsscript.json**, lưu lại.',
        'Chọn hàm **setupToken** ở thanh công cụ và bấm **Run**. Cấp quyền khi Google hỏi (Review permissions, chọn tài khoản, Advanced, Go to ..., Allow). Mở **Execution log** và **copy token**. (Lấy lại token bất cứ lúc nào từ menu **Montana → Tạo/hiện token** trong Google Sheet.)',
        'Bấm **Deploy → New deployment**, chọn loại **Web app**, đặt **Execute as: Me** và **Who has access: Anyone**, bấm **Deploy**, rồi copy **Web app URL** (kết thúc bằng /exec).',
        'Mở Montana, vào **Cài đặt**, dán URL vào ô **Web App URL** và token vào ô **Token**, bấm **Lưu**.',
        'Bấm **Kiểm tra kết nối**. Nếu thành công thì bấm **Đồng bộ ngay**.',
      ] },
      { t: 'note', text: 'Khi sửa Code.gs sau này: vào **Deploy → Manage deployments → Edit (bút chì) → Version: New version → Deploy**. URL /exec giữ nguyên nên không phải cấu hình lại app.', tone: 'warn' },
      { t: 'note', text: 'Bảo mật: token là lớp bảo vệ duy nhất. Ai có cả URL lẫn token đều đọc và ghi được dữ liệu của bạn, nên không chia sẻ chúng ở nơi công khai.', tone: 'warn' },
      { t: 'p', text: 'Tuỳ chọn **Tự động đồng bộ** (bật sẵn) giúp app tự đẩy thay đổi lên Sheet. Góc trên màn hình có nhãn trạng thái: "Đã đồng bộ", "n thay đổi chờ" hoặc "Lỗi: ..."; bấm vào nhãn để đồng bộ ngay.' },
      { t: 'actions', items: [{ label: 'Mở Cài đặt', to: '/settings' }] },
    ],
  },
  {
    id: 'nhieu-thiet-bi',
    icon: '📱',
    title: 'Dùng trên nhiều thiết bị',
    blocks: [
      { t: 'steps', items: [
        'Trên thiết bị mới, mở Montana và vào **Cài đặt**.',
        'Dán cùng **Web App URL** và **Token** đã dùng ở thiết bị đầu tiên, bấm **Lưu**.',
        'Bấm **Đồng bộ ngay**. Dữ liệu trên Google Sheet sẽ được kéo về máy.',
      ] },
      { t: 'list', items: [
        'Nếu bật **Tự động đồng bộ**, app tự đồng bộ khi mở app, khi quay lại tab, khi có mạng trở lại và sau mỗi thay đổi. Tắt tuỳ chọn này thì chỉ đồng bộ khi bạn bấm nhãn trạng thái hoặc **Đồng bộ ngay**.',
        'Nếu hai thiết bị cùng sửa một bản ghi, bản được sửa **sau cùng** sẽ thắng.',
        'Xoá một giao dịch hay tài sản trên máy này sẽ lan sang các máy khác khi đồng bộ.',
        'Không có mạng vẫn dùng bình thường; các thay đổi được xếp hàng ("Chờ đẩy lên") và tự gửi khi có mạng.',
        'Trên điện thoại, mở app bằng trình duyệt rồi chọn **Thêm vào màn hình chính (Add to Home Screen)** để có biểu tượng như ứng dụng.',
      ] },
      { t: 'actions', items: [{ label: 'Mở Cài đặt', to: '/settings' }] },
    ],
  },
  {
    id: 'sao-luu-khoi-phuc',
    icon: '💾',
    title: 'Sao lưu & khôi phục',
    blocks: [
      { t: 'p', text: 'Thẻ **Công cụ dữ liệu** trong **Cài đặt** có các nút:' },
      { t: 'table', head: ['Nút', 'Tác dụng'], rows: [
        ['Xuất JSON', 'Tải về một file chứa toàn bộ dữ liệu. Đây là bản sao lưu đầy đủ.'],
        ['Nhập JSON', 'Chọn file JSON đã xuất trước đó. App cho biết file có bao nhiêu bản ghi; bấm **Nhập** để xác nhận. Bản ghi trùng id bị ghi đè bằng nội dung trong file, bản ghi mới được thêm vào.'],
        ['Xuất CSV giao dịch', 'Tải file CSV các giao dịch (gồm cột Nguồn tiền và Đến) để mở bằng Excel hoặc Google Sheets.'],
        ['Xoá dữ liệu trên máy này', 'Xoá toàn bộ dữ liệu lưu trong trình duyệt của thiết bị này (có hỏi xác nhận).'],
      ] },
      { t: 'note', text: 'Nếu đã kết nối Google Sheet, dữ liệu vẫn còn trên Sheet sau khi xoá trên máy và sẽ được kéo về khi đồng bộ. Nếu chưa kết nối, việc xoá là không thể hoàn tác, hãy **Xuất JSON** trước.', tone: 'warn' },
      { t: 'actions', items: [{ label: 'Mở Cài đặt', to: '/settings' }] },
    ],
  },
  {
    id: 'faq',
    icon: '❓',
    title: 'Câu hỏi thường gặp & xử lý lỗi',
    blocks: [
      { t: 'faq', items: [
        { q: 'Báo lỗi "Unauthorized"?', a: 'Token sai. Vào Cài đặt, dán lại token đúng (dùng nút Hiện để kiểm tra, tránh thừa dấu cách). Nếu quên, mở Google Sheet, chọn menu Montana → Tạo/hiện token để lấy lại, hoặc xem Execution log khi chạy setupToken.' },
        { q: 'Báo lỗi "HTTP ..." hoặc "Failed to fetch"?', a: 'Thường do URL sai hoặc chưa deploy đúng. Kiểm tra: (1) URL phải là Web app URL kết thúc bằng /exec; (2) Deploy với "Who has access" là Anyone; (3) nếu vừa sửa Code.gs, phải chọn Manage deployments → Edit → Version: New version → Deploy. Cũng thử kiểm tra kết nối mạng.' },
        { q: 'Dữ liệu không lên Google Sheet?', a: 'Xem nhãn trạng thái ở góc trên: "Chưa kết nối Google Sheet" nghĩa là chưa nhập URL. Nếu có "n thay đổi chờ" hoặc "Lỗi", vào Cài đặt bấm Kiểm tra kết nối rồi Đồng bộ ngay. Đảm bảo tuỳ chọn Tự động đồng bộ đang bật.' },
        { q: 'Số dư nguồn tiền sai?', a: 'Kiểm tra: (1) Số dư ban đầu của nguồn có đúng không (thẻ tín dụng đang nợ thì phải âm); (2) chiều chuyển tiền: Từ là nguồn bị trừ, Đến là nguồn được cộng, vào Thu chi lọc theo nguồn đó để xem từng dòng; (3) giao dịch có đúng nguồn không (giao dịch cũ mặc định thuộc Tiền mặt); (4) nguồn đã Lưu trữ không tính vào Tổng số dư và Tổng tài sản.' },
        { q: 'Tổng tài sản bị tính trùng?', a: 'Có thể bạn vừa nhập tài khoản đó ở trang Tài sản vừa tạo trong Nguồn tiền. Hãy giữ ở Nguồn tiền (nhập số dư ban đầu) và xoá tài sản trùng ở trang Tài sản.' },
        { q: 'Sau khi cập nhật, Nguồn tiền không lên Sheet?', a: 'Bạn chưa cập nhật backend. Dán lại toàn bộ apps-script/Code.gs mới vào Apps Script, lưu, rồi Deploy → Manage deployments → Edit (bút chì) → Version: New version → Deploy (URL giữ nguyên), sau đó bấm Đồng bộ ngay. Bản Code.gs cũ không biết bảng accounts và cột accountId, toAccountId nên bỏ qua chúng: tab accounts không xuất hiện và nguồn tiền của giao dịch không được lưu trên Sheet, dù nhãn vẫn có thể báo Đã đồng bộ. Nếu đã đồng bộ bằng bản cũ, hãy kiểm tra lại nguồn tiền của các giao dịch mới.' },
        { q: 'Không thấy Danh mục trên điện thoại?', a: 'Thanh dưới cùng chỉ có Tổng quan, Thu chi, Nguồn tiền, Tài sản, Cài đặt. Vào Thu chi và bấm liên kết Danh mục ở góc trên.' },
        { q: 'Mất dữ liệu sau khi xoá cache trình duyệt?', a: 'Dữ liệu chưa đồng bộ nằm trong trình duyệt nên sẽ mất theo. Nếu đã kết nối Google Sheet, chỉ cần dán lại URL và token trong Cài đặt rồi Đồng bộ ngay để kéo dữ liệu về. Nếu chưa kết nối, hãy nhập lại từ file JSON đã xuất. Vì vậy nên kết nối Sheet và xuất JSON định kỳ.' },
        { q: 'Làm sao thêm app vào màn hình chính điện thoại?', a: 'iPhone (Safari): bấm nút Chia sẻ rồi chọn Thêm vào Màn hình chính (Add to Home Screen). Android (Chrome): bấm menu ⋮ rồi chọn Thêm vào màn hình chính (Add to Home screen).' },
        { q: 'Tôi có thể sửa trực tiếp trên Google Sheet không?', a: 'Được. Sau khi sửa một dòng, hãy cập nhật cột updatedAt thành giá trị mới hơn (định dạng ISO, ví dụ 2026-01-31T10:00:00.000Z) để app nhận thay đổi. Không nên xoá hẳn dòng, vì xoá trong app chỉ đặt cột deleted = TRUE để việc xoá lan sang các thiết bị khác.' },
        { q: 'Gõ 1,5 nhưng ra 2 đồng?', a: 'Không có đuôi k/tr/tỷ thì 1,5 là một đồng rưỡi và được làm tròn thành 2 đồng. Hãy gõ 1,5tr (1.500.000) hoặc 1,5k (1.500).' },
        { q: 'Hai thiết bị sửa cùng một khoản thì sao?', a: 'Bản được sửa sau cùng sẽ được giữ (last-write-wins). Nếu bạn nghi ngờ, hãy đồng bộ ở cả hai máy rồi kiểm tra lại số liệu.' },
      ] },
    ],
  },
]
