# Hướng dẫn sử dụng Montana

Montana là ứng dụng quản lý tài chính cá nhân: ghi thu chi, đặt ngân sách theo danh mục, theo dõi tài sản và (tuỳ chọn) đồng bộ dữ liệu lên Google Sheet của chính bạn.

Thanh điều hướng gồm: **Tổng quan**, **Thu chi**, **Nguồn tiền**, **Danh mục**, **Tài sản**, **Cài đặt** và **Hướng dẫn** (biểu tượng ❓). Trên điện thoại, thanh dưới cùng chỉ có 5 mục: **Tổng quan**, **Thu chi**, **Nguồn tiền**, **Tài sản**, **Cài đặt**; ❓ nằm ở góc trên bên phải. **Danh mục** không có trên thanh dưới cùng của điện thoại, hãy vào qua liên kết **Danh mục** ở góc trên trang **Thu chi** (trên máy tính vẫn có trong menu bên trái).

## 1. Bắt đầu nhanh (5 phút)

1. Mở app. Lần đầu, app đã có sẵn danh mục mẫu:
   - **Chi:** Ăn uống, Di chuyển, Nhà ở & hoá đơn, Mua sắm, Sức khoẻ, Giải trí, Học tập, Khác.
   - **Thu:** Lương, Thưởng, Lãi đầu tư, Thu khác.
   - **Tài sản:** Tiền mặt & tài khoản, Tiết kiệm, Cổ phiếu / Quỹ, Vàng, Crypto, Bất động sản.
2. Vào **Nguồn tiền**: app có sẵn nguồn **Tiền mặt** (số dư ban đầu 0). Thêm ví, tài khoản ngân hàng, thẻ tín dụng của bạn và nhập **Số dư ban đầu**. Xem mục 3.
3. Vào **Thu chi**, bấm **+ Thêm** (trên điện thoại là nút tròn **+** màu xanh ở góc dưới bên phải), nhập giao dịch đầu tiên.
4. Vào **Danh mục** (trên điện thoại: bấm liên kết **Danh mục** ở góc trên trang **Thu chi**), bấm vào một danh mục chi (ví dụ Ăn uống) và đặt **Ngân sách tháng**, ví dụ `3tr`.
5. Vào **Tài sản**, bấm **+ Thêm** để nhập các khoản tiết kiệm, vàng, cổ phiếu... (tiền trong tài khoản ngân hàng, ví thì nhập ở **Nguồn tiền**, đừng nhập ở đây).
6. Xem kết quả ở **Tổng quan**.
7. (Khuyến nghị) Kết nối Google Sheet ở **Cài đặt** để dữ liệu không mất khi xoá cache trình duyệt và dùng được trên nhiều thiết bị. Xem mục 7.

Dữ liệu luôn được lưu ngay trên máy bạn, không cần mạng. Google Sheet chỉ là nơi sao lưu và đồng bộ.

### Rút gọn số tiền khi nhập

Vào **Cài đặt → Nhập tiền**, nhập **Mã tiền nhập** và **Hệ số nhân**. Ví dụ mã `VND`, hệ số `1000`: gõ `20` trong một ô tiền sẽ lưu thành `20.000 VND`. Hệ số áp dụng cho giao dịch, số dư, ngân sách và giá trị tài sản; danh sách và báo cáo vẫn hiển thị VND. Đổi hệ số không thay đổi các số tiền đã lưu.

Mã tiền, hệ số và tuỳ chọn tự động đồng bộ được lưu trong tab `appSettings` khi đã kết nối Google Sheets, nên sẽ dùng chung trên các thiết bị sau khi đồng bộ. URL Web App và token là thông tin kết nối riêng của từng trình duyệt: nhập chúng một lần trên thiết bị mới rồi bấm **Đồng bộ ngay** để tải cấu hình chung. Nếu dùng Sheet đã có sẵn, hãy cập nhật và deploy `Code.gs` mới trước (mục 7).

## 2. Ghi thu chi

**Thêm giao dịch:** vào **Thu chi** → **+ Thêm**. Điền:

