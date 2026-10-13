-- ==============================================================================
-- SCRIPT SQL SERVER: TẠO VÀ CẬP NHẬT DỮ LIỆU LỊCH CÔNG TÁC TUẦN 10
-- Thời gian: Từ Thứ Hai 12/10/2026 đến Chủ Nhật 18/10/2026
-- Bảng ảnh gốc: LỊCH CÔNG TÁC TUẦN 10
--   - TCH Học viện: */ Vũ Đức Long
--   - TCH Phòng: 4// Nguyễn Như Hòa
--   - TCH Ban: 2// Nguyễn Văn Kiên
-- ==============================================================================

USE [hvct-local];
GO

SET NOCOUNT ON;

DECLARE @WeekStart NVARCHAR(50) = N'2026-10-12';
DECLARE @WeekEnd   NVARCHAR(50) = N'2026-10-18';

PRINT N'==============================================================================';
PRINT N'BẮT ĐẦU TẠO DỮ LIỆU LỊCH CÔNG TÁC TUẦN 10 (12/10/2026 - 18/10/2026)';
PRINT N'==============================================================================';

-- -----------------------------------------------------------------------------
-- 1. CẬP NHẬT THÔNG TIN METADATA TUẦN (weekly_schedule_meta)
-- -----------------------------------------------------------------------------
PRINT N'[1/3] Cập nhật thông tin weekly_schedule_meta...';

DECLARE @DutySummary NVARCHAR(MAX) = N'*/ Vũ Đức Long';
DECLARE @RoomSummary NVARCHAR(MAX) = N'4// Nguyễn Như Hòa (TCH Ban: 2// Nguyễn Văn Kiên)';
DECLARE @DailyDutyJson NVARCHAR(MAX) = N'{
  "2026-10-12": "Quang",
  "2026-10-13": "Thiết",
  "2026-10-14": "Diện",
  "2026-10-15": "Đông",
  "2026-10-16": "Hiếu",
  "2026-10-17": "Hiếu",
  "2026-10-18": "Hiếu",
  "_dutyNote": "Trực T7, CN Hiếu",
  "_dutyOrder": "Thứ tự trực T7 và CN: Quang, Huy, Hiếu, Đại, Diện, Thiết, Đông, Tuyển",
  "_dutyOff": "Nghỉ Trực ban: Huy, Đại, Tuyển",
  "_tchBan": "2// Nguyễn Văn Kiên"
}';

IF EXISTS (SELECT 1 FROM dbo.weekly_schedule_meta WHERE week_start = @WeekStart)
BEGIN
    UPDATE dbo.weekly_schedule_meta
    SET duty_summary = @DutySummary,
        room_summary = @RoomSummary,
        daily_duty_officers = @DailyDutyJson,
        updated_at = CONVERT(VARCHAR(19), GETDATE(), 120)
    WHERE week_start = @WeekStart;
    PRINT N'  -> Đã cập nhật metadata tuần 10 thành công.';
END
ELSE
BEGIN
    INSERT INTO dbo.weekly_schedule_meta (week_start, duty_summary, room_summary, daily_duty_officers, created_at, updated_at)
    VALUES (
        @WeekStart,
        @DutySummary,
        @RoomSummary,
        @DailyDutyJson,
        CONVERT(VARCHAR(19), GETDATE(), 120),
        CONVERT(VARCHAR(19), GETDATE(), 120)
    );
    PRINT N'  -> Đã thêm mới metadata tuần 10 thành công.';
END
GO

-- -----------------------------------------------------------------------------
-- 2. DỌN DẸP CÁC SỰ KIỆN CŨ CỦA TUẦN 10 (NẾU ĐÃ CÓ) ĐỂ TRÁNH TRÙNG LẶP
-- -----------------------------------------------------------------------------
PRINT N'[2/3] Dọn dẹp dữ liệu cũ tuần 10 trong bảng weekly_tasks...';

DELETE FROM dbo.weekly_tasks 
WHERE task_date >= N'2026-10-12' AND task_date <= N'2026-10-18';

PRINT N'  -> Đã dọn sạch dữ liệu cũ từ 12/10/2026 đến 18/10/2026.';
GO

-- -----------------------------------------------------------------------------
-- 3. CHÈN DANH SÁCH SỰ KIỆN / NHIỆM VỤ CHI TIẾT TUẦN 10 (weekly_tasks)
-- -----------------------------------------------------------------------------
PRINT N'[3/3] Chèn các sự kiện lịch công tác tuần 10...';

INSERT INTO dbo.weekly_tasks (
    title,
    task_date,
    start_time,
    end_time,
    content,
    location,
    tt_hv,
    tt_phong,
    ban,
    person_in_charge,
    duty_officer,
    color,
    status,
    is_active,
    created_at,
    updated_at
)
VALUES
-- --- THỨ HAI 12/10/2026 (Trực ban: Quang) ---
(
    N'Tập huấn CNTT nâng cao (từ thứ 2 đến thứ 6)',
    N'2026-10-12',
    N'07:30',
    N'',
    N'Tập huấn CNTT nâng cao (từ thứ 2 đến thứ 6)',
    N'H2.212',
    N'',
    N'TT Hòa',
    N'Đại, Huy, Tuyển',
    N'Kiên',
    N'Quang',
    N'#15803d',
    N'Published',
    1,
    CONVERT(VARCHAR(19), GETDATE(), 120),
    CONVERT(VARCHAR(19), GETDATE(), 120)
),
(
    N'Hội nghị giao ban trực tuyến toàn quân',
    N'2026-10-12',
    N'07:30',
    N'',
    N'Hội nghị giao ban trực tuyến toàn quân',
    N'PH. T5',
    N'PGĐ Hoàng',
    N'TT Nhã',
    N'',
    N'Minh',
    N'Quang',
    N'#15803d',
    N'Published',
    1,
    CONVERT(VARCHAR(19), GETDATE(), 120),
    CONVERT(VARCHAR(19), GETDATE(), 120)
),

