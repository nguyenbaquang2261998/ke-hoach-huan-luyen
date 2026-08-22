# 11-module-ai-assistant.md

# MODULE TRỢ LÝ AI

## 1. Tầm nhìn

Trợ lý AI là thành phần xuất hiện trên mọi màn hình hệ thống.

Người dùng có thể hỏi bất kỳ lúc nào.

---

# 2. Kiến trúc

User

↓

AI Widget

↓

AI Gateway

↓

Knowledge Base

↓

OpenAI

↓

Response

MVP Node/SQLite hiện tại:

* Backend đọc các file `.md` trong thư mục `docs`.
* Backend chọn các đoạn Markdown liên quan theo câu hỏi để tạo context.
* Backend gọi OpenAI bằng biến môi trường `OPENAI_API_KEY`; API key không được đưa xuống frontend.
* Nếu chưa cấu hình key hoặc OpenAI lỗi, backend dùng fallback nội bộ theo các chủ đề docs chính.

---

# 3. Chức năng

## Chat ngữ cảnh

AI biết:

* Màn hình hiện tại
* Người dùng hiện tại
* Module hiện tại
* Bản ghi đang mở

Ví dụ:

Đang ở màn hình kỳ thi

Người dùng hỏi:

"Cho tôi danh sách cán bộ dự bị"

AI trả lời theo dữ liệu hiện tại.

---

## Hỏi đáp tài liệu

Nguồn dữ liệu:

* Markdown trong `docs`
* PDF
* DOCX
* XLSX
* TXT

---

## Quản lý tài liệu

Upload

Index

Chunking

Embedding

Search

---

# 4. User Story

US-01

Là cán bộ đào tạo

Tôi muốn hỏi AI

Để tra cứu quy chế đào tạo.

Acceptance Criteria

* Trả lời có nguồn
* Hiển thị tài liệu tham chiếu

---

# 5. Database

AiDocument

AiChunk

AiConversation

AiMessage

AiFeedback

---

# 6. API

POST /api/ai/chat

Request:

```json
{
  "question": "Quy tắc bốc thăm thi tốt nghiệp là gì?"
}
```

Response:

```json
{
  "id": 1,
  "answer": "Câu trả lời theo tài liệu.",
  "sources": ["docs/00-core-business-rules.md"],
  "provider": "openai",
  "model": "gpt-4o-mini",
  "created_at": "2026-06-17T00:00:00.000Z"
}
```

POST /api/ai/upload

GET /api/ai/documents

DELETE /api/ai/documents

GET /api/ai/history

---

# 7. Phân quyền tri thức

| Vai trò  | Tài liệu  |
| -------- | --------- |
| Admin    | Tất cả    |
| BGĐ      | Tất cả    |
| Đào tạo  | Đào tạo   |
| Khảo thí | Khảo thí  |
| Khoa     | Khoa      |
| Viewer   | Công khai |

---

# 8. Audit

Ghi:

* Người hỏi
* Thời gian
* Prompt
* Câu trả lời
* Tài liệu tham chiếu

---

# 9. Checklist

□ Upload PDF

□ Upload Word

□ Upload Excel

□ Search

□ Chat

□ Context Aware

□ Citation

□ Audit Log
