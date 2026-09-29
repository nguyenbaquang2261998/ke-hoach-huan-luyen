import sqlite3
import json

conn = sqlite3.connect('exam-draw.db')
c = conn.cursor()

# Ensure daily_duty_officers column exists
columns = [col[1] for col in c.execute('PRAGMA table_info(weekly_schedule_meta)').fetchall()]
if 'daily_duty_officers' not in columns:
    c.execute('ALTER TABLE weekly_schedule_meta ADD COLUMN daily_duty_officers TEXT NULL')
    conn.commit()

c.execute('DELETE FROM weekly_schedule_meta WHERE week_start = ?', ('2026-09-28',))
c.execute('''INSERT INTO weekly_schedule_meta(week_start, duty_summary, room_summary, daily_duty_officers, created_at, updated_at)
VALUES (?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))''',
('2026-09-28', '*/ Nguyễn Huy Hoàng', '4// Đào Xuân Nhã', json.dumps({
    '2026-09-28': 'Hiếu',
    '2026-09-29': 'Huy',
    '2026-09-30': 'Quang',
    '2026-10-01': 'Tuyển',
    '2026-10-02': 'Đông',
    '2026-10-03': 'Quang',
    '2026-10-04': 'Quang',
    '_dutyNote': 'Trực T7, CN Quang',
    '_dutyOrder': 'Thứ tự trực T7 và CN: Quang, Huy, Hiếu, Đại, Diện, Thiết, Đông, Tuyển',
    '_dutyOff': 'Nghỉ Trực ban: Diện, Thiết, Đại'
}, ensure_ascii=False)))

c.execute("DELETE FROM weekly_tasks WHERE task_date >= '2026-09-28' AND task_date <= '2026-10-04'")

tasks = [
  ('Hội nghị giao ban trực tuyến toàn quân', '2026-09-28', '07:30', 'Hội nghị giao ban trực tuyến toàn quân', 'PH. T5', 'PGĐ Diện', 'TT Nhã', '', 'Kiên', 'Hiếu', '#15803d'),
  ('Học viên lớp K44/H2 tham quan NCTT', '2026-09-29', '06:30', 'Học viên lớp K44/H2 tham quan NCTT', 'Hà Nội', '', '', 'Diện theo dõi', 'K3', 'Huy', '#dc2626'),
  ('Học viên lớp 61 C,D/H1 tham quan NCTT', '2026-09-29', '08:30', 'Học viên lớp 61 C,D/H1 tham quan NCTT', 'T. Hóa', '', '', 'Thiết theo dõi', 'K3', 'Huy', '#dc2626'),
  ('Hội nghị đối thoại dân chủ cấp Học viện', '2026-09-29', '13:30', 'Hội nghị đối thoại dân chủ cấp Học viện', 'HT.A', 'Chính ủy', 'TT Bắc', '', 'Kiên', 'Huy', '#dc2626'),
  ('Luyện tập đội ngũ', '2026-09-29', '15:30', 'Luyện tập đội ngũ', 'SVĐ', 'PGĐ Diện', 'TT Nhã', 'Toàn ban', 'Kiên', 'Huy', '#dc2626'),
  ('Lớp Bồi dưỡng CC CPC tham quan NCTT', '2026-09-30', '08:00', 'Lớp Bồi dưỡng CC CPC tham quan NCTT', 'Hà Nội', '', '', 'Hiếu theo dõi', 'K3', 'Quang', '#15803d'),
  ('Học viên lớp 25H tham quan NCTT', '2026-10-01', '06:30', 'Học viên lớp 25H tham quan NCTT', 'Hà Nội', '', '', 'Hiếu theo dõi', 'K2', 'Tuyển', '#dc2626'),
  ('Ngày Đảng, ngày CT, VH, TT', '2026-10-01', '13:30', 'Ngày Đảng, ngày CT, VH, TT', 'P127/S3', '', 'TT Bắc', 'Toàn ban', 'Kiên', 'Tuyển', '#dc2626'),
  ('Học viên lớp 61H, BP27 tham quan NCTT', '2026-10-02', '08:30', 'Học viên lớp 61H, BP27 tham quan NCTT', 'L. Sơn', '', '', 'Thiết theo dõi', 'K3', 'Đông', '#dc2626'),
  ('Hội nghị giao ban công tác GD, ĐT quý', '2026-10-02', '14:30', 'Hội nghị giao ban công tác GD, ĐT quý', 'P127/S3', 'PGĐ Phai', 'TT Bắc', '', 'Kiên', 'Đông', '#15803d')
]

for t in tasks:
    c.execute('''INSERT INTO weekly_tasks(title, task_date, start_time, end_time, content, location, tt_hv, tt_phong, ban, person_in_charge, duty_officer, color, status, is_active, created_at, updated_at)
    VALUES (?, ?, ?, '', ?, ?, ?, ?, ?, ?, ?, ?, 'Published', 1, datetime('now', 'localtime'), datetime('now', 'localtime'))''', t)

conn.commit()
count = c.execute("SELECT COUNT(*) FROM weekly_tasks WHERE task_date >= '2026-09-28' AND task_date <= '2026-10-04'").fetchone()[0]
print(f'SQLite exam-draw.db successfully updated with {count} tasks for week 2026-09-28.')
conn.close()