-- --- THỨ BA 13/10/2026 (Trực ban: Thiết) ---
(
    N'Lớp KQ39/H1 tham quan e916/f371/QCPK-KQ',
    N'2026-10-13',
    N'06:30',
    N'',
    N'Lớp KQ39/H1 tham quan e916/f371/QCPK-KQ',
    N'Hà Nội',
    N'',
    N'',
    N'Thiết theo dõi',
    N'K9',
    N'Thiết',
    N'#166534',
    N'Published',
    1,
    CONVERT(VARCHAR(19), GETDATE(), 120),
    CONVERT(VARCHAR(19), GETDATE(), 120)
),

-- --- THỨ TƯ 14/10/2026 (Trực ban: Diện) ---
(
    N'Dự giảng mẫu đ/c 4// Bùi Tuấn Anh',
    N'2026-10-14',
    N'06:45',
    N'',
    N'Dự giảng mẫu đ/c 4// Bùi Tuấn Anh',
    N'H2.202',
    N'Giám đốc',
    N'TT Bắc',
    N'',
    N'Kiên',
    N'Diện',
    N'#166534',
    N'Published',
    1,
    CONVERT(VARCHAR(19), GETDATE(), 120),
    CONVERT(VARCHAR(19), GETDATE(), 120)
),
(
    N'Lớp BD SQCC CPC tham quan Làng Văn hóa',
    N'2026-10-14',
    N'08:00',
    N'',
    N'Lớp BD SQCC CPC tham quan Làng Văn hóa',
    N'Hà Nội',
    N'',
    N'',
    N'Hiếu theo dõi',
    N'K3',
    N'Diện',
    N'#166534',
    N'Published',
    1,
    CONVERT(VARCHAR(19), GETDATE(), 120),
    CONVERT(VARCHAR(19), GETDATE(), 120)
),

-- --- THỨ NĂM 15/10/2026 (Trực ban: Đông) ---
(
    N'Hội thảo cấp Học viện',
    N'2026-10-15',
    N'07:30',
    N'',
    N'Hội thảo cấp Học viện',
    N'HT.A',
    N'Giám đốc',
    N'TT Bắc',
    N'Minh',
    N'Kiên',
    N'Đông',
    N'#166534',
    N'Published',
    1,
    CONVERT(VARCHAR(19), GETDATE(), 120),
    CONVERT(VARCHAR(19), GETDATE(), 120)
),
(
    N'Lớp HQ38, CSB1/H1 tham quan Lữ 169',
    N'2026-10-15',
    N'08:30',
    N'',
    N'Lớp HQ38, CSB1/H1 tham quan Lữ 169',
    N'Q.Ninh',
    N'',
    N'',
    N'Thiết theo dõi',
    N'K3',
    N'Đông',
    N'#166534',
    N'Published',
    1,
    CONVERT(VARCHAR(19), GETDATE(), 120),
    CONVERT(VARCHAR(19), GETDATE(), 120)
),

-- --- THỨ SÁU 16/10/2026 (Trực ban: Hiếu) ---
(
    N'Thực hiện nhiệm vụ chuyên môn',
    N'2026-10-16',
    N'',
    N'',
    N'Thực hiện nhiệm vụ chuyên môn',
    N'',
    N'',
    N'',
    N'',
    N'',
    N'Hiếu',
    N'#166534',
    N'Published',
    1,
    CONVERT(VARCHAR(19), GETDATE(), 120),
    CONVERT(VARCHAR(19), GETDATE(), 120)
);

PRINT N'  -> Đã chèn 8 nhiệm vụ lịch công tác Tuần 10 thành công.';
GO

-- -----------------------------------------------------------------------------
-- 4. KIỂM TRA ĐỐI SOÁT DỮ LIỆU ĐÃ TẠO
-- -----------------------------------------------------------------------------
PRINT N'';
PRINT N'--- KẾT QUẢ ĐỐI SOÁT METADATA TUẦN 10 ---';
SELECT 
    week_start,
    duty_summary AS [TCH_Hoc_Vien],
    room_summary AS [TCH_Phong_Ban],
    daily_duty_officers
FROM dbo.weekly_schedule_meta 
WHERE week_start = '2026-10-12';

PRINT N'';
PRINT N'--- KẾT QUẢ ĐỐI SOÁT NHIỆM VỤ TUẦN 10 ---';
SELECT 
    id,
    task_date AS [Ngay],
    duty_officer AS [Truc_Ban],
    start_time AS [Gio],
    title AS [Noi_Dung],
    tt_hv AS [TT_HV],
    tt_phong AS [TT_Phong],
    person_in_charge AS [Phu_Trach],
    ban AS [Ban],
    location AS [Dia_Diem]
FROM dbo.weekly_tasks
WHERE task_date >= '2026-10-12' AND task_date <= '2026-10-18'
ORDER BY task_date ASC, start_time ASC;
GO
