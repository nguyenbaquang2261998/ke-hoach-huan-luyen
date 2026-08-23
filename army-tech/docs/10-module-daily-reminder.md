# 10-module-daily-reminder.md

# MODULE NHẮC VIỆC HẰNG NGÀY (DAILY TASKS & REMINDER)

## Mục tiêu

Quản lý, theo dõi và nhắc nhở công việc cá nhân/phòng ban theo trải nghiệm **Mobile To-Do List App** hiện đại, trực quan, hỗ trợ tùy chỉnh màu sắc và đánh dấu hoàn thành nhanh.

---

## Chức năng chính

* **Giao việc & Tạo việc nhanh (Quick Add)**: Thêm công việc với tiêu đề, mô tả, người phụ trách, hạn hoàn thành, mức độ ưu tiên và bảng màu tùy chọn.
* **Tùy chỉnh màu sắc công việc (Color Customization)**: Chọn màu theo bảng màu phong phú (Xanh quân đội, Xanh dương, Tím, Đỏ, Cam, Xanh ngọc, Vàng, Xám chì) hoặc mã màu tự do.
* **Đánh dấu hoàn thành một chạm (Interactive Checkbox)**: Tích chọn vòng tròn checkbox để chuyển đổi trạng thái `Completed` (tiến độ 100%, hiệu ứng gạch ngang) hoặc hủy hoàn thành tức thì.
* **Phân nhóm công việc**: Phân tách khu vực *Đang thực hiện* và khu vực *Đã hoàn thành* (có thể thu gọn/mở rộng).
* **Bộ lọc Tab thông minh (Segmented Filters)**: Lọc theo *Tất cả*, *Hôm nay*, *Đang làm*, *Quá hạn*, *Đã xong* kèm số lượng badge thời gian thực.
* **Tìm kiếm & Lọc nâng cao**: Tìm kiếm theo tên/người phụ trách, lọc theo mức độ ưu tiên hoặc màu sắc.
* **Gửi nhắc việc (Reminder)**: Gửi thông báo tức thì đến hệ thống Notification in-app.
* **Chỉnh sửa toàn diện (Edit Modal)**: Hộp thoại cập nhật chi tiết các thuộc tính của công việc.

---

## User Story

**Là cán bộ quản lý / trưởng phòng / người phụ trách**

Tôi muốn giao việc, chọn màu phân loại và theo dõi tiến độ hoàn thành dạng Todo List

Để nắm bắt kịp thời công việc trong ngày, xử lý việc quá hạn và nâng cao hiệu suất điều hành.

### Acceptance Criteria

* Có hạn hoàn thành, người phụ trách, mức độ ưu tiên và mã màu (`color`).
* Thẻ công việc hiển thị dải màu viền và badge màu tương ứng.
* Tích chọn checkbox lập tức cập nhật trạng thái `Completed` và tính lại % hoàn thành trên thanh tiến độ.

---

## Trạng thái công việc

* `New`: Mới tạo
* `InProgress`: Đang thực hiện
* `Pending`: Chờ xử lý
* `Completed`: Đã hoàn thành (100%)
* `Overdue`: Quá hạn
* `Cancelled`: Đã hủy

---

## API Specification

* `GET /api/tasks`: Lấy danh sách công việc (bao gồm trường `color`, `due_date`, `priority`, `status`, `progress`).
* `POST /api/tasks`: Tạo công việc mới (hỗ trợ trường `color`).
* `PUT /api/tasks/:id`: Cập nhật công việc, trạng thái, màu sắc và tiến độ.
* `DELETE /api/tasks/:id`: Xóa mềm công việc (`is_active = 0`).
* `POST /api/tasks/:id/remind`: Gửi thông báo nhắc nhở in-app cho công việc.

---

## Dashboard KPI & Tiến độ

* **Màu xanh**: Tỷ lệ hoàn thành > 50%
* **Màu vàng**: Tỷ lệ hoàn thành 30% - 50%
* **Màu đỏ**: Tỷ lệ hoàn thành < 30% hoặc có công việc quá hạn

---

## Checklist tính năng

* [x] Giao diện Mobile To-Do List App trực quan
* [x] Tùy chỉnh màu sắc công việc (Color Palette)
* [x] Đánh dấu hoàn thành một chạm (Interactive Checkbox)
* [x] Thanh đo % tiến độ hoàn thành thời gian thực
* [x] Bộ lọc theo tab (Tất cả, Hôm nay, Đang làm, Quá hạn, Đã xong)
* [x] Hộp thoại chỉnh sửa chi tiết công việc
* [x] Gửi nhắc việc tự động & in-app
* [x] Tích hợp KPI & danh sách trên Dashboard

