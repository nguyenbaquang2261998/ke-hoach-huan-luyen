# 04-ui-ux-guidelines.md

# TIÊU CHUẨN UI/UX

## 1. Mục tiêu

Xây dựng giao diện hiện đại, thống nhất, dễ sử dụng trên:

* Desktop
* Laptop
* Tablet
* Mobile

---

# 2. Nguyên tắc thiết kế

## Responsive First

Thiết kế ưu tiên:

* Mobile
* Tablet
* Desktop

---

## Consistency

Tất cả module sử dụng:

* Cùng màu sắc
* Cùng typography
* Cùng component

---

## Accessibility

* Keyboard navigation
* Screen reader
* Contrast đạt chuẩn WCAG

---

# 3. Layout tổng thể

```text
┌─────────────────────────────┐
│ Header                      │
├──────────┬──────────────────┤
│ Sidebar  │ Content          │
│          │                  │
├──────────┴──────────────────┤
│ Footer                      │
└─────────────────────────────┘
```

---

# 4. Header

Hiển thị:

* Logo
* Tên hệ thống
* Thông báo
* AI Assistant
* Avatar người dùng

---

# 5. Sidebar

Menu:

* Dashboard
* Lịch tuần
* Tiếp nhận học viên
* Thi tốt nghiệp
* Nhắc việc
* AI Assistant
* Quản trị

Quy tắc điều hướng:

* Mỗi module nghiệp vụ nằm trên một page riêng.
* Không gộp toàn bộ module vào cùng một page.
* Sidebar dùng để chuyển page giữa các module.
* AI Assistant vẫn có widget dùng chung trên các page.

---

# 6. Dashboard

Card KPI

* Công việc hôm nay
* Lịch hôm nay
* Kỳ thi sắp diễn ra
* Học viên mới

Biểu đồ

* Công việc
* Đào tạo
* Thi tốt nghiệp

---

# 7. Component chuẩn

## Button

Primary

Secondary

Danger

---

## Table

* Search
* Sort
* Filter
* Pagination

## Calendar

Module lịch tuần dùng giao diện dạng lịch tháng:

* Toolbar điều hướng tháng
* Segmented control cho chế độ Tháng / Tuần / Ngày
* Lưới ngày 7 cột
* Sự kiện nằm trong ô ngày
* Panel tạo lịch nhanh
* Panel chi tiết ngày đang chọn
* Không hiển thị trạng thái lịch trên UI Module 1
* Hành động xóa dùng icon
* Bảng Lịch Công tác hỗ trợ toàn màn hình

---

## Form

* Validation
* Auto Save
* Responsive

---

# 8. AI Widget

Luôn hiển thị góc phải dưới.

```text
┌────┐
│CHAT│
└────┘
```

Có thể:

* Thu gọn
* Mở rộng
* Fullscreen
* Hiển thị nguồn trả lời dạng chip
* Hiển thị trạng thái đang đọc docs khi gửi câu hỏi

---

# 9. Checklist

□ Responsive

□ Accessibility

□ Consistency

□ Dark Mode Ready
