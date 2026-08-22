# 14-notification-workflow.md

# QUY TRÌNH THÔNG BÁO

## Kênh gửi

* In App
* Email
* SMS (tùy chọn)
* Push Notification

---

# Trigger

## Lịch tuần

Tạo lịch mới

↓

Gửi thông báo

---

## Công việc

Sắp đến hạn

↓

Nhắc việc

---

## Thi tốt nghiệp

Kỳ thi sắp diễn ra

↓

Thông báo

---

# Mức độ ưu tiên

Low

Normal

High

Critical

---

# Trạng thái

Pending

Queued

Sent

Failed

Read

---

# API

POST /api/notifications/send

GET /api/notifications

PUT /api/notifications/read

---

# Checklist

□ Email

□ In-App

□ Retry

□ Logging
