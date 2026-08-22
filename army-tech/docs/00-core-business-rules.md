# 00-core-business-rules.md

# NGUYÊN TẮC NGHIỆP VỤ CỐT LÕI

## Mục đích

Tài liệu này định nghĩa các nghiệp vụ gốc của hệ thống.

Đây là tài liệu có độ ưu tiên cao nhất.

Mọi thay đổi hệ thống phải tuân thủ tài liệu này.

---

# QUY TẮC ƯU TIÊN

Thứ tự ưu tiên:

1. 00-core-business-rules.md
2. 26-business-rules.md
3. Module Specification
4. API Specification
5. UI Specification

Nếu có mâu thuẫn:

Ưu tiên tài liệu cấp cao hơn.

---

# MODULE THI TỐT NGHIỆP

## NGUYÊN TẮC BẢO TOÀN NGHIỆP VỤ

Website exam-draw hiện tại là nguồn nghiệp vụ chuẩn cho thuật toán phân công cán bộ coi thi, giám sát và phòng thi.

Từ phiên bản điều chỉnh module thi tốt nghiệp, bốc thăm được tổ chức theo từng ngày thi - môn thi trong một kỳ thi. Thuật toán phân công vẫn kế thừa logic hiện tại, nhưng lịch sử và điều kiện tránh trùng được giới hạn trong ngày thi - môn thi đang chọn.

Không được thay đổi nếu chưa có phê duyệt nghiệp vụ.

---

# BR-EXAM-001

Mỗi phòng thi phải có:

* 01 cán bộ coi thi số 1
* 01 cán bộ coi thi số 2

Bắt buộc.

---

# BR-EXAM-002

Danh sách cán bộ coi thi số 1 độc lập.

Không được sử dụng cho danh sách cán bộ coi thi số 2.

---

# BR-EXAM-003

Danh sách cán bộ coi thi số 2 độc lập.

Không được sử dụng cho danh sách cán bộ coi thi số 1.

---

# BR-EXAM-004

Danh sách cán bộ giám sát độc lập.

Không được sử dụng thay thế cán bộ coi thi.

---

# BR-EXAM-005

Kết quả bốc thăm phải được phân công ngẫu nhiên.

---

# BR-EXAM-006

Kết quả bốc thăm phải lưu lịch sử theo từng ngày thi - môn thi.

---

# BR-EXAM-007

Chỉ hiển thị 05 phiên bốc thăm gần nhất của ngày thi - môn thi đang chọn.

---

# BR-EXAM-008

Danh sách phòng thi trong kết quả phải sắp xếp tăng dần.

Ví dụ:

Phòng thi 01

Phòng thi 02

Phòng thi 03

...

Không được đảo thứ tự.

---

# BR-EXAM-009

Phương án đánh số báo danh được chọn ngẫu nhiên.

Các phương án:

* Phương án 1
* Phương án 2
* Phương án 3
* Phương án 4

---

# BR-EXAM-010

Một lần bốc thăm chỉ sử dụng một phương án đánh số báo danh duy nhất.

Áp dụng cho toàn bộ phòng thi.

---

# BR-EXAM-011

Kết quả bốc thăm mới không được trùng các phiên gần nhất của cùng ngày thi - môn thi.

Nếu trùng:

Hệ thống phải thực hiện bốc thăm lại.

---

# BR-EXAM-012

Cho phép cán bộ giám sát dùng chung giữa hai phòng liền kề.

Chỉ áp dụng khi:

allow_supervisor_pair = true

---

# BR-EXAM-013

Cho phép hiển thị danh sách cán bộ dự bị.

Bao gồm:

* Dự bị coi thi số 1
* Dự bị coi thi số 2
* Dự bị giám sát

---

# BR-EXAM-014

Cho phép xem lại bất kỳ phiên bốc thăm nào trong lịch sử.

---

# BR-EXAM-015

Cho phép xuất Word theo đúng mẫu đã phê duyệt.

Không được thay đổi cấu trúc mẫu Word nếu chưa được phê duyệt.

---

# BR-EXAM-016

Cho phép trình chiếu kết quả ở chế độ toàn màn hình.

---

# BR-EXAM-017

Mọi thay đổi ảnh hưởng tới các API sau phải được xem là thay đổi nghiệp vụ trọng yếu:

POST /api/draw

GET /api/history

GET /api/history/{id}

GET /api/history/{id}/export

---

# BR-EXAM-018

Mỗi kỳ thi phải quản lý được:

* Tên đối tượng
* Số lượng học viên
* Danh sách ngày thi - môn thi
* Tài liệu Kế hoạch, Quyết định của kỳ thi

Tài liệu tải lên phải được lưu trong thư mục riêng của từng kỳ thi.

Danh sách cán bộ coi thi số 1, cán bộ coi thi số 2, cán bộ giám sát và phòng thi phải được quản lý riêng theo từng kỳ thi. Chỉ sau khi chọn chi tiết kỳ thi mới được nhập và bốc thăm bằng các danh sách này.

---

# QUY TẮC CHO AI CODING AGENT

Khi phát hiện yêu cầu thay đổi module thi tốt nghiệp:

Bắt buộc:

1. Đọc 00-core-business-rules.md

2. Đọc 09-module-graduation-exam.md

3. So sánh với logic hiện tại

4. Không được sửa các BR-EXAM-* nếu người dùng không yêu cầu rõ ràng

5. Nếu thay đổi làm ảnh hưởng logic bốc thăm:

   * Phải cảnh báo
   * Phải liệt kê các BR bị ảnh hưởng

---

# DEFINITION OF DONE

Một thay đổi được chấp nhận khi:

□ Không phá vỡ logic exam-draw hiện tại

□ Không thay đổi kết quả bốc thăm hiện tại

□ Không thay đổi API hiện tại

□ Không thay đổi mẫu Word hiện tại

□ Không thay đổi lịch sử bốc thăm

□ Không thay đổi cơ chế fullscreen

Nếu vi phạm bất kỳ điều nào ở trên thì thay đổi phải được xem xét lại.
