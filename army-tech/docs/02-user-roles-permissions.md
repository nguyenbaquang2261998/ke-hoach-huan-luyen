# 02-user-roles-permissions.md

# Vai trò và phân quyền

## Danh sách vai trò

### SYS_ADMIN

Quản trị hệ thống

### BOARD

Ban Giám đốc

### TRAINING_DEPARTMENT

Phòng Đào tạo

### EXAM_DEPARTMENT

Phòng Khảo thí

### FACULTY

Khoa giáo viên

### CLASS_MANAGER

Cán bộ quản lý lớp

### VIEWER

Người xem

---

## Ma trận phân quyền

| Chức năng      | Admin | BGĐ  | Đào tạo | Khảo thí | Khoa | QL Lớp | Viewer  |
| -------------- | ----- | ---- | ------- | -------- | ---- | ------ | ------- |
| Lịch tuần      | CRUD  | View | CRUD    | View     | View | View   | View    |
| Tiếp nhận HV   | CRUD  | View | CRUD    | View     | View | CRUD   | View    |
| Thi tốt nghiệp | CRUD  | View | View    | CRUD     | View | View   | View    |
| Nhắc việc      | CRUD  | View | CRUD    | CRUD     | View | CRUD   | View    |
| AI Chat        | Full  | Full | Full    | Full     | Full | Full   | Limited |
| User           | CRUD  | View | No      | No       | No   | No     | No      |

---

# Quy tắc phân quyền

* RBAC
* Theo module
* Theo hành động
* Theo dữ liệu
