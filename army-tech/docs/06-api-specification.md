# 06-api-specification.md

# TIÊU CHUẨN API

## Kiến trúc

RESTful API

JSON

UTF-8

HTTPS

---

# Authentication

Authorization:

Bearer Token

Ví dụ:

Authorization: Bearer {token}

---

# Response chuẩn

Success

```json
{
  "success": true,
  "data": {}
}
```

Error

```json
{
  "success": false,
  "message": "Error"
}
```

---

# API GROUPS

## Dashboard

GET /api/dashboard

GET /api/bootstrap

---

## Auth

POST /api/auth/login

POST /api/auth/logout

POST /api/auth/refresh

GET /api/auth/profile

---

## Users

GET /api/users

POST /api/users

PUT /api/users/{id}

DELETE /api/users/{id}

---

## Calendar

GET /api/calendar

GET /api/calendar/week-meta

PUT /api/calendar/week-meta

POST /api/calendar

PUT /api/calendar/{id}

DELETE /api/calendar/{id}

Trường dữ liệu MVP khi tạo/cập nhật lịch:

```json
{
  "title": "Tổ chức thi TN môn CTĐ",
  "date": "2026-06-16",
  "startTime": "06:45",
  "endTime": "",
  "location": "GĐ H2/P.601",
  "ttHv": "CTHĐ (Giám đốc)",
  "ttPhong": "TT Hà",
  "personInCharge": "Bằng",
  "ban": "Kiên, Đại, Hà, Tân",
  "dutyOfficer": "Tuyến",
  "status": "Published"
}
```

Metadata tuần:

```json
{
  "weekStart": "2026-06-15",
  "dutySummary": "1* Nguyễn Huy Hoàng",
  "roomSummary": "4// Nguyễn Đình Bắc"
}
```

---

## Students

GET /api/students

POST /api/students

PUT /api/students/{id}

DELETE /api/students/{id}

POST /api/students/import

---

## Exams

GET /api/exams

GET /api/exam-sessions

POST /api/exam-sessions

Body:

```json
{
  "targetName": "Đối tượng thi",
  "studentCount": 120,
  "subjects": [
    {
      "examDate": "2026-06-30",
      "subjectName": "Công tác Đảng, công tác chính trị"
    }
  ]
}
```

GET /api/exam-sessions/{id}

PUT /api/exam-sessions/{id}

DELETE /api/exam-sessions/{id}

POST /api/exam-sessions/{id}/documents

Body:

```json
{
  "fileName": "ke-hoach.pdf",
  "fileType": "application/pdf",
  "contentBase64": "data:application/pdf;base64,..."
}
```

GET /api/exam-sessions/{id}/documents/{documentId}/download

DELETE /api/exam-sessions/{id}/documents/{documentId}

Danh sách cán bộ coi thi, giám sát và phòng thi được nhập theo từng kỳ thi:

POST /api/teachers/import

```json
{
  "examSessionId": 1,
  "role": "examiner1",
  "names": "Nguyễn Văn A\nTrần Văn B"
}
```

POST /api/rooms/import

```json
{
  "examSessionId": 1,
  "names": "Phòng 101\nPhòng 102"
}
```

---

## Draw

POST /api/draw

Body:

```json
{
  "examSubjectId": 1
}
```

GET /api/draw/history

GET /api/draw/history/{id}

GET /api/draw/export/{id}

Các endpoint tương thích module exam-draw hiện tại:

GET /api/history

GET /api/history?examSubjectId={id}

GET /api/history/{id}

GET /api/history/{id}/export

DELETE /api/history/{id}

---

## Tasks

GET /api/tasks

POST /api/tasks

PUT /api/tasks/{id}

DELETE /api/tasks/{id}

POST /api/tasks/remind

POST /api/tasks/{id}/remind

---

## Notifications

GET /api/notifications

POST /api/notifications

POST /api/notifications/send

PUT /api/notifications/read

PUT /api/notifications/{id}/read

---

## AI

POST /api/ai/chat

Backend đọc các file Markdown trong `docs`, chọn context liên quan và gọi OpenAI bằng biến môi trường `OPENAI_API_KEY`.

Request:

```json
{
  "question": "Module lịch công tác có những chế độ xem nào?"
}
```

Response:

```json
{
  "id": 1,
  "answer": "Câu trả lời theo tài liệu.",
  "sources": ["docs/07-module-weekly-calendar.md"],
  "provider": "openai",
  "model": "gpt-4o-mini",
  "created_at": "2026-06-17T00:00:00.000Z"
}
```

Nếu chưa cấu hình `OPENAI_API_KEY`, API trả lời bằng `provider = local-fallback`.

POST /api/ai/upload

GET /api/ai/documents

DELETE /api/ai/documents/{id}

GET /api/ai/history

---

## Audit

GET /api/audit-logs

---

# Versioning

/api/v1

/api/v2
