# 08-module-student-reception.md

# MODULE TIẾP NHẬN HỌC VIÊN

## 1. Mục đích

Quản lý toàn bộ quá trình tiếp nhận học viên nhập học.

---

# 2. Chức năng

## Hồ sơ học viên

* Thêm
* Sửa
* Xóa
* Tìm kiếm

## Tiếp nhận

* Xác nhận hồ sơ
* Phân lớp
* In danh sách

## Báo cáo

* Theo khóa
* Theo hệ
* Theo đơn vị

---

# 3. User Story

## US-01

Là cán bộ quản lý lớp

Tôi muốn nhập thông tin học viên

Để quản lý hồ sơ.

### Acceptance Criteria

* Không trùng mã học viên
* Có kiểm tra dữ liệu

---

## US-02

Là Phòng Đào tạo

Tôi muốn phân lớp

Để bố trí học tập.

### Acceptance Criteria

* Chọn lớp
* Chọn nhiều học viên
* Cập nhật thành công

---

# 4. Database

Student

| Trường      |
| ----------- |
| Id          |
| StudentCode |
| FullName    |
| Birthday    |
| Rank        |
| Unit        |
| Phone       |
| Email       |

StudentAdmission

| Trường        |
| ------------- |
| Id            |
| StudentId     |
| AdmissionDate |
| Status        |

---

# 5. Trạng thái

Created

PendingReview

Approved

Rejected

Completed

---

# 6. API

GET /api/students

POST /api/students

PUT /api/students

DELETE /api/students

POST /api/students/import-excel

GET /api/students/export-excel

---

# 7. Màn hình

Danh sách học viên

Chi tiết học viên

Import Excel

Phân lớp

Báo cáo

---

# 8. Checklist

□ Import Excel

□ Export Excel

□ Kiểm tra trùng

□ Phân quyền
