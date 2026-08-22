# 99-document-maintenance-rules.md

# QUY TẮC QUẢN LÝ VÀ CẬP NHẬT TÀI LIỆU

## Mục đích

Tài liệu này quy định nguyên tắc cập nhật hệ thống tài liệu dự án.

Mọi thay đổi nghiệp vụ, giao diện, dữ liệu, API hoặc kiến trúc phải được cập nhật đồng bộ vào các file liên quan.

Không được phép cập nhật một file đơn lẻ nếu thay đổi ảnh hưởng tới nhiều module.

---

# Nguyên tắc chung

## Rule 01

Mọi thay đổi phải cập nhật:

* Business Rules
* API
* Database
* UI
* Permission

nếu các thành phần này bị ảnh hưởng.

---

## Rule 02

Không được tạo dữ liệu hoặc nghiệp vụ mâu thuẫn với các file hiện có.

Nếu phát hiện mâu thuẫn:

* Ưu tiên Business Rules
* Sau đó Data Model
* Sau đó Module Specification

---

## Rule 03

Mọi thay đổi phải ghi vào Change Log.

---

# Ma trận cập nhật tài liệu

## Nếu thay đổi lịch tuần

Phải cập nhật:

```text
07-module-weekly-calendar.md

05-data-model.md

06-api-specification.md

02-user-roles-permissions.md

28-system-wireframes.md

26-business-rules.md
```

---

## Nếu thay đổi tiếp nhận học viên

Phải cập nhật:

```text
08-module-student-reception.md

05-data-model.md

06-api-specification.md

02-user-roles-permissions.md

28-system-wireframes.md

26-business-rules.md
```

---

## Nếu thay đổi thi tốt nghiệp

Phải cập nhật:

```text
09-module-graduation-exam.md

05-data-model.md

06-api-specification.md

02-user-roles-permissions.md

20-reporting-center.md

28-system-wireframes.md

26-business-rules.md
```

---

## Nếu thay đổi AI Assistant

Phải cập nhật:

```text
11-module-ai-assistant.md

21-ai-rag-architecture.md

05-data-model.md

06-api-specification.md

13-audit-log-security.md

26-business-rules.md
```

---

## Nếu thay đổi phân quyền

Phải cập nhật:

```text
02-user-roles-permissions.md

12-sso-authentication.md

13-audit-log-security.md

26-business-rules.md
```

---

## Nếu thay đổi giao diện

Phải cập nhật:

```text
04-ui-ux-guidelines.md

15-responsive-design.md

28-system-wireframes.md
```

---

## Nếu thay đổi dữ liệu

Phải cập nhật:

```text
05-data-model.md

06-api-specification.md

26-business-rules.md
```

---

## Nếu thay đổi báo cáo

Phải cập nhật:

```text
20-reporting-center.md

06-api-specification.md

28-system-wireframes.md
```

---

# Quy tắc cập nhật Database

Khi thêm bảng mới:

Bắt buộc cập nhật:

```text
05-data-model.md

03-system-architecture.md

06-api-specification.md
```

---

# Quy tắc cập nhật API

Khi thêm API mới:

Bắt buộc cập nhật:

```text
06-api-specification.md

Module tương ứng

Testing Checklist
```

---

# Quy tắc cập nhật màn hình

Khi thêm màn hình:

Bắt buộc cập nhật:

```text
28-system-wireframes.md

04-ui-ux-guidelines.md

Module tương ứng
```

---

# Quy tắc cập nhật AI Knowledge

Khi thêm nguồn dữ liệu AI:

Bắt buộc cập nhật:

```text
11-module-ai-assistant.md

21-ai-rag-architecture.md

22-data-governance.md
```

---

# CHANGE LOG

## Format

Ngày | Người cập nhật | File | Nội dung

Ví dụ:

2026-06-15 | Admin | 09-module-graduation-exam.md | Thêm chức năng bốc thăm giám sát

2026-06-15 | Codex | server.js, public/index.html, public/app.js, public/style.css | Triển khai MVP Node/SQLite cho dashboard, lịch tuần, học viên, nhắc việc, thông báo, AI Assistant, audit và giữ nguyên module thi tốt nghiệp

2026-06-15 | Codex | 05-data-model.md, 06-api-specification.md | Bổ sung data model và API cho các bảng/endpoint MVP đã triển khai

2026-06-15 | Codex | public/index.html, public/calendar.html, public/students.html, public/exam.html, public/tasks.html, public/ai.html, public/admin.html, public/app.js, public/style.css, 04-ui-ux-guidelines.md | Tách mỗi module thành một page riêng và cập nhật sidebar điều hướng

2026-06-15 | Codex | public/calendar.html, public/app.js, public/style.css, 07-module-weekly-calendar.md, 04-ui-ux-guidelines.md, 15-responsive-design.md | Đổi Module 1 sang giao diện lịch tháng dạng Google Calendar

2026-06-15 | Codex | public/calendar.html, public/app.js, public/style.css, 07-module-weekly-calendar.md, 04-ui-ux-guidelines.md, 15-responsive-design.md | Bổ sung chế độ xem lịch theo tuần và theo ngày cho Module 1

2026-06-15 | Codex | server.js, public/calendar.html, public/app.js, public/style.css, 05-data-model.md, 06-api-specification.md, 07-module-weekly-calendar.md | Bổ sung trường TT HV, TT Phòng, Ban khi tạo lịch và thêm bảng lịch công tác theo mẫu

2026-06-15 | Codex | server.js, public/calendar.html, public/app.js, public/style.css, 05-data-model.md, 06-api-specification.md, 07-module-weekly-calendar.md | Thêm vùng nhập Trực ban và TCH Phòng riêng theo từng tuần

2026-06-15 | Codex | public/calendar.html, public/app.js, public/style.css, 07-module-weekly-calendar.md, 04-ui-ux-guidelines.md | Bỏ trạng thái khỏi UI lịch và chuyển nút xóa lịch thành icon

2026-06-15 | Codex | public/calendar.html, public/app.js, public/style.css, 07-module-weekly-calendar.md, 04-ui-ux-guidelines.md | Bổ sung chế độ xem toàn màn hình cho bảng Lịch Công tác

2026-06-17 | Codex | server.js, public/ai.html, public/*.html, public/app.js, public/style.css, .env.example, .gitignore, 04-ui-ux-guidelines.md, 06-api-specification.md, 11-module-ai-assistant.md, 17-deployment-guide.md, README.md | Kết nối AI Assistant với OpenAI qua OPENAI_API_KEY server-side, đọc Markdown trong docs và đổi widget sang icon chat hiện đại

---

# Hướng dẫn cho AI Coding Agent

Khi nhận yêu cầu thay đổi:

Bước 1

Xác định module bị ảnh hưởng.

Bước 2

Đọc file:

99-document-maintenance-rules.md

Bước 3

Xác định danh sách file cần cập nhật.

Bước 4

Cập nhật đồng bộ tất cả file liên quan.

Bước 5

Kiểm tra:

* Business Rules
* Database
* API
* Permission
* UI

Bước 6

Ghi Change Log.

---

# Định nghĩa hoàn thành (Definition of Done)

Một thay đổi chỉ được xem là hoàn thành khi:

□ Module Specification được cập nhật

□ Data Model được cập nhật

□ API Specification được cập nhật

□ Wireframe được cập nhật

□ Business Rules được cập nhật

□ Permission được cập nhật

□ Audit Log được cập nhật (nếu cần)

□ Change Log được ghi nhận

Nếu thiếu bất kỳ mục nào ở trên thì thay đổi chưa hoàn thành.
