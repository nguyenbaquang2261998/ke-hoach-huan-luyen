# 07-module-weekly-calendar.md

# MODULE QUẢN LÝ LỊCH TUẦN

## 1. Mục đích

Quản lý tập trung lịch công tác tuần của Học viện, Phòng, Khoa và các hệ học viên.

Cho phép:

* Lập lịch tuần
* Điều chỉnh lịch
* Theo dõi trực ban
* Thông báo tự động
* Đồng bộ lịch cá nhân

---

# 2. Đối tượng sử dụng

| Vai trò            | Quyền      |
| ------------------ | ---------- |
| Admin              | Toàn quyền |
| Ban Giám đốc       | Xem        |
| Phòng Đào tạo      | CRUD       |
| Phòng Khảo thí     | Xem        |
| Khoa giáo viên     | Xem        |
| Cán bộ quản lý lớp | Xem        |
| Viewer             | Xem        |

---

# 3. User Story

## US-01

Là cán bộ Phòng Đào tạo

Tôi muốn tạo lịch tuần

Để phân công công việc cho các đơn vị.

### Acceptance Criteria

* Chọn tuần
* Chọn ngày
* Chọn thời gian
* Chọn màu
* Lưu thành công

---

## US-02

Là lãnh đạo

Tôi muốn xem lịch tổng hợp

Để nắm tình hình hoạt động toàn Học viện.

### Acceptance Criteria

* Xem theo tuần
* Xem theo ngày
* In PDF

---

# 4. Luồng nghiệp vụ

Tạo lịch

→ Kiểm tra quyền

→ Nhập thông tin

→ Lưu

→ Gửi thông báo

→ Hiển thị trên Dashboard

---

# 5. Cấu trúc dữ liệu

WeeklyCalendar

| Trường | Kiểu |
| ------ | ---- |
| Id     | Guid |
| WeekNo | int  |
| Year   | int  |
| Status | int  |

WeeklyTask

| Trường         | Kiểu     |
| -------------- | -------- |
| Id             | Guid     |
| CalendarId     | Guid     |
| DayOfWeek      | int      |
| Date           | Date     |
| StartTime      | Time     |
| EndTime        | Time     |
| Content        | nvarchar |
| Location       | nvarchar |
| TtHv           | nvarchar |
| TtPhong        | nvarchar |
| PersonInCharge | nvarchar |
| Ban            | nvarchar |
| DutyOfficer    | nvarchar |
| Color          | varchar  |

WeeklyScheduleMeta

| Trường      | Kiểu     |
| ----------- | -------- |
| Id          | Guid     |
| WeekStart   | Date     |
| DutySummary | nvarchar |
| RoomSummary | nvarchar |

---

# 6. API

GET /api/calendar

GET /api/calendar/{id}

POST /api/calendar

PUT /api/calendar/{id}

DELETE /api/calendar/{id}

GET /api/calendar/export-pdf

---

# 7. Màn hình

1. Danh sách lịch tuần
2. Chi tiết lịch tuần
3. Thêm mới
4. Chỉnh sửa
5. Dashboard lịch

## Cập nhật UI MVP

Module lịch tuần sử dụng page riêng `calendar.html`.

Thiết kế chính:

* Bố cục lịch tháng dạng lưới 7 cột
* Chuyển chế độ xem Tháng / Tuần / Ngày
* Thanh điều hướng Hôm nay / tháng trước / tháng sau
* Panel trái để tạo lịch nhanh
* Panel phải hiển thị chi tiết ngày đang chọn
* Sự kiện hiển thị trực tiếp trong ô ngày
* Mobile cho phép cuộn ngang lưới lịch
* Bảng lịch công tác theo tuần có cột Thứ/ngày, Trực ban HL, Thời gian, Nội dung, TT HV, TT Phòng, Phụ trách, Ban, Địa điểm
* Trực ban và TCH Phòng của dòng tiêu đề bảng được nhập riêng theo từng tuần
* UI MVP không hiển thị trường trạng thái lịch; lịch mới được lưu mặc định Published
* Nút xóa lịch hiển thị bằng icon
* Bảng Lịch Công tác có nút xem toàn màn hình

---

# 8. Trạng thái

Draft

Published

Archived

---

# 9. Checklist nghiệm thu

□ Tạo lịch

□ Chỉnh sửa

□ In PDF

□ Phân quyền

□ Responsive
