/**
 * Script: Tạo và cập nhật chính xác dữ liệu Lịch công tác Tuần 08 (28/09/2026 - 04/10/2026)
 * theo mẫu ảnh LỊCH CÔNG TÁC TUẦN 08 vào cơ sở dữ liệu (SQL Server + SQLite).
 */
const path = require('path');
const fs = require('fs');

// 1. Nạp biến môi trường nếu có
function loadLocalEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const sep = trimmed.indexOf('=');
    if (sep === -1) return;
    const key = trimmed.slice(0, sep).trim();
    let val = trimmed.slice(sep + 1).trim();
    if (!key || process.env[key]) return;
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  });
}
loadLocalEnv();

const db = require('../db/sqlserver');

const WEEK_START = '2026-09-28';
const WEEK_META = {
  week_start: WEEK_START,
  duty_summary: '*/ Nguyễn Huy Hoàng',
  room_summary: '4// Đào Xuân Nhã',
  daily_duty_officers: JSON.stringify({
    "2026-09-28": "Hiếu",
    "2026-09-29": "Huy",
    "2026-09-30": "Quang",
    "2026-10-01": "Tuyển",
    "2026-10-02": "Đông",
    "2026-10-03": "Quang",
    "2026-10-04": "Quang",
    "_dutyNote": "Trực T7, CN Quang",
    "_dutyOrder": "Thứ tự trực T7 và CN: Quang, Huy, Hiếu, Đại, Diện, Thiết, Đông, Tuyển",
    "_dutyOff": "Nghỉ Trực ban: Diện, Thiết, Đại"
  })
};

const WEEK_TASKS = [
  // Thứ Hai 28/9/2026
  {
    task_date: '2026-09-28',
    duty_officer: 'Hiếu',
    start_time: '07:30',
    end_time: '',
    title: 'Hội nghị giao ban trực tuyến toàn quân',
    content: 'Hội nghị giao ban trực tuyến toàn quân',
    tt_hv: 'PGĐ Diện',
    tt_phong: 'TT Nhã',
    person_in_charge: 'Kiên',
    ban: '',
    location: 'PH. T5',
    color: '#15803d',
    status: 'Published'
  },

  // Thứ Ba 29/9/2026
  {
    task_date: '2026-09-29',
    duty_officer: 'Huy',
    start_time: '06:30',
    end_time: '',
    title: 'Học viên lớp K44/H2 tham quan NCTT',
    content: 'Học viên lớp K44/H2 tham quan NCTT',
    tt_hv: '',
    tt_phong: '',
    person_in_charge: 'K3',
    ban: 'Diện theo dõi',
    location: 'Hà Nội',
    color: '#dc2626',
    status: 'Published'
  },
  {
    task_date: '2026-09-29',
    duty_officer: 'Huy',
    start_time: '08:30',
    end_time: '',
    title: 'Học viên lớp 61 C,D/H1 tham quan NCTT',
    content: 'Học viên lớp 61 C,D/H1 tham quan NCTT',
    tt_hv: '',
    tt_phong: '',
    person_in_charge: 'K3',
    ban: 'Thiết theo dõi',
    location: 'T. Hóa',
    color: '#dc2626',
    status: 'Published'
  },
  {
    task_date: '2026-09-29',
    duty_officer: 'Huy',
    start_time: '13:30',
    end_time: '',
    title: 'Hội nghị đối thoại dân chủ cấp Học viện',
    content: 'Hội nghị đối thoại dân chủ cấp Học viện',
    tt_hv: 'Chính ủy',
    tt_phong: 'TT Bắc',
    person_in_charge: 'Kiên',
    ban: '',
    location: 'HT.A',
    color: '#dc2626',
    status: 'Published'
  },
  {
    task_date: '2026-09-29',
    duty_officer: 'Huy',
    start_time: '15:30',
    end_time: '',
    title: 'Luyện tập đội ngũ',
    content: 'Luyện tập đội ngũ',
    tt_hv: 'PGĐ Diện',
    tt_phong: 'TT Nhã',
    person_in_charge: 'Kiên',
    ban: 'Toàn ban',
    location: 'SVĐ',
    color: '#dc2626',
    status: 'Published'
  },

  // Thứ Tư 30/9/2026
  {
    task_date: '2026-09-30',
    duty_officer: 'Quang',
    start_time: '08:00',
    end_time: '',
    title: 'Lớp Bồi dưỡng CC CPC tham quan NCTT',
    content: 'Lớp Bồi dưỡng CC CPC tham quan NCTT',
    tt_hv: '',
    tt_phong: '',
    person_in_charge: 'K3',
    ban: 'Hiếu theo dõi',
    location: 'Hà Nội',
    color: '#15803d',
    status: 'Published'
  },

  // Thứ Năm 01/10/2026
  {
    task_date: '2026-10-01',
    duty_officer: 'Tuyển',
    start_time: '06:30',
    end_time: '',
    title: 'Học viên lớp 25H tham quan NCTT',
    content: 'Học viên lớp 25H tham quan NCTT',
    tt_hv: '',
    tt_phong: '',
    person_in_charge: 'K2',
    ban: 'Hiếu theo dõi',
    location: 'Hà Nội',
    color: '#dc2626',
    status: 'Published'
  },
  {
    task_date: '2026-10-01',
    duty_officer: 'Tuyển',
    start_time: '13:30',
    end_time: '',
    title: 'Ngày Đảng, ngày CT, VH, TT',
    content: 'Ngày Đảng, ngày CT, VH, TT',
    tt_hv: '',
    tt_phong: 'TT Bắc',
    person_in_charge: 'Kiên',
    ban: 'Toàn ban',
    location: 'P127/S3',
    color: '#dc2626',
    status: 'Published'
  },

  // Thứ Sáu 02/10/2026
  {
    task_date: '2026-10-02',
    duty_officer: 'Đông',
    start_time: '08:30',
    end_time: '',
    title: 'Học viên lớp 61H, BP27 tham quan NCTT',
    content: 'Học viên lớp 61H, BP27 tham quan NCTT',
    tt_hv: '',
    tt_phong: '',
    person_in_charge: 'K3',
    ban: 'Thiết theo dõi',
    location: 'L. Sơn',
    color: '#dc2626',
    status: 'Published'
  },
  {
    task_date: '2026-10-02',
    duty_officer: 'Đông',
    start_time: '14:30',
    end_time: '',
    title: 'Hội nghị giao ban công tác GD, ĐT quý',
    content: 'Hội nghị giao ban công tác GD, ĐT quý',
    tt_hv: 'PGĐ Phai',
    tt_phong: 'TT Bắc',
    person_in_charge: 'Kiên',
    ban: '',
    location: 'P127/S3',
    color: '#15803d',
    status: 'Published'
  }
];

