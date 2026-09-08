const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const JSZip = require('jszip');
const db = require('./db/sqlserver');
const { ensureAdmissionTables } = require('./db/ensure_admission_tables');

function loadLocalEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;

  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key]) return;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  });
}

loadLocalEnv();

const app = express();
const PORT = process.env.PORT || 3001;

function resolveRuntimePath(value, fallback) {
  const text = String(value || '').trim();
  return text ? path.resolve(text) : fallback;
}

const DATA_DIR = resolveRuntimePath(process.env.DATA_DIR, __dirname);
const UPLOAD_ROOT = resolveRuntimePath(process.env.UPLOAD_DIR, path.join(DATA_DIR, 'uploads'));
const EXAM_UPLOAD_ROOT = path.join(UPLOAD_ROOT, 'exams');
const STUDENT_UPLOAD_ROOT = path.join(UPLOAD_ROOT, 'students');

fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
fs.mkdirSync(EXAM_UPLOAD_ROOT, { recursive: true });
fs.mkdirSync(STUDENT_UPLOAD_ROOT, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '30mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const ROLES = ['examiner1', 'examiner2', 'supervisor'];
const USER_ROLES = ['admin', 'manager', 'viewer'];
const USER_MENU_PERMISSIONS = [
  { key: 'calendar', label: 'Lịch tuần' },
  { key: 'students', label: 'Tiếp nhận học viên' },
  { key: 'exam', label: 'Thi tốt nghiệp' },
  { key: 'tasks', label: 'Nhắc việc' },
  { key: 'admin', label: 'Quản trị' }
];
const ROLE_DEFAULT_PERMISSIONS = {
  admin: { calendar: true, students: true, exam: true, tasks: true, admin: true },
  manager: { calendar: true, students: true, exam: true, tasks: true, admin: false },
  viewer: { calendar: true, students: true, exam: true, tasks: true, admin: false }
};
const USER_PUBLIC_COLUMNS = 'id, username, full_name, rank, unit, role, email, phone, avatar_url, auth_provider, permissions, note, is_active, last_login_at, created_at, updated_at';
const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_CLIENT_ID = cleanEnv(process.env.GOOGLE_CLIENT_ID);
const GOOGLE_ALLOWED_EMAIL_DOMAIN = cleanEnv(process.env.GOOGLE_ALLOWED_EMAIL_DOMAIN).toLowerCase();
const GOOGLE_DEFAULT_ROLE = USER_ROLES.includes(cleanEnv(process.env.GOOGLE_DEFAULT_ROLE)) ? cleanEnv(process.env.GOOGLE_DEFAULT_ROLE) : 'viewer';
const AUTH_TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || 'exam-draw-dev-secret-change-me';
const AUTH_TOKEN_TTL_SECONDS = Number(process.env.AUTH_TOKEN_TTL_SECONDS || 86400);
const PLANS = ['Phương án 1', 'Phương án 2', 'Phương án 3', 'Phương án 4'];
const CALENDAR_STATUSES = ['Draft', 'Published', 'Archived'];
const STUDENT_STATUSES = ['Created', 'PendingReview', 'Approved', 'Rejected', 'Completed'];
const TASK_STATUSES = ['New', 'InProgress', 'Pending', 'Completed', 'Overdue', 'Cancelled'];
const NOTIFICATION_STATUSES = ['Pending', 'Queued', 'Sent', 'Failed', 'Read'];
const OPENAI_API_KEY = cleanEnv(process.env.OPENAI_API_KEY);
const OPENAI_MODEL = cleanEnv(process.env.OPENAI_MODEL) || 'gpt-4o-mini';
const AI_DOC_CONTEXT_MAX_CHARS = Number(process.env.AI_DOC_CONTEXT_MAX_CHARS || 18000);
const AI_DOC_CHUNK_MAX_CHARS = Number(process.env.AI_DOC_CHUNK_MAX_CHARS || 2200);
const AI_RESPONSE_MAX_TOKENS = Number(process.env.AI_RESPONSE_MAX_TOKENS || 700);
const AI_DOCS_DIR = path.join(__dirname, 'docs');
const EXAM_DOCUMENT_TYPES = ['plan', 'decision'];
const EXAM_DOCUMENT_TYPE_LABELS = {
  plan: 'Tài liệu',
  decision: 'Tài liệu'
};
const EXAM_DOCUMENT_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);
const EXAM_DOCUMENT_MAX_BYTES = Number(process.env.EXAM_DOCUMENT_MAX_BYTES || 20 * 1024 * 1024);

async function listByRole(role, examSessionId = null) {
  if (examSessionId) {
    return db.all(`
      SELECT * FROM teachers
      WHERE role = ? AND exam_session_id = ? AND is_active = 1
      ORDER BY id DESC
    `, [role, examSessionId]);
  }
  return db.all(`
    SELECT * FROM teachers
    WHERE role = ? AND exam_session_id IS NULL AND is_active = 1
    ORDER BY id DESC
  `, [role]);
}

function cleanText(value) {
  return String(value ?? '').trim();
}

function cleanEnv(value) {
  return String(value ?? '').trim();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, expectedHash] = String(storedHash || '').split(':');
  if (!salt || !expectedHash) return false;
  const actualHash = crypto.scryptSync(String(password), salt, 64);
  const expected = Buffer.from(expectedHash, 'hex');
  return expected.length === actualHash.length && crypto.timingSafeEqual(actualHash, expected);
}

async function auditLog(action, entityName, entityId, newValue = null, oldValue = null, req = null) {
  try {
    await db.run(`
      INSERT INTO audit_logs(username, action, entity_name, entity_id, old_value, new_value, ip, device)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req?.headers?.['x-user'] || 'system',
      action,
      entityName,
      entityId == null ? null : String(entityId),
      oldValue == null ? null : JSON.stringify(oldValue),
      newValue == null ? null : JSON.stringify(newValue),
      req?.ip || null,
      req?.headers?.['user-agent'] || null
    ]);
  } catch (error) {
    // Audit logging must not block the primary workflow.
  }
}

function parseLimit(value, fallback = 20, max = 100) {
  const limit = Number(value || fallback);
  if (!Number.isFinite(limit) || limit <= 0) return fallback;
  return Math.min(Math.floor(limit), max);
}

function ensureDate(value) {
  const text = cleanText(value);
  return text || new Date().toISOString().slice(0, 10);
}

function normalizeStatus(value, allowed, fallback) {
  const status = cleanText(value);
  return allowed.includes(status) ? status : fallback;
}

function normalizePriority(value) {
  return normalizeStatus(value, ['Low', 'Normal', 'High', 'Critical'], 'Normal');
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function defaultPermissionsForRole(role = 'viewer') {
  return { ...(ROLE_DEFAULT_PERMISSIONS[role] || ROLE_DEFAULT_PERMISSIONS.viewer) };
}

function normalizeMenuPermissions(value, role = 'viewer') {
  const normalized = defaultPermissionsForRole(role);
  let source = value;

  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch (error) {
      source = {};
    }
  }

  if (source && typeof source === 'object' && !Array.isArray(source)) {
    USER_MENU_PERMISSIONS.forEach(menu => {
      if (Object.prototype.hasOwnProperty.call(source, menu.key)) {
        normalized[menu.key] = Boolean(source[menu.key]);
      }
    });
  }

  return normalized;
}

function serializeUser(row) {
  if (!row) return null;
  return {
    ...row,
    permissions: normalizeMenuPermissions(row.permissions, row.role)
  };
}

async function getPublicUser(id, includeInactive = false) {
  const where = includeInactive ? 'id = ?' : 'id = ? AND is_active = 1';
  const row = await db.get(`SELECT ${USER_PUBLIC_COLUMNS} FROM users WHERE ${where}`, [id]);
  return serializeUser(row);
}

async function usernameExists(username, exceptId = null) {
  if (exceptId) {
    const row = await db.get('SELECT id FROM users WHERE username = ? AND id != ?', [username, exceptId]);
    return Boolean(row);
  }
  const row = await db.get('SELECT id FROM users WHERE username = ?', [username]);
  return Boolean(row);
}

function normalizeUserPayload(body) {
  const username = cleanText(body.username).toLowerCase();
  const fullName = cleanText(body.full_name ?? body.fullName);
  const rank = cleanText(body.rank);
  const unit = cleanText(body.unit);
  const role = cleanText(body.role || 'viewer');
  const email = cleanText(body.email);
  const phone = cleanText(body.phone);
  const note = cleanText(body.note);
  const hasPermissions = Object.prototype.hasOwnProperty.call(body, 'permissions');
  const permissions = hasPermissions ? normalizeMenuPermissions(body.permissions, role) : undefined;

  return { username, fullName, rank, unit, role, email, phone, note, permissions };
}

async function ensureDefaultAdminAccount() {
  const baseUsername = (cleanEnv(process.env.DEFAULT_ADMIN_USERNAME) || 'admin').toLowerCase();
  const configuredPassword = cleanEnv(process.env.DEFAULT_ADMIN_PASSWORD);
  const password = configuredPassword.length >= 6 ? configuredPassword : 'admin123';

  // 1. Luôn đảm bảo tài khoản admin chuẩn tồn tại và hoạt động
  const existingAdmin = await db.get("SELECT id, permissions, is_active FROM users WHERE username = ?", [baseUsername]);
  if (!existingAdmin) {
    await db.run(`
      INSERT INTO users(username, password_hash, full_name, role, permissions, note, is_active)
      VALUES (?, ?, ?, 'admin', ?, ?, 1)
    `, [
      baseUsername,
      hashPassword(password),
      'Quản trị hệ thống',
      JSON.stringify(defaultPermissionsForRole('admin')),
      'Tài khoản quản trị mặc định của hệ thống.'
    ]);
    console.log(`✅ Đã khởi tạo tài khoản quản trị mặc định: [${baseUsername}]`);
  } else if (Number(existingAdmin.is_active) !== 1) {
    await db.run("UPDATE users SET is_active = 1 WHERE id = ?", [existingAdmin.id]);
  }

  // 2. Cập nhật quyền 'students' cho các tài khoản hiện có trong CSDL nếu chưa có
  const allUsers = await db.all("SELECT id, username, role, permissions FROM users WHERE is_active = 1");
  for (const u of allUsers) {
    let perms = {};
    try {
      perms = typeof u.permissions === 'string' ? JSON.parse(u.permissions || '{}') : (u.permissions || {});
    } catch (e) {
      perms = {};
    }
    if (perms.students !== true) {
      perms.students = true;
      await db.run("UPDATE users SET permissions = ? WHERE id = ?", [JSON.stringify(perms), u.id]);
      console.log(`🔑 Đã cấp quyền Tiếp nhận học viên cho tài khoản [${u.username}]`);
    }
  }
}

function validateUserPayload(payload, options = {}) {
  if (options.requireUsername && !payload.username) {
    return 'Username khong duoc de trong.';
  }
  if (payload.username && !/^[a-z0-9._-]{3,50}$/.test(payload.username)) {
    return 'Username chi gom chu thuong, so, dau cham, gach duoi hoac gach ngang va dai 3-50 ky tu.';
  }
  if (options.requireFullName && !payload.fullName) {
    return 'Ho ten khong duoc de trong.';
  }
  if (payload.role && !USER_ROLES.includes(payload.role)) {
    return 'Vai tro user khong hop le.';
  }
  return null;
}

function validatePassword(password) {
  if (!password || String(password).length < 6) {
    return 'Mat khau phai co it nhat 6 ky tu.';
  }
  return null;
}

let googleCertCache = { keys: [], expiresAt: 0 };

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function sendError(res, error) {
  const status = error.status || 500;
  const message = status >= 500 && !error.status ? 'Co loi xay ra.' : error.message;
  res.status(status).json({ message });
}

function normalizeNonNegativeInteger(value, fallback = 0) {
  const number = Number(value ?? fallback);
  if (!Number.isFinite(number) || number < 0) return fallback;
  return Math.floor(number);
}

function normalizeExamSubjects(subjects, { requireAny = true } = {}) {
  const rows = Array.isArray(subjects) ? subjects : [];
  const normalized = rows.map(item => ({
    id: Number(item.id) > 0 ? Number(item.id) : null,
    examDate: cleanText(item.exam_date ?? item.examDate ?? item.date),
    subjectName: cleanText(item.subject_name ?? item.subjectName ?? item.name),
    note: cleanText(item.note)
  })).filter(item => item.examDate || item.subjectName || item.note);

  normalized.forEach(item => {
    if (!item.examDate || !item.subjectName) {
      throw httpError(400, 'Mỗi ngày thi - môn thi phải có ngày thi và tên môn thi.');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.examDate)) {
      throw httpError(400, 'Ngày thi không hợp lệ.');
    }
  });
  if (requireAny && !normalized.length) {
    throw httpError(400, 'Kỳ thi phải có ít nhất một ngày thi - môn thi.');
  }
  return normalized;
}

function normalizeExamSessionPayload(body, current = {}, options = {}) {
  const targetName = cleanText(body.target_name ?? body.targetName ?? current.target_name);
  if (!targetName) throw httpError(400, 'Tên đối tượng không hợp lệ.');
  return {
    targetName,
    studentCount: normalizeNonNegativeInteger(body.student_count ?? body.studentCount ?? current.student_count, current.student_count || 0),
    note: cleanText(body.note ?? current.note),
    subjects: normalizeExamSubjects(body.subjects ?? body.examSubjects ?? [], options)
  };
}

async function drawSummaryForSubject(subjectId) {
  const row = await db.get(`
    SELECT COUNT(*) AS draw_count, MAX(created_at) AS latest_draw_at
    FROM draw_sessions
    WHERE exam_subject_id = ?
  `, [subjectId]);
  return {
    draw_count: row?.draw_count || 0,
    latest_draw_at: row?.latest_draw_at || null
  };
}

async function listExamSubjects(examSessionId, includeInactive = false) {
  const where = includeInactive ? 'exam_session_id = ?' : 'exam_session_id = ? AND is_active = 1';
  const rows = await db.all(`
    SELECT * FROM exam_subjects
    WHERE ${where}
    ORDER BY exam_date ASC, id ASC
  `, [examSessionId]);

  return Promise.all(rows.map(async row => ({
    ...row,
    ...(await drawSummaryForSubject(row.id))
  })));
}

async function listExamDocuments(examSessionId, includeInactive = false) {
  const where = includeInactive ? 'exam_session_id = ?' : 'exam_session_id = ? AND is_active = 1';
  const rows = await db.all(`
    SELECT * FROM exam_documents
    WHERE ${where}
    ORDER BY id DESC
  `, [examSessionId]);

  return rows.map(row => ({
    ...row,
    document_type_label: EXAM_DOCUMENT_TYPE_LABELS[row.document_type] || row.document_type
  }));
}

async function serializeExamSession(row, includeInactiveChildren = false) {
  if (!row) return null;
  const [ex1, ex2, sup, rooms, subjects, documents] = await Promise.all([
    listByRole('examiner1', row.id),
    listByRole('examiner2', row.id),
    listByRole('supervisor', row.id),
    listRooms(row.id),
    listExamSubjects(row.id, includeInactiveChildren),
    listExamDocuments(row.id, includeInactiveChildren)
  ]);

  const teachers = {
    examiner1: ex1.length,
    examiner2: ex2.length,
    supervisor: sup.length
  };

  return {
    ...row,
    student_count: Number(row.student_count) || 0,
    subjects,
    documents,
    summary: {
      subjects: subjects.length,
      documents: documents.length,
      rooms: rooms.length,
      teachers
    }
  };
}

async function getExamSession(id, includeInactive = false) {
  const where = includeInactive ? 'id = ?' : 'id = ? AND is_active = 1';
  const row = await db.get(`SELECT * FROM exam_sessions WHERE ${where}`, [id]);
  return serializeExamSession(row, includeInactive);
}

async function normalizeExamSessionId(value, { required = false } = {}) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    if (required) throw httpError(400, 'Vui lòng chọn kỳ thi.');
    return null;
  }
  const exam = await getExamSession(id);
  if (!exam) throw httpError(404, 'Không tìm thấy kỳ thi.');
  return exam.id;
}

async function listExamSessions(includeInactive = false) {
  const where = includeInactive ? '' : 'WHERE is_active = 1';
  const rows = await db.all(`
    SELECT * FROM exam_sessions
    ${where}
    ORDER BY id DESC
  `);
  return Promise.all(rows.map(row => serializeExamSession(row, includeInactive)));
}

async function getExamSubjectContext(subjectId) {
  const row = await db.get(`
    SELECT
      s.id AS subject_id,
      s.exam_session_id,
      s.exam_date,
      s.subject_name,
      s.note AS subject_note,
      e.target_name,
      e.student_count,
      e.note AS exam_note
    FROM exam_subjects s
    JOIN exam_sessions e ON e.id = s.exam_session_id
    WHERE s.id = ? AND s.is_active = 1 AND e.is_active = 1
  `, [subjectId]);
  if (!row) throw httpError(404, 'Không tìm thấy ngày thi - môn thi.');
  return row;
}

async function syncExamSubjects(examSessionId, subjects, tx = null) {
  const runner = tx || db;
  const existing = await runner.all('SELECT * FROM exam_subjects WHERE exam_session_id = ?', [examSessionId]);
  const existingIds = new Set(existing.map(row => row.id));
  const incomingIds = new Set(subjects.filter(item => item.id && existingIds.has(item.id)).map(item => item.id));

  for (const row of existing) {
    if (!incomingIds.has(row.id)) {
      await runner.run('UPDATE exam_subjects SET is_active = 0, updated_at = CONVERT(VARCHAR(19), GETDATE(), 120) WHERE id = ?', [row.id]);
    }
  }

  for (const item of subjects) {
    if (item.id && existingIds.has(item.id)) {
      await runner.run(`
        UPDATE exam_subjects
        SET exam_date = ?, subject_name = ?, note = ?, is_active = 1, updated_at = CONVERT(VARCHAR(19), GETDATE(), 120)
        WHERE id = ? AND exam_session_id = ?
      `, [item.examDate, item.subjectName, item.note, item.id, examSessionId]);
    } else {
      await runner.run(`
        INSERT INTO exam_subjects(exam_session_id, exam_date, subject_name, note)
        VALUES (?, ?, ?, ?)
      `, [examSessionId, item.examDate, item.subjectName, item.note]);
    }
  }
}

function ensureExamFolder(examSessionId) {
  const folder = path.join(EXAM_UPLOAD_ROOT, `exam-${examSessionId}`);
  fs.mkdirSync(folder, { recursive: true });
  return folder;
}

function getDocumentFullPath(relativePath) {
  const root = path.resolve(EXAM_UPLOAD_ROOT);
  const fullPath = path.resolve(EXAM_UPLOAD_ROOT, relativePath);
  if (fullPath !== root && !fullPath.startsWith(`${root}${path.sep}`)) {
    throw httpError(400, 'Đường dẫn tài liệu không hợp lệ.');
  }
  return fullPath;
}

function normalizeExamDocumentPayload(body) {
  const documentType = cleanText(body.document_type ?? body.documentType) || 'plan';
  if (!EXAM_DOCUMENT_TYPES.includes(documentType)) {
    throw httpError(400, 'Loại tài liệu không hợp lệ.');
  }

  const originalName = path.basename(cleanText(body.file_name ?? body.fileName ?? body.name));
  const ext = path.extname(originalName).toLowerCase();
  if (!originalName || !EXAM_DOCUMENT_EXTENSIONS.has(ext)) {
    throw httpError(400, 'Chỉ cho phép tải file PDF, DOC hoặc DOCX.');
  }

  const rawBase64 = cleanText(body.content_base64 ?? body.contentBase64 ?? body.data);
  const contentBase64 = rawBase64.replace(/^data:[^;]+;base64,/i, '');
  if (!contentBase64) throw httpError(400, 'Thiếu nội dung file.');

  const buffer = Buffer.from(contentBase64, 'base64');
  if (!buffer.length) throw httpError(400, 'File tải lên rỗng.');
  if (buffer.length > EXAM_DOCUMENT_MAX_BYTES) {
    throw httpError(400, 'File tải lên vượt quá dung lượng cho phép.');
  }

  return {
    documentType,
    originalName,
    storedName: `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`,
    fileType: cleanText(body.file_type ?? body.fileType) || ext.slice(1),
    buffer
  };
}

function decodeBase64Url(value) {
  try {
    return Buffer.from(String(value), 'base64url');
  } catch (error) {
    throw httpError(401, 'Google idToken khong hop le.');
  }
}

function parseJwt(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw httpError(401, 'Google idToken khong hop le.');

  try {
    const header = JSON.parse(decodeBase64Url(parts[0]).toString('utf8'));
    const payload = JSON.parse(decodeBase64Url(parts[1]).toString('utf8'));
    return {
      header,
      payload,
      signedContent: `${parts[0]}.${parts[1]}`,
      signature: decodeBase64Url(parts[2])
    };
  } catch (error) {
    if (error.status) throw error;
    throw httpError(401, 'Google idToken khong hop le.');
  }
}

function httpsGetJson(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { timeout: 8000 }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => {
        body += chunk;
      });
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(httpError(502, 'Khong lay duoc khoa xac thuc Google.'));
          return;
        }

        try {
          resolve({ data: JSON.parse(body), headers: response.headers });
        } catch (error) {
          reject(httpError(502, 'Du lieu khoa xac thuc Google khong hop le.'));
        }
      });
    });

    request.on('timeout', () => {
      request.destroy(httpError(504, 'Ket noi Google qua thoi gian.'));
    });
    request.on('error', reject);
  });
}

async function getGoogleKeys() {
  const now = Date.now();
  if (googleCertCache.keys.length && googleCertCache.expiresAt > now) {
    return googleCertCache.keys;
  }

  const { data, headers } = await httpsGetJson(GOOGLE_CERTS_URL);
  const cacheControl = String(headers['cache-control'] || '');
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/)?.[1] || 3600);
  googleCertCache = {
    keys: Array.isArray(data.keys) ? data.keys : [],
    expiresAt: now + maxAge * 1000
  };
  return googleCertCache.keys;
}

function certToPem(cert) {
  const lines = String(cert).match(/.{1,64}/g) || [];
  return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----\n`;
}

async function verifyGoogleIdToken(idToken) {
  if (!GOOGLE_CLIENT_ID) {
    throw httpError(500, 'Chua cau hinh GOOGLE_CLIENT_ID tren server.');
  }

  const parsed = parseJwt(idToken);
  if (parsed.header.alg !== 'RS256') throw httpError(401, 'Google idToken khong dung thuat toan ky.');

  const keys = await getGoogleKeys();
  const key = keys.find(item => item.kid === parsed.header.kid);
  if (!key?.x5c?.[0]) throw httpError(401, 'Khong tim thay khoa xac thuc Google phu hop.');

  const isValidSignature = crypto.verify(
    'RSA-SHA256',
    Buffer.from(parsed.signedContent),
    certToPem(key.x5c[0]),
    parsed.signature
  );
  if (!isValidSignature) throw httpError(401, 'Chu ky Google idToken khong hop le.');

  const now = Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(parsed.payload.aud) ? parsed.payload.aud : [parsed.payload.aud];
  if (!audiences.includes(GOOGLE_CLIENT_ID)) throw httpError(401, 'Google idToken khong dung client id.');
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(parsed.payload.iss)) {
    throw httpError(401, 'Google idToken khong dung issuer.');
  }
  if (Number(parsed.payload.exp) <= now) throw httpError(401, 'Google idToken da het han.');
  if (parsed.payload.email_verified !== true && parsed.payload.email_verified !== 'true') {
    throw httpError(403, 'Email Google chua duoc xac minh.');
  }

  const email = cleanText(parsed.payload.email).toLowerCase();
  const allowedDomain = GOOGLE_ALLOWED_EMAIL_DOMAIN.replace(/^@/, '');
  if (allowedDomain && !email.endsWith(`@${allowedDomain}`)) {
    throw httpError(403, `Chi chap nhan email thuoc domain ${allowedDomain}.`);
  }

  const sub = cleanText(parsed.payload.sub);
  if (!sub || !email) throw httpError(401, 'Google idToken thieu thong tin tai khoan.');

  return {
    sub,
    email,
    name: cleanText(parsed.payload.name) || email.split('@')[0],
    picture: cleanText(parsed.payload.picture)
  };
}

function signAuthToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = Number.isFinite(AUTH_TOKEN_TTL_SECONDS) && AUTH_TOKEN_TTL_SECONDS > 0 ? AUTH_TOKEN_TTL_SECONDS : 86400;
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: String(user.id),
    username: user.username,
    role: user.role,
    provider: user.auth_provider,
    iat: now,
    exp: now + expiresIn
  })).toString('base64url');
  const unsignedToken = `${header}.${payload}`;
  const signature = crypto.createHmac('sha256', AUTH_TOKEN_SECRET).update(unsignedToken).digest('base64url');

  return {
    accessToken: `${unsignedToken}.${signature}`,
    tokenType: 'Bearer',
    expiresIn,
    expiresAt: new Date((now + expiresIn) * 1000).toISOString()
  };
}

function verifyInternalAuthToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw httpError(401, 'Token khong hop le.');

  const unsignedToken = `${parts[0]}.${parts[1]}`;
  const expectedSignature = crypto.createHmac('sha256', AUTH_TOKEN_SECRET).update(unsignedToken).digest('base64url');
  const actual = Buffer.from(parts[2]);
  const expected = Buffer.from(expectedSignature);
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    throw httpError(401, 'Token khong hop le.');
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch (error) {
    throw httpError(401, 'Token khong hop le.');
  }

  const now = Math.floor(Date.now() / 1000);
  if (Number(payload.exp) <= now) throw httpError(401, 'Token da het han.');
  return payload;
}

function getBearerPayload(req) {
  const header = String(req.headers.authorization || '');
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) throw httpError(401, 'Thieu Bearer token.');
  return verifyInternalAuthToken(match[1]);
}

function buildAuthResponse(user, extra = {}) {
  return {
    user,
    ...signAuthToken(user),
    ...extra
  };
}

function hasMenuPermission(user, permissionKey) {
  if (!permissionKey) return true;
  const permissions = normalizeMenuPermissions(user?.permissions, user?.role);
  return Boolean(permissions[permissionKey]);
}

async function getAuthenticatedUser(req) {
  const payload = getBearerPayload(req);
  const record = await getUserRecordById(payload.sub);
  ensureActiveUser(record);
  return getPublicUser(record.id, true);
}

function permissionForApi(req) {
  const pathName = String(req.path || '');
  if (pathName.startsWith('/calendar')) return 'calendar';
  if (pathName.startsWith('/students') || pathName.startsWith('/admission-batches') || pathName.startsWith('/admission-targets')) return 'students';
  if (pathName.startsWith('/tasks')) return 'tasks';
  if (pathName.startsWith('/users') || pathName.startsWith('/audit-logs') || pathName.startsWith('/docs')) return 'admin';
  if (
    pathName.startsWith('/exams') ||
    pathName.startsWith('/exam-sessions') ||
    pathName.startsWith('/bootstrap') ||
    pathName.startsWith('/teachers') ||
    pathName.startsWith('/rooms') ||
    pathName.startsWith('/draw') ||
    pathName.startsWith('/history')
  ) {
    return 'exam';
  }
  return null;
}

