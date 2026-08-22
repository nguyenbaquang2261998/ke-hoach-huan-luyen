# 09-module-graduation-exam.md

# MODULE THI TỐT NGHIỆP

## 1. Mục tiêu

Quản lý toàn bộ công tác thi tốt nghiệp.

---

# 2. Chức năng

### Kỳ thi

* Tạo kỳ thi
* Chỉnh sửa kỳ thi
* Xóa kỳ thi
* Quản lý tên đối tượng
* Quản lý số lượng học viên
* Quản lý danh sách ngày thi - môn thi
* Tải tài liệu kỳ thi dạng PDF, DOC, DOCX

### Phòng thi

* Danh sách phòng
* Sức chứa
* Quản lý riêng theo từng kỳ thi

### Coi thi

* Coi thi số 1
* Coi thi số 2
* Quản lý riêng theo từng kỳ thi

### Giám sát

* Quản lý giám sát
* Quản lý riêng theo từng kỳ thi

### Bốc thăm

* Tự động theo từng ngày thi - môn thi
* Không trùng trong các phiên gần nhất của cùng ngày thi - môn thi
* Lưu phiên bốc thăm gắn với kỳ thi và môn thi

### Lịch sử

* Lưu kết quả theo từng ngày thi - môn thi

### Xuất Word

* Biên bản
* Danh sách

---

# 3. User Story

## US-01

Là Phòng Khảo thí

Tôi muốn bốc thăm tự động

Để phân công cán bộ coi thi.

Acceptance Criteria

* Không trùng lần trước
* Lưu lịch sử
* Có thể xem lại

---

## US-02

Là Thư ký hội đồng

Tôi muốn xuất Word

Để in biên bản.

Acceptance Criteria

* Đúng mẫu
* Đúng dữ liệu

---

# 4. BPM

Tạo kỳ thi

↓

Nhập phòng

↓

Nhập cán bộ

↓

Bốc thăm

↓

Kiểm tra

↓

Phê duyệt

↓

Xuất Word

---

# 5. Database

ExamSession

ExamSubject

ExamDocument

ExamRoom

ExamTeacher

ExamSupervisor

ExamAssignment

DrawSession

DrawResult

---

# 6. API

GET /api/exam-sessions

POST /api/exam-sessions

GET /api/exam-sessions/{id}

PUT /api/exam-sessions/{id}

DELETE /api/exam-sessions/{id}

POST /api/exam-sessions/{id}/documents

GET /api/exam-sessions/{id}/documents/{documentId}/download

DELETE /api/exam-sessions/{id}/documents/{documentId}

POST /api/draw

GET /api/history

GET /api/history/{id}

GET /api/history/{id}/export

DELETE /api/history/{id}

---

# 7. Màn hình

Dashboard kỳ thi

Danh sách kỳ thi

Tài liệu kỳ thi

Danh sách cán bộ

Danh sách phòng

Bốc thăm theo ngày thi - môn thi

Chi tiết kỳ thi

Kết quả

Lịch sử

---

# 8. Trạng thái

Draft

Prepared

Drawing

Approved

Completed

Archived

---

# 9. Checklist

□ Bốc thăm

□ Không trùng

□ Lưu lịch sử

□ Xuất Word

□ Responsive

□ Fullscreen
