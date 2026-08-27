-- ==========================================================
-- SCHEMA TẠO CÁC BẢNG TRÊN SQL SERVER CHO HỆ THỐNG ARMY-TECH
-- Cơ sở dữ liệu: hvct-local
-- ==========================================================

-- 1. Bảng [users] - Quản lý người dùng và phân quyền
IF OBJECT_ID('dbo.users', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(100) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    google_sub NVARCHAR(255) NULL,
    full_name NVARCHAR(255) NOT NULL,
    rank NVARCHAR(100) NULL,
    unit NVARCHAR(255) NULL,
    role NVARCHAR(50) NOT NULL DEFAULT 'viewer' CHECK(role IN ('admin','manager','viewer')),
    email NVARCHAR(255) NULL,
    phone NVARCHAR(50) NULL,
    avatar_url NVARCHAR(MAX) NULL,
    auth_provider NVARCHAR(50) NOT NULL DEFAULT 'password',
    permissions NVARCHAR(MAX) NOT NULL DEFAULT '{}',
    note NVARCHAR(MAX) NULL,
    is_active INT NOT NULL DEFAULT 1,
    last_login_at NVARCHAR(50) NULL,
    created_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120),
    updated_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120)
  )
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_google_sub' AND object_id = OBJECT_ID('dbo.users'))
BEGIN
  CREATE UNIQUE INDEX idx_users_google_sub ON dbo.users(google_sub) WHERE google_sub IS NOT NULL
END
GO

-- 2. Bảng [exam_sessions] - Kỳ thi tốt nghiệp
IF OBJECT_ID('dbo.exam_sessions', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.exam_sessions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    target_name NVARCHAR(255) NOT NULL,
    student_count INT DEFAULT 0,
    note NVARCHAR(MAX) NULL,
    is_active INT DEFAULT 1,
    created_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120),
    updated_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120)
  )
END
GO

-- 3. Bảng [teachers] - Danh sách giảng viên, cán bộ coi thi
IF OBJECT_ID('dbo.teachers', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.teachers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL CHECK(role IN ('examiner1','examiner2','supervisor')),
    unit NVARCHAR(255) NULL,
    note NVARCHAR(MAX) NULL,
    is_active INT DEFAULT 1,
    created_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120),
    exam_session_id INT NULL,
    CONSTRAINT FK_teachers_exam_session FOREIGN KEY (exam_session_id) REFERENCES dbo.exam_sessions(id)
  )
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_teachers_exam_session' AND object_id = OBJECT_ID('dbo.teachers'))
BEGIN
  CREATE INDEX idx_teachers_exam_session ON dbo.teachers(exam_session_id, role, is_active)
END
GO

-- 4. Bảng [exam_rooms] - Phòng thi
IF OBJECT_ID('dbo.exam_rooms', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.exam_rooms (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    capacity INT NULL,
    note NVARCHAR(MAX) NULL,
    is_active INT DEFAULT 1,
    created_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120),
    allow_supervisor_pair INT DEFAULT 0,
    exam_session_id INT NULL,
    CONSTRAINT FK_exam_rooms_exam_session FOREIGN KEY (exam_session_id) REFERENCES dbo.exam_sessions(id)
  )
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_exam_rooms_session' AND object_id = OBJECT_ID('dbo.exam_rooms'))
BEGIN
  CREATE INDEX idx_exam_rooms_session ON dbo.exam_rooms(exam_session_id, is_active)
END
GO

-- 5. Bảng [exam_subjects] - Môn thi / Ngày thi
IF OBJECT_ID('dbo.exam_subjects', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.exam_subjects (
    id INT IDENTITY(1,1) PRIMARY KEY,
    exam_session_id INT NOT NULL,
    exam_date NVARCHAR(50) NOT NULL,
    subject_name NVARCHAR(255) NOT NULL,
    note NVARCHAR(MAX) NULL,
    is_active INT DEFAULT 1,
    created_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120),
    updated_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120),
    CONSTRAINT FK_exam_subjects_exam_session FOREIGN KEY (exam_session_id) REFERENCES dbo.exam_sessions(id)
  )
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_exam_subjects_session' AND object_id = OBJECT_ID('dbo.exam_subjects'))
BEGIN
  CREATE INDEX idx_exam_subjects_session ON dbo.exam_subjects(exam_session_id)
END
GO

