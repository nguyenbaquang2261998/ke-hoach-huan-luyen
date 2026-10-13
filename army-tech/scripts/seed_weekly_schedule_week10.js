/**
 * Script: Tạo và cập nhật chính xác dữ liệu Lịch công tác Tuần 10 (12/10/2026 - 18/10/2026)
 * theo mẫu ảnh LỊCH CÔNG TÁC TUẦN 10 vào cơ sở dữ liệu SQL Server (+ SQLite dự phòng nếu có).
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

const WEEK_START = '2026-10-12';
const WEEK_END = '2026-10-18';

const WEEK_META = {
  week_start: WEEK_START,
  duty_summary: '*/ Vũ Đức Long',
  room_summary: '4// Nguyễn Như Hòa (TCH Ban: 2// Nguyễn Văn Kiên)',
  daily_duty_officers: JSON.stringify({
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
  })
};

const WEEK_TASKS = [
  // Thứ Hai 12/10/2026
  {
    task_date: '2026-10-12',
    duty_officer: 'Quang',
    start_time: '07:30',
    end_time: '',
    title: 'Tập huấn CNTT nâng cao (từ thứ 2 đến thứ 6)',
    content: 'Tập huấn CNTT nâng cao (từ thứ 2 đến thứ 6)',
    tt_hv: '',
    tt_phong: 'TT Hòa',
    person_in_charge: 'Kiên',
    ban: 'Đại, Huy, Tuyển',
    location: 'H2.212',
    color: '#15803d',
    status: 'Published'
  },
  {
    task_date: '2026-10-12',
    duty_officer: 'Quang',
    start_time: '07:30',
    end_time: '',
    title: 'Hội nghị giao ban trực tuyến toàn quân',
    content: 'Hội nghị giao ban trực tuyến toàn quân',
    tt_hv: 'PGĐ Hoàng',
    tt_phong: 'TT Nhã',
    person_in_charge: 'Minh',
    ban: '',
    location: 'PH. T5',
    color: '#15803d',
    status: 'Published'
  },

  // Thứ Ba 13/10/2026
  {
    task_date: '2026-10-13',
    duty_officer: 'Thiết',
    start_time: '06:30',
    end_time: '',
    title: 'Lớp KQ39/H1 tham quan e916/f371/QCPK-KQ',
    content: 'Lớp KQ39/H1 tham quan e916/f371/QCPK-KQ',
    tt_hv: '',
    tt_phong: '',
    person_in_charge: 'K9',
    ban: 'Thiết theo dõi',
    location: 'Hà Nội',
    color: '#166534',
    status: 'Published'
  },

  // Thứ Tư 14/10/2026
  {
    task_date: '2026-10-14',
    duty_officer: 'Diện',
    start_time: '06:45',
    end_time: '',
    title: 'Dự giảng mẫu đ/c 4// Bùi Tuấn Anh',
    content: 'Dự giảng mẫu đ/c 4// Bùi Tuấn Anh',
    tt_hv: 'Giám đốc',
    tt_phong: 'TT Bắc',
    person_in_charge: 'Kiên',
    ban: '',
    location: 'H2.202',
    color: '#166534',
    status: 'Published'
  },
  {
    task_date: '2026-10-14',
    duty_officer: 'Diện',
    start_time: '08:00',
    end_time: '',
    title: 'Lớp BD SQCC CPC tham quan Làng Văn hóa',
    content: 'Lớp BD SQCC CPC tham quan Làng Văn hóa',
    tt_hv: '',
    tt_phong: '',
    person_in_charge: 'K3',
    ban: 'Hiếu theo dõi',
    location: 'Hà Nội',
    color: '#166534',
    status: 'Published'
  },

  // Thứ Năm 15/10/2026
  {
    task_date: '2026-10-15',
    duty_officer: 'Đông',
    start_time: '07:30',
    end_time: '',
    title: 'Hội thảo cấp Học viện',
    content: 'Hội thảo cấp Học viện',
    tt_hv: 'Giám đốc',
    tt_phong: 'TT Bắc',
    person_in_charge: 'Kiên',
    ban: 'Minh',
    location: 'HT.A',
    color: '#166534',
    status: 'Published'
  },
  {
    task_date: '2026-10-15',
    duty_officer: 'Đông',
    start_time: '08:30',
    end_time: '',
    title: 'Lớp HQ38, CSB1/H1 tham quan Lữ 169',
    content: 'Lớp HQ38, CSB1/H1 tham quan Lữ 169',
    tt_hv: '',
    tt_phong: '',
    person_in_charge: 'K3',
    ban: 'Thiết theo dõi',
    location: 'Q.Ninh',
    color: '#166534',
    status: 'Published'
  },

  // Thứ Sáu 16/10/2026
  {
    task_date: '2026-10-16',
    duty_officer: 'Hiếu',
    start_time: '',
    end_time: '',
    title: 'Thực hiện nhiệm vụ chuyên môn',
    content: 'Thực hiện nhiệm vụ chuyên môn',
    tt_hv: '',
    tt_phong: '',
    person_in_charge: '',
    ban: '',
    location: '',
    color: '#166534',
    status: 'Published'
  }
];

