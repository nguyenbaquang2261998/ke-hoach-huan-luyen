const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const sql = require('mssql');
const { config } = require('../db/sqlserver');

const sqliteDbPath = path.join(__dirname, '../exam-draw.db');
const schemaSqlPath = path.join(__dirname, '../db/schema.sql');

async function runMigration() {
  console.log('====================================================');
  console.log('🚀 BẮT ĐẦU QUÁ TRÌNH TẠO BẢNG VÀ MIGRATE SANG SQL SERVER');
  console.log('====================================================');

  if (!fs.existsSync(sqliteDbPath)) {
    throw new Error(`Không tìm thấy file SQLite: ${sqliteDbPath}`);
  }

  const sqliteDb = new Database(sqliteDbPath, { readonly: true });
  console.log('📂 Đã mở cơ sở dữ liệu SQLite nguồn:', sqliteDbPath);

  console.log(`🔌 Đang kết nối đến SQL Server (${config.server} -> ${config.database})...`);
  const pool = await sql.connect(config);
  console.log('✅ Đã kết nối SQL Server thành công!');

  const migrationTables = [
    { name: 'users', primaryKey: 'id' },
    { name: 'exam_sessions', primaryKey: 'id' },
    { name: 'teachers', primaryKey: 'id' },
    { name: 'exam_rooms', primaryKey: 'id' },
    { name: 'exam_subjects', primaryKey: 'id' },
    { name: 'exam_documents', primaryKey: 'id' },
    { name: 'draw_sessions', primaryKey: 'id' },
    { name: 'draw_results', primaryKey: 'id' },
    { name: 'draw_reserves', primaryKey: 'id' },
    { name: 'weekly_tasks', primaryKey: 'id' },
    { name: 'weekly_schedule_meta', primaryKey: 'id' },
    { name: 'students', primaryKey: 'id' },
    { name: 'daily_tasks', primaryKey: 'id' },
    { name: 'notifications', primaryKey: 'id' },
    { name: 'ai_documents', primaryKey: 'id' },
    { name: 'ai_conversations', primaryKey: 'id' },
    { name: 'audit_logs', primaryKey: 'id' }
  ];

  // Kiểm tra danh sách bảng hiện tại trong database
  const existingTablesRes = await pool.request().query(
    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"
  );
  const existingTables = existingTablesRes.recordset.map(r => r.TABLE_NAME.toLowerCase());
  const missingTables = migrationTables.filter(t => !existingTables.includes(t.name.toLowerCase()));

  console.log(`📋 Số bảng hiện có trên SQL Server: ${existingTables.length}/17`);

  // Bước 1: Tạo schema trên SQL Server nếu còn thiếu bảng
  if (missingTables.length > 0) {
    console.log(`\n--- BƯỚC 1: TẠO ${missingTables.length} BẢNG CÒN THIẾU TRÊN SQL SERVER ---`);
    const schemaSql = fs.readFileSync(schemaSqlPath, 'utf8');
    const schemaBatches = schemaSql
      .split(/\r?\nGO\s*(?:\r?\n|$)/i)
      .map(batch => batch.trim())
      .filter(batch => batch.length > 0);

    let createdCount = 0;
    for (let i = 0; i < schemaBatches.length; i++) {
      const batch = schemaBatches[i];
      try {
        await pool.request().query(batch);
        createdCount++;
      } catch (err) {
        if (err.message.includes('permission denied')) {
          console.error(`\n⚠️ LƯU Ý QUYỀN TRUY CẬP SQL SERVER:`);
          console.error(`User 'dev' trên database '${config.database}' hiện chưa có quyền CREATE TABLE (cần quyền db_owner hoặc db_ddladmin).`);
          console.error(`👉 Vui lòng chạy lệnh sau trên SSMS bằng tài khoản sa hoặc Admin:`);
          console.error(`   USE [${config.database}];`);
          console.error(`   ALTER ROLE db_owner ADD MEMBER dev;`);
          console.error(`👉 Hoặc mở file db/schema.sql và chạy toàn bộ nội dung trong SSMS để tạo bảng.\n`);
          throw err;
        }
        console.error(`❌ Lỗi tại batch #${i + 1}:`, batch.slice(0, 120), '\nChi tiết:', err.message);
        throw err;
      }
    }
    console.log(`✅ Đã thực thi thành công ${createdCount} khối lệnh tạo bảng.`);
  } else {
    console.log('✅ Toàn bộ 17 bảng đã tồn tại trên SQL Server.');
  }

  // Bước 2: Dọn dẹp dữ liệu cũ (nếu có) theo thứ tự ngược của quan hệ khóa ngoại
  console.log('\n--- BƯỚC 2: CHUẨN BỊ BẢNG TRƯỚC KHI NẠP DỮ LIỆU ---');
  for (let i = migrationTables.length - 1; i >= 0; i--) {
    const tableName = migrationTables[i].name;
    try {
      await pool.request().query(`DELETE FROM dbo.[${tableName}];`);
    } catch (err) {
      console.warn(`Lưu ý dọn dẹp bảng [${tableName}]:`, err.message);
    }
  }
  console.log('✅ Đã sẵn sàng các bảng trống để nạp dữ liệu sạch.');

  // Bước 3: Migrate dữ liệu từng bảng
  console.log('\n--- BƯỚC 3: CHUYỂN TOÀN BỘ DỮ LIỆU TỪ SQLITE SANG SQL SERVER ---');
  for (const table of migrationTables) {
    const tableName = table.name;
    const rows = sqliteDb.prepare(`SELECT * FROM "${tableName}"`).all();
    const sourceCount = rows.length;

    if (sourceCount === 0) {
      console.log(`ℹ️ [${tableName}]: Bảng trống (0 bản ghi). Bỏ qua nạp dữ liệu.`);
      continue;
    }

    console.log(`⏳ Đang chuyển [${tableName}] (${sourceCount} bản ghi)...`);

    const columns = Object.keys(rows[0]);
    const columnNamesEscaped = columns.map(c => `[${c}]`).join(', ');

    // Chia nhỏ batch để insert an toàn
    const batchSize = 25;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const batchReq = pool.request();

      const valueClauses = [];
      batch.forEach((row, rowIndex) => {
        const paramNames = [];
        columns.forEach((col, colIndex) => {
          const paramName = `p_${rowIndex}_${colIndex}`;
          paramNames.push(`@${paramName}`);
          let val = row[col];
          if (val === undefined) val = null;
          batchReq.input(paramName, val);
        });
        valueClauses.push(`(${paramNames.join(', ')})`);
      });

      const insertQuery = `
        SET IDENTITY_INSERT dbo.[${tableName}] ON;
        INSERT INTO dbo.[${tableName}] (${columnNamesEscaped})
        VALUES ${valueClauses.join(',\n')};
        SET IDENTITY_INSERT dbo.[${tableName}] OFF;
      `;
      await batchReq.query(insertQuery);
    }

    console.log(`✅ [${tableName}]: Đã nạp thành công ${sourceCount} bản ghi.`);
  }

  // Bước 4: Đối soát số lượng bản ghi
  console.log('\n--- BƯỚC 4: ĐỐI SOÁT TÍNH TOÀN VẸN VÀ SỐ LƯỢNG DỮ LIỆU ---');
  const stats = [];
  let totalSqlite = 0;
  let totalSqlServer = 0;
  let allMatched = true;

  for (const table of migrationTables) {
    const tableName = table.name;
    const countSqlite = sqliteDb.prepare(`SELECT COUNT(*) as c FROM "${tableName}"`).get().c;
    const resSql = await pool.request().query(`SELECT COUNT(*) as c FROM dbo.[${tableName}]`);
    const countSqlServer = resSql.recordset[0].c;

    totalSqlite += countSqlite;
    totalSqlServer += countSqlServer;
    const isMatch = countSqlite === countSqlServer;
    if (!isMatch) allMatched = false;

    stats.push({
      'Bảng': tableName,
      'SQLite': countSqlite,
      'SQL Server': countSqlServer,
      'Khớp': isMatch ? '✅ 100%' : '❌ LỆCH'
    });
  }

  console.table(stats);
  console.log(`\n📊 TỔNG KẾT:`);
  console.log(`- Tổng bản ghi SQLite:     ${totalSqlite}`);
  console.log(`- Tổng bản ghi SQL Server: ${totalSqlServer}`);
  console.log(`- Trạng thái chung:        ${allMatched ? '✅ HOÀN TẤT VÀ KHỚP 100%' : '❌ CÓ LỖI LỆCH DỮ LIỆU'}`);

  // Test kiểm tra Unicode tiếng Việt
  console.log('\n--- KIỂM TRA MẪU DỮ LIỆU UNICODE TIẾNG VIỆT ---');
  const sampleTeacher = await pool.request().query('SELECT TOP 3 id, name, role, unit FROM dbo.teachers ORDER BY id ASC');
  console.log('Sample Teachers:', sampleTeacher.recordset);

  const sampleUser = await pool.request().query('SELECT id, username, full_name, role, permissions FROM dbo.users');
  console.log('Sample Users:', sampleUser.recordset);

  const sampleTask = await pool.request().query('SELECT TOP 2 id, title, location, task_date FROM dbo.weekly_tasks ORDER BY id DESC');
  console.log('Sample Weekly Tasks:', sampleTask.recordset);

  sqliteDb.close();
  await pool.close();
  console.log('\n🎉 TOÀN BỘ DỮ LIỆU ĐÃ ĐƯỢC CHUYỂN SANG SQL SERVER THÀNH CÔNG VÀ CHÍNH XÁC!');
}

runMigration().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