- **Loại:** Chi, Thu hoặc Chuyển tiền (danh sách danh mục sẽ đổi theo loại; **Chuyển tiền** xem mục 3).
- **Số tiền (VND):** gõ nhanh theo cách dưới đây.
- **Danh mục:** bắt buộc chọn (không có khi chuyển tiền).
- **Nguồn tiền:** khoản thu/chi này lấy từ đâu / vào đâu. Mặc định là nguồn bạn dùng lần trước (lần đầu là **Tiền mặt**); nếu bạn đang lọc theo một nguồn tiền thì mặc định là nguồn đó. Mỗi lựa chọn hiện kèm số dư hiện tại.
- **Ngày:** mặc định là hôm nay (nếu đang xem tháng khác thì là ngày 1 của tháng đó).
- **Ghi chú:** tuỳ chọn.

Bấm **Lưu** để lưu và đóng. Bấm **Lưu & thêm tiếp** để lưu rồi giữ nguyên form, xoá sạch số tiền và ghi chú để nhập tiếp khoản khác (loại, danh mục, nguồn tiền, ngày được giữ lại). Rất tiện khi nhập một loạt khoản chi cùng ngày.

**Gõ tiền nhanh** (ô Số tiền tự hiểu):

| Bạn gõ | App hiểu |
|---|---|
| `50k` | 50.000 |
| `1,5tr` (hoặc `1.5tr`, `1,5m`) | 1.500.000 |
| `2 tỷ` (hoặc `2ty`) | 2.000.000.000 |
| `1.500.000` | 1.500.000 |
| `200000` | 200.000 |

Lưu ý: dấu chấm/phẩy đứng trước đúng 3 chữ số được hiểu là dấu ngăn cách hàng nghìn (`1.500.000`, `1.500k` = 1.500.000); các trường hợp khác là dấu thập phân (`1,5tr` = 1.500.000). Số tiền luôn làm tròn tới đồng, nên muốn số lẻ hãy thêm đuôi như `1,5tr`.

**Xem theo tháng:** dùng nút **‹** (Tháng trước) và **›** (Tháng sau) cạnh tên tháng. Phía trên là ba ô tổng hợp của tháng: **Tổng thu**, **Tổng chi**, **Chênh lệch**. Giao dịch được nhóm theo ngày, mỗi ngày có tổng riêng.

**Lọc và tìm kiếm** (áp dụng cho tháng đang xem):

- Ô chọn đầu tiên: **Tất cả / Chi / Thu / Chuyển tiền**.
- Ô chọn thứ hai: **Tất cả nguồn tiền** hoặc một nguồn cụ thể (nguồn đã lưu trữ có ghi "(đã lưu trữ)"). Lọc theo nguồn thì cũng hiện các khoản chuyển tiền đi/đến nguồn đó, và tổng mỗi ngày là biến động số dư của nguồn đó. Nút **Lịch sử** ở trang **Nguồn tiền** mở sẵn trang này với bộ lọc tương ứng.
- Ô chọn thứ ba: **Mọi danh mục** hoặc một danh mục cụ thể.
- Ô **Tìm ghi chú...**: tìm theo chữ trong ghi chú.

Ba ô **Tổng thu**, **Tổng chi**, **Chênh lệch** ở đầu trang không tính các khoản chuyển tiền và không bị ảnh hưởng bởi bộ lọc.

Mỗi giao dịch thu/chi hiện tên nguồn tiền bên dưới tên danh mục; giao dịch chuyển tiền hiện dạng **Chuyển tiền: nguồn đi → nguồn đến** (biểu tượng 🔁, màu xanh dương).

**Sửa hoặc xoá:** bấm vào một giao dịch trong danh sách để mở form **Sửa giao dịch**. Sửa xong bấm **Lưu**, hoặc bấm **Xoá** rồi xác nhận để xoá.

## 3. Nguồn tiền & chuyển tiền

**Nguồn tiền** là nơi tiền của bạn đang nằm: tiền mặt, tài khoản ngân hàng, ví điện tử (Momo...), thẻ tín dụng. Mỗi khoản thu/chi thuộc về một nguồn tiền, nên app tính được số dư từng nguồn.

**Công thức số dư:** số dư = **số dư ban đầu** + tổng thu − tổng chi ± chuyển tiền (nhận vào thì cộng, chuyển đi thì trừ). Số dư tính trên mọi giao dịch của nguồn đó, không phụ thuộc tháng đang xem.