async function seedData() {
  console.log('=====================================================');
  console.log('🗓️  BẮT ĐẦU CẬP NHẬT / TẠO DỮ LIỆU LỊCH CÔNG TÁC TUẦN 08');
  console.log('=====================================================');

  // --- BƯỚC 1: CẬP NHẬT TRÊN SQL SERVER ---
  console.log('\n[1/2] Cập nhật trên SQL Server...');
  const existingMeta = await db.get('SELECT id FROM weekly_schedule_meta WHERE week_start = ?', [WEEK_START]);
  if (existingMeta) {
    await db.run(`
      UPDATE weekly_schedule_meta
      SET duty_summary = ?, room_summary = ?, daily_duty_officers = ?, updated_at = CONVERT(VARCHAR(19), GETDATE(), 120)
      WHERE week_start = ?
    `, [WEEK_META.duty_summary, WEEK_META.room_summary, WEEK_META.daily_duty_officers, WEEK_START]);
    console.log(`  ✅ Đã cập nhật weekly_schedule_meta (ID: ${existingMeta.id}) cho tuần ${WEEK_START}`);
  } else {
    await db.run(`
      INSERT INTO weekly_schedule_meta(week_start, duty_summary, room_summary, daily_duty_officers)
      VALUES (?, ?, ?, ?)
    `, [WEEK_META.week_start, WEEK_META.duty_summary, WEEK_META.room_summary, WEEK_META.daily_duty_officers]);
    console.log(`  ✅ Đã thêm mới weekly_schedule_meta cho tuần ${WEEK_START}`);
  }

  // Xóa các task cũ của tuần này nếu có để đảm bảo dữ liệu sạch và chính xác
  await db.run('DELETE FROM weekly_tasks WHERE task_date >= ? AND task_date <= ?', ['2026-09-28', '2026-10-04']);
  console.log('  🧹 Đã xóa sạch các bản ghi cũ của tuần 28/09/2026 - 04/10/2026 trên SQL Server');

  // Thêm 10 sự kiện chuẩn
  for (const t of WEEK_TASKS) {
    await db.run(`
      INSERT INTO weekly_tasks(title, task_date, start_time, end_time, content, location, tt_hv, tt_phong, ban, person_in_charge, duty_officer, color, status, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      t.title,
      t.task_date,
      t.start_time,
      t.end_time,
      t.content,
      t.location,
      t.tt_hv,
      t.tt_phong,
      t.ban,
      t.person_in_charge,
      t.duty_officer,
      t.color,
      t.status
    ]);
  }
  console.log(`  ✅ Đã chèn thành công ${WEEK_TASKS.length} sự kiện lịch công tác vào SQL Server!`);

  // --- BƯỚC 2: ĐỒNG BỘ VÀO FILE SQLITE exam-draw.db (DỰ PHÒNG NẾU CẦN) ---
  console.log('\n[2/2] Đồng bộ dữ liệu sang SQLite exam-draw.db...');
  const sqliteDbPath = path.join(__dirname, '../exam-draw.db');
  if (fs.existsSync(sqliteDbPath)) {
    try {
      const Database = require('better-sqlite3');
      const sqliteDb = new Database(sqliteDbPath);

      // Cập nhật weekly_schedule_meta
      sqliteDb.prepare('DELETE FROM weekly_schedule_meta WHERE week_start = ?').run(WEEK_START);
      sqliteDb.prepare(`
        INSERT INTO weekly_schedule_meta(week_start, duty_summary, room_summary, daily_duty_officers, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
      `).run(WEEK_META.week_start, WEEK_META.duty_summary, WEEK_META.room_summary, WEEK_META.daily_duty_officers);

      // Cập nhật weekly_tasks
      sqliteDb.prepare("DELETE FROM weekly_tasks WHERE task_date >= '2026-09-28' AND task_date <= '2026-10-04'").run();
      const insertTaskStmt = sqliteDb.prepare(`
        INSERT INTO weekly_tasks(title, task_date, start_time, end_time, content, location, tt_hv, tt_phong, ban, person_in_charge, duty_officer, color, status, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now', 'localtime'), datetime('now', 'localtime'))
      `);

      for (const t of WEEK_TASKS) {
        insertTaskStmt.run(
          t.title,
          t.task_date,
          t.start_time,
          t.end_time,
          t.content,
          t.location,
          t.tt_hv,
          t.tt_phong,
          t.ban,
          t.person_in_charge,
          t.duty_officer,
          t.color,
          t.status
        );
      }
      sqliteDb.close();
      console.log(`  ✅ Đã đồng bộ thành công sang file SQLite exam-draw.db!`);
    } catch (e) {
      console.log(`  ⚠️ Ghi chú SQLite: ${e.message}`);
    }
  }

  // Kiểm tra lại trên SQL Server
  const finalTasks = await db.all('SELECT id, task_date, start_time, title, tt_hv, tt_phong, person_in_charge, ban, location, duty_officer, color FROM weekly_tasks WHERE task_date >= ? AND task_date <= ? ORDER BY task_date, start_time', ['2026-09-28', '2026-10-04']);
  const finalMeta = await db.get('SELECT * FROM weekly_schedule_meta WHERE week_start = ?', [WEEK_START]);

  console.log('\n=====================================================');
  console.log('📊 KẾT QUẢ KIỂM TRA DỮ LIỆU ĐÃ TẠO:');
  console.log('Week Meta:', finalMeta.week_start, '| TCH HV:', finalMeta.duty_summary, '| TCH Phòng:', finalMeta.room_summary);
  console.log(`Số sự kiện công tác: ${finalTasks.length}`);
  finalTasks.forEach((t, i) => {
    console.log(` ${i + 1}. [${t.task_date} ${t.start_time}] (Trực ban: ${t.duty_officer}) ${t.title} | Ban: ${t.ban || '---'} | ĐĐ: ${t.location} | Màu: ${t.color}`);
  });
  console.log('=====================================================');
}

seedData().then(() => {
  console.log('🎉 Hoàn tất quá trình tạo dữ liệu lịch công tác!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
