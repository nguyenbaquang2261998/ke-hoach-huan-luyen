# README.md

# HỆ THỐNG QUẢN LÝ HOẠT ĐỘNG GIÁO DỤC ĐÀO TẠO HỌC VIỆN CHÍNH TRỊ

## Giới thiệu

Hệ thống được xây dựng nhằm số hóa và quản lý tập trung các hoạt động giáo dục đào tạo của Học viện Chính trị.

Mục tiêu:

* Quản lý lịch công tác tuần
* Quản lý tiếp nhận học viên
* Quản lý thi tốt nghiệp
* Quản lý thông báo nhắc việc
* Trợ lý AI hỗ trợ nghiệp vụ
* Quản lý người dùng và phân quyền
* Tích hợp đăng nhập SSO

---

## Danh mục tài liệu

```text
docs/
├── README.md
├── 00-overview.md
├── 01-scope-and-goals.md
├── 02-user-roles-permissions.md
├── 03-system-architecture.md
├── 04-ui-ux-guidelines.md
├── 05-data-model.md
├── 06-api-specification.md
├── 07-module-weekly-calendar.md
├── 08-module-student-reception.md
├── 09-module-graduation-exam.md
├── 10-module-daily-reminder.md
├── 11-module-ai-assistant.md
├── 12-sso-authentication.md
├── 13-audit-log-security.md
├── 14-notification-workflow.md
├── 15-responsive-design.md
├── 16-testing-checklist.md
├── 17-deployment-guide.md
└── 18-roadmap.md
```

---

## Kiến trúc tổng quan

Frontend:

* NextJS
* React
* Ant Design

Backend:

* ASP.NET Core Web API

Database:

* SQL Server

AI:

* OpenAI API
* RAG Knowledge Base
* MVP Node đọc Markdown trong `docs` và gọi OpenAI bằng `OPENAI_API_KEY` ở server

Authentication:

* SSO OAuth2/OpenID Connect

Deployment:

* IIS
* Nginx Reverse Proxy
* Docker (tùy chọn)

---

## Mô hình triển khai

Người dùng → SSO → Hệ thống → Database

Người dùng → AI Chatbot → AI Service → Knowledge Base