**Nguồn tiền mặc định:** app có sẵn nguồn **Tiền mặt** (không thể xoá, chỉ đổi tên hoặc lưu trữ). Mọi giao dịch cũ, tạo trước khi có tính năng này, được tính vào **Tiền mặt**; dữ liệu cũ không bị sửa. Vì vậy nếu tiền thực tế của bạn nằm ở ngân hàng, hãy đặt lại **Số dư ban đầu** cho phù hợp, hoặc sửa nguồn tiền của các giao dịch cũ.

**Thêm nguồn tiền:** vào **Nguồn tiền** → **+ Thêm nguồn tiền**, điền:

- **Tên** (ví dụ Vietcombank, Momo) và **Loại**: Tiền mặt, Ngân hàng, Ví điện tử hoặc Thẻ tín dụng.
- **Biểu tượng** (emoji) và **Màu**.
- **Số dư ban đầu:** số tiền đang có **tại thời điểm bạn bắt đầu dùng app**, không phải số dư hôm nay nếu bạn đã nhập giao dịch cũ.
- **Đang nợ (số dư ban đầu âm):** dành cho thẻ tín dụng, ví dụ đang nợ 5 triệu thì bật ô này và nhập `5tr` (hoặc nhập thẳng `-5tr`). Chọn loại **Thẻ tín dụng** thì ô này tự bật.

Đầu trang **Nguồn tiền** là **Tổng số dư** của các nguồn đang dùng. Khi có nguồn đang âm (thường là thẻ tín dụng), trang tách thêm **Tài sản tiền** và **Nợ thẻ tín dụng**. Các nguồn được nhóm theo loại; mỗi thẻ có nút **Chuyển tiền**, **Lịch sử** và **Sửa**.

**Chuyển tiền giữa các nguồn:** bấm **Chuyển tiền** trên một thẻ (hoặc vào **Thu chi** → **+ Thêm** → **Chuyển tiền**), chọn nguồn **Từ** và **Đến** (phải khác nhau), nhập số tiền, ngày, ghi chú. Chuyển tiền làm số dư nguồn đi giảm, nguồn đến tăng đúng bằng số tiền đó, và **không tính vào thu hay chi**, không ảnh hưởng ngân sách. Ví dụ: rút 2 triệu từ ngân hàng ra tiền mặt là chuyển tiền, không phải chi.

- **Trả nợ thẻ tín dụng** = chuyển tiền từ tài khoản ngân hàng **đến** thẻ tín dụng: số dư thẻ tăng dần về 0. Khi bạn quẹt thẻ mua hàng, hãy ghi là **Chi** với nguồn là thẻ tín dụng (số dư thẻ âm thêm).
- Sửa/xoá giao dịch chuyển tiền: bấm vào nó trong **Thu chi**, như giao dịch thường.

**Lưu trữ và xoá:**

- **Lưu trữ** (tick ô "Lưu trữ" khi sửa): nguồn bị ẩn khỏi danh sách chọn khi ghi giao dịch và **không tính vào Tổng số dư, Tổng tài sản**. Nguồn nằm trong mục **Đã lưu trữ** ở cuối trang, giao dịch cũ vẫn được giữ, có thể bỏ tick để dùng lại. Nên lưu trữ khi tài khoản đã đóng.
- **Xoá:** chỉ xoá được nguồn **chưa có giao dịch nào**. Nguồn đã có giao dịch (kể cả chuyển tiền đi/đến) thì app báo số giao dịch và yêu cầu dùng **Lưu trữ**. Nguồn **Tiền mặt** mặc định không xoá được.

**Nguồn tiền trong Tài sản và Tổng quan:** số dư các nguồn đang dùng được cộng vào **Tổng tài sản** (Tổng quan và trang Tài sản) và hiện trong nhóm **Tiền mặt & tài khoản** của trang Tài sản dưới dạng dòng chỉ đọc (bấm **Quản lý** để sang trang Nguồn tiền). **Lãi / lỗ** và **Vốn đầu tư** chỉ tính trên tài sản đầu tư bạn nhập ở trang Tài sản, không tính Nguồn tiền. Biểu đồ **Diễn biến tài sản ròng** cộng thêm số dư nguồn tiền tại từng ngày và có điểm cho ngày hôm nay.