-- 6. Bảng [exam_documents] - Tài liệu đính kèm kỳ thi
IF OBJECT_ID('dbo.exam_documents', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.exam_documents (
    id INT IDENTITY(1,1) PRIMARY KEY,
    exam_session_id INT NOT NULL,
    document_type NVARCHAR(50) NOT NULL CHECK(document_type IN ('plan','decision')),
    original_name NVARCHAR(500) NOT NULL,
    stored_name NVARCHAR(500) NOT NULL,
    file_type NVARCHAR(100) NULL,
    size BIGINT DEFAULT 0,
    relative_path NVARCHAR(MAX) NOT NULL,
    is_active INT DEFAULT 1,
    created_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120),
    CONSTRAINT FK_exam_documents_exam_session FOREIGN KEY (exam_session_id) REFERENCES dbo.exam_sessions(id)
  )
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_exam_documents_session' AND object_id = OBJECT_ID('dbo.exam_documents'))
BEGIN
  CREATE INDEX idx_exam_documents_session ON dbo.exam_documents(exam_session_id)
END
GO

-- 7. Bảng [draw_sessions] - Phiên bốc thăm
IF OBJECT_ID('dbo.draw_sessions', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.draw_sessions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    plan_name NVARCHAR(255) NOT NULL,
    result_hash NVARCHAR(MAX) NOT NULL,
    created_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120),
    exam_session_id INT NULL,
    exam_subject_id INT NULL,
    CONSTRAINT FK_draw_sessions_exam_session FOREIGN KEY (exam_session_id) REFERENCES dbo.exam_sessions(id),
    CONSTRAINT FK_draw_sessions_exam_subject FOREIGN KEY (exam_subject_id) REFERENCES dbo.exam_subjects(id)
  )
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_draw_sessions_subject' AND object_id = OBJECT_ID('dbo.draw_sessions'))
BEGIN
  CREATE INDEX idx_draw_sessions_subject ON dbo.draw_sessions(exam_subject_id)
END
GO

-- 8. Bảng [draw_results] - Kết quả bốc thăm phòng thi
IF OBJECT_ID('dbo.draw_results', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.draw_results (
    id INT IDENTITY(1,1) PRIMARY KEY,
    session_id INT NOT NULL,
    room_id INT NOT NULL,
    room_name NVARCHAR(255) NOT NULL,
    examiner1_id INT NOT NULL,
    examiner1_name NVARCHAR(255) NOT NULL,
    examiner2_id INT NOT NULL,
    examiner2_name NVARCHAR(255) NOT NULL,
    supervisor_id INT NOT NULL,
    supervisor_name NVARCHAR(255) NOT NULL,
    CONSTRAINT FK_draw_results_draw_session FOREIGN KEY (session_id) REFERENCES dbo.draw_sessions(id) ON DELETE CASCADE
  )
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_draw_results_session' AND object_id = OBJECT_ID('dbo.draw_results'))
BEGIN
  CREATE INDEX idx_draw_results_session ON dbo.draw_results(session_id)
END
GO

-- 9. Bảng [draw_reserves] - Cán bộ coi thi dự bị
IF OBJECT_ID('dbo.draw_reserves', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.draw_reserves (
    id INT IDENTITY(1,1) PRIMARY KEY,
    session_id INT NOT NULL,
    role NVARCHAR(50) NOT NULL CHECK(role IN ('examiner1','examiner2','supervisor')),
    staff_id INT NOT NULL,
    staff_name NVARCHAR(255) NOT NULL,
    CONSTRAINT FK_draw_reserves_draw_session FOREIGN KEY (session_id) REFERENCES dbo.draw_sessions(id) ON DELETE CASCADE
  )
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_draw_reserves_session' AND object_id = OBJECT_ID('dbo.draw_reserves'))
BEGIN
  CREATE INDEX idx_draw_reserves_session ON dbo.draw_reserves(session_id)
END
GO

-- 10. Bảng [weekly_tasks] - Lịch tuần công tác
IF OBJECT_ID('dbo.weekly_tasks', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.weekly_tasks (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(500) NOT NULL,
    task_date NVARCHAR(50) NOT NULL,
    start_time NVARCHAR(50) NULL,
    end_time NVARCHAR(50) NULL,
    content NVARCHAR(MAX) NULL,
    location NVARCHAR(500) NULL,
    tt_hv NVARCHAR(500) NULL,
    tt_phong NVARCHAR(500) NULL,
    ban NVARCHAR(500) NULL,
    person_in_charge NVARCHAR(255) NULL,
    duty_officer NVARCHAR(255) NULL,
    color NVARCHAR(50) DEFAULT '#166534',
    status NVARCHAR(50) DEFAULT 'Draft',
    is_active INT DEFAULT 1,
    created_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120),
    updated_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120)
  )
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_weekly_tasks_date' AND object_id = OBJECT_ID('dbo.weekly_tasks'))
BEGIN
  CREATE INDEX idx_weekly_tasks_date ON dbo.weekly_tasks(task_date, is_active)
END
GO

-- 11. Bảng [weekly_schedule_meta] - Trực ban, phòng họp theo tuần
IF OBJECT_ID('dbo.weekly_schedule_meta', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.weekly_schedule_meta (
    id INT IDENTITY(1,1) PRIMARY KEY,
    week_start NVARCHAR(50) NOT NULL UNIQUE,
    duty_summary NVARCHAR(MAX) NULL,
    room_summary NVARCHAR(MAX) NULL,
    created_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120),
    updated_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120)
  )
