# 12-sso-authentication.md

# SSO AUTHENTICATION

## Mục tiêu

Đăng nhập một lần.

Truy cập toàn bộ hệ thống.

---

# Công nghệ

OpenID Connect

OAuth2

JWT

---

# Luồng xác thực

```text
User
 ↓
SSO Login
 ↓
Identity Provider
 ↓
Access Token
 ↓
Application
```

---

# Vai trò

SSO quản lý:

* Tài khoản
* Mật khẩu
* MFA

Hệ thống quản lý:

* Role
* Permission

---

# Token

Access Token

15 phút

Refresh Token

7 ngày

---

# MFA

Bắt buộc với:

* Admin
* Ban Giám đốc

---

# Session

Idle Timeout

30 phút

Absolute Timeout

8 giờ

---

# Security Checklist

□ MFA

□ HTTPS

□ Token Rotation

□ Logout All Devices

□ Device Tracking