async function seedData() {
  console.log('=====================================================');
  console.log('🗓️  BẮT ĐẦU CẬP NHẬT / TẠO DỮ LIỆU LỊCH CÔNG TÁC TUẦN 10');
  console.log('   (12/10/2026 - 18/10/2026)');
  console.log('=====================================================');

  try {
    // 1. Cập nhật thông tin weekly_schedule_meta trên SQL Server
    console.log('\n[1/3] Cập nhật weekly_schedule_meta trên SQL Server...');
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

    // 2. Xóa các task cũ của tuần 10 nếu có
    console.log('\n[2/3] Dọn dẹp dữ liệu cũ tuần 10 trên SQL Server...');
    await db.run('DELETE FROM weekly_tasks WHERE task_date >= ? AND task_date <= ?', [WEEK_START, WEEK_END]);
    console.log(`  🧹 Đã xóa sạch dữ liệu cũ từ ${WEEK_START} đến ${WEEK_END} trên SQL Server`);

    // 3. Chèn các sự kiện của tuần 10 vào SQL Server
    console.log('\n[3/3] Chèn 8 sự kiện lịch công tác tuần 10 vào SQL Server...');
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
    console.log(`  ✅ Đã chèn thành công ${WEEK_TASKS.length} sự kiện vào SQL Server!`);

    // 4. Kiểm tra lại kết quả trên SQL Server
    const finalTasks = await db.all(
      'SELECT id, task_date, start_time, title, tt_hv, tt_phong, person_in_charge, ban, location, duty_officer, color FROM weekly_tasks WHERE task_date >= ? AND task_date <= ? ORDER BY task_date, start_time',
      [WEEK_START, WEEK_END]
    );
    console.log('\n📋 DANH SÁCH NHIỆM VỤ TUẦN 10 ĐÃ TẠO TRÊN SQL SERVER:');
    console.table(finalTasks);

  } catch (err) {
    console.error('❌ Lỗi khi thực hiện trên SQL Server:', err.message);
  }

  // --- Đồng bộ sang SQLite exam-draw.db (nếu có để phục vụ offline dev) ---
  const sqliteDbPath = path.join(__dirname, '../exam-draw.db');
  if (fs.existsSync(sqliteDbPath)) {
    try {
      console.log('\n[Đồng bộ SQLite] Cập nhật vào exam-draw.db...');
      const Database = require('better-sqlite3');
      const sqliteDb = new Database(sqliteDbPath);

      sqliteDb.prepare('DELETE FROM weekly_schedule_meta WHERE week_start = ?').run(WEEK_START);
      sqliteDb.prepare(`
        INSERT INTO weekly_schedule_meta(week_start, duty_summary, room_summary, daily_duty_officers, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
      `).run(WEEK_META.week_start, WEEK_META.duty_summary, WEEK_META.room_summary, WEEK_META.daily_duty_officers);

      sqliteDb.prepare('DELETE FROM weekly_tasks WHERE task_date >= ? AND task_date <= ?').run(WEEK_START, WEEK_END);
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
      console.log('  ✅ Đã đồng bộ thành công sang SQLite exam-draw.db');
    } catch (e) {
      console.log('  ℹ️ Bỏ qua đồng bộ SQLite:', e.message);
    }
  }

  console.log('\n🎉 HOÀN THÀNH TẠO DỮ LIỆU LỊCH CÔNG TÁC TUẦN 10!');
}

if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seedData, WEEK_META, WEEK_TASKS };