END
GO

-- 12. Bảng [students] - Hồ sơ học viên tiếp nhận
IF OBJECT_ID('dbo.students', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.students (
    id INT IDENTITY(1,1) PRIMARY KEY,
    student_code NVARCHAR(100) NOT NULL UNIQUE,
    full_name NVARCHAR(255) NOT NULL,
    birthday NVARCHAR(50) NULL,
    rank NVARCHAR(100) NULL,
    unit NVARCHAR(255) NULL,
    phone NVARCHAR(50) NULL,
    email NVARCHAR(255) NULL,
    class_name NVARCHAR(255) NULL,
    admission_date NVARCHAR(50) NULL,
    status NVARCHAR(50) DEFAULT 'Created',
    is_active INT DEFAULT 1,
    created_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120),
    updated_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120)
  )
END
GO

-- 13. Bảng [daily_tasks] - Nhắc việc hàng ngày
IF OBJECT_ID('dbo.daily_tasks', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.daily_tasks (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(500) NOT NULL,
    description NVARCHAR(MAX) NULL,
    assignee NVARCHAR(255) NULL,
    due_date NVARCHAR(50) NULL,
    priority NVARCHAR(50) DEFAULT 'Normal',
    status NVARCHAR(50) DEFAULT 'New',
    progress INT DEFAULT 0,
    color NVARCHAR(50) DEFAULT '#15803d',
    is_active INT DEFAULT 1,
    created_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120),
    updated_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120)
  )
END
GO

-- 14. Bảng [notifications] - Thông báo hệ thống
IF OBJECT_ID('dbo.notifications', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.notifications (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(500) NOT NULL,
    message NVARCHAR(MAX) NULL,
    channel NVARCHAR(50) DEFAULT 'In App',
    priority NVARCHAR(50) DEFAULT 'Normal',
    status NVARCHAR(50) DEFAULT 'Pending',
    entity_name NVARCHAR(100) NULL,
    entity_id INT NULL,
    is_read INT DEFAULT 0,
    created_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120),
    read_at NVARCHAR(50) NULL
  )
END
GO

-- 15. Bảng [ai_documents] - Tài liệu huấn luyện trợ lý AI
IF OBJECT_ID('dbo.ai_documents', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.ai_documents (
    id INT IDENTITY(1,1) PRIMARY KEY,
    file_name NVARCHAR(500) NOT NULL,
    file_type NVARCHAR(100) NULL,
    scope NVARCHAR(100) DEFAULT N'Công khai',
    uploaded_by NVARCHAR(255) NULL,
    status NVARCHAR(50) DEFAULT 'Indexed',
    created_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120)
  )
END
GO

-- 16. Bảng [ai_conversations] - Lịch sử trò chuyện trợ lý AI
IF OBJECT_ID('dbo.ai_conversations', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.ai_conversations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    question NVARCHAR(MAX) NOT NULL,
    answer NVARCHAR(MAX) NOT NULL,
    sources NVARCHAR(MAX) NULL,
    created_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120)
  )
END
GO

-- 17. Bảng [audit_logs] - Nhật ký hệ thống
IF OBJECT_ID('dbo.audit_logs', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.audit_logs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(255) DEFAULT 'system',
    action NVARCHAR(100) NOT NULL,
    entity_name NVARCHAR(100) NOT NULL,
    entity_id NVARCHAR(100) NULL,
    old_value NVARCHAR(MAX) NULL,
    new_value NVARCHAR(MAX) NULL,
    ip NVARCHAR(100) NULL,
    device NVARCHAR(500) NULL,
    created_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120)
  )
END
GO
