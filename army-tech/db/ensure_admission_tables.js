const db = require('./sqlserver');

async function ensureAdmissionTables() {
  console.log('🔄 Đang kiểm tra và khởi tạo các bảng Tiếp nhận học viên trên SQL Server...');

  // 1. Tạo bảng admission_targets (Đối tượng tiếp nhận)
  await db.exec(`
    IF OBJECT_ID('dbo.admission_targets', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.admission_targets (
        id INT IDENTITY(1,1) PRIMARY KEY,
        code NVARCHAR(100) NOT NULL UNIQUE,
        name NVARCHAR(500) NOT NULL,
        default_class NVARCHAR(255) NULL,
        quota INT DEFAULT 0,
        required_documents NVARCHAR(MAX) NULL,
        description NVARCHAR(MAX) NULL,
        is_active INT DEFAULT 1,
        created_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120),
        updated_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120)
      );
    END
  `);

  // 2. Tạo bảng admission_batches (Đợt tiếp nhận)
  await db.exec(`
    IF OBJECT_ID('dbo.admission_batches', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.admission_batches (
        id INT IDENTITY(1,1) PRIMARY KEY,
        code NVARCHAR(100) NOT NULL UNIQUE,
        name NVARCHAR(500) NOT NULL,
        academic_year NVARCHAR(50) NULL,
        start_date NVARCHAR(50) NULL,
        end_date NVARCHAR(50) NULL,
        target_ids NVARCHAR(MAX) NULL,
        status NVARCHAR(50) DEFAULT 'Open',
        note NVARCHAR(MAX) NULL,
        is_active INT DEFAULT 1,
        created_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120),
        updated_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120)
      );
    END
  `);

  // 3. Tạo bảng student_documents (Văn bằng, chứng chỉ, giấy tờ của học viên)
  await db.exec(`
    IF OBJECT_ID('dbo.student_documents', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.student_documents (
        id INT IDENTITY(1,1) PRIMARY KEY,
        student_id INT NOT NULL,
        doc_type NVARCHAR(255) NOT NULL,
        file_name NVARCHAR(500) NOT NULL,
        file_path NVARCHAR(MAX) NOT NULL,
        file_size BIGINT DEFAULT 0,
        file_type NVARCHAR(100) NULL,
        is_active INT DEFAULT 1,
        created_at NVARCHAR(50) DEFAULT CONVERT(VARCHAR(19), GETDATE(), 120),
        CONSTRAINT FK_student_documents_student FOREIGN KEY (student_id) REFERENCES dbo.students(id) ON DELETE CASCADE
      );
    END
  `);

  // 4. Bổ sung các cột mở rộng vào bảng students (nếu chưa có)
  const columnsToAdd = [
    { name: 'order_index', type: 'INT NULL' },
    { name: 'birthplace', type: 'NVARCHAR(255) NULL' },
    { name: 'hometown', type: 'NVARCHAR(500) NULL' },
    { name: 'position', type: 'NVARCHAR(255) NULL' },
    { name: 'id_card', type: 'NVARCHAR(50) NULL' },
    { name: 'id_card_date', type: 'NVARCHAR(50) NULL' },
    { name: 'id_card_place', type: 'NVARCHAR(255) NULL' },
    { name: 'gender', type: 'NVARCHAR(20) NULL' },
    { name: 'ethnic', type: 'NVARCHAR(100) NULL' },
    { name: 'religion', type: 'NVARCHAR(100) NULL' },
    { name: 'party_date', type: 'NVARCHAR(50) NULL' },
    { name: 'party_official_date', type: 'NVARCHAR(50) NULL' },
    { name: 'education_level', type: 'NVARCHAR(MAX) NULL' },
    { name: 'batch_id', type: 'INT NULL' },
    { name: 'target_id', type: 'INT NULL' },
    { name: 'review_notes', type: 'NVARCHAR(MAX) NULL' },
    { name: 'reviewed_by', type: 'NVARCHAR(255) NULL' },
    { name: 'reviewed_at', type: 'NVARCHAR(50) NULL' },
    { name: 'declaration_date', type: 'NVARCHAR(50) NULL' },
    { name: 'declaration_place', type: 'NVARCHAR(255) NULL' },
    { name: 'avatar_url', type: 'NVARCHAR(MAX) NULL' }
  ];

  for (const col of columnsToAdd) {
    await db.exec(`
      IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('dbo.students') AND name = '${col.name}'
      )
      BEGIN
        ALTER TABLE dbo.students ADD ${col.name} ${col.type};
      END
    `);
  }

  // 5. Seed dữ liệu mẫu ban đầu nếu chưa có
  const existingTargets = await db.all('SELECT id FROM admission_targets WHERE is_active = 1');
  let target1Id = null;

  if (existingTargets.length === 0) {
    const defaultDocs1 = JSON.stringify([
      'Bản sao Quyết định cử đi học',
      'Bằng tốt nghiệp Đại học / Cao đẳng',
      'Chứng chỉ Lý luận chính trị',
      'Ảnh thẻ 3x4 nền trắng'
    ]);

    const res1 = await db.run(`
      INSERT INTO admission_targets (code, name, default_class, quota, required_documents, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'DT-CHINH-UY-23C',
      'Đào tạo ngắn hạn Chính ủy Trung, Lữ đoàn',
      'Lớp 23C',
      40,
      defaultDocs1,
      'Đối tượng cán bộ nguồn đào tạo ngắn hạn Chính ủy Trung đoàn, Lữ đoàn - Học viện Chính trị'
    ]);
    target1Id = res1.lastInsertRowid;

    const defaultDocs2 = JSON.stringify([
      'Giấy báo nhập học',
      'Bằng tốt nghiệp Đại học',
      'Bản sao Giấy khai sinh',
      'Lý lịch cán bộ có xác nhận',
      'Ảnh thẻ 3x4 nền trắng'
    ]);

    await db.run(`
      INSERT INTO admission_targets (code, name, default_class, quota, required_documents, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'DT-CBCT-TRUNG-DOAN',
      'Đào tạo Cán bộ Chính trị cấp Trung (sư) đoàn',
      'Lớp 15B',
      60,
      defaultDocs2,
      'Đối tượng đào tạo Cán bộ Chính trị cấp Trung đoàn, Sư đoàn'
    ]);

    console.log('✅ Đã khởi tạo dữ liệu đối tượng tiếp nhận mẫu!');
  } else {
    target1Id = existingTargets[0].id;
  }

  const existingBatches = await db.all('SELECT id FROM admission_batches WHERE is_active = 1');
  let batchId = null;
  if (existingBatches.length === 0) {
    const allTargets = await db.all('SELECT id FROM admission_targets WHERE is_active = 1');
    const targetIds = JSON.stringify(allTargets.map(t => t.id));

    const batchRes = await db.run(`
      INSERT INTO admission_batches (code, name, academic_year, start_date, end_date, target_ids, status, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'DOT-2026-01',
      'Đợt tiếp nhận Học viên Khóa 2026 - Đợt 1',
      '2026-2027',
      '2026-08-01',
      '2026-09-30',
      targetIds,
      'Open',
      'Đợt tiếp nhận tập trung đầu năm học 2026 - 2027 tại Học viện Chính trị'
    ]);
    batchId = batchRes.lastInsertRowid;
    console.log('✅ Đã khởi tạo dữ liệu đợt tiếp nhận mẫu!');
  } else {
    batchId = existingBatches[0].id;
  }

  // Khởi tạo hồ sơ học viên mẫu chuẩn [Bàn Trung Nam] theo đúng phiếu tiếp nhận trên ảnh
  const checkExisted = await db.get('SELECT id FROM students WHERE student_code = ?', ['HVCT-2026-0027']);
  if (!checkExisted) {
    await db.run(`
      INSERT INTO students (
        student_code, full_name, birthday, birthplace, hometown,
        rank, position, unit, education_level, phone, email,
        class_name, batch_id, target_id, order_index, admission_date,
        status, declaration_date, declaration_place, id_card
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'HVCT-2026-0027',
      'Bàn Trung Nam',
      '1985-01-30',
      'Thái Nguyên',
      'Xã Kim Phượng, tỉnh Thái Nguyên',
      'Trung tá',
      'Chính trị viên',
      'Quân khu 1',
      'dai_hoc_ct_phan_doi; dai_hoc_ct_phan_doi',
      '0978819885',
      'bantrungnam.qk1@mod.gov.vn',
      'Lớp 23C',
      batchId,
      target1Id,
      27,
      '2026-08-03',
      'Approved',
      '2026-08-03',
      'Hà Nội',
      '019085001234'
    ]);
    console.log('✅ Đã tạo hồ sơ học viên mẫu chuẩn [Bàn Trung Nam] theo đúng phiếu tiếp nhận!');
  }

  console.log('🎉 Hoàn tất kiểm tra và khởi tạo cấu trúc CSDL Tiếp nhận học viên.');
}

if (require.main === module) {
  ensureAdmissionTables()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Lỗi khi khởi tạo bảng CSDL:', err);
      process.exit(1);
    });
}

module.exports = { ensureAdmissionTables };
