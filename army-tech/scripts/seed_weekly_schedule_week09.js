/**
 * Script: Tạo và cập nhật chính xác dữ liệu Lịch công tác Tuần 09 (05/10/2026 - 11/10/2026)
 * CHỈ THỰC HIỆN TRÊN SQL SERVER (không ghi vào SQLite).
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

const WEEK_START = '2026-10-05';
const WEEK_END = '2026-10-11';

const WEEK_META = {
  week_start: WEEK_START,
  duty_summary: '*/ Vũ Đức Long',
  room_summary: '4// Nguyễn Đình Bắc',
  daily_duty_officers: JSON.stringify({
    "2026-10-05": "Diện",
    "2026-10-06": "Thiết",
    "2026-10-07": "Đại",
    "2026-10-08": "Hiếu",
    "2026-10-09": "Huy",
    "2026-10-10": "Quang",
    "2026-10-11": "Quang",
    "_dutyNote": "Trực T7, CN Quang",
    "_dutyOrder": "Thứ tự trực T7 và CN: Quang, Huy, Hiếu, Đại, Diện, Thiết, Đông, Tuyển",
    "_dutyOff": "Nghỉ Trực ban: Đông, Quang, Tuyển"
  })
};

const WEEK_TASKS = [
  // Thứ Hai 05/10/2026
  {
    task_date: '2026-10-05',
    duty_officer: 'Diện',
    start_time: '06:45',
    end_time: '',
    title: 'Chào cờ Học viện',
    content: 'Chào cờ Học viện',
    tt_hv: 'Giám đốc',
    tt_phong: 'TT Bắc',
    person_in_charge: 'Kiên',
    ban: 'Toàn ban',
    location: 'SVĐ',
    color: '#15803d',
    status: 'Published'
  },
  {
    task_date: '2026-10-05',
    duty_officer: 'Diện',
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
  {
    task_date: '2026-10-05',
    duty_officer: 'Diện',
    start_time: '08:00',
    end_time: '',
    title: 'Tiếp nhận học viên QPAN tại HVCTQGHCM',
    content: 'Tiếp nhận học viên QPAN tại HVCTQGHCM',
    tt_hv: '',
    tt_phong: '',
    person_in_charge: 'Kiên',
    ban: 'Thiết',
    location: 'HVCTQG',
    color: '#15803d',
    status: 'Published'
  },
  {
    task_date: '2026-10-05',
    duty_officer: 'Diện',
    start_time: '15:00',
    end_time: '',
    title: 'Lễ Khai giảng lớp QPAN tại HVCTQGHCM',
    content: 'Lễ Khai giảng lớp QPAN tại HVCTQGHCM',
    tt_hv: 'Giám đốc',
    tt_phong: 'TT Bắc',
    person_in_charge: 'Kiên',
    ban: 'Thiết',
    location: 'HVCTQG',
    color: '#15803d',
    status: 'Published'
  },

  // Thứ Ba 06/10/2026
  {
    task_date: '2026-10-06',
    duty_officer: 'Thiết',
    start_time: '08:30',
    end_time: '',
    title: 'Học viên lớp 61 E,G/H1 tham quan NCTT',
    content: 'Học viên lớp 61 E,G/H1 tham quan NCTT',
    tt_hv: '',
    tt_phong: '',
    person_in_charge: 'K3',
    ban: 'Thiết theo dõi',
    location: 'H. Phòng',
    color: '#dc2626',
    status: 'Published'
  },
  {
    task_date: '2026-10-06',
    duty_officer: 'Thiết',
    start_time: '14:00',
    end_time: '',
    title: 'Tổ công tác UBKTQU làm việc với P5',
    content: 'Tổ công tác UBKTQU làm việc với P5',
    tt_hv: '',
    tt_phong: 'TT Bắc',
    person_in_charge: 'Kiên',
    ban: 'Đại, Tuyển',
    location: 'P127/S3',
    color: '#dc2626',
    status: 'Published'
  },

  // Thứ Tư 07/10/2026
  {
    task_date: '2026-10-07',
    duty_officer: 'Đại',
    start_time: '13:30',
    end_time: '',
    title: 'Ngày PL tháng 10',
    content: 'Ngày PL tháng 10',
    tt_hv: '',
    tt_phong: 'TT Nhã',
    person_in_charge: 'Kiên',
    ban: 'Toàn ban',
    location: 'P127/S3',
    color: '#dc2626',
    status: 'Published'
  },

  // Thứ Năm 08/10/2026
  {
    task_date: '2026-10-08',
    duty_officer: 'Hiếu',
    start_time: '13:30',
    end_time: '',
    title: 'Học tập chính trị đối với sĩ quan',
    content: 'Học tập chính trị đối với sĩ quan',
    tt_hv: '',
    tt_phong: 'TT Bắc',
    person_in_charge: 'Kiên',
    ban: 'Sĩ quan Ban',
    location: 'HT.A',
    color: '#dc2626',
    status: 'Published'
  },

  // Thứ Sáu 09/10/2026
  {
    task_date: '2026-10-09',
    duty_officer: 'Huy',
    start_time: '13:30',
    end_time: '',
    title: 'Học tập chính trị đối với QNCN',
    content: 'Học tập chính trị đối với QNCN',
    tt_hv: '',
    tt_phong: 'TT Nhã',
    person_in_charge: 'Minh',
    ban: 'Hanh',
    location: 'HT.A',
    color: '#dc2626',
    status: 'Published'
  }
];

async function seedDataSqlServerOnly() {
  console.log('=====================================================');
  console.log('🗓️  BẮT ĐẦU CẬP NHẬT / TẠO DỮ LIỆU LỊCH CÔNG TÁC TUẦN 09');
  console.log('   (CHỈ THỰC HIỆN TRÊN CƠ SỞ DỮ LIỆU SQL SERVER)');
  console.log('=====================================================');

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

  // 2. Xóa các task cũ của tuần 09 (05/10/2026 - 11/10/2026) nếu có
  console.log('\n[2/3] Dọn dẹp dữ liệu cũ tuần 09 nếu có trên SQL Server...');
  await db.run('DELETE FROM weekly_tasks WHERE task_date >= ? AND task_date <= ?', [WEEK_START, WEEK_END]);
  console.log(`  🧹 Đã xóa sạch dữ liệu cũ từ ${WEEK_START} đến ${WEEK_END} trên SQL Server`);

  // 3. Chèn các sự kiện của tuần 09 vào SQL Server
  console.log('\n[3/3] Chèn các sự kiện lịch công tác tuần 09 vào SQL Server...');
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

  // 4. Kiểm tra lại dữ liệu vừa chèn trên SQL Server
  const finalTasks = await db.all(
    'SELECT id, task_date, start_time, title, tt_hv, tt_phong, person_in_charge, ban, location, duty_officer, color FROM weekly_tasks WHERE task_date >= ? AND task_date <= ? ORDER BY task_date, start_time',
    [WEEK_START, WEEK_END]
  );
  const finalMeta = await db.get('SELECT * FROM weekly_schedule_meta WHERE week_start = ?', [WEEK_START]);

  console.log('\n=====================================================');
  console.log('📊 KẾT QUẢ KIỂM TRA DỮ LIỆU ĐÃ TẠO TRÊN SQL SERVER:');
  console.log('Week Meta:', finalMeta.week_start);
  console.log('  - TCH Học viện (duty_summary):', finalMeta.duty_summary);
  console.log('  - TCH Phòng (room_summary):', finalMeta.room_summary);
  console.log('  - Phân công trực ban (daily_duty_officers):', finalMeta.daily_duty_officers);
  console.log(`\nTổng số sự kiện tuần 09: ${finalTasks.length}`);
  finalTasks.forEach((t, i) => {
    console.log(` ${i + 1}. [${t.task_date} ${t.start_time}] (Trực ban: ${t.duty_officer}) ${t.title} | TT HV: ${t.tt_hv || '---'} | TT Phòng: ${t.tt_phong || '---'} | PT: ${t.person_in_charge || '---'} | Ban: ${t.ban || '---'} | ĐĐ: ${t.location} | Màu: ${t.color}`);
  });
  console.log('=====================================================');
}

seedDataSqlServerOnly().then(() => {
  console.log('🎉 Hoàn tất quá trình tạo dữ liệu lịch công tác tuần 09 trên SQL Server!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