async function requireApiAccess(req, res, next) {
  try {
    const pathName = String(req.path || '');
    if (
      pathName.startsWith('/auth') ||
      pathName.startsWith('/reception') ||
      pathName.startsWith('/student-documents') ||
      (req.method === 'GET' && (
        pathName.startsWith('/admission-batches') ||
        pathName.startsWith('/admission-targets') ||
        pathName.includes('/receipt-doc') ||
        pathName.includes('/download-bundle') ||
        pathName.includes('/export-excel')
      ))
    ) {
      return next();
    }
    const user = await getAuthenticatedUser(req);
    const permissionKey = permissionForApi(req);
    if (!hasMenuPermission(user, permissionKey)) {
      throw httpError(403, 'Khong co quyen truy cap chuc nang nay.');
    }
    req.user = user;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

async function getUserRecordById(id) {
  return db.get('SELECT * FROM users WHERE id = ?', [id]);
}

async function getUserRecordByGoogleSub(googleSub) {
  return db.get('SELECT * FROM users WHERE google_sub = ?', [googleSub]);
}

async function getUserRecordByEmail(email) {
  return db.get('SELECT TOP 1 * FROM users WHERE lower(email) = ? ORDER BY id ASC', [String(email).toLowerCase()]);
}

function ensureActiveUser(user) {
  if (!user) throw httpError(404, 'Khong tim thay user.');
  if (Number(user.is_active) !== 1) throw httpError(403, 'Tai khoan da bi khoa.');
}

async function usernameFromEmail(email) {
  const localPart = String(email).split('@')[0].toLowerCase();
  const base = localPart.replace(/[^a-z0-9._-]/g, '').replace(/^[._-]+|[._-]+$/g, '') || 'user';
  let username = base.slice(0, 50);
  let counter = 1;

  while (await usernameExists(username)) {
    const suffix = `-${counter}`;
    username = `${base.slice(0, 50 - suffix.length)}${suffix}`;
    counter++;
  }

  return username;
}

async function touchGoogleUser(user, profile) {
  await db.run(`
    UPDATE users
    SET google_sub = COALESCE(google_sub, ?),
        email = ?,
        avatar_url = ?,
        auth_provider = 'google',
        last_login_at = CONVERT(VARCHAR(19), GETDATE(), 120),
        updated_at = CONVERT(VARCHAR(19), GETDATE(), 120)
    WHERE id = ?
  `, [profile.sub, profile.email, profile.picture, user.id]);
  return getPublicUser(user.id, true);
}

async function registerGoogleUser(profile) {
  let user = await getUserRecordByGoogleSub(profile.sub);
  if (!user) user = await getUserRecordByEmail(profile.email);

  if (user) {
    if (user.google_sub && user.google_sub !== profile.sub) {
      throw httpError(409, 'Email nay da lien ket voi tai khoan Google khac.');
    }
    ensureActiveUser(user);
    const touched = await touchGoogleUser(user, profile);
    return { user: touched, isNewUser: false };
  }

  const generatedUsername = await usernameFromEmail(profile.email);
  const info = await db.run(`
    INSERT INTO users(username, password_hash, google_sub, full_name, role, email, avatar_url, auth_provider, last_login_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'google', CONVERT(VARCHAR(19), GETDATE(), 120))
  `, [
    generatedUsername,
    hashPassword(crypto.randomBytes(32).toString('hex')),
    profile.sub,
    profile.name,
    GOOGLE_DEFAULT_ROLE,
    profile.email,
    profile.picture
  ]);

  const created = await getPublicUser(info.lastInsertRowid, true);
  return { user: created, isNewUser: true };
}

async function loginGoogleUser(profile) {
  let user = await getUserRecordByGoogleSub(profile.sub);
  if (!user) {
    user = await getUserRecordByEmail(profile.email);
    if (!user) throw httpError(404, 'Tai khoan Google chua duoc dang ky.');
    if (user.google_sub && user.google_sub !== profile.sub) {
      throw httpError(409, 'Email nay da lien ket voi tai khoan Google khac.');
    }
  }

  ensureActiveUser(user);
  const touched = await touchGoogleUser(user, profile);
  return { user: touched, isNewUser: false };
}

async function handleGoogleAuth(req, res, mode) {
  try {
    const body = req.body || {};
    const idToken = body.idToken || body.credential;
    if (!idToken) throw httpError(400, 'Thieu Google idToken.');

    const profile = await verifyGoogleIdToken(idToken);
    const result = mode === 'login' ? await loginGoogleUser(profile) : await registerGoogleUser(profile);
    res.status(result.isNewUser ? 201 : 200).json(buildAuthResponse(result.user, {
      authProvider: 'google',
      isNewUser: result.isNewUser
    }));
  } catch (error) {
    sendError(res, error);
  }
}

function readApiDocs() {
  const docsPath = path.join(__dirname, 'public', 'mock-api.json');
  return JSON.parse(fs.readFileSync(docsPath, 'utf8'));
}

function htmlEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function renderJsonBlock(value) {
  if (value === undefined) return '';
  return `<pre><code>${htmlEscape(JSON.stringify(value, null, 2))}</code></pre>`;
}

function renderApiDocsHtml(docs) {
  const endpoints = Object.entries(docs.endpoints || {});
  const endpointHtml = endpoints.map(([name, item]) => `
    <section class="endpoint">
      <div class="endpoint-head">
        <span class="method">${htmlEscape(name.split(' ')[0])}</span>
        <h2>${htmlEscape(name)}</h2>
      </div>
      <p>${htmlEscape(item.description || '')}</p>
      <h3>Request</h3>
      ${renderJsonBlock(item.request)}
      <h3>Response</h3>
      ${renderJsonBlock(item.response)}
      ${item.errors ? `<h3>Errors</h3>${renderJsonBlock(item.errors)}` : ''}
    </section>
  `).join('');

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>API Docs</title>
  <style>
    :root { color-scheme: light; font-family: Arial, sans-serif; color: #172033; background: #f5f7fb; }
    body { margin: 0; }
    header { background: #172033; color: #fff; padding: 28px max(20px, calc((100vw - 1120px) / 2)); }
    main { max-width: 1120px; margin: 0 auto; padding: 24px 20px 48px; }
    h1 { margin: 0 0 8px; font-size: 28px; }
    h2 { margin: 0; font-size: 18px; }
    h3 { margin: 18px 0 8px; font-size: 14px; color: #4a5568; text-transform: uppercase; letter-spacing: .04em; }
    p { color: #4a5568; line-height: 1.55; }
    a { color: #2563eb; }
    .meta { margin: 0; color: #d8deea; }
    .toolbar { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 18px; }
    .toolbar a { color: #fff; border: 1px solid rgba(255,255,255,.35); border-radius: 6px; padding: 8px 10px; text-decoration: none; }
    .endpoint { background: #fff; border: 1px solid #dbe2ee; border-radius: 8px; padding: 18px; margin-bottom: 16px; }
    .endpoint-head { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .method { background: #e8f0ff; color: #1d4ed8; border-radius: 999px; font-size: 12px; font-weight: 700; padding: 5px 8px; }
    pre { overflow: auto; background: #0f172a; color: #dbeafe; border-radius: 8px; padding: 14px; line-height: 1.45; }
    code { font-family: Consolas, Monaco, monospace; font-size: 13px; }
    .env { background: #eef6ff; border: 1px solid #bfd7ff; border-radius: 8px; padding: 14px 18px; margin-bottom: 18px; }
  </style>
</head>
<body>
  <header>
    <h1>${htmlEscape(docs.meta?.name || 'API Docs')}</h1>
    <p class="meta">${htmlEscape(docs.meta?.description || '')}</p>
    <div class="toolbar">
      <a href="/api/docs.json">Open JSON docs</a>
      <a href="/mock-api.json">Open mock file</a>
    </div>
  </header>
  <main>
    ${docs.meta?.googleAuthEnv ? `<section class="env"><h2>Google Auth Env</h2>${renderJsonBlock(docs.meta.googleAuthEnv)}</section>` : ''}
    ${endpointHtml}
  </main>
</body>
</html>`;
}

function roomNumber(name) {
  const text = String(name || '');
  const match = text.match(/(?:phòng\s*thi\s*số|phòng\s*số|phòng|pt)\s*0*(\d+)/i) || text.match(/0*(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function sortRooms(rooms) {
  return [...rooms].sort((a, b) => {
    const na = roomNumber(a.name);
    const nb = roomNumber(b.name);
    if (na !== nb) return na - nb;
    return String(a.name).localeCompare(String(b.name), 'vi', { numeric: true, sensitivity: 'base' });
  });
}

async function listRooms(examSessionId = null) {
  if (examSessionId) {
    const rows = await db.all(`
      SELECT * FROM exam_rooms
      WHERE exam_session_id = ? AND is_active = 1
      ORDER BY id ASC
    `, [examSessionId]);
    return sortRooms(rows);
  }
  const rows = await db.all(`
    SELECT * FROM exam_rooms
    WHERE exam_session_id IS NULL AND is_active = 1
    ORDER BY id ASC
  `);
  return sortRooms(rows);
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function hashResult(planName, rows) {
  return JSON.stringify({
    planName,
    rows: rows.map(x => ({
      roomId: x.roomId,
      examiner1Id: x.examiner1Id,
      examiner2Id: x.examiner2Id,
      supervisorId: x.supervisorId
    }))
  });
}

function reserveRows(role, staff) {
  return staff.map(person => ({
    role,
    staffId: person.id,
    staffName: person.name
  }));
}

function addRecentRoom(map, staffId, roomId) {
  if (!map.has(staffId)) map.set(staffId, new Set());
  map.get(staffId).add(roomId);
}

async function getRecentDrawConstraints(limit = 2, examSubjectId = null, examSessionId = null) {
  const sessions = examSessionId
    ? await db.all('SELECT TOP (?) id, plan_name FROM draw_sessions WHERE exam_session_id = ? ORDER BY id DESC', [limit, examSessionId])
    : (examSubjectId
      ? await db.all('SELECT TOP (?) id, plan_name FROM draw_sessions WHERE exam_subject_id = ? ORDER BY id DESC', [limit, examSubjectId])
      : await db.all('SELECT TOP (?) id, plan_name FROM draw_sessions WHERE exam_subject_id IS NULL ORDER BY id DESC', [limit]));

  const recentRooms = {
    examiner1: new Map(),
    examiner2: new Map(),
    supervisor: new Map()
  };

  for (const session of sessions) {
    const rows = await db.all('SELECT room_id, examiner1_id, examiner2_id, supervisor_id FROM draw_results WHERE session_id = ?', [session.id]);
    rows.forEach(row => {
      addRecentRoom(recentRooms.examiner1, row.examiner1_id, row.room_id);
      addRecentRoom(recentRooms.examiner2, row.examiner2_id, row.room_id);
      addRecentRoom(recentRooms.supervisor, row.supervisor_id, row.room_id);
    });
  }

  return {
    recentPlanNames: new Set(sessions.map(session => session.plan_name)),
    recentRooms
  };
}

function pickPlanName(recentPlanNames = new Set()) {
  const availablePlans = PLANS.filter(plan => !recentPlanNames.has(plan));
  if (!availablePlans.length) {
    throw httpError(409, 'Không còn phương án đánh số báo danh khác 2 lần bốc thăm trước.');
  }
  return availablePlans[Math.floor(Math.random() * availablePlans.length)];
}

function groupRoomsForSupervisors(rooms) {
  const groups = [];
  for (let i = 0; i < rooms.length; i++) {
    const current = rooms[i];
    const next = rooms[i + 1];
    if (
      next &&
      Number(current.allow_supervisor_pair) === 1 &&
      Number(next.allow_supervisor_pair) === 1
    ) {
      groups.push([current, next]);
      i++;
    } else {
      groups.push([current]);
    }
  }
  return groups;
}

function assignStaffToGroups(groups, staff, blockedRoomsByStaff = new Map(), errorMessage = 'Không tạo được phân công khác 2 lần bốc thăm trước.') {
  const shuffledStaff = shuffle(staff);
  const candidatesByGroup = groups.map(group => ({
    group,
    candidates: shuffle(shuffledStaff).filter(person => {
      const blockedRooms = blockedRoomsByStaff.get(person.id);
      return !blockedRooms || group.every(room => !blockedRooms.has(room.id));
    })
  }));
  const assigned = new Map();
  const used = new Set();

  function search(remainingIndexes) {
    if (!remainingIndexes.length) return true;

    let nextPosition = 0;
    let bestCount = Number.MAX_SAFE_INTEGER;
    remainingIndexes.forEach((candidateIndex, position) => {
      const count = candidatesByGroup[candidateIndex].candidates.filter(person => !used.has(person.id)).length;
      if (count < bestCount) {
        bestCount = count;
        nextPosition = position;
      }
    });

    if (bestCount === 0) return false;

    const [groupIndex] = remainingIndexes.splice(nextPosition, 1);
    const entry = candidatesByGroup[groupIndex];
    for (const person of entry.candidates) {
      if (used.has(person.id)) continue;
      used.add(person.id);
      entry.group.forEach(room => assigned.set(room.id, person));
      if (search(remainingIndexes)) return true;
      entry.group.forEach(room => assigned.delete(room.id));
      used.delete(person.id);
    }
    remainingIndexes.splice(nextPosition, 0, groupIndex);
    return false;
  }

  const indexes = groups.map((_, index) => index);
  if (!search(indexes)) throw httpError(409, errorMessage);

  return {
    assigned,
    reserves: shuffledStaff.filter(person => !used.has(person.id))
  };
}

function assignSupervisorsV2(rooms, supervisors, blockedRoomsByStaff = new Map()) {
  const groups = groupRoomsForSupervisors(rooms);
  if (supervisors.length < groups.length) {
    throw httpError(400, 'Số cán bộ giám sát thi không đủ. Chỉ các cặp phòng thi liền kề cùng tích Ghép GS mới được dùng chung 1 giám sát.');
  }

  return assignStaffToGroups(
    groups,
    supervisors,
    blockedRoomsByStaff,
    'Không tạo được phân công cán bộ giám sát khác phòng trong 2 lần bốc thăm trước.'
  );
}

async function buildDrawV2(constraints, examSessionId = null) {
  const [rooms, examiner1, examiner2, supervisors] = await Promise.all([
    listRooms(examSessionId),
    listByRole('examiner1', examSessionId),
    listByRole('examiner2', examSessionId),
    listByRole('supervisor', examSessionId)
  ]);

  if (!rooms.length) throw httpError(400, 'Chưa có danh sách phòng thi.');
  if (examiner1.length < rooms.length) throw httpError(400, 'Số cán bộ coi thi 1 ít hơn số phòng thi.');
  if (examiner2.length < rooms.length) throw httpError(400, 'Số cán bộ coi thi 2 ít hơn số phòng thi.');
  if (!supervisors.length) throw httpError(400, 'Chưa có danh sách cán bộ giám sát thi.');

  const sRooms = sortRooms(rooms);
  const examiner1Assignment = assignStaffToGroups(
    sRooms.map(room => [room]),
    examiner1,
    constraints.recentRooms.examiner1,
    'Không tạo được phân công cán bộ coi thi số 1 khác phòng trong 2 lần bốc thăm trước.'
  );
  const examiner2Assignment = assignStaffToGroups(
    sRooms.map(room => [room]),
    examiner2,
    constraints.recentRooms.examiner2,
    'Không tạo được phân công cán bộ coi thi số 2 khác phòng trong 2 lần bốc thăm trước.'
  );
  const supervisorAssignment = assignSupervisorsV2(sRooms, supervisors, constraints.recentRooms.supervisor);
  const planName = pickPlanName(constraints.recentPlanNames);

  const rows = sRooms.map(room => {
    const assignedExaminer1 = examiner1Assignment.assigned.get(room.id);
    const assignedExaminer2 = examiner2Assignment.assigned.get(room.id);
    const supervisor = supervisorAssignment.assigned.get(room.id);
    return {
      roomId: room.id,
      roomName: room.name,
      examiner1Id: assignedExaminer1.id,
      examiner1Name: assignedExaminer1.name,
      examiner2Id: assignedExaminer2.id,
      examiner2Name: assignedExaminer2.name,
      supervisorId: supervisor.id,
      supervisorName: supervisor.name
    };
  });

  const reserves = [
    ...reserveRows('examiner1', examiner1Assignment.reserves),
    ...reserveRows('examiner2', examiner2Assignment.reserves),
    ...reserveRows('supervisor', supervisorAssignment.reserves)
  ];

  return { planName, rows, reserves };
}

async function createNotification(payload, req = null) {
  const title = cleanText(payload.title);
  if (!title) throw httpError(400, 'Tieu de thong bao khong hop le.');

  const info = await db.run(`
    INSERT INTO notifications(title, message, channel, priority, status, entity_name, entity_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    title,
    cleanText(payload.message),
    cleanText(payload.channel || 'In App') || 'In App',
    normalizePriority(payload.priority),
    normalizeStatus(payload.status, NOTIFICATION_STATUSES, 'Pending'),
    cleanText(payload.entity_name ?? payload.entityName),
    payload.entity_id ?? payload.entityId ?? null
  ]);

  const row = await db.get('SELECT * FROM notifications WHERE id = ?', [info.lastInsertRowid]);
  await auditLog('Create', 'Notifications', row.id, row, null, req);
  return row;
}

async function getDashboardSummary() {
  const today = getToday();
  const [
    calendarTodayRow,
    tasksTodayRow,
    overdueTasksRow,
    upcomingDueCountRow,
    newStudentsRow,
    activeStudentsRow,
    unreadNotificationsRow,
    allRooms,
    ex1,
    ex2,
    sups,
    todayTasks,
    overdueTasksList,
    upcomingDueTasks,
    upcomingCalendar,
    dueTasks,
    notifications,
    latestDrawSession
  ] = await Promise.all([
    db.get('SELECT COUNT(*) AS total FROM weekly_tasks WHERE is_active = 1 AND task_date = ?', [today]),
    db.get("SELECT COUNT(*) AS total FROM daily_tasks WHERE is_active = 1 AND due_date = ? AND status NOT IN ('Completed','Cancelled')", [today]),
    db.get("SELECT COUNT(*) AS total FROM daily_tasks WHERE is_active = 1 AND due_date < ? AND status NOT IN ('Completed','Cancelled')", [today]),
    db.get("SELECT COUNT(*) AS total FROM daily_tasks WHERE is_active = 1 AND due_date > ? AND due_date <= CONVERT(VARCHAR(10), DATEADD(day, 3, CAST(? AS DATE)), 120) AND status NOT IN ('Completed','Cancelled')", [today, today]),
    db.get("SELECT COUNT(*) AS total FROM students WHERE is_active = 1 AND created_at >= CONVERT(VARCHAR(10), DATEADD(day, -7, GETDATE()), 120)"),
    db.get('SELECT COUNT(*) AS total FROM students WHERE is_active = 1'),
    db.get('SELECT COUNT(*) AS total FROM notifications WHERE is_read = 0'),
    listRooms(),
    listByRole('examiner1'),
    listByRole('examiner2'),
    listByRole('supervisor'),
    db.all(`
      SELECT TOP 20 * FROM daily_tasks
      WHERE is_active = 1 AND due_date = ?
      ORDER BY (CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) ASC, (CASE WHEN priority = 'Critical' THEN 2 WHEN priority = 'High' THEN 1 ELSE 0 END) DESC, id DESC
    `, [today]),
    db.all(`
      SELECT TOP 10 * FROM daily_tasks
      WHERE is_active = 1 AND due_date < ? AND status NOT IN ('Completed','Cancelled')
      ORDER BY due_date ASC, (CASE WHEN priority = 'Critical' THEN 2 WHEN priority = 'High' THEN 1 ELSE 0 END) DESC, id DESC
    `, [today]),
    db.all(`
      SELECT TOP 10 * FROM daily_tasks
      WHERE is_active = 1 AND due_date > ? AND due_date <= CONVERT(VARCHAR(10), DATEADD(day, 3, CAST(? AS DATE)), 120) AND status NOT IN ('Completed','Cancelled')
      ORDER BY due_date ASC, (CASE WHEN priority = 'Critical' THEN 2 WHEN priority = 'High' THEN 1 ELSE 0 END) DESC, id DESC
    `, [today, today]),
    db.all(`
      SELECT TOP 8 * FROM weekly_tasks
      WHERE is_active = 1 AND task_date >= ?
      ORDER BY task_date ASC, start_time ASC, id DESC
    `, [today]),
    db.all(`
      SELECT TOP 8 * FROM daily_tasks
      WHERE is_active = 1 AND status NOT IN ('Completed','Cancelled')
      ORDER BY (CASE WHEN due_date IS NULL THEN 1 ELSE 0 END) ASC, due_date ASC, id DESC
    `),
    db.all('SELECT TOP 5 * FROM notifications ORDER BY id DESC'),
    db.get('SELECT TOP 1 * FROM draw_sessions ORDER BY id DESC')
  ]);

  const calendarToday = calendarTodayRow?.total || 0;
  const tasksToday = tasksTodayRow?.total || 0;
  const overdueTasks = overdueTasksRow?.total || 0;
  const upcomingDueCount = upcomingDueCountRow?.total || 0;
  const newStudents = newStudentsRow?.total || 0;
  const activeStudents = activeStudentsRow?.total || 0;
  const unreadNotifications = unreadNotificationsRow?.total || 0;

  const todayCompletedCount = todayTasks.filter(t => t.status === 'Completed').length;
  const todayTotalCount = todayTasks.length;
  const todayPercent = todayTotalCount > 0 ? Math.round((todayCompletedCount / todayTotalCount) * 100) : 0;

  return {
    date: today,
    kpis: {
      calendarToday,
      tasksToday,
      overdueTasks,
      upcomingDue: upcomingDueCount,
      activeStudents,
      newStudents,
      unreadNotifications,
      rooms: allRooms.length,
      examiners: ex1.length + ex2.length,
      supervisors: sups.length
    },
    todayTasks,
    todayProgress: {
      total: todayTotalCount,
      completed: todayCompletedCount,
      percent: todayPercent
    },
    overdueTasksList,
    upcomingDueTasks,
    upcomingCalendar,
    dueTasks,
    notifications,
    latestDrawSession: latestDrawSession || null
  };
}

function normalizeCalendarPayload(body, current = {}) {
  const title = cleanText(body.title ?? current.title);
  const content = cleanText(body.content ?? current.content);
  return {
    title: title || content.slice(0, 80),
    taskDate: ensureDate(body.task_date ?? body.date ?? current.task_date),
    startTime: cleanText(body.start_time ?? body.startTime ?? current.start_time),
    endTime: cleanText(body.end_time ?? body.endTime ?? current.end_time),
    content,
    location: cleanText(body.location ?? current.location),
    ttHv: cleanText(body.tt_hv ?? body.ttHv ?? current.tt_hv),
    ttPhong: cleanText(body.tt_phong ?? body.ttPhong ?? current.tt_phong),
    ban: cleanText(body.ban ?? current.ban),
    personInCharge: cleanText(body.person_in_charge ?? body.personInCharge ?? current.person_in_charge),
    dutyOfficer: cleanText(body.duty_officer ?? body.dutyOfficer ?? current.duty_officer),
    color: cleanText(body.color ?? current.color) || '#166534',
    status: normalizeStatus(body.status ?? current.status, CALENDAR_STATUSES, 'Draft')
  };
}

function normalizeStudentPayload(body, current = {}) {
  return {
    studentCode: cleanText(body.student_code ?? body.studentCode ?? current.student_code),
    fullName: cleanText(body.full_name ?? body.fullName ?? current.full_name),
    birthday: cleanText(body.birthday ?? current.birthday),
    birthplace: cleanText(body.birthplace ?? current.birthplace),
    hometown: cleanText(body.hometown ?? current.hometown),
    rank: cleanText(body.rank ?? current.rank),
    position: cleanText(body.position ?? current.position),
    unit: cleanText(body.unit ?? current.unit),
    phone: cleanText(body.phone ?? current.phone),
    email: cleanText(body.email ?? current.email),
    idCard: cleanText(body.id_card ?? body.idCard ?? current.id_card),
    idCardDate: cleanText(body.id_card_date ?? body.idCardDate ?? current.id_card_date),
    idCardPlace: cleanText(body.id_card_place ?? body.idCardPlace ?? current.id_card_place),
    gender: cleanText(body.gender ?? current.gender) || 'Nam',
    ethnic: cleanText(body.ethnic ?? current.ethnic) || 'Kinh',
    religion: cleanText(body.religion ?? current.religion) || 'Không',
    partyDate: cleanText(body.party_date ?? body.partyDate ?? current.party_date),
    partyOfficialDate: cleanText(body.party_official_date ?? body.partyOfficialDate ?? current.party_official_date),
    educationLevel: cleanText(body.education_level ?? body.educationLevel ?? current.education_level),
    className: cleanText(body.class_name ?? body.className ?? current.class_name),
    batchId: (body.batch_id ?? body.batchId ?? current.batch_id) ? Number(body.batch_id ?? body.batchId ?? current.batch_id) : null,
    targetId: (body.target_id ?? body.targetId ?? current.target_id) ? Number(body.target_id ?? body.targetId ?? current.target_id) : null,
    orderIndex: (body.order_index ?? body.orderIndex ?? current.order_index) ? Number(body.order_index ?? body.orderIndex ?? current.order_index) : null,
    admissionDate: ensureDate(body.admission_date ?? body.admissionDate ?? current.admission_date),
    declarationDate: cleanText(body.declaration_date ?? body.declarationDate ?? current.declaration_date) || new Date().toISOString().slice(0, 10),
    declarationPlace: cleanText(body.declaration_place ?? body.declarationPlace ?? current.declaration_place) || 'Hà Nội',
    status: normalizeStatus(body.status ?? current.status, STUDENT_STATUSES, 'Created'),
    reviewNotes: cleanText(body.review_notes ?? body.reviewNotes ?? current.review_notes),
    reviewedBy: cleanText(body.reviewed_by ?? body.reviewedBy ?? current.reviewed_by),
    reviewedAt: cleanText(body.reviewed_at ?? body.reviewedAt ?? current.reviewed_at),
    avatarUrl: cleanText(body.avatar_url ?? body.avatarUrl ?? current.avatar_url)
  };
}

async function generateNextStudentCode(year = new Date().getFullYear()) {
  const prefix = `HVCT-${year}-`;
  const existingRows = await db.all(`SELECT student_code FROM students WHERE student_code LIKE '${prefix}%'`);
  let maxNum = 0;
  for (const row of existingRows) {
    const raw = String(row.student_code || '');
    if (raw.startsWith(prefix)) {
      const num = parseInt(raw.slice(prefix.length), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  let nextNum = maxNum + 1;
  let code = `${prefix}${String(nextNum).padStart(4, '0')}`;
  while (await db.get('SELECT id FROM students WHERE student_code = ?', [code])) {
    nextNum++;
    code = `${prefix}${String(nextNum).padStart(4, '0')}`;
  }
  return code;
}

function normalizeTaskPayload(body, current = {}) {
  const progress = Number(body.progress ?? current.progress ?? 0);
  return {
    title: cleanText(body.title ?? current.title),
    description: cleanText(body.description ?? current.description),
    assignee: cleanText(body.assignee ?? current.assignee),
    dueDate: cleanText(body.due_date ?? body.dueDate ?? current.due_date),
    priority: normalizePriority(body.priority ?? current.priority),
    status: normalizeStatus(body.status ?? current.status, TASK_STATUSES, 'New'),
    progress: Number.isFinite(progress) ? Math.max(0, Math.min(100, Math.round(progress))) : 0,
    color: cleanText(body.color ?? current.color) || '#15803d'
  };
}

const AI_STOP_WORDS = new Set([
  'anh', 'chi', 'cho', 'toi', 'toi', 'hay', 'hoi', 'cua', 'cac', 'mot', 'nhung',
  'trong', 'theo', 'nhu', 'nay', 'kia', 'voi', 'vao', 'khi', 'neu', 'thi',
  'la', 've', 'va', 'hoac', 'duoc', 'khong', 'can', 'gi', 'nao', 'module',
  'file', 'docs', 'tai', 'lieu'
]);

function normalizeSearchText(value) {
  return cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function extractSearchTerms(question) {
  const words = normalizeSearchText(question)
    .replace(/[^a-z0-9\s_-]/g, ' ')
    .split(/\s+/)
    .map(word => word.trim())
    .filter(word => word.length >= 3 && !AI_STOP_WORDS.has(word));
  return [...new Set(words)].slice(0, 16);
}

function listMarkdownDocuments() {
  if (!fs.existsSync(AI_DOCS_DIR)) return [];

  return fs.readdirSync(AI_DOCS_DIR)
    .filter(name => name.toLowerCase().endsWith('.md'))
    .sort((a, b) => a.localeCompare(b))
    .map(name => {
      const absolutePath = path.join(AI_DOCS_DIR, name);
      const stat = fs.statSync(absolutePath);
      return {
        id: `docs/${name}`,
        file_name: name,
        file_type: 'md',
        scope: 'Nội bộ',
        status: 'Indexed',
        size: stat.size,
        content: fs.readFileSync(absolutePath, 'utf8')
      };
    });
}

function splitMarkdownIntoChunks(document) {
  const lines = document.content.split(/\r?\n/);
  const chunks = [];
  let heading = document.file_name;
  let buffer = [];

  function pushChunk() {
    const text = buffer.join('\n').trim();
    if (!text) return;
    chunks.push({
      source: document.id,
      file_name: document.file_name,
      heading,
      text: text.length > AI_DOC_CHUNK_MAX_CHARS ? `${text.slice(0, AI_DOC_CHUNK_MAX_CHARS)}...` : text
    });
    buffer = [];
  }

  lines.forEach(line => {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch && buffer.join('\n').length > 260) {
      pushChunk();
      heading = headingMatch[2].trim();
    }

    buffer.push(line);
    if (buffer.join('\n').length >= AI_DOC_CHUNK_MAX_CHARS) pushChunk();
  });

  pushChunk();
  return chunks;
}

function scoreAiChunk(chunk, terms, question) {
  const normalizedText = normalizeSearchText(`${chunk.file_name} ${chunk.heading} ${chunk.text}`);
  const normalizedQuestion = normalizeSearchText(question);
  let score = 0;

  terms.forEach(term => {
    if (normalizeSearchText(chunk.file_name).includes(term)) score += 5;
    if (normalizeSearchText(chunk.heading).includes(term)) score += 3;
    const occurrences = normalizedText.split(term).length - 1;
    score += Math.min(occurrences, 6);
  });

  if (normalizedQuestion.length > 12 && normalizedText.includes(normalizedQuestion.slice(0, 80))) {
    score += 8;
  }

  return score;
}

function buildAiMarkdownContext(question) {
  const documents = listMarkdownDocuments();
  const terms = extractSearchTerms(question);
  const chunks = documents.flatMap(document => splitMarkdownIntoChunks(document));
  let ranked = chunks
    .map(chunk => ({ ...chunk, score: scoreAiChunk(chunk, terms, question) }))
    .filter(chunk => chunk.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) {
    ranked = chunks
      .filter(chunk => ['README.md', '11-module-ai-assistant.md', '00-overview.md'].includes(chunk.file_name))
      .map(chunk => ({ ...chunk, score: 1 }));
  }

  const selected = [];
  let totalChars = 0;
  for (const chunk of ranked) {
    const part = `Nguồn: ${chunk.source} | Mục: ${chunk.heading}\n${chunk.text}`;
    if (totalChars + part.length > AI_DOC_CONTEXT_MAX_CHARS) continue;
    selected.push(part);
    totalChars += part.length;
    if (selected.length >= 10) break;
  }

  return {
    context: selected.join('\n\n---\n\n'),
    sources: [...new Set(ranked.slice(0, selected.length || 5).map(chunk => chunk.source))]
  };
}

function httpsPostJson(url, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const body = JSON.stringify(payload);
    const request = https.request({
      hostname: target.hostname,
      path: `${target.pathname}${target.search}`,
      method: 'POST',
      port: target.port || 443,
      timeout: 25000,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers
      }
    }, response => {
      let responseBody = '';
      response.setEncoding('utf8');
      response.on('data', chunk => {
        responseBody += chunk;
      });
      response.on('end', () => {
        let data = {};
        try {
          data = responseBody ? JSON.parse(responseBody) : {};
        } catch (error) {
          reject(httpError(502, 'OpenAI tra ve du lieu khong hop le.'));
          return;
        }

        if (response.statusCode < 200 || response.statusCode >= 300) {
          const status = response.statusCode === 401 ? 401 : response.statusCode === 429 ? 429 : 502;
          const message = response.statusCode === 401
            ? 'OPENAI_API_KEY khong hop le hoac da het han.'
            : data?.error?.message || 'OpenAI API dang khong san sang.';
          reject(httpError(status, message));
          return;
        }

        resolve(data);
      });
    });

    request.on('timeout', () => {
      request.destroy(httpError(504, 'Ket noi OpenAI qua thoi gian.'));
    });
    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

async function aiAnswerWithOpenAi(question, markdownContext) {
  if (!OPENAI_API_KEY) {
    throw httpError(503, 'Chua cau hinh OPENAI_API_KEY tren server.');
  }

  const data = await httpsPostJson('https://api.openai.com/v1/chat/completions', {
    model: OPENAI_MODEL,
    temperature: 0.2,
    max_tokens: AI_RESPONSE_MAX_TOKENS,
    messages: [
      {
        role: 'system',
        content: [
          'Bạn là trợ lý AI cho hệ thống Hệ thống điều hành nội bộ của Học viện Chính trị.',
          'Chỉ trả lời dựa trên CONTEXT Markdown được cung cấp.',
          'Nếu tài liệu chưa đủ thông tin, nói rõ là chưa thấy trong docs và gợi ý tài liệu cần bổ sung.',
          'Trả lời bằng tiếng Việt, ngắn gọn, có cấu trúc, không bịa số liệu hoặc quy định.'
        ].join(' ')
      },
      {
        role: 'user',
        content: `CÂU HỎI:\n${question}\n\nCONTEXT MARKDOWN:\n${markdownContext.context || 'Không tìm thấy nội dung Markdown phù hợp trong thư mục docs.'}`
      }
    ]
  }, {
    Authorization: `Bearer ${OPENAI_API_KEY}`
  });

  const answer = cleanText(data?.choices?.[0]?.message?.content);
  if (!answer) throw httpError(502, 'OpenAI chua tra ve cau tra loi.');

  return {
    answer,
    sources: markdownContext.sources,
    provider: 'openai',
    model: OPENAI_MODEL
  };
}

function aiAnswerFallback(question, markdownContext, reason = '') {
  const text = normalizeSearchText(question);
  const matches = [];
  const knowledge = [
    {
      keywords: ['thi', 'boc tham', 'phong thi', 'coi thi'],
      source: 'docs/00-core-business-rules.md, docs/09-module-graduation-exam.md',
      answer: 'Module thi tốt nghiệp quản lý kỳ thi theo tên đối tượng, số lượng học viên và danh sách ngày thi - môn thi. Phải chọn chi tiết kỳ thi để nhập cán bộ coi thi số 1, cán bộ coi thi số 2, giám sát và phòng thi riêng của kỳ thi đó. Bốc thăm được tổ chức riêng cho từng ngày thi - môn thi: mỗi phòng có cán bộ coi thi số 1, số 2 và giám sát; phòng thi hiển thị tăng dần; lịch sử và điều kiện tránh trùng được tính trong môn thi đang chọn; chỉ hiển thị 5 phiên gần nhất của môn đó.'
    },
    {
      keywords: ['lich', 'tuan', 'calendar', 'cong tac'],
      source: 'docs/07-module-weekly-calendar.md',
      answer: 'Module lịch công tác hỗ trợ tạo lịch theo ngày, chế độ xem ngày/tuần/tháng, nhập TT HV, TT Phòng, Ban, trực ban và TCH Phòng theo từng tuần.'
    },
    {
      keywords: ['hoc vien', 'student', 'tiep nhan'],
      source: 'docs/08-module-student-reception.md',
      answer: 'Module tiếp nhận học viên quản lý hồ sơ, trạng thái tiếp nhận, phân lớp, kiểm tra trùng mã học viên và hỗ trợ báo cáo/import/export trong các giai đoạn sau.'
    },
    {
      keywords: ['nhac viec', 'task', 'qua han'],
      source: 'docs/10-module-daily-reminder.md',
      answer: 'Module nhắc việc theo dõi công việc, hạn hoàn thành, người phụ trách, tiến độ và trạng thái New/InProgress/Pending/Completed/Overdue/Cancelled.'
    },
    {
      keywords: ['sso', 'dang nhap', 'auth', 'mfa'],
      source: 'docs/12-sso-authentication.md',
      answer: 'Tài liệu định hướng SSO dùng OpenID Connect/OAuth2/JWT, token ngắn hạn và MFA cho Admin/Ban Giám đốc. Bản Node hiện có login nội bộ và Google auth để phục vụ MVP.'
    },
    {
      keywords: ['audit', 'nhat ky', 'bao mat'],
      source: 'docs/13-audit-log-security.md',
      answer: 'Các thao tác quan trọng như Create, Update, Delete, Import, Export, Upload và Login cần ghi audit log với người thao tác, thực thể, dữ liệu thay đổi, IP và thiết bị.'
    },
    {
      keywords: ['assistant', 'openai', 'markdown', 'knowledge', 'rag'],
      source: 'docs/11-module-ai-assistant.md, docs/README.md',
      answer: 'AI Assistant đọc các file Markdown trong thư mục docs, chọn đoạn liên quan theo câu hỏi, sau đó gọi OpenAI bằng OPENAI_API_KEY ở phía server. API key không được gửi xuống frontend; khi chưa cấu hình key, hệ thống dùng fallback nội bộ.'
    }
  ];

  knowledge.forEach(item => {
    if (item.keywords.some(keyword => text.includes(keyword))) matches.push(item);
  });

  const fallbackReason = reason ? `${reason}\n\n` : '';
  if (!matches.length) {
    return {
      answer: `${fallbackReason}Tôi chưa tìm thấy ngữ cảnh đủ cụ thể trong tài liệu. Bạn có thể hỏi về lịch công tác, tiếp nhận học viên, thi tốt nghiệp, nhắc việc, SSO, audit hoặc AI Assistant.`,
      sources: markdownContext.sources.length ? markdownContext.sources : ['docs/README.md'],
      provider: 'local-fallback',
      model: null
    };
  }

  return {
    answer: `${fallbackReason}${matches.map(item => item.answer).join('\n\n')}`,
    sources: [...new Set(matches.flatMap(item => item.source.split(',').map(source => source.trim())))],
    provider: 'local-fallback',
    model: null
  };
}

async function aiAnswer(question) {
  const markdownContext = buildAiMarkdownContext(question);
  if (!OPENAI_API_KEY) {
    return aiAnswerFallback(
      question,
      markdownContext,
      'AI đang ở chế độ nội bộ vì server chưa cấu hình OPENAI_API_KEY.'
    );
  }

  try {
    return await aiAnswerWithOpenAi(question, markdownContext);
  } catch (error) {
    return aiAnswerFallback(
      question,
      markdownContext,
      `Chưa gọi được OpenAI (${error.message}). Dưới đây là câu trả lời nội bộ theo docs:`
    );
  }
}

// -------------------------------------------------------------
// ROUTES
// -------------------------------------------------------------

app.post('/api/auth/login', async (req, res) => {
  try {
    const username = cleanText(req.body?.username).toLowerCase();
    const password = req.body?.password;
    if (!username || !password) throw httpError(400, 'Thieu username hoac mat khau.');

    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user || !verifyPassword(password, user.password_hash)) throw httpError(401, 'Thong tin dang nhap khong hop le.');
    ensureActiveUser(user);

    await db.run('UPDATE users SET last_login_at = CONVERT(VARCHAR(19), GETDATE(), 120), updated_at = CONVERT(VARCHAR(19), GETDATE(), 120) WHERE id = ?', [user.id]);
    const publicUser = await getPublicUser(user.id, true);
    await auditLog('Login', 'Users', user.id, { username }, null, req);
    res.json(buildAuthResponse(publicUser, { authProvider: publicUser.auth_provider }));
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/auth/logout', async (req, res) => {
  await auditLog('Logout', 'Users', null, null, null, req);
  res.json({ ok: true });
});

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    res.json(buildAuthResponse(user));
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/auth/profile', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    res.json(user);
  } catch (error) {
    sendError(res, error);
  }
});

app.use('/api', requireApiAccess);

app.get('/api/dashboard', async (req, res) => {
  try {
    const summary = await getDashboardSummary();
    res.json(summary);
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/calendar', async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit, 100, 200);
    const rows = await db.all(`
      SELECT TOP (?) * FROM weekly_tasks
      WHERE is_active = 1
      ORDER BY task_date ASC, start_time ASC, id DESC
    `, [limit]);
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/calendar/week-meta', async (req, res) => {
  try {
    const weekStart = cleanText(req.query.weekStart);
    if (weekStart) {
      const row = await db.get('SELECT * FROM weekly_schedule_meta WHERE week_start = ?', [weekStart]);
      return res.json(row || {
        week_start: weekStart,
        duty_summary: '',
        room_summary: ''
      });
    }

    const rows = await db.all('SELECT * FROM weekly_schedule_meta ORDER BY week_start ASC');
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
});

app.put('/api/calendar/week-meta', async (req, res) => {
  try {
    const weekStart = ensureDate(req.body?.weekStart ?? req.body?.week_start);
    const payload = {
      weekStart,
      dutySummary: cleanText(req.body?.dutySummary ?? req.body?.duty_summary),
      roomSummary: cleanText(req.body?.roomSummary ?? req.body?.room_summary)
    };

    const existing = await db.get('SELECT id FROM weekly_schedule_meta WHERE week_start = ?', [payload.weekStart]);
    if (existing) {
      await db.run(`
        UPDATE weekly_schedule_meta
        SET duty_summary = ?, room_summary = ?, updated_at = CONVERT(VARCHAR(19), GETDATE(), 120)
        WHERE week_start = ?
      `, [payload.dutySummary, payload.roomSummary, payload.weekStart]);
    } else {
      await db.run(`
        INSERT INTO weekly_schedule_meta(week_start, duty_summary, room_summary)
        VALUES (?, ?, ?)
      `, [payload.weekStart, payload.dutySummary, payload.roomSummary]);
    }

    const row = await db.get('SELECT * FROM weekly_schedule_meta WHERE week_start = ?', [payload.weekStart]);
    await auditLog('Update', 'WeeklyScheduleMeta', payload.weekStart, row, null, req);
    res.json(row);
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/calendar/:id', async (req, res) => {
  try {
    const row = await db.get('SELECT * FROM weekly_tasks WHERE id = ? AND is_active = 1', [req.params.id]);
    if (!row) return res.status(404).json({ message: 'Khong tim thay lich.' });
    res.json(row);
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/calendar', async (req, res) => {
  try {
    const payload = normalizeCalendarPayload(req.body || {});
    if (!payload.title) throw httpError(400, 'Tieu de lich khong hop le.');

    const info = await db.run(`
      INSERT INTO weekly_tasks(title, task_date, start_time, end_time, content, location, tt_hv, tt_phong, ban, person_in_charge, duty_officer, color, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [payload.title, payload.taskDate, payload.startTime, payload.endTime, payload.content, payload.location, payload.ttHv, payload.ttPhong, payload.ban, payload.personInCharge, payload.dutyOfficer, payload.color, payload.status]);
    
    const row = await db.get('SELECT * FROM weekly_tasks WHERE id = ?', [info.lastInsertRowid]);
    await auditLog('Create', 'WeeklyCalendar', row.id, row, null, req);
    await createNotification({
      title: 'Lịch tuần mới',
      message: `${row.title} - ${row.task_date}`,
      priority: row.status === 'Published' ? 'High' : 'Normal',
      status: 'Queued',
      entity_name: 'WeeklyCalendar',
      entity_id: row.id
    }, req);
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

app.put('/api/calendar/:id', async (req, res) => {
  try {
    const current = await db.get('SELECT * FROM weekly_tasks WHERE id = ? AND is_active = 1', [req.params.id]);
    if (!current) throw httpError(404, 'Khong tim thay lich.');
    const payload = normalizeCalendarPayload(req.body || {}, current);
    if (!payload.title) throw httpError(400, 'Tieu de lich khong hop le.');

    await db.run(`
      UPDATE weekly_tasks
      SET title = ?, task_date = ?, start_time = ?, end_time = ?, content = ?, location = ?,
          tt_hv = ?, tt_phong = ?, ban = ?, person_in_charge = ?, duty_officer = ?, color = ?, status = ?, updated_at = CONVERT(VARCHAR(19), GETDATE(), 120)
      WHERE id = ?
    `, [payload.title, payload.taskDate, payload.startTime, payload.endTime, payload.content, payload.location, payload.ttHv, payload.ttPhong, payload.ban, payload.personInCharge, payload.dutyOfficer, payload.color, payload.status, current.id]);
    
    const row = await db.get('SELECT * FROM weekly_tasks WHERE id = ?', [current.id]);
    await auditLog('Update', 'WeeklyCalendar', row.id, row, current, req);
    res.json(row);
  } catch (error) {
    sendError(res, error);
  }
});

app.delete('/api/calendar/:id', async (req, res) => {
  try {
    const current = await db.get('SELECT * FROM weekly_tasks WHERE id = ? AND is_active = 1', [req.params.id]);
    if (!current) return res.status(404).json({ message: 'Khong tim thay lich.' });
    await db.run('UPDATE weekly_tasks SET is_active = 0, updated_at = CONVERT(VARCHAR(19), GETDATE(), 120) WHERE id = ?', [current.id]);
    await auditLog('Delete', 'WeeklyCalendar', current.id, null, current, req);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

function tryParseJson(str, fallback = []) {
  if (!str) return fallback;
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

async function getStudentFull(id) {
  const row = await db.get(`
    SELECT s.*, 
           b.name AS batch_name, b.code AS batch_code,
           t.name AS target_name, t.code AS target_code, t.required_documents AS target_required_documents
    FROM students s
    LEFT JOIN admission_batches b ON b.id = s.batch_id
    LEFT JOIN admission_targets t ON t.id = s.target_id
    WHERE s.id = ? AND s.is_active = 1
  `, [id]);
  if (!row) return null;
  const docs = await db.all('SELECT * FROM student_documents WHERE student_id = ? AND is_active = 1 ORDER BY id ASC', [row.id]);
  row.documents = docs;
  row.target_required_documents = tryParseJson(row.target_required_documents, []);
  return row;
}

// ==========================================================
// ADMISSION TARGETS (Đối tượng tiếp nhận)
// ==========================================================
app.get('/api/admission-targets', async (req, res) => {
  try {
    const rows = await db.all(`
      SELECT t.*,
             (SELECT COUNT(*) FROM students s WHERE s.target_id = t.id AND s.is_active = 1) AS student_count
      FROM admission_targets t
      WHERE t.is_active = 1
      ORDER BY t.id ASC
    `);
    res.json(rows.map(r => ({
      ...r,
      required_documents: tryParseJson(r.required_documents, [])
    })));
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/admission-targets', async (req, res) => {
  try {
    const code = cleanText(req.body.code);
    const name = cleanText(req.body.name);
    if (!code || !name) throw httpError(400, 'Mã và tên đối tượng không được để trống.');

    const duplicate = await db.get('SELECT id FROM admission_targets WHERE code = ?', [code]);
    if (duplicate) throw httpError(409, 'Mã đối tượng tiếp nhận đã tồn tại.');

    const defaultClass = cleanText(req.body.default_class ?? req.body.defaultClass);
    const quota = Number(req.body.quota || 0);
    const reqDocs = Array.isArray(req.body.required_documents) ? JSON.stringify(req.body.required_documents) : cleanText(req.body.required_documents);
    const description = cleanText(req.body.description);

    const info = await db.run(`
      INSERT INTO admission_targets (code, name, default_class, quota, required_documents, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [code, name, defaultClass, quota, reqDocs, description]);

    const row = await db.get('SELECT * FROM admission_targets WHERE id = ?', [info.lastInsertRowid]);
    row.required_documents = tryParseJson(row.required_documents, []);
    await auditLog('Create', 'AdmissionTargets', row.id, row, null, req);
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

app.put('/api/admission-targets/:id', async (req, res) => {
  try {
    const current = await db.get('SELECT * FROM admission_targets WHERE id = ? AND is_active = 1', [req.params.id]);
    if (!current) throw httpError(404, 'Không tìm thấy đối tượng tiếp nhận.');

    const code = cleanText(req.body.code ?? current.code);
    const name = cleanText(req.body.name ?? current.name);
    const defaultClass = cleanText(req.body.default_class ?? req.body.defaultClass ?? current.default_class);
    const quota = Number(req.body.quota ?? current.quota);
    const reqDocs = req.body.required_documents !== undefined
      ? (Array.isArray(req.body.required_documents) ? JSON.stringify(req.body.required_documents) : cleanText(req.body.required_documents))
      : current.required_documents;
    const description = cleanText(req.body.description ?? current.description);

    await db.run(`
      UPDATE admission_targets
      SET code = ?, name = ?, default_class = ?, quota = ?, required_documents = ?, description = ?,
          updated_at = CONVERT(VARCHAR(19), GETDATE(), 120)
      WHERE id = ?
    `, [code, name, defaultClass, quota, reqDocs, description, current.id]);

    const row = await db.get('SELECT * FROM admission_targets WHERE id = ?', [current.id]);
    row.required_documents = tryParseJson(row.required_documents, []);
    await auditLog('Update', 'AdmissionTargets', row.id, row, current, req);
    res.json(row);
  } catch (error) {
    sendError(res, error);
  }
});

app.delete('/api/admission-targets/:id', async (req, res) => {
  try {
    const current = await db.get('SELECT * FROM admission_targets WHERE id = ? AND is_active = 1', [req.params.id]);
    if (!current) throw httpError(404, 'Không tìm thấy đối tượng tiếp nhận.');
    await db.run('UPDATE admission_targets SET is_active = 0, updated_at = CONVERT(VARCHAR(19), GETDATE(), 120) WHERE id = ?', [current.id]);
    await auditLog('Delete', 'AdmissionTargets', current.id, null, current, req);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

// ==========================================================
// ADMISSION BATCHES (Đợt tiếp nhận)
// ==========================================================
app.get('/api/admission-batches', async (req, res) => {
  try {
    const rows = await db.all(`
      SELECT b.*,
             (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id AND s.is_active = 1) AS student_count,
             (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id AND s.status = 'Approved' AND s.is_active = 1) AS approved_count,
             (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id AND s.status = 'PendingReview' AND s.is_active = 1) AS pending_count
      FROM admission_batches b
      WHERE b.is_active = 1
      ORDER BY b.id DESC
    `);
    
    const allTargets = await db.all('SELECT id, code, name, default_class, required_documents FROM admission_targets WHERE is_active = 1');
    const targetMap = new Map(allTargets.map(t => [t.id, { ...t, required_documents: tryParseJson(t.required_documents, []) }]));

    const result = rows.map(b => {
      const targetIds = tryParseJson(b.target_ids, []);
      const targets = targetIds.map(id => targetMap.get(Number(id))).filter(Boolean);
      return {
        ...b,
        target_ids: targetIds,
        targets
      };
    });

    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/admission-batches', async (req, res) => {
  try {
    const code = cleanText(req.body.code);
    const name = cleanText(req.body.name);
    if (!code || !name) throw httpError(400, 'Mã và tên đợt tiếp nhận không được để trống.');

    const duplicate = await db.get('SELECT id FROM admission_batches WHERE code = ?', [code]);
    if (duplicate) throw httpError(409, 'Mã đợt tiếp nhận đã tồn tại.');

    const academicYear = cleanText(req.body.academic_year ?? req.body.academicYear) || '2026-2027';
    const startDate = cleanText(req.body.start_date ?? req.body.startDate);
    const endDate = cleanText(req.body.end_date ?? req.body.endDate);
    const targetIds = Array.isArray(req.body.target_ids) ? JSON.stringify(req.body.target_ids) : cleanText(req.body.target_ids);
    const status = cleanText(req.body.status) || 'Open';
    const note = cleanText(req.body.note);

    const info = await db.run(`
      INSERT INTO admission_batches (code, name, academic_year, start_date, end_date, target_ids, status, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [code, name, academicYear, startDate, endDate, targetIds, status, note]);

    const row = await db.get('SELECT * FROM admission_batches WHERE id = ?', [info.lastInsertRowid]);
    await auditLog('Create', 'AdmissionBatches', row.id, row, null, req);
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

app.put('/api/admission-batches/:id', async (req, res) => {
  try {
    const current = await db.get('SELECT * FROM admission_batches WHERE id = ? AND is_active = 1', [req.params.id]);
    if (!current) throw httpError(404, 'Không tìm thấy đợt tiếp nhận.');

    const code = cleanText(req.body.code ?? current.code);
    const name = cleanText(req.body.name ?? current.name);
    const academicYear = cleanText(req.body.academic_year ?? req.body.academicYear ?? current.academic_year);
    const startDate = cleanText(req.body.start_date ?? req.body.startDate ?? current.start_date);
    const endDate = cleanText(req.body.end_date ?? req.body.endDate ?? current.end_date);
    const targetIds = req.body.target_ids !== undefined
      ? (Array.isArray(req.body.target_ids) ? JSON.stringify(req.body.target_ids) : cleanText(req.body.target_ids))
      : current.target_ids;
    const status = cleanText(req.body.status ?? current.status);
    const note = cleanText(req.body.note ?? current.note);

    await db.run(`
      UPDATE admission_batches
      SET code = ?, name = ?, academic_year = ?, start_date = ?, end_date = ?, target_ids = ?, status = ?, note = ?,
          updated_at = CONVERT(VARCHAR(19), GETDATE(), 120)
      WHERE id = ?
    `, [code, name, academicYear, startDate, endDate, targetIds, status, note, current.id]);

    const row = await db.get('SELECT * FROM admission_batches WHERE id = ?', [current.id]);
    await auditLog('Update', 'AdmissionBatches', row.id, row, current, req);
    res.json(row);
  } catch (error) {
    sendError(res, error);
  }
});

app.delete('/api/admission-batches/:id', async (req, res) => {
  try {
    const current = await db.get('SELECT * FROM admission_batches WHERE id = ? AND is_active = 1', [req.params.id]);
    if (!current) throw httpError(404, 'Không tìm thấy đợt tiếp nhận.');
    await db.run('UPDATE admission_batches SET is_active = 0, updated_at = CONVERT(VARCHAR(19), GETDATE(), 120) WHERE id = ?', [current.id]);
    await auditLog('Delete', 'AdmissionBatches', current.id, null, current, req);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

// ==========================================================
// STUDENTS (Hồ sơ học viên tiếp nhận - Quản trị viên)
// ==========================================================
app.get('/api/students', async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit, 100, 500);
    const batchId = req.query.batch_id ? Number(req.query.batch_id) : null;
    const targetId = req.query.target_id ? Number(req.query.target_id) : null;
    const status = cleanText(req.query.status);
    const keyword = cleanText(req.query.keyword || req.query.q);

    let whereSql = 'WHERE s.is_active = 1';
    const params = [];

    if (batchId) {
      whereSql += ' AND s.batch_id = ?';
      params.push(batchId);
    }
    if (targetId) {
      whereSql += ' AND s.target_id = ?';
      params.push(targetId);
    }
    if (status) {
      whereSql += ' AND s.status = ?';
      params.push(status);
    }
    if (keyword) {
      whereSql += ' AND (s.student_code LIKE ? OR s.full_name LIKE ? OR s.id_card LIKE ? OR s.phone LIKE ? OR s.unit LIKE ? OR s.rank LIKE ?)';
      const kwPattern = `%${keyword}%`;
      params.push(kwPattern, kwPattern, kwPattern, kwPattern, kwPattern, kwPattern);
    }

    params.unshift(limit);

    const rows = await db.all(`
      SELECT TOP (?) s.*,
             b.name AS batch_name, b.code AS batch_code,
             t.name AS target_name, t.code AS target_code,
             (SELECT COUNT(*) FROM student_documents d WHERE d.student_id = s.id AND d.is_active = 1) AS document_count
      FROM students s
      LEFT JOIN admission_batches b ON b.id = s.batch_id
      LEFT JOIN admission_targets t ON t.id = s.target_id
      ${whereSql}
      ORDER BY (CASE WHEN s.order_index IS NULL THEN 9999 ELSE s.order_index END) ASC, s.id DESC
    `, params);

    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
});

// Xuất danh sách học viên dạng Excel/CSV (UTF-8 BOM tương thích hoàn hảo với Microsoft Excel)
app.get('/api/students/export-excel', async (req, res) => {
  try {
    const batchId = req.query.batch_id ? Number(req.query.batch_id) : null;
    const targetId = req.query.target_id ? Number(req.query.target_id) : null;
    const status = cleanText(req.query.status);
    const keyword = cleanText(req.query.keyword || req.query.q);

    let whereSql = 'WHERE s.is_active = 1';
    const params = [];

    if (batchId) {
      whereSql += ' AND s.batch_id = ?';
      params.push(batchId);
    }
    if (targetId) {
      whereSql += ' AND s.target_id = ?';
      params.push(targetId);
    }
    if (status) {
      whereSql += ' AND s.status = ?';
      params.push(status);
    }
    if (keyword) {
      whereSql += ' AND (s.student_code LIKE ? OR s.full_name LIKE ? OR s.id_card LIKE ? OR s.phone LIKE ? OR s.unit LIKE ? OR s.rank LIKE ?)';
      const kwPattern = `%${keyword}%`;
      params.push(kwPattern, kwPattern, kwPattern, kwPattern, kwPattern, kwPattern);
    }

    const rows = await db.all(`
      SELECT s.*,
             b.name AS batch_name,
             t.name AS target_name
      FROM students s
      LEFT JOIN admission_batches b ON b.id = s.batch_id
      LEFT JOIN admission_targets t ON t.id = s.target_id
      ${whereSql}
      ORDER BY (CASE WHEN s.order_index IS NULL THEN 9999 ELSE s.order_index END) ASC, s.id DESC
    `, params);

    const escapeCsv = (val) => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'STT', 'Mã hồ sơ', 'Họ và tên', 'Ngày sinh', 'Nơi sinh', 'Quê quán',
      'Cấp bậc', 'Chức vụ', 'Đơn vị cử đi học', 'Số CCCD/CMND', 'Số điện thoại',
      'Email', 'Đợt tiếp nhận', 'Đối tượng tiếp nhận', 'Lớp biên chế',
      'Trạng thái', 'Trình độ học vấn', 'Ghi chú thẩm định'
    ];

    const lines = [headers.map(escapeCsv).join(',')];
    rows.forEach((r, idx) => {
      lines.push([
        escapeCsv(r.order_index || (idx + 1)),
        escapeCsv(r.student_code || ''),
        escapeCsv(r.full_name || ''),
        escapeCsv(r.birthday || ''),
        escapeCsv(r.birthplace || ''),
        escapeCsv(r.hometown || ''),
        escapeCsv(r.rank || ''),
        escapeCsv(r.position || ''),
        escapeCsv(r.unit || ''),
        escapeCsv(r.id_card || ''),
        escapeCsv(r.phone || ''),
        escapeCsv(r.email || ''),
        escapeCsv(r.batch_name || ''),
        escapeCsv(r.target_name || ''),
        escapeCsv(r.class_name || ''),
        escapeCsv(r.status || ''),
        escapeCsv(r.education_level || ''),
        escapeCsv(r.review_notes || '')
      ].join(','));
    });

    const csvContent = '\uFEFF' + lines.join('\r\n');
    const fileName = `Danh_Sach_Hoc_Vien_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(Buffer.from(csvContent, 'utf8'));
  } catch (error) {
    sendError(res, error);
  }
});

// Nhập danh sách học viên từ file / JSON
app.post('/api/students/import-excel', async (req, res) => {
  try {
    const list = Array.isArray(req.body.students) ? req.body.students : (Array.isArray(req.body) ? req.body : []);
    if (!list.length) throw httpError(400, 'Không có dữ liệu học viên để nhập.');

    let importedCount = 0;
    const errors = [];

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const fullName = cleanText(item.full_name || item.fullName);
      if (!fullName) {
        errors.push(`Dòng ${i + 1}: Thiếu họ và tên học viên.`);
        continue;
      }

      let studentCode = cleanText(item.student_code || item.studentCode);
      if (!studentCode) {
        studentCode = await generateNextStudentCode();
      } else {
        const existed = await db.get('SELECT id FROM students WHERE student_code = ?', [studentCode]);
        if (existed) {
          studentCode = await generateNextStudentCode();
        }
      }

      await db.run(`
        INSERT INTO students (
          student_code, full_name, birthday, birthplace, hometown,
          rank, position, unit, phone, email, id_card,
          class_name, batch_id, target_id, order_index,
          admission_date, declaration_date, declaration_place, status, review_notes
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?
        )
      `, [
        studentCode,
        fullName,
        cleanText(item.birthday),
        cleanText(item.birthplace),
        cleanText(item.hometown),
        cleanText(item.rank),
        cleanText(item.position),
        cleanText(item.unit),
        cleanText(item.phone),
        cleanText(item.email),
        cleanText(item.id_card || item.idCard),
        cleanText(item.class_name || item.className),
        item.batch_id ? Number(item.batch_id) : null,
        item.target_id ? Number(item.target_id) : null,
        item.order_index ? Number(item.order_index) : null,
        new Date().toISOString().slice(0, 10),
        new Date().toISOString().slice(0, 10),
        'Hà Nội',
        cleanText(item.status) || 'PendingReview',
        cleanText(item.review_notes || 'Nhập từ file danh sách')
      ]);
      importedCount++;
    }

    res.json({
      ok: true,
      importedCount,
      errors,
      message: `Đã nhập thành công ${importedCount} hồ sơ học viên.`
    });
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const row = await getStudentFull(req.params.id);
    if (!row) return res.status(404).json({ message: 'Không tìm thấy hồ sơ học viên.' });
    res.json(row);
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const payload = normalizeStudentPayload(req.body || {});
    if (!payload.fullName) throw httpError(400, 'Họ và tên không được để trống.');

    let studentCode = payload.studentCode;
    if (!studentCode) {
      studentCode = await generateNextStudentCode();
    } else {
      const duplicate = await db.get('SELECT id FROM students WHERE student_code = ?', [studentCode]);
      if (duplicate) throw httpError(409, 'Mã hồ sơ học viên đã tồn tại.');
    }

    const info = await db.run(`
      INSERT INTO students (
        student_code, full_name, birthday, birthplace, hometown,
        rank, position, unit, phone, email, id_card, id_card_date, id_card_place,
        gender, ethnic, religion, party_date, party_official_date,
        education_level, class_name, batch_id, target_id, order_index,
        admission_date, declaration_date, declaration_place, status,
        review_notes, reviewed_by, reviewed_at, avatar_url
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `, [
      studentCode, payload.fullName, payload.birthday, payload.birthplace, payload.hometown,
      payload.rank, payload.position, payload.unit, payload.phone, payload.email, payload.idCard, payload.idCardDate, payload.idCardPlace,
      payload.gender, payload.ethnic, payload.religion, payload.partyDate, payload.partyOfficialDate,
      payload.educationLevel, payload.className, payload.batchId, payload.targetId, payload.orderIndex,
      payload.admissionDate, payload.declarationDate, payload.declarationPlace, payload.status,
      payload.reviewNotes, payload.reviewedBy, payload.reviewedAt, payload.avatarUrl
    ]);

    const row = await getStudentFull(info.lastInsertRowid);
    await auditLog('Create', 'Students', row.id, row, null, req);
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const current = await db.get('SELECT * FROM students WHERE id = ? AND is_active = 1', [req.params.id]);
    if (!current) throw httpError(404, 'Không tìm thấy hồ sơ học viên.');
    const payload = normalizeStudentPayload(req.body || {}, current);
    if (!payload.studentCode || !payload.fullName) throw httpError(400, 'Mã học viên và họ tên không được để trống.');
    const duplicate = await db.get('SELECT id FROM students WHERE student_code = ? AND id != ?', [payload.studentCode, current.id]);
    if (duplicate) throw httpError(409, 'Mã học viên đã tồn tại.');

    await db.run(`
      UPDATE students
      SET student_code = ?, full_name = ?, birthday = ?, birthplace = ?, hometown = ?,
          rank = ?, position = ?, unit = ?, phone = ?, email = ?,
          id_card = ?, id_card_date = ?, id_card_place = ?, gender = ?, ethnic = ?, religion = ?,
          party_date = ?, party_official_date = ?, education_level = ?,
          class_name = ?, batch_id = ?, target_id = ?, order_index = ?,
          admission_date = ?, declaration_date = ?, declaration_place = ?,
          status = ?, review_notes = ?, reviewed_by = ?, reviewed_at = ?, avatar_url = ?,
          updated_at = CONVERT(VARCHAR(19), GETDATE(), 120)
      WHERE id = ?
    `, [
      payload.studentCode, payload.fullName, payload.birthday, payload.birthplace, payload.hometown,
      payload.rank, payload.position, payload.unit, payload.phone, payload.email,
      payload.idCard, payload.idCardDate, payload.idCardPlace, payload.gender, payload.ethnic, payload.religion,
      payload.partyDate, payload.partyOfficialDate, payload.educationLevel,
      payload.className, payload.batchId, payload.targetId, payload.orderIndex,
      payload.admissionDate, payload.declarationDate, payload.declarationPlace,
      payload.status, payload.reviewNotes, payload.reviewedBy, payload.reviewedAt, payload.avatarUrl,
      current.id
    ]);

    const row = await getStudentFull(current.id);
    await auditLog('Update', 'Students', row.id, row, current, req);
    res.json(row);
  } catch (error) {
    sendError(res, error);
  }
});

app.put('/api/students/:id/review', async (req, res) => {
  try {
    const current = await db.get('SELECT * FROM students WHERE id = ? AND is_active = 1', [req.params.id]);
    if (!current) throw httpError(404, 'Không tìm thấy hồ sơ học viên.');
    const status = cleanText(req.body.status);
    if (!['Approved', 'Rejected', 'PendingReview', 'Completed'].includes(status)) {
      throw httpError(400, 'Trạng thái duyệt không hợp lệ.');
    }
    const reviewNotes = cleanText(req.body.review_notes ?? req.body.reviewNotes ?? current.review_notes);
    const className = cleanText(req.body.class_name ?? req.body.className ?? current.class_name);
    const orderIndex = (req.body.order_index ?? req.body.orderIndex ?? current.order_index) ? Number(req.body.order_index ?? req.body.orderIndex ?? current.order_index) : null;
    const reviewedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);

    await db.run(`
      UPDATE students
      SET status = ?, review_notes = ?, class_name = ?, order_index = ?, reviewed_by = ?, reviewed_at = ?,
          updated_at = CONVERT(VARCHAR(19), GETDATE(), 120)
      WHERE id = ?
    `, [status, reviewNotes, className, orderIndex, reviewedBy, reviewedAt, current.id]);

    const notifTitle = status === 'Approved' ? `Hồ sơ học viên ${current.full_name} đã được phê duyệt` : `Hồ sơ học viên ${current.full_name}: yêu cầu bổ sung`;
    await db.run(`
      INSERT INTO notifications (title, message, priority, entity_name, entity_id)
      VALUES (?, ?, ?, 'Students', ?)
    `, [notifTitle, reviewNotes || `Trạng thái: ${status}`, status === 'Approved' ? 'Normal' : 'High', current.id]);

    const row = await getStudentFull(current.id);
    await auditLog('Review', 'Students', row.id, row, current, req);
    res.json(row);
  } catch (error) {
    sendError(res, error);
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const current = await db.get('SELECT * FROM students WHERE id = ? AND is_active = 1', [req.params.id]);
    if (!current) return res.status(404).json({ message: 'Không tìm thấy học viên.' });
    await db.run('UPDATE students SET is_active = 0, updated_at = CONVERT(VARCHAR(19), GETDATE(), 120) WHERE id = ?', [current.id]);
    await auditLog('Delete', 'Students', current.id, null, current, req);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

// Xuất file Word Phiếu tiếp nhận học viên chuẩn theo mẫu
app.get('/api/students/:id/receipt-doc', async (req, res) => {
  try {
    const student = await getStudentFull(req.params.id);
    if (!student) return res.status(404).json({ message: 'Không tìm thấy hồ sơ học viên.' });

    const buffer = await buildAdmissionReceiptDocx(student);
    const safeStudentCode = (student.student_code || 'HV').replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="Phieu_Tiep_Nhan_${safeStudentCode}.docx"`);
    res.send(buffer);
  } catch (error) {
    sendError(res, error);
  }
});

// Tải file hồ sơ trọn gói Bundle ZIP gồm Phiếu tiếp nhận và toàn bộ ảnh văn bằng chứng chỉ
app.get('/api/students/:id/download-bundle', async (req, res) => {
  try {
    const student = await getStudentFull(req.params.id);
    if (!student) return res.status(404).json({ message: 'Không tìm thấy hồ sơ học viên.' });

    const docxBuffer = await buildAdmissionReceiptDocx(student);
    const safeStudentCode = (student.student_code || 'HV').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFullName = (student.full_name || 'HocVien')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');

    const zip = new JSZip();
    zip.file(`Phieu_Tiep_Nhan_${safeStudentCode}.docx`, docxBuffer);

    const docFolder = zip.folder('VanBang_ChungChi');
    const docs = student.documents || [];
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      if (doc.file_path && fs.existsSync(doc.file_path)) {
        const fileData = fs.readFileSync(doc.file_path);
        const ext = path.extname(doc.file_name || '') || '.jpg';
        const safeDocType = (doc.doc_type || 'ChungChi')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9_-]/g, '_');
        docFolder.file(`${String(i + 1).padStart(2, '0')}_${safeDocType}${ext}`, fileData);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const filename = `HoSo_${safeStudentCode}_${safeFullName}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(zipBuffer);
  } catch (error) {
    sendError(res, error);
  }
});

// Phục vụ xem/tải trực tiếp file ảnh văn bằng chứng chỉ
app.get('/api/student-documents/:id/file', async (req, res) => {
  try {
    const doc = await db.get('SELECT * FROM student_documents WHERE id = ? AND is_active = 1', [req.params.id]);
    if (!doc || !fs.existsSync(doc.file_path)) {
      return res.status(404).json({ message: 'Không tìm thấy tệp tài liệu.' });
    }
    const ext = path.extname(doc.file_name).toLowerCase();
    const mimeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf'
    };
    res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.file_name)}"`);
    fs.createReadStream(doc.file_path).pipe(res);
  } catch (error) {
    sendError(res, error);
  }
});

// ==========================================================
// RECEPTION PORTAL (Phân vùng Tiếp nhận học viên - Mobile-first)
// ==========================================================
app.get('/api/reception/init-data', async (req, res) => {
  try {
    const batches = await db.all(`
      SELECT id, code, name, academic_year, start_date, end_date, target_ids, status, note
      FROM admission_batches
      WHERE is_active = 1 AND status = 'Open'
      ORDER BY id DESC
    `);

    const allTargets = await db.all(`
      SELECT id, code, name, default_class, quota, required_documents, description
      FROM admission_targets
      WHERE is_active = 1
      ORDER BY id ASC
    `);

    const targetMap = new Map();
    allTargets.forEach(t => {
      targetMap.set(t.id, {
        ...t,
        required_documents: tryParseJson(t.required_documents, [])
      });
    });

    const activeBatches = batches.map(b => {
      const targetIds = tryParseJson(b.target_ids, []);
      const targets = targetIds.map(id => targetMap.get(Number(id))).filter(Boolean);
      return {
        ...b,
        targets
      };
    });

    res.json({
      batches: activeBatches,
      allTargets: Array.from(targetMap.values())
    });
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/reception/submit', async (req, res) => {
  try {
    const payload = normalizeStudentPayload(req.body || {});
    if (!payload.fullName) throw httpError(400, 'Vui lòng nhập họ và tên.');
    if (!payload.birthday) throw httpError(400, 'Vui lòng nhập ngày sinh.');
    if (!payload.unit) throw httpError(400, 'Vui lòng nhập đơn vị công tác.');
    if (!payload.phone) throw httpError(400, 'Vui lòng nhập số điện thoại.');
    if (!payload.targetId) throw httpError(400, 'Vui lòng chọn đối tượng đào tạo tiếp nhận.');

    const studentCode = await generateNextStudentCode();

    let className = payload.className;
    if (!className && payload.targetId) {
      const t = await db.get('SELECT default_class FROM admission_targets WHERE id = ?', [payload.targetId]);
      if (t?.default_class) className = t.default_class;
    }

    const info = await db.run(`
      INSERT INTO students (
        student_code, full_name, birthday, birthplace, hometown,
        rank, position, unit, phone, email, id_card, id_card_date, id_card_place,
        gender, ethnic, religion, party_date, party_official_date,
        education_level, class_name, batch_id, target_id, order_index,
        admission_date, declaration_date, declaration_place, status,
        review_notes
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, 'PendingReview',
        ?
      )
    `, [
      studentCode, payload.fullName, payload.birthday, payload.birthplace, payload.hometown,
      payload.rank, payload.position, payload.unit, payload.phone, payload.email, payload.idCard, payload.idCardDate, payload.idCardPlace,
      payload.gender, payload.ethnic, payload.religion, payload.partyDate, payload.partyOfficialDate,
      payload.educationLevel, className, payload.batchId, payload.targetId, payload.orderIndex,
      new Date().toISOString().slice(0, 10), payload.declarationDate, payload.declarationPlace,
      'Hồ sơ đăng ký nộp trực tuyến qua Phân vùng Tiếp nhận'
    ]);

    const studentId = info.lastInsertRowid;
    const studentFolder = path.join(STUDENT_UPLOAD_ROOT, `student-${studentId}`);
    fs.mkdirSync(studentFolder, { recursive: true });

    const documents = Array.isArray(req.body.documents) ? req.body.documents : [];
    let savedDocsCount = 0;

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      if (!doc || !doc.contentBase64) continue;

      const rawBase64 = cleanText(doc.contentBase64 || doc.data);
      const cleanBase64 = rawBase64.replace(/^data:[^;]+;base64,/i, '');
      if (!cleanBase64) continue;

      const buffer = Buffer.from(cleanBase64, 'base64');
      const originalName = cleanText(doc.fileName || doc.name || `ChungChi_${i + 1}.jpg`);
      const ext = path.extname(originalName).toLowerCase() || '.jpg';
      const storedName = `${Date.now()}-${i + 1}-${crypto.randomBytes(4).toString('hex')}${ext}`;
      const filePath = path.join(studentFolder, storedName);

      fs.writeFileSync(filePath, buffer);

      await db.run(`
        INSERT INTO student_documents (student_id, doc_type, file_name, file_path, file_size, file_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        studentId,
        cleanText(doc.docType || 'Văn bằng chứng chỉ'),
        originalName,
        filePath,
        buffer.length,
        ext.slice(1)
      ]);
      savedDocsCount++;
    }

    await db.run(`
      INSERT INTO notifications (title, message, priority, entity_name, entity_id)
      VALUES (?, ?, 'High', 'Students', ?)
    `, [
      `Hồ sơ tiếp nhận mới: ${payload.fullName} (${studentCode})`,
      `Đồng chí ${payload.rank ? payload.rank + ' ' : ''}${payload.fullName} (${payload.unit || 'Đơn vị'}) vừa nộp hồ sơ tiếp nhận kèm ${savedDocsCount} ảnh văn bằng.`,
      studentId
    ]);

    res.status(201).json({
      ok: true,
      studentId,
      studentCode,
      fullName: payload.fullName,
      status: 'PendingReview',
      documentsSaved: savedDocsCount,
      message: 'Hồ sơ đã được gửi thành công! Cán bộ tiếp nhận sẽ thẩm định và phản hồi.'
    });
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/reception/track', async (req, res) => {
  try {
    const keyword = cleanText(req.query.keyword || req.query.code || req.query.idCard);
    const phone = cleanText(req.query.phone);
    if (!keyword) throw httpError(400, 'Vui lòng nhập Mã hồ sơ hoặc Số CCCD để tra cứu.');

    let student = await db.get(`
      SELECT s.*,
             b.name AS batch_name, b.academic_year,
             t.name AS target_name, t.required_documents AS target_required_documents
      FROM students s
      LEFT JOIN admission_batches b ON b.id = s.batch_id
      LEFT JOIN admission_targets t ON t.id = s.target_id
      WHERE (s.student_code = ? OR s.id_card = ?) AND s.is_active = 1
    `, [keyword, keyword]);

    if (!student && phone) {
      student = await db.get(`
        SELECT s.*,
               b.name AS batch_name, b.academic_year,
               t.name AS target_name, t.required_documents AS target_required_documents
        FROM students s
        LEFT JOIN admission_batches b ON b.id = s.batch_id
        LEFT JOIN admission_targets t ON t.id = s.target_id
        WHERE s.phone = ? AND s.is_active = 1
      `, [phone]);
    }

    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ học viên phù hợp. Vui lòng kiểm tra lại Mã hồ sơ hoặc Số CCCD.' });
    }

    const docs = await db.all('SELECT id, doc_type, file_name, file_size, file_type, created_at FROM student_documents WHERE student_id = ? AND is_active = 1 ORDER BY id ASC', [student.id]);
    student.documents = docs;
    student.target_required_documents = tryParseJson(student.target_required_documents, []);

    res.json(student);
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/reception/supplement/:id', async (req, res) => {
  try {
    const student = await db.get('SELECT * FROM students WHERE id = ? AND is_active = 1', [req.params.id]);
    if (!student) throw httpError(404, 'Không tìm thấy hồ sơ học viên.');

    const documents = Array.isArray(req.body.documents) ? req.body.documents : [];
    if (!documents.length) throw httpError(400, 'Vui lòng chọn ảnh văn bằng cần bổ sung.');

    const studentFolder = path.join(STUDENT_UPLOAD_ROOT, `student-${student.id}`);
    fs.mkdirSync(studentFolder, { recursive: true });

    let addedCount = 0;
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      if (!doc || !doc.contentBase64) continue;

      const rawBase64 = cleanText(doc.contentBase64 || doc.data);
      const cleanBase64 = rawBase64.replace(/^data:[^;]+;base64,/i, '');
      if (!cleanBase64) continue;

      const buffer = Buffer.from(cleanBase64, 'base64');
      const originalName = cleanText(doc.fileName || doc.name || `BoSung_${i + 1}.jpg`);
      const ext = path.extname(originalName).toLowerCase() || '.jpg';
      const storedName = `supplement-${Date.now()}-${i + 1}${ext}`;
      const filePath = path.join(studentFolder, storedName);

      fs.writeFileSync(filePath, buffer);

      await db.run(`
        INSERT INTO student_documents (student_id, doc_type, file_name, file_path, file_size, file_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        student.id,
        cleanText(doc.docType || 'Văn bằng bổ sung'),
        originalName,
        filePath,
        buffer.length,
        ext.slice(1)
      ]);
      addedCount++;
    }

    await db.run(`
      UPDATE students
      SET status = 'PendingReview', review_notes = ?, updated_at = CONVERT(VARCHAR(19), GETDATE(), 120)
      WHERE id = ?
    `, [`Học viên đã bổ sung ${addedCount} ảnh văn bằng/giấy tờ mới.`, student.id]);

    await db.run(`
      INSERT INTO notifications (title, message, priority, entity_name, entity_id)
      VALUES (?, ?, 'High', 'Students', ?)
    `, [
      `Bổ sung hồ sơ: ${student.full_name} (${student.student_code})`,
      `Học viên đã bổ sung thêm ${addedCount} văn bằng/chứng chỉ theo yêu cầu.`,
      student.id
    ]);

    res.json({ ok: true, addedCount, message: 'Đã cập nhật bổ sung hồ sơ thành công!' });
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/tasks', async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit, 100, 300);
    const rows = await db.all(`
      SELECT TOP (?) * FROM daily_tasks
      WHERE is_active = 1
      ORDER BY (CASE WHEN due_date IS NULL THEN 1 ELSE 0 END) ASC, due_date ASC, id DESC
    `, [limit]);
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const payload = normalizeTaskPayload(req.body || {});
    if (!payload.title) throw httpError(400, 'Tieu de cong viec khong hop le.');
    const info = await db.run(`
      INSERT INTO daily_tasks(title, description, assignee, due_date, priority, status, progress, color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [payload.title, payload.description, payload.assignee, payload.dueDate, payload.priority, payload.status, payload.progress, payload.color]);
    const row = await db.get('SELECT * FROM daily_tasks WHERE id = ?', [info.lastInsertRowid]);
    await auditLog('Create', 'Tasks', row.id, row, null, req);
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const current = await db.get('SELECT * FROM daily_tasks WHERE id = ? AND is_active = 1', [req.params.id]);
    if (!current) throw httpError(404, 'Khong tim thay cong viec.');
    const payload = normalizeTaskPayload(req.body || {}, current);
    if (!payload.title) throw httpError(400, 'Tieu de cong viec khong hop le.');
    await db.run(`
      UPDATE daily_tasks
      SET title = ?, description = ?, assignee = ?, due_date = ?, priority = ?, status = ?,
          progress = ?, color = ?, updated_at = CONVERT(VARCHAR(19), GETDATE(), 120)
      WHERE id = ?
    `, [payload.title, payload.description, payload.assignee, payload.dueDate, payload.priority, payload.status, payload.progress, payload.color, current.id]);
    const row = await db.get('SELECT * FROM daily_tasks WHERE id = ?', [current.id]);
    await auditLog('Update', 'Tasks', row.id, row, current, req);
    res.json(row);
  } catch (error) {
    sendError(res, error);
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const current = await db.get('SELECT * FROM daily_tasks WHERE id = ? AND is_active = 1', [req.params.id]);
    if (!current) return res.status(404).json({ message: 'Khong tim thay cong viec.' });
    await db.run('UPDATE daily_tasks SET is_active = 0, updated_at = CONVERT(VARCHAR(19), GETDATE(), 120) WHERE id = ?', [current.id]);
    await auditLog('Delete', 'Tasks', current.id, null, current, req);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

app.post(['/api/tasks/remind', '/api/tasks/:id/remind'], async (req, res) => {
  try {
    const id = req.params.id || req.body?.id;
    const task = id ? await db.get('SELECT * FROM daily_tasks WHERE id = ? AND is_active = 1', [id]) : null;
    if (!task) throw httpError(404, 'Khong tim thay cong viec de nhac.');
    const notification = await createNotification({
      title: `Nhắc việc: ${task.title}`,
      message: `${task.assignee || 'Người phụ trách'} cần xử lý trước hạn ${task.due_date || 'chưa đặt'}.`,
      priority: task.priority,
      status: 'Queued',
      entity_name: 'Tasks',
      entity_id: task.id
    }, req);
    await auditLog('Remind', 'Tasks', task.id, notification, task, req);
    res.json({ ok: true, notification });
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/notifications', async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit, 50, 200);
    const rows = await db.all('SELECT TOP (?) * FROM notifications ORDER BY id DESC', [limit]);
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
});

app.post(['/api/notifications', '/api/notifications/send'], async (req, res) => {
  try {
    const created = await createNotification(req.body || {}, req);
    res.status(201).json(created);
  } catch (error) {
    sendError(res, error);
  }
});

app.put(['/api/notifications/read', '/api/notifications/:id/read'], async (req, res) => {
  try {
    const id = req.params.id || req.body?.id;
    if (!id) return res.status(400).json({ message: 'Thieu id thong bao.' });
    const current = await db.get('SELECT * FROM notifications WHERE id = ?', [id]);
    if (!current) return res.status(404).json({ message: 'Khong tim thay thong bao.' });
    await db.run(`
      UPDATE notifications
      SET is_read = 1, status = 'Read', read_at = CONVERT(VARCHAR(19), GETDATE(), 120)
      WHERE id = ?
    `, [id]);
    const row = await db.get('SELECT * FROM notifications WHERE id = ?', [id]);
    await auditLog('Read', 'Notifications', row.id, row, current, req);
    res.json(row);
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/ai/documents', async (req, res) => {
  try {
    const rows = await db.all('SELECT TOP 100 * FROM ai_documents ORDER BY id DESC');
    const docsFolder = listMarkdownDocuments().map(({ content, ...document }) => ({
      ...document,
      created_at: null
    }));
    res.json([...docsFolder, ...rows]);
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/ai/upload', async (req, res) => {
  try {
    const fileName = cleanText(req.body?.file_name ?? req.body?.fileName);
    if (!fileName) throw httpError(400, 'Ten tai lieu khong hop le.');
    const info = await db.run(`
      INSERT INTO ai_documents(file_name, file_type, scope, uploaded_by, status)
      VALUES (?, ?, ?, ?, ?)
    `, [fileName, cleanText(req.body?.file_type ?? req.body?.fileType), cleanText(req.body?.scope || 'Công khai'), cleanText(req.body?.uploaded_by ?? req.body?.uploadedBy), 'Indexed']);
    const row = await db.get('SELECT * FROM ai_documents WHERE id = ?', [info.lastInsertRowid]);
    await auditLog('Upload', 'AiDocuments', row.id, row, null, req);
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

app.delete('/api/ai/documents/:id', async (req, res) => {
  try {
    const current = await db.get('SELECT * FROM ai_documents WHERE id = ?', [req.params.id]);
    if (!current) return res.status(404).json({ message: 'Khong tim thay tai lieu AI.' });
    await db.run('DELETE FROM ai_documents WHERE id = ?', [req.params.id]);
    await auditLog('Delete', 'AiDocuments', req.params.id, null, current, req);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const question = cleanText(req.body?.question ?? req.body?.message);
    if (!question) throw httpError(400, 'Cau hoi khong duoc de trong.');
    const result = await aiAnswer(question);
    const info = await db.run(`
      INSERT INTO ai_conversations(question, answer, sources)
      VALUES (?, ?, ?)
    `, [question, result.answer, JSON.stringify(result.sources)]);
    await auditLog('AI Chat', 'AiConversation', info.lastInsertRowid, { question, sources: result.sources, provider: result.provider, model: result.model }, null, req);
    res.json({
      id: info.lastInsertRowid,
      answer: result.answer,
      sources: result.sources,
      provider: result.provider,
      model: result.model,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/ai/history', async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit, 20, 100);
    const rows = await db.all('SELECT TOP (?) * FROM ai_conversations ORDER BY id DESC', [limit]);
    res.json(rows.map(row => ({ ...row, sources: JSON.parse(row.sources || '[]') })));
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/audit-logs', async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit, 50, 200);
    const rows = await db.all('SELECT TOP (?) * FROM audit_logs ORDER BY id DESC', [limit]);
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/exam-sessions', async (req, res) => {
  try {
    const sessions = await listExamSessions(req.query.includeInactive === '1' || req.query.includeInactive === 'true');
    res.json(sessions);
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/exam-sessions/:id', async (req, res) => {
  try {
    const row = await getExamSession(req.params.id, req.query.includeInactive === '1' || req.query.includeInactive === 'true');
    if (!row) return res.status(404).json({ message: 'Không tìm thấy kỳ thi.' });
    res.json(row);
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/exam-sessions', async (req, res) => {
  try {
    const payload = normalizeExamSessionPayload(req.body || {}, {}, { requireAny: true });
    
    let createdId;
    await db.transaction(async (tx) => {
      const info = await tx.run(`
        INSERT INTO exam_sessions(target_name, student_count, note)
        VALUES (?, ?, ?)
      `, [payload.targetName, payload.studentCount, payload.note]);
      createdId = info.lastInsertRowid;
      await syncExamSubjects(createdId, payload.subjects, tx);
    });

    const created = await getExamSession(createdId);
    await auditLog('Create', 'ExamSession', createdId, created, null, req);
    res.status(201).json(created);
  } catch (error) {
    sendError(res, error);
  }
});

app.put('/api/exam-sessions/:id', async (req, res) => {
  try {
    const current = await getExamSession(req.params.id, true);
    if (!current || Number(current.is_active) !== 1) throw httpError(404, 'Không tìm thấy kỳ thi.');
    const payload = normalizeExamSessionPayload(req.body || {}, current, { requireAny: true });

    await db.transaction(async (tx) => {
      await tx.run(`
        UPDATE exam_sessions
        SET target_name = ?, student_count = ?, note = ?, updated_at = CONVERT(VARCHAR(19), GETDATE(), 120)
        WHERE id = ?
      `, [payload.targetName, payload.studentCount, payload.note, current.id]);
      await syncExamSubjects(current.id, payload.subjects, tx);
    });

    const updated = await getExamSession(current.id);
    await auditLog('Update', 'ExamSession', current.id, updated, current, req);
    res.json(updated);
  } catch (error) {
    sendError(res, error);
  }
});

app.delete('/api/exam-sessions/:id', async (req, res) => {
  try {
    const current = await getExamSession(req.params.id, true);
    if (!current || Number(current.is_active) !== 1) throw httpError(404, 'Không tìm thấy kỳ thi.');

    await db.transaction(async (tx) => {
      await tx.run('UPDATE exam_sessions SET is_active = 0, updated_at = CONVERT(VARCHAR(19), GETDATE(), 120) WHERE id = ?', [current.id]);
      await tx.run('UPDATE exam_subjects SET is_active = 0, updated_at = CONVERT(VARCHAR(19), GETDATE(), 120) WHERE exam_session_id = ?', [current.id]);
      await tx.run('UPDATE exam_documents SET is_active = 0 WHERE exam_session_id = ?', [current.id]);
    });

    await auditLog('Delete', 'ExamSession', current.id, null, current, req);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/exam-sessions/:id/documents', async (req, res) => {
  try {
    const exam = await getExamSession(req.params.id);
    if (!exam) throw httpError(404, 'Không tìm thấy kỳ thi.');
    const payload = normalizeExamDocumentPayload(req.body || {});
    const relativePath = `exam-${exam.id}/${payload.storedName}`;
    const fullPath = getDocumentFullPath(relativePath);
    ensureExamFolder(exam.id);
    fs.writeFileSync(fullPath, payload.buffer);

    const info = await db.run(`
      INSERT INTO exam_documents(exam_session_id, document_type, original_name, stored_name, file_type, size, relative_path)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      exam.id,
      payload.documentType,
      payload.originalName,
      payload.storedName,
      payload.fileType,
      payload.buffer.length,
      relativePath
    ]);

    const docs = await listExamDocuments(exam.id);
    const created = docs.find(item => item.id === info.lastInsertRowid);
    await auditLog('Upload', 'ExamDocument', info.lastInsertRowid, created, null, req);
    res.status(201).json(created);
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/exam-sessions/:id/documents/:documentId/download', async (req, res) => {
  try {
    const exam = await getExamSession(req.params.id);
    if (!exam) throw httpError(404, 'Không tìm thấy kỳ thi.');
    const document = await db.get(`
      SELECT * FROM exam_documents
      WHERE id = ? AND exam_session_id = ? AND is_active = 1
    `, [req.params.documentId, exam.id]);
    if (!document) throw httpError(404, 'Không tìm thấy tài liệu.');

    const fullPath = getDocumentFullPath(document.relative_path);
    if (!fs.existsSync(fullPath)) throw httpError(404, 'File tài liệu không còn tồn tại trên máy chủ.');
    await auditLog('Download', 'ExamDocument', document.id, { original_name: document.original_name }, null, req);
    res.download(fullPath, document.original_name);
  } catch (error) {
    sendError(res, error);
  }
});

app.delete('/api/exam-sessions/:id/documents/:documentId', async (req, res) => {
  try {
    const exam = await getExamSession(req.params.id);
    if (!exam) throw httpError(404, 'Không tìm thấy kỳ thi.');
    const document = await db.get(`
      SELECT * FROM exam_documents
      WHERE id = ? AND exam_session_id = ? AND is_active = 1
    `, [req.params.documentId, exam.id]);
    if (!document) throw httpError(404, 'Không tìm thấy tài liệu.');

    await db.run('UPDATE exam_documents SET is_active = 0 WHERE id = ?', [document.id]);
    await auditLog('Delete', 'ExamDocument', document.id, null, document, req);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/exams', async (req, res) => {
  try {
    const examSessionId = await normalizeExamSessionId(req.query.examSessionId ?? req.query.exam_session_id);
    const [examSessions, rooms, ex1, ex2, sups, latestSession, recentHistory] = await Promise.all([
      listExamSessions(),
      listRooms(examSessionId),
      listByRole('examiner1', examSessionId),
      listByRole('examiner2', examSessionId),
      listByRole('supervisor', examSessionId),
      db.get('SELECT TOP 1 * FROM draw_sessions ORDER BY id DESC'),
      db.all('SELECT TOP 5 * FROM draw_sessions ORDER BY id DESC')
    ]);

    res.json({
      examSessionId,
      examSessions,
      rooms,
      teachers: {
        examiner1: ex1,
        examiner2: ex2,
        supervisor: sups
      },
      latestSession: latestSession || null,
      recentHistory
    });
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/docs.json', (req, res) => {
  try {
    res.json(readApiDocs());
  } catch (error) {
    res.status(500).json({ message: 'Khong doc duoc API docs.' });
  }
});

app.get('/api/docs', (req, res) => {
  try {
    const docs = readApiDocs();
    if (req.query.format === 'json' || req.accepts(['html', 'json']) === 'json') {
      return res.json(docs);
    }
    res.type('html').send(renderApiDocsHtml(docs));
  } catch (error) {
    res.status(500).json({ message: 'Khong doc duoc API docs.' });
  }
});

app.post('/api/auth/google/register', (req, res) => {
  handleGoogleAuth(req, res, 'register');
});

app.post('/api/auth/google/login', (req, res) => {
  handleGoogleAuth(req, res, 'login');
});

app.post('/api/auth/google', (req, res) => {
  handleGoogleAuth(req, res, 'register');
});

app.get('/api/users', async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === '1' || req.query.includeInactive === 'true';
    const where = includeInactive ? '' : 'WHERE is_active = 1';
    const users = await db.all(`SELECT ${USER_PUBLIC_COLUMNS} FROM users ${where} ORDER BY id DESC`);
    res.json(users.map(serializeUser));
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/users/menu-permissions', (req, res) => {
  res.json(USER_MENU_PERMISSIONS);
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === '1' || req.query.includeInactive === 'true';
    const user = await getPublicUser(req.params.id, includeInactive);
    if (!user) return res.status(404).json({ message: 'Khong tim thay user.' });
    res.json(user);
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const body = req.body || {};
    const payload = normalizeUserPayload(body);
    const passwordError = validatePassword(body.password);
    if (passwordError) return res.status(400).json({ message: passwordError });

    const payloadError = validateUserPayload(payload, { requireUsername: true, requireFullName: true });
    if (payloadError) return res.status(400).json({ message: payloadError });

    if (await usernameExists(payload.username)) {
      return res.status(409).json({ message: 'Username da ton tai.' });
    }

    const hasIsActive = Object.prototype.hasOwnProperty.call(body, 'is_active') || Object.prototype.hasOwnProperty.call(body, 'isActive');
    const isActiveValue = body.is_active ?? body.isActive;
    const isActive = hasIsActive ? (isActiveValue ? 1 : 0) : 1;

    const info = await db.run(`
      INSERT INTO users(username, password_hash, full_name, rank, unit, role, email, phone, permissions, note, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      payload.username,
      hashPassword(body.password),
      payload.fullName,
      payload.rank,
      payload.unit,
      payload.role,
      payload.email,
      payload.phone,
      JSON.stringify(payload.permissions || defaultPermissionsForRole(payload.role)),
      payload.note,
      isActive
    ]);

    const created = await getPublicUser(info.lastInsertRowid, true);
    await auditLog('Create', 'Users', created.id, created, null, req);
    res.status(201).json(created);
  } catch (error) {
    sendError(res, error);
  }
});

async function updateUser(req, res) {
  try {
    const body = req.body || {};
    const current = await getPublicUser(req.params.id, true);
    if (!current) return res.status(404).json({ message: 'Khong tim thay user.' });

    const payload = normalizeUserPayload({
      username: body.username ?? current.username,
      full_name: body.full_name ?? body.fullName ?? current.full_name,
      rank: body.rank ?? current.rank,
      unit: body.unit ?? current.unit,
      role: body.role ?? current.role,
      email: body.email ?? current.email,
      phone: body.phone ?? current.phone,
      permissions: body.permissions ?? current.permissions,
      note: body.note ?? current.note
    });
    const payloadError = validateUserPayload(payload, { requireUsername: true, requireFullName: true });
    if (payloadError) return res.status(400).json({ message: payloadError });

    if (await usernameExists(payload.username, current.id)) {
      return res.status(409).json({ message: 'Username da ton tai.' });
    }

    const hasIsActive = Object.prototype.hasOwnProperty.call(body, 'is_active') || Object.prototype.hasOwnProperty.call(body, 'isActive');
    const isActiveValue = body.is_active ?? body.isActive;
    const isActive = hasIsActive ? (isActiveValue ? 1 : 0) : current.is_active;

    await db.run(`
      UPDATE users
      SET username = ?,
          full_name = ?,
          rank = ?,
          unit = ?,
          role = ?,
          email = ?,
          phone = ?,
          permissions = ?,
          note = ?,
          is_active = ?,
          updated_at = CONVERT(VARCHAR(19), GETDATE(), 120)
      WHERE id = ?
    `, [
      payload.username,
      payload.fullName,
      payload.rank,
      payload.unit,
      payload.role,
      payload.email,
      payload.phone,
      JSON.stringify(payload.permissions || defaultPermissionsForRole(payload.role)),
      payload.note,
      isActive,
      current.id
    ]);

    const updated = await getPublicUser(current.id, true);
    await auditLog('Update', 'Users', current.id, updated, current, req);
    res.json(updated);
  } catch (error) {
    sendError(res, error);
  }
}

app.patch('/api/users/:id/password', async (req, res) => {
  try {
    const body = req.body || {};
    const current = await getPublicUser(req.params.id, true);
    if (!current) return res.status(404).json({ message: 'Khong tim thay user.' });

    const passwordError = validatePassword(body.password);
    if (passwordError) return res.status(400).json({ message: passwordError });

    await db.run('UPDATE users SET password_hash = ?, updated_at = CONVERT(VARCHAR(19), GETDATE(), 120) WHERE id = ?', [hashPassword(body.password), current.id]);
    await auditLog('UpdatePassword', 'Users', current.id, { username: current.username }, null, req);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

app.put('/api/users/:id', updateUser);
app.patch('/api/users/:id', updateUser);

app.delete('/api/users/:id', async (req, res) => {
  try {
    const current = await getPublicUser(req.params.id, true);
    if (!current) return res.status(404).json({ message: 'Khong tim thay user.' });

    await db.run('UPDATE users SET is_active = 0, updated_at = CONVERT(VARCHAR(19), GETDATE(), 120) WHERE id = ?', [current.id]);
    await auditLog('Lock', 'Users', current.id, { username: current.username, is_active: 0 }, current, req);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/bootstrap', async (req, res) => {
  try {
    const examSessionId = await normalizeExamSessionId(req.query.examSessionId ?? req.query.exam_session_id);
    const [examSessions, ex1, ex2, sups, rooms, latestSession] = await Promise.all([
      listExamSessions(),
      listByRole('examiner1', examSessionId),
      listByRole('examiner2', examSessionId),
      listByRole('supervisor', examSessionId),
      listRooms(examSessionId),
      db.get('SELECT TOP 1 * FROM draw_sessions ORDER BY id DESC')
    ]);

    res.json({
      plans: PLANS,
      examSessionId,
      examSessions,
      teachers: {
        examiner1: ex1,
        examiner2: ex2,
        supervisor: sups
      },
      rooms,
      latestSession: latestSession || null
    });
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/teachers', async (req, res) => {
  try {
    const { name, role, unit = '', note = '' } = req.body;
    if (!name || !ROLES.includes(role)) return res.status(400).json({ message: 'Tên hoặc vai trò không hợp lệ.' });
    const examSessionId = await normalizeExamSessionId(req.body?.examSessionId ?? req.body?.exam_session_id);
    const info = await db.run('INSERT INTO teachers(name, role, unit, note, exam_session_id) VALUES (?, ?, ?, ?, ?)', [name.trim(), role, unit.trim(), note.trim(), examSessionId]);
    res.json({ id: info.lastInsertRowid, name, role, unit, note, exam_session_id: examSessionId });
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/teachers/import', async (req, res) => {
  try {
    const { role, names = '' } = req.body;
    if (!ROLES.includes(role)) return res.status(400).json({ message: 'Vai trò không hợp lệ.' });
    const examSessionId = await normalizeExamSessionId(req.body?.examSessionId ?? req.body?.exam_session_id);
    const lines = names.split(/\r?\n/).map(x => x.trim()).filter(Boolean);

    await db.transaction(async (tx) => {
      for (const name of lines) {
        await tx.run('INSERT INTO teachers(name, role, exam_session_id) VALUES (?, ?, ?)', [name, role, examSessionId]);
      }
    });

    res.json({ inserted: lines.length });
  } catch (error) {
    sendError(res, error);
  }
});

app.delete('/api/teachers/:id', async (req, res) => {
  try {
    await db.run('UPDATE teachers SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const { name, capacity = null, note = '' } = req.body;
    if (!name) return res.status(400).json({ message: 'Tên phòng thi không hợp lệ.' });
    const examSessionId = await normalizeExamSessionId(req.body?.examSessionId ?? req.body?.exam_session_id);
    const info = await db.run('INSERT INTO exam_rooms(name, capacity, note, exam_session_id) VALUES (?, ?, ?, ?)', [name.trim(), capacity, note.trim(), examSessionId]);
    res.json({ id: info.lastInsertRowid, name, capacity, note, exam_session_id: examSessionId });
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/rooms/import', async (req, res) => {
  try {
    const { names = '' } = req.body;
    const examSessionId = await normalizeExamSessionId(req.body?.examSessionId ?? req.body?.exam_session_id);
    const lines = names.split(/\r?\n/).map(x => x.trim()).filter(Boolean);

    await db.transaction(async (tx) => {
      for (const name of lines) {
        await tx.run('INSERT INTO exam_rooms(name, exam_session_id) VALUES (?, ?)', [name, examSessionId]);
      }
    });

    res.json({ inserted: lines.length });
  } catch (error) {
    sendError(res, error);
  }
});

app.delete('/api/rooms/:id', async (req, res) => {
  try {
    await db.run('UPDATE exam_rooms SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

app.patch('/api/rooms/:id/supervisor-pair', async (req, res) => {
  try {
    const allow = req.body.allow ? 1 : 0;
    await db.run('UPDATE exam_rooms SET allow_supervisor_pair = ? WHERE id = ?', [allow, req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/draw', async (req, res) => {
  try {
    const examSubjectId = Number(req.body?.examSubjectId ?? req.body?.exam_subject_id) || null;
    const subjectContext = examSubjectId ? await getExamSubjectContext(examSubjectId) : null;
    const constraints = await getRecentDrawConstraints(2, subjectContext?.subject_id || null, subjectContext?.exam_session_id || null);
    const last = subjectContext
      ? await db.get('SELECT TOP 1 result_hash FROM draw_sessions WHERE exam_subject_id = ? ORDER BY id DESC', [subjectContext.subject_id])
      : await db.get('SELECT TOP 1 result_hash FROM draw_sessions WHERE exam_subject_id IS NULL ORDER BY id DESC');
    
    let draw;
    let resultHash;
    let attempts = 0;

    do {
      draw = await buildDrawV2(constraints, subjectContext?.exam_session_id || null);
      resultHash = hashResult(draw.planName, draw.rows);
      attempts++;
    } while (last && resultHash === last.result_hash && attempts < 50);

    if (last && resultHash === last.result_hash) {
      return res.status(409).json({ message: 'Không tạo được kết quả khác các lần bốc thăm trước. Vui lòng bổ sung thêm cán bộ/phòng thi.' });
    }

    let sessionId;
    await db.transaction(async (tx) => {
      const session = await tx.run(
        'INSERT INTO draw_sessions(plan_name, result_hash, exam_session_id, exam_subject_id) VALUES (?, ?, ?, ?)',
        [draw.planName, resultHash, subjectContext?.exam_session_id || null, subjectContext?.subject_id || null]
      );
      sessionId = session.lastInsertRowid;

      for (const row of draw.rows) {
        await tx.run(`
          INSERT INTO draw_results(session_id, room_id, room_name, examiner1_id, examiner1_name, examiner2_id, examiner2_name, supervisor_id, supervisor_name)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          sessionId,
          row.roomId,
          row.roomName,
          row.examiner1Id,
          row.examiner1Name,
          row.examiner2Id,
          row.examiner2Name,
          row.supervisorId,
          row.supervisorName
        ]);
      }

      for (const row of draw.reserves) {
        await tx.run(`
          INSERT INTO draw_reserves(session_id, role, staff_id, staff_name)
          VALUES (?, ?, ?, ?)
        `, [
          sessionId,
          row.role,
          row.staffId,
          row.staffName
        ]);
      }
    });

    await auditLog('Create', 'DrawSession', sessionId, {
      planName: draw.planName,
      rooms: draw.rows.length,
      examSessionId: subjectContext?.exam_session_id || null,
      examSubjectId: subjectContext?.subject_id || null
    }, null, req);

    res.json({
      sessionId,
      planName: draw.planName,
      examSessionId: subjectContext?.exam_session_id || null,
      examSubjectId: subjectContext?.subject_id || null,
      targetName: subjectContext?.target_name || null,
      examDate: subjectContext?.exam_date || null,
      subjectName: subjectContext?.subject_name || null,
      rows: draw.rows,
      reserves: draw.reserves
    });
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const examSubjectId = Number(req.query.examSubjectId ?? req.query.exam_subject_id) || null;
    const baseQuery = `
      SELECT TOP 5
        d.*,
        e.target_name,
        s.exam_date,
        s.subject_name
      FROM draw_sessions d
      LEFT JOIN exam_sessions e ON e.id = d.exam_session_id
      LEFT JOIN exam_subjects s ON s.id = d.exam_subject_id
    `;
    const sessions = examSubjectId
      ? await db.all(`${baseQuery} WHERE d.exam_subject_id = ? ORDER BY d.id DESC`, [examSubjectId])
      : await db.all(`${baseQuery} ORDER BY d.id DESC`);
    res.json(sessions);
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/history/:id', async (req, res) => {
  try {
    const session = await db.get(`
      SELECT
        d.*,
        e.target_name,
        e.student_count,
        s.exam_date,
        s.subject_name
      FROM draw_sessions d
      LEFT JOIN exam_sessions e ON e.id = d.exam_session_id
      LEFT JOIN exam_subjects s ON s.id = d.exam_subject_id
      WHERE d.id = ?
    `, [req.params.id]);
    if (!session) return res.status(404).json({ message: 'Không tìm thấy phiên bốc thăm.' });
    
    const dbRows = await db.all('SELECT * FROM draw_results WHERE session_id = ? ORDER BY id ASC', [req.params.id]);
    const rows = sortRooms(dbRows.map(r => ({ ...r, name: r.room_name })));
    rows.forEach(r => delete r.name);

    const reserves = await db.all('SELECT * FROM draw_reserves WHERE session_id = ? ORDER BY id ASC', [req.params.id]);
    res.json({ session, rows, reserves });
  } catch (error) {
    sendError(res, error);
  }
});

app.delete('/api/history/:id', async (req, res) => {
  try {
    const session = await db.get(`
      SELECT
        d.*,
        e.target_name,
        e.student_count,
        s.exam_date,
        s.subject_name
      FROM draw_sessions d
      LEFT JOIN exam_sessions e ON e.id = d.exam_session_id
      LEFT JOIN exam_subjects s ON s.id = d.exam_subject_id
      WHERE d.id = ?
    `, [req.params.id]);
    if (!session) throw httpError(404, 'Không tìm thấy phiên bốc thăm.');

    const [rows, reserves] = await Promise.all([
      db.all('SELECT * FROM draw_results WHERE session_id = ? ORDER BY id ASC', [session.id]),
      db.all('SELECT * FROM draw_reserves WHERE session_id = ? ORDER BY id ASC', [session.id])
    ]);

    await db.transaction(async (tx) => {
      await tx.run('DELETE FROM draw_reserves WHERE session_id = ?', [session.id]);
      await tx.run('DELETE FROM draw_results WHERE session_id = ?', [session.id]);
      await tx.run('DELETE FROM draw_sessions WHERE id = ?', [session.id]);
    });

    await auditLog('Delete', 'DrawSession', session.id, null, {
      session,
      rows_count: rows.length,
      reserves_count: reserves.length
    }, req);
    res.json({ ok: true, id: session.id });
  } catch (error) {
    sendError(res, error);
  }
});

function xmlEscape(value) {
  return String(value ?? '').replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
}

function p(text = '', bold = false, align = 'left') {
  const jc = align === 'center' ? '<w:jc w:val="center"/>' : align === 'right' ? '<w:jc w:val="right"/>' : '';
  const b = bold ? '<w:b/>' : '';
  return `<w:p><w:pPr>${jc}<w:spacing w:after="80"/></w:pPr><w:r><w:rPr>${b}<w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`;
}

function cell(text = '', opts = {}) {
  const width = opts.width || 1800;
  const bold = opts.bold ? '<w:b/>' : '';
  const align = opts.align || 'center';
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:jc w:val="${align}"/></w:pPr><w:r><w:rPr>${bold}<w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p></w:tc>`;
}

function table(rows) {
  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="8"/><w:left w:val="single" w:sz="8"/><w:bottom w:val="single" w:sz="8"/><w:right w:val="single" w:sz="8"/><w:insideH w:val="single" w:sz="8"/><w:insideV w:val="single" w:sz="8"/></w:tblBorders></w:tblPr>${rows.map(r => `<w:tr>${r.join('')}</w:tr>`).join('')}</w:tbl>`;
}

function sectionBreak() {
  return '<w:p><w:pPr><w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:pPr></w:p>';
}

async function buildExportDocx(session, rows) {
  const dateSource = session.exam_date ? `${session.exam_date}T00:00:00` : session.created_at;
  const dateText = new Date(dateSource).toLocaleDateString('vi-VN');
  const targetText = session.target_name || '...............................................................';
  const subjectText = session.subject_name || '...............................................................';
  const studentCountText = session.student_count ? `Số lượng học viên: ${session.student_count}` : '';
  const handoverRows = [
    [cell('STT', { bold: true, width: 700 }), cell('Tên phòng thi số', { bold: true, width: 1700 }), cell('Số túi đựng bài thi', { bold: true, width: 1400 }), cell('Tổng số học viên theo danh sách', { bold: true, width: 1700 }), cell('Tổng số học viên có mặt dự thi', { bold: true, width: 1700 }), cell('Tổng số bài thi', { bold: true, width: 1300 }), cell('Cán bộ coi thi số 1', { bold: true, width: 2300 }), cell('Cán bộ coi thi số 2', { bold: true, width: 2300 })],
    ...rows.map((r, i) => [cell(String(i + 1).padStart(2, '0'), { width: 700 }), cell(r.room_name, { width: 1700 }), cell('', { width: 1400 }), cell('', { width: 1700 }), cell('', { width: 1700 }), cell('', { width: 1300 }), cell(r.examiner1_name, { width: 2300, align: 'left' }), cell(r.examiner2_name, { width: 2300, align: 'left' })])
  ];

  const staffTable = (title, field) => [
    p(title, true),
    table([
      [cell('STT', { bold: true, width: 700 }), cell('Cấp bậc', { bold: true, width: 1200 }), cell('Họ và tên', { bold: true, width: 3200 }), cell('Đơn vị', { bold: true, width: 2200 }), cell('Phòng thi', { bold: true, width: 1800 }), cell('Ghi chú', { bold: true, width: 1600 })],
      ...rows.map((r, i) => [cell(String(i + 1), { width: 700 }), cell('', { width: 1200 }), cell(r[field], { width: 3200, align: 'left' }), cell('', { width: 2200 }), cell(r.room_name, { width: 1800 }), cell('', { width: 1600 })])
    ]),
    p('')
  ].join('');

  const body = `
    ${p('HỌC VIỆN CHÍNH TRỊ', true, 'center')}${p('HỘI ĐỒNG THI TỐT NGHIỆP', true, 'center')}
    ${p('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', true, 'center')}${p('Độc lập - Tự do - Hạnh phúc', true, 'center')}
    ${p('BIÊN BẢN BÀN GIAO BÀI THI TỐT NGHIỆP', true, 'center')}
    ${p('Đối tượng: ' + targetText)}${p(studentCountText)}${p('Ngày thi: ' + dateText)}${p('Môn thi: ' + subjectText)}
    ${p('Phương án đánh số báo danh: ' + session.plan_name, true)}
    ${table(handoverRows)}
    ${p('THƯỜNG TRỰC HỘI ĐỒNG                                             BAN THƯ KÝ', true, 'center')}
    ${sectionBreak()}
    ${p('HỌC VIỆN CHÍNH TRỊ', true, 'center')}${p('HỘI ĐỒNG THI TỐT NGHIỆP', true, 'center')}
    ${p('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', true, 'center')}${p('Độc lập - Tự do - Hạnh phúc', true, 'center')}
    ${p('BIÊN BẢN PHÂN CHIA PHÒNG THI', true, 'center')}
    ${p('Đối tượng: ' + targetText)}${p(studentCountText)}${p('Ngày thi: ' + dateText)}${p('Môn thi: ' + subjectText)}
    ${p('Phương án đánh số báo danh: ' + session.plan_name, true)}
    ${staffTable('I. DANH SÁCH CÁN BỘ COI THI SỐ 1', 'examiner1_name')}
    ${staffTable('II. DANH SÁCH CÁN BỘ COI THI SỐ 2', 'examiner2_name')}
    ${staffTable('III. DANH SÁCH CÁN BỘ GIÁM SÁT THI', 'supervisor_name')}
    ${p('THƯỜNG TRỰC HỘI ĐỒNG                                             BAN THƯ KÝ', true, 'center')}
  `;

  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`);
  zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  zip.folder('docProps').file('core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"><dc:title>Biên bản phân chia phòng thi</dc:title><dc:creator>Exam Draw Website</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">${new Date().toISOString()}</dcterms:created></cp:coreProperties>`);
  zip.folder('docProps').file('app.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Exam Draw Website</Application></Properties>`);
  zip.folder('word').folder('_rels').file('document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`);
  zip.folder('word').file('document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`);
  return zip.generateAsync({ type: 'nodebuffer' });
}

async function buildAdmissionReceiptDocx(student) {
  const dateStr = student.declaration_date || student.admission_date || new Date().toISOString().slice(0, 10);
  const parts = dateStr.split('-');
  const dYear = parts[0] || '2026';
  const dMonth = parts[1] || '08';
  const dDay = parts[2] || '03';

  const targetTitle = (student.target_name || 'ĐÀO TẠO NGẮN HẠN CHÍNH ỦY TRUNG, LỮ ĐOÀN').toUpperCase();
  const classTitle = student.class_name ? ` – ${student.class_name.toUpperCase()}` : ' – LỚP 23C';
  const orderText = student.order_index ? String(student.order_index) : '......';

  const body = `
    ${p('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', true, 'center')}
    ${p('Độc lập – Tự do – Hạnh phúc', true, 'center')}
    ${p('_______________________', false, 'center')}
    ${p('')}
    ${p(`PHIẾU ĐĂNG KÝ NHẬP HỌC ${targetTitle}${classTitle}`, true, 'center')}
    ${p('Kính gửi: Phòng Đào tạo/Học viện Chính trị', false, 'center')}
    ${p('')}
    ${p('I. THÔNG TIN HỌC VIÊN', true, 'left')}
    ${p(`   1. Số thứ tự (theo DS trên bảng):   ${orderText}`, false, 'left')}
    ${p(`   2. Họ và tên:                                  ${student.full_name || ''}`, false, 'left')}
    ${p(`   3. Ngày sinh:                                  ${student.birthday || ''}`, false, 'left')}
    ${p(`   4. Nơi sinh:                                   ${student.birthplace || ''}`, false, 'left')}
    ${p(`   5. Quê quán:                                  ${student.hometown || ''}`, false, 'left')}
    ${p('')}
    ${p('II. THÔNG TIN CÔNG TÁC', true, 'left')}
    ${p(`   1. Cấp bậc:                                     ${student.rank || ''}`, false, 'left')}
    ${p(`   2. Chức vụ:                                    ${student.position || ''}`, false, 'left')}
    ${p(`   3. Đơn vị (Trực thuộc Bộ):           ${student.unit || ''}`, false, 'left')}
    ${p(`   4. Trình độ học vấn:                      ${student.education_level || ''}`, false, 'left')}
    ${p('')}
    ${p('III. THÔNG TIN LIÊN HỆ', true, 'left')}
    ${p(`   • Số điện thoại:                               ${student.phone || ''}`, false, 'left')}
    ${student.id_card ? p(`   • Số CCCD/CMND:                            ${student.id_card}`, false, 'left') : ''}
    ${p('')}
    ${p('Ghi chú: Chuẩn bị bản photocopy văn bằng (đã kê khai) kèm bản gốc để đối chiếu tại bàn tiếp nhận học viên nhập học.', true, 'left')}
    ${p('')}
    ${p('Tôi xin cam đoan các thông tin kê khai trên là hoàn toàn chính xác và chấp hành nghiêm chỉnh mọi quy chế, quy định của Học viện.', false, 'left')}
    ${p('')}
    ${p(`Hà Nội, ngày ${parseInt(dDay, 10)} tháng ${parseInt(dMonth, 10)} năm ${dYear}`, false, 'right')}
    ${p('')}
    ${table([
      [
        cell('NGƯỜI KÊ KHAI\n(Ký, ghi rõ họ tên)', { bold: true, width: 4500 })
      ]
    ])}
    ${p('')}
    ${p('')}
    ${p('')}
    ${table([
      [
        cell(student.full_name || '', { bold: true, width: 4500 })
      ]
    ])}
  `;

  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`);
  zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  zip.folder('docProps').file('core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"><dc:title>Phiếu đăng ký nhập học</dc:title><dc:creator>Học viện Chính trị</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">${new Date().toISOString()}</dcterms:created></cp:coreProperties>`);
  zip.folder('docProps').file('app.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Học viện Chính trị - Quản lý tiếp nhận</Application></Properties>`);
  zip.folder('word').folder('_rels').file('document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`);
  zip.folder('word').file('document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838" w:orient="portrait"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1418" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`);
  return zip.generateAsync({ type: 'nodebuffer' });
}

app.get('/api/history/:id/export', async (req, res) => {
  try {
    const session = await db.get(`
      SELECT
        d.*,
        e.target_name,
        e.student_count,
        s.exam_date,
        s.subject_name
      FROM draw_sessions d
      LEFT JOIN exam_sessions e ON e.id = d.exam_session_id
      LEFT JOIN exam_subjects s ON s.id = d.exam_subject_id
      WHERE d.id = ?
    `, [req.params.id]);
    if (!session) return res.status(404).json({ message: 'Không tìm thấy phiên bốc thăm.' });
    
    let rows = await db.all('SELECT * FROM draw_results WHERE session_id = ? ORDER BY id ASC', [req.params.id]);
    rows = sortRooms(rows.map(r => ({ ...r, name: r.room_name }))).map(({ name, ...r }) => r);
    
    const buffer = await buildExportDocx(session, rows);
    await auditLog('Export', 'DrawSession', session.id, { file: `ket-qua-boc-tham-${session.id}.docx` }, null, req);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="ket-qua-boc-tham-${session.id}.docx"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

async function startServer() {
  try {
    await ensureDefaultAdminAccount();
    await ensureAdmissionTables();
    app.listen(PORT, () => {
      console.log(`🚀 ArmyTech Website running on SQL Server at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to initialize server:', err);
    process.exit(1);
  }
}

startServer();
