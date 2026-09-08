const http = require('http');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const AUTH_SECRET = 'army-tech-secret-key-2026';

const BASE_URL = 'http://localhost:3001';

// Tạo 1 sample buffer ảnh PNG 1x1 pixel base64
const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

let authToken = null;

function makeRequest(method, pathName, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathName, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {}
    };

    const currentToken = token || authToken;
    if (currentToken) {
      options.headers['Authorization'] = `Bearer ${currentToken}`;
    }

    let payload = null;
    if (body) {
      payload = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentType = res.headers['content-type'] || '';
        let data = buffer;
        if (contentType.includes('application/json')) {
          try {
            data = JSON.parse(buffer.toString('utf8'));
          } catch (e) {}
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data,
          buffer
        });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ HỆ THỐNG TIẾP NHẬN HỌC VIÊN');
  console.log('====================================================');

  // 1. Kiểm tra API Cổng tiếp nhận khởi tạo
  console.log('\n--- 1. Kiểm tra GET /api/reception/init-data ---');
  const initRes = await makeRequest('GET', '/api/reception/init-data');
  console.log('Status:', initRes.status);
  console.log('Số đợt tiếp nhận đang mở:', initRes.data.batches?.length);
  if (!initRes.data.batches?.length) {
    throw new Error('Chưa có đợt tiếp nhận nào!');
  }
  const batch = initRes.data.batches[0];
  const target = batch.targets[0] || initRes.data.allTargets[0];
  console.log(`Đợt: [${batch.name}] - Đối tượng: [${target.name}]`);

  // 2. Học viên nộp hồ sơ qua mobile
  console.log('\n--- 2. Kiểm tra POST /api/reception/submit ---');
  const submitPayload = {
    batchId: batch.id,
    targetId: target.id,
    orderIndex: 28,
    fullName: 'NGUYỄN VĂN AN',
    birthday: '1988-05-15',
    birthplace: 'Bắc Ninh',
    hometown: 'Xã Tam Sơn, thị xã Từ Sơn, tỉnh Bắc Ninh',
    rank: 'Thiếu tá',
    position: 'Phó Chính ủy Trung đoàn',
    unit: 'Quân đoàn 12',
    educationLevel: 'dai_hoc_ct_phan_doi; Thạc sĩ Xây dựng Đảng',
    phone: '0988123456',
    email: 'nguyenvanan.qd12@mod.gov.vn',
    idCard: '027088005678',
    className: target.default_class || 'Lớp 23C',
    declarationDate: '2026-08-04',
    declarationPlace: 'Hà Nội',
    documents: [
      {
        docType: 'Bản sao Quyết định cử đi học',
        fileName: 'Quyet_Dinh_Cu_Di_Hoc.png',
        contentBase64: samplePngBase64
      },
      {
        docType: 'Bằng tốt nghiệp Đại học / Cao đẳng',
        fileName: 'Bang_Tot_Nghiep_Dai_Hoc.png',
        contentBase64: samplePngBase64
      }
    ]
  };

  const submitRes = await makeRequest('POST', '/api/reception/submit', submitPayload);
  console.log('Status:', submitRes.status);
  console.log('Kết quả nộp hồ sơ:', submitRes.data);
  if (!submitRes.data.studentCode) {
    throw new Error('Nộp hồ sơ thất bại: ' + JSON.stringify(submitRes.data));
  }
  const newStudentId = submitRes.data.studentId;
  const newStudentCode = submitRes.data.studentCode;

  // 3. Tra cứu tiến độ hồ sơ qua mobile
  console.log('\n--- 3. Kiểm tra GET /api/reception/track ---');
  const trackRes = await makeRequest('GET', `/api/reception/track?keyword=${encodeURIComponent(newStudentCode)}`);
  console.log('Status:', trackRes.status);
  console.log(`Tra cứu thành công: [${trackRes.data.full_name}], Trạng thái: [${trackRes.data.status}], Số tệp đính kèm: [${trackRes.data.documents?.length}]`);
  if (trackRes.data.status !== 'PendingReview') {
    throw new Error('Trạng thái hồ sơ ban đầu không phải PendingReview!');
  }

  // 4. Cán bộ quản lý tra cứu danh sách trên PC
  console.log('\n--- 4. Cán bộ xác thực tài khoản quản trị ---');
  const crypto = require('crypto');
  const now = Math.floor(Date.now() / 1000);
  const secret = AUTH_SECRET;
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({
    sub: '1',
    username: 'quangnb',
    role: 'admin',
    iat: now,
    exp: now + 86400
  })).toString('base64url');
  const unsigned = `${h}.${p}`;
  const sig = crypto.createHmac('sha256', secret).update(unsigned).digest('base64url');
  authToken = `${unsigned}.${sig}`;
  console.log('Tạo token admin thành công:', authToken.slice(0, 25) + '...');

  console.log('\n--- Kiểm tra GET /api/students ---');
  const listRes = await makeRequest('GET', '/api/students');
  console.log('Status:', listRes.status);
  const foundInList = listRes.data.find(s => s.id === newStudentId);
  console.log(`Tìm thấy hồ sơ trong bảng quản trị: [${foundInList?.student_code}], Số ảnh văn bằng: [${foundInList?.document_count}]`);
  if (!foundInList) throw new Error('Không tìm thấy học viên trong danh sách quản trị!');

  // 5. Cán bộ thẩm định & Duyệt hồ sơ
  console.log('\n--- 5. Kiểm tra PUT /api/students/:id/review ---');
  const reviewPayload = {
    status: 'Approved',
    class_name: 'Lớp 23C',
    order_index: 28,
    review_notes: 'Đã kiểm tra hồ sơ và ảnh văn bằng đầy đủ hợp lệ. Phê duyệt tiếp nhận vào Lớp 23C.'
  };
  const reviewRes = await makeRequest('PUT', `/api/students/${newStudentId}/review`, reviewPayload);
  console.log('Status:', reviewRes.status);
  console.log(`Đã duyệt hồ sơ: Trạng thái mới = [${reviewRes.data.status}], Lớp = [${reviewRes.data.class_name}]`);

  // 6. Kiểm tra xuất file Word Phiếu tiếp nhận (.docx) chuẩn mẫu
  console.log('\n--- 6. Kiểm tra GET /api/students/:id/receipt-doc ---');
  const docxRes = await makeRequest('GET', `/api/students/${newStudentId}/receipt-doc`);
  console.log('Status:', docxRes.status);
  console.log('Content-Type:', docxRes.headers['content-type']);
  console.log('Content-Disposition:', docxRes.headers['content-disposition']);
  console.log('Docx Size (bytes):', docxRes.buffer.length);

  // Đọc và kiểm tra nội dung file docx bằng JSZip
  const docxZip = await JSZip.loadAsync(docxRes.buffer);
  const docXml = await docxZip.file('word/document.xml').async('string');
  console.log('Word Document XML contains student name:', docXml.includes('NGUYỄN VĂN AN'));
  console.log('Word Document XML contains title:', docXml.includes('PHIẾU ĐĂNG KÝ NHẬP HỌC'));

  if (!docXml.includes('NGUYỄN VĂN AN') || !docXml.includes('PHIẾU ĐĂNG KÝ NHẬP HỌC')) {
    throw new Error('Nội dung file Word không khớp với thông tin học viên!');
  }

  // 7. Kiểm tra Tải file hồ sơ trọn gói Bundle (.zip) gồm Phiếu tiếp nhận + Ảnh văn bằng
  console.log('\n--- 7. Kiểm tra GET /api/students/:id/download-bundle ---');
  const bundleRes = await makeRequest('GET', `/api/students/${newStudentId}/download-bundle`);
  console.log('Status:', bundleRes.status);
  console.log('Content-Type:', bundleRes.headers['content-type']);
  console.log('Content-Disposition:', bundleRes.headers['content-disposition']);
  console.log('Zip Bundle Size (bytes):', bundleRes.buffer.length);

  const bundleZip = await JSZip.loadAsync(bundleRes.buffer);
  const zipFiles = Object.keys(bundleZip.files);
  console.log('Danh sách các file trong file ZIP hồ sơ:', zipFiles);

  const hasWordDoc = zipFiles.some(f => f.startsWith('Phieu_Tiep_Nhan_') && f.endsWith('.docx'));
  const hasCertFolder = zipFiles.some(f => f.startsWith('VanBang_ChungChi/'));
  console.log('Có file Phiếu tiếp nhận Word:', hasWordDoc);
  console.log('Có thư mục Ảnh văn bằng chứng chỉ:', hasCertFolder);

  if (!hasWordDoc || !hasCertFolder) {
    throw new Error('File ZIP hồ sơ trọn gói không chứa đầy đủ phiếu tiếp nhận và ảnh văn bằng!');
  }

  // 8. Kiểm tra xem ảnh văn bằng trực tiếp qua API
  console.log('\n--- 8. Kiểm tra GET /api/student-documents/:id/file ---');
  const docId = trackRes.data.documents[0].id;
  const fileRes = await makeRequest('GET', `/api/student-documents/${docId}/file`);
  console.log('Status:', fileRes.status);
  console.log('Content-Type:', fileRes.headers['content-type']);
  console.log('File Size (bytes):', fileRes.buffer.length);
  if (fileRes.status !== 200) throw new Error('Không thể tải ảnh văn bằng!');

  console.log('\n====================================================');
  console.log('🎉 TẤT CẢ CÁC BÀI KIỂM THỬ ĐÃ VƯỢT QUA XUẤT SẮC (8/8)!');
  console.log('====================================================');
}

// Chạy test
runTests().then(() => process.exit(0)).catch(err => {
  console.error('❌ Lỗi kiểm thử:', err.message);
  process.exit(1);
});