**Xuất CSV giao dịch** có thêm cột **Nguồn tiền** và **Đến** (nguồn nhận, chỉ có ở chuyển tiền); cột **Loại** có giá trị Chi, Thu hoặc Chuyển.

> **Cảnh báo tính trùng:** trước khi có tính năng này, có thể bạn đã nhập tài khoản ngân hàng/ví/tiền mặt như một **tài sản** (nhóm "Tiền mặt & tài khoản"). Nếu giờ bạn lại tạo nó ở **Nguồn tiền** thì tiền bị tính hai lần trong Tổng tài sản. Hãy **chuyển sang Nguồn tiền** (nhập số dư ban đầu) rồi **xoá tài sản** tương ứng ở trang Tài sản.

**Đồng bộ Google Sheet:** Nguồn tiền được lưu ở tab mới `accounts`, danh mục con cần cột `parentId`, và cấu hình dùng chung được lưu ở tab `appSettings`. Nếu đã có Sheet, hãy cập nhật `Code.gs` trong Apps Script bằng [bản mới](https://github.com/HoangPham1220/montana/blob/main/apps-script/Code.gs), rồi **Deploy → Manage deployments → Edit → Version: New version → Deploy**. Lần đồng bộ kế tiếp sẽ tự tạo tab/cột còn thiếu.

## 4. Danh mục & ngân sách

Vào **Danh mục** (trên điện thoại: liên kết **Danh mục** ở góc trên trang **Thu chi**). Trang chia làm hai khối: **Danh mục chi** và **Danh mục thu**.

- **Thêm:** bấm **+ Thêm** ở khối tương ứng. Chọn loại, gõ tên, chọn biểu tượng (emoji) và màu.
- **Sửa:** bấm vào tên danh mục.
- **Ngân sách tháng:** chỉ có ở danh mục chi. Nhập số tiền (ví dụ `3tr`), để `0` nếu không muốn đặt ngân sách. Ngân sách tính theo **tháng hiện tại** và là mức chi tối đa bạn muốn cho danh mục đó mỗi tháng.

**Thanh ngân sách:**

- Trang **Danh mục**: mỗi danh mục có ngân sách hiển thị dạng `đã chi / ngân sách` kèm thanh tiến độ. Thanh **xanh** khi còn trong hạn mức, chuyển **đỏ** và hiện **Vượt ...** khi chi quá ngân sách.
- Trang **Tổng quan**: khối **⚠️ Cảnh báo ngân sách** chỉ liệt kê danh mục đã dùng từ **80% ngân sách trở lên**. Từ 80% đến 100% thanh và số tiền màu **vàng cam**, quá 100% chuyển **đỏ**.

**Xoá danh mục:** bấm vào danh mục → **Xoá**. Nếu danh mục đã có giao dịch, app sẽ báo số giao dịch và hỏi lại. Các giao dịch **vẫn được giữ nguyên**, chỉ là tên danh mục hiển thị thành **"Không rõ"**. Muốn gọn gàng, hãy vào **Thu chi** và sửa các giao dịch đó sang danh mục khác.

## 5. Quản lý tài sản

Vào **Tài sản**. Ở trên cùng có ba thẻ: **Tổng tài sản** (gồm cả số dư **Nguồn tiền**), **Vốn đầu tư** (tổng tiền đã bỏ ra cho các tài sản) và **Lãi/lỗ đầu tư** (chênh lệch giá trị hiện tại và vốn của các tài sản, kèm %; không tính Nguồn tiền). Nhóm **Tiền mặt & tài khoản** hiển thị thêm các nguồn tiền dưới dạng dòng chỉ đọc; muốn sửa hãy bấm **Quản lý** để sang trang **Nguồn tiền**.

**Thêm tài sản:** ở khối **Danh sách tài sản** bấm **+ Thêm**, điền:

- **Tên tài sản** (ví dụ Vàng SJC, VNM) và **Danh mục**.
- **Số lượng** và **Đơn vị** (ví dụ 5 chỉ, 100 cổ phiếu).
- **Vốn đã bỏ ra (VND):** số tiền bạn đã đầu tư, dùng để tính lãi/lỗ.
- **Giá hiện tại / đơn vị** (tuỳ chọn): nhập giá một đơn vị, app tự tính **Giá trị hiện tại** = giá x số lượng và lưu lại giá này để lần sau mở tài sản vẫn thấy.
- **Giá trị hiện tại (VND):** tổng giá trị thị trường bây giờ. Có thể nhập tay trực tiếp.
- **Ghi chú.**

**Vốn và giá trị hiện tại khác nhau thế nào?** Vốn là số tiền bạn đã bỏ ra lúc mua (không đổi). Giá trị hiện tại là giá trị thị trường hôm nay (thay đổi theo thời gian). Lãi/lỗ = giá trị hiện tại - vốn. Với tiền mặt, tiết kiệm không có "vốn" riêng, bạn có thể để vốn bằng số tiền gốc hoặc để 0 (lúc đó % lãi/lỗ hiển thị "—").

**Cập nhật giá trị nhanh:** mỗi dòng tài sản có nút **Cập nhật**. Bấm vào, nhập giá trị mới, **Lưu**. Cách này nhanh hơn mở form đầy đủ và là cách tốt nhất để cập nhật định kỳ (ví dụ mỗi tuần hoặc mỗi tháng).

**Biểu đồ diễn biến (Diễn biến tài sản ròng):** mỗi lần bạn tạo tài sản hoặc đổi giá trị hiện tại, app ghi lại giá trị của ngày đó. Biểu đồ chỉ xuất hiện khi có giá trị ở **ít nhất 2 ngày khác nhau**. Vì vậy nếu chưa thấy biểu đồ, hãy quay lại cập nhật giá trị vào một ngày khác.

**Nhóm theo danh mục:** danh sách tài sản được gom theo danh mục, bấm vào tên nhóm để thu gọn/mở rộng. Tài sản chưa có danh mục (hoặc danh mục đã bị xoá) nằm ở nhóm **Chưa phân loại**. Muốn chuyển, bấm vào tài sản và chọn danh mục khác.

**Sửa hoặc xoá tài sản:** bấm vào tên tài sản → **Lưu** hoặc **Xoá**. Xoá tài sản thì lịch sử giá trị cũ vẫn được giữ, nhưng tài sản không còn tính vào tổng từ ngày xoá.

**Danh mục tài sản & phân bổ mục tiêu:** bấm nút **Danh mục** ở khối danh sách. Tại đây bạn có thể **+ Thêm danh mục**, **Sửa**, **Xoá**, và đặt **Tỷ trọng mục tiêu (%)** cho từng danh mục (0 = không đặt). Ví dụ: Tiết kiệm 40%, Cổ phiếu 30%, Vàng 20%, Tiền mặt 10%. Tổng các mục tiêu nên bằng 100%, nếu không app sẽ nhắc.

Khi đã đặt mục tiêu, khối **Phân bổ tài sản** hiện thêm bảng **Phân bổ thực tế vs mục tiêu** với các cột **Thực tế**, **Mục tiêu**, **Lệch** và **Gợi ý**. Cột Gợi ý cho biết nên **Thêm** hay **Giảm** bao nhiêu tiền để về đúng tỷ trọng, hoặc hiện **Đạt mục tiêu** nếu chênh lệch dưới 0,5%.

Nếu xoá một danh mục tài sản còn tài sản bên trong, các tài sản đó chuyển sang **Chưa phân loại** (không bị mất).

## 6. Đọc trang Tổng quan

Chọn tháng bằng nút **‹** và **›**. Bấm vào tên tháng ở giữa để quay về tháng hiện tại.

- **Thu tháng này / Chi tháng này:** tổng thu, tổng chi của tháng đang chọn (không tính chuyển tiền giữa các nguồn).
- **Tiết kiệm:** thu trừ chi, kèm **Tỷ lệ tiết kiệm** (% trên tổng thu). Số âm nghĩa là tháng đó chi nhiều hơn thu.
- **Tổng tài sản:** tổng giá trị hiện tại của tài sản cộng số dư **Nguồn tiền** (dòng **Nguồn tiền: ...** bấm để sang trang Nguồn tiền); bấm **Xem tài sản →** để sang trang Tài sản.
- **Chi theo danh mục:** biểu đồ tròn và top 5 danh mục chi nhiều nhất, kèm % và số tiền.
- **Thu và chi 6 tháng gần nhất:** biểu đồ cột so sánh, giúp thấy xu hướng.
- **⚠️ Cảnh báo ngân sách:** danh mục đã dùng từ 80% ngân sách (vàng cam), vượt ngân sách (đỏ). Khối này ẩn nếu không có danh mục nào đạt ngưỡng.
- **Giao dịch gần đây:** 5 giao dịch mới nhất, bấm **Xem tất cả** để sang trang Thu chi.

Khi chưa có giao dịch hay tài sản nào, trang hiện lời chào với hai nút: **Thêm giao dịch đầu tiên** và **Kết nối Google Sheet**.

## 7. Kết nối Google Sheet

Bước này chỉ làm một lần. Mã script có sẵn trong thư mục dự án (`apps-script/Code.gs`). Chi tiết từng bước xem file **README.md**; dưới đây là bản tóm tắt.

1. Tạo một Google Sheet mới (ví dụ đặt tên "Montana").
2. Vào **Tiện ích mở rộng (Extensions) → Apps Script**. Xoá code mặc định, dán toàn bộ nội dung file `apps-script/Code.gs` và lưu. Bật hiển thị file `appsscript.json` (Project Settings) rồi dán nội dung `apps-script/appsscript.json`.
3. Chọn hàm `setupToken`, bấm **Run**, cấp quyền khi Google hỏi. Mở **Execution log** và **copy token** vừa tạo.
4. Bấm **Deploy → New deployment**, chọn loại **Web app**, đặt **Execute as: Me** và **Who has access: Anyone**. Bấm **Deploy** và copy **Web app URL** (kết thúc bằng `/exec`).
5. Mở Montana → **Cài đặt** → khối **Kết nối Google Sheet**: dán URL vào **Web App URL**, dán token vào **Token** (bấm **Hiện** nếu muốn xem lại), bấm **Lưu**.
6. Bấm **Kiểm tra kết nối**. Thấy "Kết nối thành công" là được. Sau đó bấm **Đồng bộ ngay**.

Ô **Tự động đồng bộ** (mặc định bật): app tự đẩy thay đổi lên sau khoảng 1,5 giây kể từ lần sửa cuối.

**Huy hiệu đồng bộ ở góc trên** cho biết trạng thái:

| Hiển thị | Ý nghĩa |
|---|---|
| Chưa kết nối Google Sheet | Chưa cài URL. Bấm vào để sang Cài đặt. |
| Đang đồng bộ… | Đang gửi/nhận dữ liệu. |
| N thay đổi chờ | Có N bản ghi chưa gửi lên Sheet (do đang offline, hoặc chưa tới lượt đồng bộ). |
| Đã đồng bộ | Mọi thứ đã khớp với Google Sheet. |
| Lỗi: ... | Đồng bộ thất bại, xem mục 10. Dữ liệu của bạn vẫn an toàn trên máy. |

Bấm vào huy hiệu (khi đã kết nối) để **đồng bộ ngay**.

**Không có mạng vẫn dùng bình thường.** Mọi thao tác được ghi trên máy trước. Khi có mạng lại, hoặc khi bạn quay lại tab/cửa sổ của app, app tự đồng bộ. Cũng có thể bấm huy hiệu để đồng bộ tay.

**Bảo mật:** URL + token là chìa khoá duy nhất. Ai có cả hai đều đọc và ghi được dữ liệu của bạn, nên đừng chia sẻ chúng.

**Sửa trực tiếp trong Google Sheet:** được, nhưng **không khuyến khích**. Mỗi dòng có cột `updatedAt`; app chỉ nhận thay đổi khi `updatedAt` **mới hơn** giá trị app đang có. Nếu bạn sửa mà không đổi `updatedAt` (định dạng ví dụ `2026-01-31T10:00:00.000Z`), thay đổi sẽ bị bỏ qua hoặc bị ghi đè. Cách an toàn nhất là sửa ngay trong app.

## 8. Dùng trên nhiều thiết bị

1. Trên mỗi thiết bị (điện thoại, laptop...), mở cùng địa chỉ web của Montana.
2. Vào **Cài đặt**, nhập **Web App URL và Token** của Sheet rồi bấm **Lưu**.
3. Bấm **Đồng bộ ngay**. Dữ liệu và cấu hình chung trong tab `appSettings` sẽ được tải về máy mới.

Cách hoạt động: mỗi bản ghi có thời điểm sửa cuối; nếu cùng một bản ghi được sửa ở hai nơi thì **bản sửa sau cùng thắng**. Vì vậy:

- Đừng sửa **cùng một giao dịch/tài sản** trên hai thiết bị cùng lúc (hoặc khi một thiết bị đang offline chưa đồng bộ).
- Trước khi sửa trên thiết bị khác, hãy chờ huy hiệu báo **Đã đồng bộ**.
- Các bản ghi khác nhau (giao dịch khác nhau) thì không xung đột, nhập song song thoải mái.
- Xoá cũng được đồng bộ sang các thiết bị khác.

## 9. Sao lưu & khôi phục

Vào **Cài đặt** → khối **Công cụ dữ liệu**:

- **Xuất JSON:** tải về file `montana-backup-<ngày>.json` chứa toàn bộ dữ liệu. Nên xuất định kỳ, và **luôn xuất trước khi xoá dữ liệu**.
- **Nhập JSON:** chọn file sao lưu, app cho biết số bản ghi trong file, bấm **Nhập** để xác nhận. Bản ghi mới được thêm vào; với bản ghi trùng, bản nào **mới hơn** thì được giữ (một bản sao lưu cũ sẽ không đè lên dữ liệu bạn vừa sửa). Khi đã kết nối Sheet, dữ liệu nhập vào sẽ tự đồng bộ lên.
- **Xuất CSV giao dịch:** tải file `montana-giao-dich-<ngày>.csv` (cột Ngày, Loại, Danh mục, Nguồn tiền, Đến, Số tiền, Ghi chú; Loại là Chi, Thu hoặc Chuyển) để mở bằng Excel/Google Sheets. File này chỉ để xem/phân tích, **không** dùng để khôi phục.

**Vùng nguy hiểm → Xoá dữ liệu trên máy này:**

- Xoá toàn bộ dữ liệu lưu trong trình duyệt này, **kể cả URL và token** (bạn phải nhập lại).
- Các thay đổi **chưa đồng bộ sẽ mất vĩnh viễn**.
- Dữ liệu đã có trên Google Sheet vẫn còn và sẽ tải lại khi bạn kết nối lại và đồng bộ.
- Nếu chưa kết nối Sheet, xoá là mất hết, nên hãy **Xuất JSON** trước.

## 10. Câu hỏi thường gặp & xử lý lỗi

**Huy hiệu báo "Lỗi: Unauthorized".**
Token sai. Vào **Cài đặt**, dán lại đúng token (lấy từ Execution log hoặc menu **Montana → Tạo/hiện token** trong Google Sheet), bấm **Lưu** rồi **Kiểm tra kết nối**. Kiểm tra không có khoảng trắng thừa.

**Huy hiệu báo "Lỗi: HTTP ..." hoặc "Failed to fetch".**
Thường do một trong các nguyên nhân sau:
- URL sai: phải là địa chỉ kết thúc bằng `/exec` (không phải `/dev`, không phải link chỉnh sửa Apps Script).
- Chưa deploy dạng Web app, hoặc **Who has access** chưa đặt là **Anyone**.
- Đã sửa `Code.gs` nhưng chưa phát hành bản mới: vào **Deploy → Manage deployments → biểu tượng bút chì → Version: New version → Deploy**.
- Máy đang không có mạng, hoặc trình duyệt/tiện ích chặn kết nối.

**Dữ liệu không lên Google Sheet.**
Kiểm tra lần lượt: (1) huy hiệu có đang là "Chưa kết nối Google Sheet" không; (2) **Tự động đồng bộ** có bật không, hoặc bấm huy hiệu / **Đồng bộ ngay**; (3) huy hiệu có hiện "Lỗi: ..." không, xử lý theo các mục trên; (4) có bản ghi nào đang "chờ" không, đợi có mạng rồi đồng bộ lại. Trong Sheet, dữ liệu nằm ở các tab `accounts`, `categories`, `transactions`, `assetCategories`, `assets`, `assetSnapshots`, `appSettings`. Nếu thiếu tab mới, cập nhật và deploy `Code.gs` rồi đồng bộ lại.

**Mở app lên thấy mất hết dữ liệu.**
Dữ liệu được lưu trong trình duyệt nên sẽ mất nếu bạn xoá cache/dữ liệu trang web, dùng chế độ ẩn danh, hoặc đổi trình duyệt/thiết bị. Nếu đã kết nối Google Sheet: vào **Cài đặt**, nhập lại URL + token, bấm **Đồng bộ ngay** là lấy lại đầy đủ. Nếu chưa kết nối, hãy nhập file sao lưu bằng **Nhập JSON**. Vì vậy nên kết nối Sheet hoặc xuất JSON định kỳ.

**Số dư nguồn tiền sai?**
Kiểm tra lần lượt: (1) **Số dư ban đầu** của nguồn có đúng không (thẻ hiện dòng "Số dư ban đầu"; thẻ tín dụng đang nợ thì số dư ban đầu phải âm); (2) chiều chuyển tiền: **Từ** là nguồn bị trừ, **Đến** là nguồn được cộng, hãy vào **Thu chi**, lọc theo nguồn đó để xem từng dòng cộng/trừ; (3) giao dịch có đúng nguồn không (giao dịch cũ mặc định thuộc **Tiền mặt**); (4) nguồn đã **Lưu trữ** không tính vào Tổng số dư, Tổng tài sản (số dư của chính nó vẫn hiện trong mục **Đã lưu trữ**).

**Tổng tài sản bị tính trùng?**
Có thể bạn vừa nhập tài khoản đó ở trang **Tài sản** (như một tài sản) vừa tạo trong **Nguồn tiền**. Hãy giữ ở **Nguồn tiền** (nhập số dư ban đầu) và **xoá tài sản** trùng ở trang Tài sản.

**Sau khi cập nhật, Nguồn tiền không lên Sheet?**
Bạn chưa cập nhật backend. Mở Apps Script, dán lại toàn bộ file `apps-script/Code.gs` mới, lưu, rồi **Deploy → Manage deployments → biểu tượng bút chì → Version: New version → Deploy** (URL giữ nguyên). Bản `Code.gs` cũ không biết bảng `accounts` và hai cột `accountId`, `toAccountId` nên bỏ qua chúng: tab `accounts` không xuất hiện, và nguồn tiền của giao dịch không được lưu trên Sheet (nhãn vẫn có thể hiện "Đã đồng bộ"). Sau khi deploy, bấm **Đồng bộ ngay**. Hãy cập nhật trước khi dùng nhiều nguồn tiền hoặc chuyển tiền, và nếu đã lỡ đồng bộ bằng bản cũ, hãy kiểm tra lại nguồn tiền của các giao dịch mới (có thể đã về **Tiền mặt**, chuyển tiền có thể mất nguồn đến).

**Không thấy Danh mục trên điện thoại?**
Thanh dưới cùng trên điện thoại chỉ có Tổng quan, Thu chi, Nguồn tiền, Tài sản, Cài đặt. Vào **Thu chi** và bấm liên kết **Danh mục** ở góc trên.

**Giao dịch hiện "Không rõ" ở phần danh mục.**
Danh mục của giao dịch đó đã bị xoá. Bấm vào giao dịch và chọn danh mục khác.

**Không thấy biểu đồ "Diễn biến tài sản ròng".**
Cần có giá trị tài sản ở ít nhất 2 ngày khác nhau. Hãy dùng nút **Cập nhật** vào một ngày khác.

**Bảng "Phân bổ thực tế vs mục tiêu" không hiện.**
Bạn chưa đặt tỷ trọng mục tiêu nào. Bấm **Danh mục** ở trang Tài sản → **Sửa** một danh mục → nhập **Tỷ trọng mục tiêu (%)**.

**Thêm app ra màn hình chính điện thoại.**
Montana là web app nên bạn chỉ cần tạo lối tắt:
- **iPhone (Safari):** mở địa chỉ app → bấm nút **Chia sẻ** → **Thêm vào Màn hình chính** (Add to Home Screen).
- **Android (Chrome):** mở địa chỉ app → menu **⋮** → **Thêm vào Màn hình chính** (hoặc **Cài đặt ứng dụng**).

Lưu ý: dữ liệu vẫn gắn với trình duyệt bạn đã dùng, nên lối tắt và trình duyệt có thể có kho dữ liệu riêng trên một số máy. Cách chắc chắn nhất là kết nối Google Sheet với cùng URL + token rồi đồng bộ.
