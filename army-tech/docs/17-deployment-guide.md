# 17-deployment-guide.md

# TRIỂN KHAI HỆ THỐNG

## Môi trường

### DEV

Developer

### TEST

Tester

### UAT

Nghiệm thu

### PROD

Chính thức

---

## Biến môi trường MVP Node

```env
PORT=3001
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_MODEL=gpt-4o-mini
AI_DOC_CONTEXT_MAX_CHARS=18000
AI_DOC_CHUNK_MAX_CHARS=2200
AI_RESPONSE_MAX_TOKENS=700
```

Không lưu API key thật trong frontend hoặc commit vào mã nguồn. Tạo file `.env` trên máy chạy server từ `.env.example`.

---

# Kiến trúc triển khai

```text
Internet
    │
Nginx Reverse Proxy
    │
ASP.NET Core API
    │
SQL Server
    │
Redis
    │
MinIO
    │
AI Service
```

---

# Máy chủ đề xuất

## Application Server

CPU: 8 Core

RAM: 16GB

SSD: 500GB

---

## Database Server

CPU: 8 Core

RAM: 32GB

SSD: 1TB

---

# Backup

## Database

Mỗi ngày

## Documents

Mỗi ngày

## Audit Log

Mỗi ngày

---

# Monitoring

Prometheus

Grafana

ELK

---

# CI/CD

Git

↓

Jenkins

↓

Build

↓

Test

↓

Deploy

---

# Rollback

1 Click Rollback

---

# Checklist

□ Backup

□ Monitoring

□ SSL

□ CI/CD

□ Rollback
