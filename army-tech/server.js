const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const JSZip = require('jszip');

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
const db = new Database(path.join(__dirname, 'exam-draw.db'));
const EXAM_UPLOAD_ROOT = path.join(__dirname, 'uploads', 'exams');

app.use(cors());
app.use(express.json({ limit: '30mb' }));
app.use(express.static(path.join(__dirname, 'public')));

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  google_sub TEXT UNIQUE,
  full_name TEXT NOT NULL,
  rank TEXT,
  unit TEXT,
  role TEXT NOT NULL CHECK(role IN ('admin','manager','viewer')) DEFAULT 'viewer',
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  auth_provider TEXT NOT NULL DEFAULT 'password',
  permissions TEXT NOT NULL DEFAULT '{}',
  note TEXT,
  is_active INTEGER DEFAULT 1,
  last_login_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('examiner1','examiner2','supervisor')),
  unit TEXT,
  note TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  capacity INTEGER,
  note TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_name TEXT NOT NULL,
  student_count INTEGER DEFAULT 0,
  note TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_session_id INTEGER NOT NULL,
  exam_date TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  note TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(exam_session_id) REFERENCES exam_sessions(id)
);

CREATE TABLE IF NOT EXISTS exam_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_session_id INTEGER NOT NULL,
  document_type TEXT NOT NULL CHECK(document_type IN ('plan','decision')),
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  file_type TEXT,
  size INTEGER DEFAULT 0,
  relative_path TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(exam_session_id) REFERENCES exam_sessions(id)
);

CREATE TABLE IF NOT EXISTS draw_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_name TEXT NOT NULL,
  result_hash TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS draw_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  room_id INTEGER NOT NULL,
  room_name TEXT NOT NULL,
  examiner1_id INTEGER NOT NULL,
  examiner1_name TEXT NOT NULL,
  examiner2_id INTEGER NOT NULL,
  examiner2_name TEXT NOT NULL,
  supervisor_id INTEGER NOT NULL,
  supervisor_name TEXT NOT NULL,
  FOREIGN KEY(session_id) REFERENCES draw_sessions(id)
);

CREATE TABLE IF NOT EXISTS draw_reserves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('examiner1','examiner2','supervisor')),
  staff_id INTEGER NOT NULL,
  staff_name TEXT NOT NULL,
  FOREIGN KEY(session_id) REFERENCES draw_sessions(id)
);

CREATE TABLE IF NOT EXISTS weekly_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  task_date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  content TEXT,
  location TEXT,
  tt_hv TEXT,
  tt_phong TEXT,
  ban TEXT,
  person_in_charge TEXT,
  duty_officer TEXT,
  color TEXT DEFAULT '#166534',
  status TEXT DEFAULT 'Draft',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS weekly_schedule_meta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start TEXT NOT NULL UNIQUE,
  duty_summary TEXT,
  room_summary TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  birthday TEXT,
  rank TEXT,
  unit TEXT,
  phone TEXT,
  email TEXT,
  class_name TEXT,
  admission_date TEXT,
  status TEXT DEFAULT 'Created',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  assignee TEXT,
  due_date TEXT,
  priority TEXT DEFAULT 'Normal',
  status TEXT DEFAULT 'New',
  progress INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  message TEXT,
  channel TEXT DEFAULT 'In App',
  priority TEXT DEFAULT 'Normal',
  status TEXT DEFAULT 'Pending',
  entity_name TEXT,
  entity_id INTEGER,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  read_at TEXT
);

CREATE TABLE IF NOT EXISTS ai_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_name TEXT NOT NULL,
  file_type TEXT,
  scope TEXT DEFAULT 'Công khai',
  uploaded_by TEXT,
  status TEXT DEFAULT 'Indexed',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sources TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT DEFAULT 'system',
  action TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  entity_id TEXT,
  old_value TEXT,
  new_value TEXT,
  ip TEXT,
  device TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

const userColumns = db.prepare('PRAGMA table_info(users)').all().map(column => column.name);
function addUserColumn(name, definition) {
  if (!userColumns.includes(name)) {
    db.prepare(`ALTER TABLE users ADD COLUMN ${name} ${definition}`).run();
  }
}
addUserColumn('google_sub', 'TEXT');
addUserColumn('rank', 'TEXT');
addUserColumn('unit', 'TEXT');
addUserColumn('avatar_url', 'TEXT');
addUserColumn('auth_provider', "TEXT NOT NULL DEFAULT 'password'");
addUserColumn('last_login_at', 'TEXT');
addUserColumn('permissions', "TEXT NOT NULL DEFAULT '{}'");
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub) WHERE google_sub IS NOT NULL');

const teacherColumns = db.prepare('PRAGMA table_info(teachers)').all().map(column => column.name);
if (!teacherColumns.includes('exam_session_id')) {
  db.prepare('ALTER TABLE teachers ADD COLUMN exam_session_id INTEGER').run();
}

const roomColumns = db.prepare('PRAGMA table_info(exam_rooms)').all().map(column => column.name);
if (!roomColumns.includes('exam_session_id')) {
  db.prepare('ALTER TABLE exam_rooms ADD COLUMN exam_session_id INTEGER').run();
}
if (!roomColumns.includes('allow_supervisor_pair')) {
  db.prepare('ALTER TABLE exam_rooms ADD COLUMN allow_supervisor_pair INTEGER DEFAULT 0').run();
}

const drawSessionColumns = db.prepare('PRAGMA table_info(draw_sessions)').all().map(column => column.name);
if (!drawSessionColumns.includes('exam_session_id')) {
  db.prepare('ALTER TABLE draw_sessions ADD COLUMN exam_session_id INTEGER').run();
}
if (!drawSessionColumns.includes('exam_subject_id')) {
  db.prepare('ALTER TABLE draw_sessions ADD COLUMN exam_subject_id INTEGER').run();
}
db.exec(`
CREATE INDEX IF NOT EXISTS idx_exam_subjects_session ON exam_subjects(exam_session_id);
CREATE INDEX IF NOT EXISTS idx_exam_documents_session ON exam_documents(exam_session_id);
CREATE INDEX IF NOT EXISTS idx_draw_sessions_subject ON draw_sessions(exam_subject_id);
CREATE INDEX IF NOT EXISTS idx_teachers_exam_session ON teachers(exam_session_id, role, is_active);
CREATE INDEX IF NOT EXISTS idx_exam_rooms_session ON exam_rooms(exam_session_id, is_active);
`);

const weeklyTaskColumns = db.prepare('PRAGMA table_info(weekly_tasks)').all().map(column => column.name);
function addWeeklyTaskColumn(name, definition) {
  if (!weeklyTaskColumns.includes(name)) {
    db.prepare(`ALTER TABLE weekly_tasks ADD COLUMN ${name} ${definition}`).run();
  }
}
addWeeklyTaskColumn('tt_hv', 'TEXT');
addWeeklyTaskColumn('tt_phong', 'TEXT');
addWeeklyTaskColumn('ban', 'TEXT');

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

function listByRole(role, examSessionId = null) {
  if (examSessionId) {
    return db.prepare(`
      SELECT * FROM teachers
      WHERE role = ? AND exam_session_id = ? AND is_active = 1
      ORDER BY id DESC
    `).all(role, examSessionId);
  }
  return db.prepare(`
    SELECT * FROM teachers
    WHERE role = ? AND exam_session_id IS NULL AND is_active = 1
    ORDER BY id DESC
  `).all(role);
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

function auditLog(action, entityName, entityId, newValue = null, oldValue = null, req = null) {
  try {
    db.prepare(`
      INSERT INTO audit_logs(username, action, entity_name, entity_id, old_value, new_value, ip, device)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req?.headers?.['x-user'] || 'system',
      action,
      entityName,
      entityId == null ? null : String(entityId),
      oldValue == null ? null : JSON.stringify(oldValue),
      newValue == null ? null : JSON.stringify(newValue),
      req?.ip || null,
      req?.headers?.['user-agent'] || null
    );
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

function getPublicUser(id, includeInactive = false) {
  const where = includeInactive ? 'id = ?' : 'id = ? AND is_active = 1';
  return serializeUser(db.prepare(`SELECT ${USER_PUBLIC_COLUMNS} FROM users WHERE ${where}`).get(id));
}

function usernameExists(username, exceptId = null) {
  if (exceptId) {
    return Boolean(db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, exceptId));
  }
  return Boolean(db.prepare('SELECT id FROM users WHERE username = ?').get(username));
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

function ensureDefaultAdminAccount() {
  const activeAdmin = db.prepare("SELECT id FROM users WHERE role = 'admin' AND is_active = 1 LIMIT 1").get();
  if (activeAdmin) return;

  const baseUsername = (cleanEnv(process.env.DEFAULT_ADMIN_USERNAME) || 'admin').toLowerCase();
  const configuredPassword = cleanEnv(process.env.DEFAULT_ADMIN_PASSWORD);
  const password = configuredPassword.length >= 6 ? configuredPassword : 'admin123';
  let username = baseUsername;
  let counter = 1;
  while (usernameExists(username)) {
    username = `${baseUsername}-${counter}`;
    counter++;
  }

  db.prepare(`
    INSERT INTO users(username, password_hash, full_name, role, permissions, note)
    VALUES (?, ?, ?, 'admin', ?, ?)
  `).run(
    username,
    hashPassword(password),
    'Quản trị hệ thống',
    JSON.stringify(defaultPermissionsForRole('admin')),
    'Tài khoản quản trị khởi tạo tự động khi hệ thống chưa có người dùng.'
  );
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

ensureDefaultAdminAccount();

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

function drawSummaryForSubject(subjectId) {
  const row = db.prepare(`
    SELECT COUNT(*) AS draw_count, MAX(created_at) AS latest_draw_at
    FROM draw_sessions
    WHERE exam_subject_id = ?
  `).get(subjectId);
  return {
    draw_count: row?.draw_count || 0,
    latest_draw_at: row?.latest_draw_at || null
  };
}

function listExamSubjects(examSessionId, includeInactive = false) {
  const where = includeInactive ? 'exam_session_id = ?' : 'exam_session_id = ? AND is_active = 1';
  return db.prepare(`
    SELECT * FROM exam_subjects
    WHERE ${where}
    ORDER BY exam_date ASC, id ASC
  `).all(examSessionId).map(row => ({
    ...row,
    ...drawSummaryForSubject(row.id)
  }));
}

function listExamDocuments(examSessionId, includeInactive = false) {
  const where = includeInactive ? 'exam_session_id = ?' : 'exam_session_id = ? AND is_active = 1';
  return db.prepare(`
    SELECT * FROM exam_documents
    WHERE ${where}
    ORDER BY id DESC
  `).all(examSessionId).map(row => ({
    ...row,
    document_type_label: EXAM_DOCUMENT_TYPE_LABELS[row.document_type] || row.document_type
  }));
}

function serializeExamSession(row, includeInactiveChildren = false) {
  if (!row) return null;
  const teachers = {
    examiner1: listByRole('examiner1', row.id).length,
    examiner2: listByRole('examiner2', row.id).length,
    supervisor: listByRole('supervisor', row.id).length
  };
  const rooms = listRooms(row.id).length;
  const subjects = listExamSubjects(row.id, includeInactiveChildren);
  const documents = listExamDocuments(row.id, includeInactiveChildren);
  return {
    ...row,
    student_count: Number(row.student_count) || 0,
    subjects,
    documents,
    summary: {
      subjects: subjects.length,
      documents: documents.length,
      rooms,
      teachers
    }
  };
}

function getExamSession(id, includeInactive = false) {
  const where = includeInactive ? 'id = ?' : 'id = ? AND is_active = 1';
  const row = db.prepare(`SELECT * FROM exam_sessions WHERE ${where}`).get(id);
  return serializeExamSession(row, includeInactive);
}

function normalizeExamSessionId(value, { required = false } = {}) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    if (required) throw httpError(400, 'Vui lòng chọn kỳ thi.');
    return null;
  }
  const exam = getExamSession(id);
  if (!exam) throw httpError(404, 'Không tìm thấy kỳ thi.');
  return exam.id;
}

function listExamSessions(includeInactive = false) {
  const where = includeInactive ? '' : 'WHERE is_active = 1';
  return db.prepare(`
    SELECT * FROM exam_sessions
    ${where}
    ORDER BY id DESC
  `).all().map(row => serializeExamSession(row, includeInactive));
}

function getExamSubjectContext(subjectId) {
  const row = db.prepare(`
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
  `).get(subjectId);
  if (!row) throw httpError(404, 'Không tìm thấy ngày thi - môn thi.');
  return row;
}

function syncExamSubjects(examSessionId, subjects) {
  const existing = db.prepare('SELECT * FROM exam_subjects WHERE exam_session_id = ?').all(examSessionId);
  const existingIds = new Set(existing.map(row => row.id));
  const incomingIds = new Set(subjects.filter(item => item.id && existingIds.has(item.id)).map(item => item.id));

  existing.forEach(row => {
    if (!incomingIds.has(row.id)) {
      db.prepare('UPDATE exam_subjects SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(row.id);
    }
  });

  const insert = db.prepare(`
    INSERT INTO exam_subjects(exam_session_id, exam_date, subject_name, note)
    VALUES (?, ?, ?, ?)
  `);
  const update = db.prepare(`
    UPDATE exam_subjects
    SET exam_date = ?, subject_name = ?, note = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND exam_session_id = ?
  `);

  subjects.forEach(item => {
    if (item.id && existingIds.has(item.id)) {
      update.run(item.examDate, item.subjectName, item.note, item.id, examSessionId);
    } else {
      insert.run(examSessionId, item.examDate, item.subjectName, item.note);
    }
  });
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

function getAuthenticatedUser(req) {
  const payload = getBearerPayload(req);
  const record = getUserRecordById(payload.sub);
  ensureActiveUser(record);
  return getPublicUser(record.id, true);
}

function permissionForApi(req) {
  const pathName = String(req.path || '');
  if (pathName.startsWith('/calendar')) return 'calendar';
  if (pathName.startsWith('/students')) return 'students';
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

function requireApiAccess(req, res, next) {
  try {
    if (String(req.path || '').startsWith('/auth')) return next();
    const user = getAuthenticatedUser(req);
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

function getUserRecordById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
}

function getUserRecordByGoogleSub(googleSub) {
  return db.prepare('SELECT * FROM users WHERE google_sub = ?').get(googleSub) || null;
}

function getUserRecordByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE lower(email) = ? ORDER BY id ASC LIMIT 1').get(String(email).toLowerCase()) || null;
}

function ensureActiveUser(user) {
  if (!user) throw httpError(404, 'Khong tim thay user.');
  if (Number(user.is_active) !== 1) throw httpError(403, 'Tai khoan da bi khoa.');
}

function usernameFromEmail(email) {
  const localPart = String(email).split('@')[0].toLowerCase();
  const base = localPart.replace(/[^a-z0-9._-]/g, '').replace(/^[._-]+|[._-]+$/g, '') || 'user';
  let username = base.slice(0, 50);
  let counter = 1;

  while (usernameExists(username)) {
    const suffix = `-${counter}`;
    username = `${base.slice(0, 50 - suffix.length)}${suffix}`;
    counter++;
  }

  return username;
}

function touchGoogleUser(user, profile) {
  db.prepare(`
    UPDATE users
    SET google_sub = COALESCE(google_sub, ?),
        email = ?,
        avatar_url = ?,
        auth_provider = 'google',
        last_login_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(profile.sub, profile.email, profile.picture, user.id);
  return getPublicUser(user.id, true);
}

function registerGoogleUser(profile) {
  let user = getUserRecordByGoogleSub(profile.sub);
  if (!user) user = getUserRecordByEmail(profile.email);

  if (user) {
    if (user.google_sub && user.google_sub !== profile.sub) {
      throw httpError(409, 'Email nay da lien ket voi tai khoan Google khac.');
    }
    ensureActiveUser(user);
    return { user: touchGoogleUser(user, profile), isNewUser: false };
  }

  const info = db.prepare(`
    INSERT INTO users(username, password_hash, google_sub, full_name, role, email, avatar_url, auth_provider, last_login_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'google', CURRENT_TIMESTAMP)
  `).run(
    usernameFromEmail(profile.email),
    hashPassword(crypto.randomBytes(32).toString('hex')),
    profile.sub,
    profile.name,
    GOOGLE_DEFAULT_ROLE,
    profile.email,
    profile.picture
  );

  return { user: getPublicUser(info.lastInsertRowid, true), isNewUser: true };
}

function loginGoogleUser(profile) {
  let user = getUserRecordByGoogleSub(profile.sub);
  if (!user) {
    user = getUserRecordByEmail(profile.email);
    if (!user) throw httpError(404, 'Tai khoan Google chua duoc dang ky.');
    if (user.google_sub && user.google_sub !== profile.sub) {
      throw httpError(409, 'Email nay da lien ket voi tai khoan Google khac.');
    }
  }

  ensureActiveUser(user);
  return { user: touchGoogleUser(user, profile), isNewUser: false };
}

async function handleGoogleAuth(req, res, mode) {
  try {
    const body = req.body || {};
    const idToken = body.idToken || body.credential;
    if (!idToken) throw httpError(400, 'Thieu Google idToken.');

    const profile = await verifyGoogleIdToken(idToken);
    const result = mode === 'login' ? loginGoogleUser(profile) : registerGoogleUser(profile);
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

function listRooms(examSessionId = null) {
  if (examSessionId) {
    return sortRooms(db.prepare(`
      SELECT * FROM exam_rooms
      WHERE exam_session_id = ? AND is_active = 1
      ORDER BY id ASC
    `).all(examSessionId));
  }
  return sortRooms(db.prepare(`
    SELECT * FROM exam_rooms
    WHERE exam_session_id IS NULL AND is_active = 1
    ORDER BY id ASC
  `).all());
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

function getRecentDrawConstraints(limit = 2, examSubjectId = null, examSessionId = null) {
  // If an examSessionId is provided, use all previous draw_sessions within that exam session.
    const sessions = examSessionId
      ? db.prepare('SELECT id, plan_name FROM draw_sessions WHERE exam_session_id = ? ORDER BY id DESC LIMIT ?').all(examSessionId, limit)
      : (examSubjectId
        ? db.prepare('SELECT id, plan_name FROM draw_sessions WHERE exam_subject_id = ? ORDER BY id DESC LIMIT ?').all(examSubjectId, limit)
        : db.prepare('SELECT id, plan_name FROM draw_sessions WHERE exam_subject_id IS NULL ORDER BY id DESC LIMIT ?').all(limit));
  const recentRooms = {
    examiner1: new Map(),
    examiner2: new Map(),
    supervisor: new Map()
  };

  sessions.forEach(session => {
    const rows = db.prepare('SELECT room_id, examiner1_id, examiner2_id, supervisor_id FROM draw_results WHERE session_id = ?').all(session.id);
    rows.forEach(row => {
      addRecentRoom(recentRooms.examiner1, row.examiner1_id, row.room_id);
      addRecentRoom(recentRooms.examiner2, row.examiner2_id, row.room_id);
      addRecentRoom(recentRooms.supervisor, row.supervisor_id, row.room_id);
    });
  });

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

function assignSupervisors(rooms, supervisors) {
  if (supervisors.length >= rooms.length) {
    const assigned = new Map(rooms.map((room, index) => [room.id, supervisors[index]]));
    return {
      assigned,
      reserves: supervisors.slice(rooms.length)
    };
  }

  const deficit = rooms.length - supervisors.length;
  if (supervisors.length < Math.ceil(rooms.length / 2)) {
    throw httpError(400, 'Số cán bộ giám sát thi không đủ. Mỗi cán bộ giám sát chỉ được ghép tối đa 2 phòng thi.');
  }

  const pairableRooms = rooms.filter(room => Number(room.allow_supervisor_pair) === 1);
  if (pairableRooms.length < deficit * 2) {
    throw httpError(400, 'Chưa tích đủ phòng thi được ghép cán bộ giám sát thi.');
  }

  const roomsInPairs = new Set();
  const groups = [];
  for (let i = 0; i < deficit * 2; i += 2) {
    const first = pairableRooms[i];
    const second = pairableRooms[i + 1];
    roomsInPairs.add(first.id);
    roomsInPairs.add(second.id);
    groups.push([first, second]);
  }
  rooms.forEach(room => {
    if (!roomsInPairs.has(room.id)) groups.push([room]);
  });

  const assigned = new Map();
  groups.forEach((group, index) => {
    group.forEach(room => assigned.set(room.id, supervisors[index]));
  });
  return { assigned, reserves: [] };
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

function buildDraw(examSessionId = null) {
  const rooms = listRooms(examSessionId);
  const examiner1 = listByRole('examiner1', examSessionId);
  const examiner2 = listByRole('examiner2', examSessionId);
  const supervisors = listByRole('supervisor', examSessionId);

  if (!rooms.length) throw httpError(400, 'Chưa có danh sách phòng thi.');
  if (examiner1.length < rooms.length) throw httpError(400, 'Số cán bộ coi thi 1 ít hơn số phòng thi.');
  if (examiner2.length < rooms.length) throw httpError(400, 'Số cán bộ coi thi 2 ít hơn số phòng thi.');
  if (supervisors.length < rooms.length) throw httpError(400, 'Số cán bộ giám sát thi ít hơn số phòng thi.');

  // Phòng thi luôn giữ đúng thứ tự: Phòng thi số 1, 2, 3...; chỉ cán bộ được đảo ngẫu nhiên.
  const sRooms = sortRooms(rooms);
  const sExaminer1 = shuffle(examiner1);
  const sExaminer2 = shuffle(examiner2);
  const sSupervisors = shuffle(supervisors);
  const planName = PLANS[Math.floor(Math.random() * PLANS.length)];

  const rows = sRooms.map((room, index) => ({
    roomId: room.id,
    roomName: room.name,
    examiner1Id: sExaminer1[index].id,
    examiner1Name: sExaminer1[index].name,
    examiner2Id: sExaminer2[index].id,
    examiner2Name: sExaminer2[index].name,
    supervisorId: sSupervisors[index].id,
    supervisorName: sSupervisors[index].name
  }));

  return { planName, rows };
}

function buildDrawV2(constraints = getRecentDrawConstraints(), examSessionId = null) {
  const rooms = listRooms(examSessionId);
  const examiner1 = listByRole('examiner1', examSessionId);
  const examiner2 = listByRole('examiner2', examSessionId);
  const supervisors = listByRole('supervisor', examSessionId);

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

function createNotification(payload, req = null) {
  const title = cleanText(payload.title);
  if (!title) throw httpError(400, 'Tieu de thong bao khong hop le.');

  const info = db.prepare(`
    INSERT INTO notifications(title, message, channel, priority, status, entity_name, entity_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    cleanText(payload.message),
    cleanText(payload.channel || 'In App') || 'In App',
    normalizePriority(payload.priority),
    normalizeStatus(payload.status, NOTIFICATION_STATUSES, 'Pending'),
    cleanText(payload.entity_name ?? payload.entityName),
    payload.entity_id ?? payload.entityId ?? null
  );

  const row = db.prepare('SELECT * FROM notifications WHERE id = ?').get(info.lastInsertRowid);
  auditLog('Create', 'Notifications', row.id, row, null, req);
  return row;
}

function getDashboardSummary() {
  const today = getToday();
  const calendarToday = db.prepare(`
    SELECT COUNT(*) AS total FROM weekly_tasks
    WHERE is_active = 1 AND task_date = ?
  `).get(today).total;
  const tasksToday = db.prepare(`
    SELECT COUNT(*) AS total FROM daily_tasks
    WHERE is_active = 1 AND due_date = ? AND status NOT IN ('Completed','Cancelled')
  `).get(today).total;
  const overdueTasks = db.prepare(`
    SELECT COUNT(*) AS total FROM daily_tasks
    WHERE is_active = 1 AND due_date < ? AND status NOT IN ('Completed','Cancelled')
  `).get(today).total;
  const newStudents = db.prepare(`
    SELECT COUNT(*) AS total FROM students
    WHERE is_active = 1 AND date(created_at) >= date('now', '-7 day')
  `).get().total;
  const activeStudents = db.prepare('SELECT COUNT(*) AS total FROM students WHERE is_active = 1').get().total;
  const unreadNotifications = db.prepare('SELECT COUNT(*) AS total FROM notifications WHERE is_read = 0').get().total;

  return {
    date: today,
    kpis: {
      calendarToday,
      tasksToday,
      overdueTasks,
      activeStudents,
      newStudents,
      unreadNotifications,
      rooms: listRooms().length,
      examiners: listByRole('examiner1').length + listByRole('examiner2').length,
      supervisors: listByRole('supervisor').length
    },
    upcomingCalendar: db.prepare(`
      SELECT * FROM weekly_tasks
      WHERE is_active = 1 AND task_date >= ?
      ORDER BY task_date ASC, start_time ASC, id DESC
      LIMIT 6
    `).all(today),
    dueTasks: db.prepare(`
      SELECT * FROM daily_tasks
      WHERE is_active = 1 AND status NOT IN ('Completed','Cancelled')
      ORDER BY due_date IS NULL, due_date ASC, id DESC
      LIMIT 6
    `).all(),
    notifications: db.prepare('SELECT * FROM notifications ORDER BY id DESC LIMIT 5').all(),
    latestDrawSession: db.prepare('SELECT * FROM draw_sessions ORDER BY id DESC LIMIT 1').get() || null
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
    rank: cleanText(body.rank ?? current.rank),
    unit: cleanText(body.unit ?? current.unit),
    phone: cleanText(body.phone ?? current.phone),
    email: cleanText(body.email ?? current.email),
    className: cleanText(body.class_name ?? body.className ?? current.class_name),
    admissionDate: ensureDate(body.admission_date ?? body.admissionDate ?? current.admission_date),
    status: normalizeStatus(body.status ?? current.status, STUDENT_STATUSES, 'Created')
  };
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
    progress: Number.isFinite(progress) ? Math.max(0, Math.min(100, Math.round(progress))) : 0
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

app.post('/api/auth/login', (req, res) => {
  try {
    const username = cleanText(req.body?.username).toLowerCase();
    const password = req.body?.password;
    if (!username || !password) throw httpError(400, 'Thieu username hoac mat khau.');

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !verifyPassword(password, user.password_hash)) throw httpError(401, 'Thong tin dang nhap khong hop le.');
    ensureActiveUser(user);

    db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    const publicUser = getPublicUser(user.id, true);
    auditLog('Login', 'Users', user.id, { username }, null, req);
    res.json(buildAuthResponse(publicUser, { authProvider: publicUser.auth_provider }));
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/auth/logout', (req, res) => {
  auditLog('Logout', 'Users', null, null, null, req);
  res.json({ ok: true });
});

app.post('/api/auth/refresh', (req, res) => {
  try {
    const payload = getBearerPayload(req);
    const user = getAuthenticatedUser(req);
    res.json(buildAuthResponse(user));
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/auth/profile', (req, res) => {
  try {
    const user = getAuthenticatedUser(req);
    res.json(user);
  } catch (error) {
    sendError(res, error);
  }
});

app.use('/api', requireApiAccess);

app.get('/api/dashboard', (req, res) => {
  res.json(getDashboardSummary());
});

app.get('/api/calendar', (req, res) => {
  const limit = parseLimit(req.query.limit, 100, 200);
  const rows = db.prepare(`
    SELECT * FROM weekly_tasks
    WHERE is_active = 1
    ORDER BY task_date ASC, start_time ASC, id DESC
    LIMIT ?
  `).all(limit);
  res.json(rows);
});

app.get('/api/calendar/week-meta', (req, res) => {
  const weekStart = cleanText(req.query.weekStart);
  if (weekStart) {
    const row = db.prepare('SELECT * FROM weekly_schedule_meta WHERE week_start = ?').get(weekStart);
    return res.json(row || {
      week_start: weekStart,
      duty_summary: '',
      room_summary: ''
    });
  }

  const rows = db.prepare('SELECT * FROM weekly_schedule_meta ORDER BY week_start ASC').all();
  res.json(rows);
});

app.put('/api/calendar/week-meta', (req, res) => {
  try {
    const weekStart = ensureDate(req.body?.weekStart ?? req.body?.week_start);
    const payload = {
      weekStart,
      dutySummary: cleanText(req.body?.dutySummary ?? req.body?.duty_summary),
      roomSummary: cleanText(req.body?.roomSummary ?? req.body?.room_summary)
    };

    db.prepare(`
      INSERT INTO weekly_schedule_meta(week_start, duty_summary, room_summary)
      VALUES (?, ?, ?)
      ON CONFLICT(week_start) DO UPDATE SET
        duty_summary = excluded.duty_summary,
        room_summary = excluded.room_summary,
        updated_at = CURRENT_TIMESTAMP
    `).run(payload.weekStart, payload.dutySummary, payload.roomSummary);

    const row = db.prepare('SELECT * FROM weekly_schedule_meta WHERE week_start = ?').get(payload.weekStart);
    auditLog('Update', 'WeeklyScheduleMeta', payload.weekStart, row, null, req);
    res.json(row);
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/calendar/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM weekly_tasks WHERE id = ? AND is_active = 1').get(req.params.id);
  if (!row) return res.status(404).json({ message: 'Khong tim thay lich.' });
  res.json(row);
});

app.post('/api/calendar', (req, res) => {
  try {
    const payload = normalizeCalendarPayload(req.body || {});
    if (!payload.title) throw httpError(400, 'Tieu de lich khong hop le.');

    const info = db.prepare(`
      INSERT INTO weekly_tasks(title, task_date, start_time, end_time, content, location, tt_hv, tt_phong, ban, person_in_charge, duty_officer, color, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(payload.title, payload.taskDate, payload.startTime, payload.endTime, payload.content, payload.location, payload.ttHv, payload.ttPhong, payload.ban, payload.personInCharge, payload.dutyOfficer, payload.color, payload.status);
    const row = db.prepare('SELECT * FROM weekly_tasks WHERE id = ?').get(info.lastInsertRowid);
    auditLog('Create', 'WeeklyCalendar', row.id, row, null, req);
    createNotification({
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

app.put('/api/calendar/:id', (req, res) => {
  try {
    const current = db.prepare('SELECT * FROM weekly_tasks WHERE id = ? AND is_active = 1').get(req.params.id);
    if (!current) throw httpError(404, 'Khong tim thay lich.');
    const payload = normalizeCalendarPayload(req.body || {}, current);
    if (!payload.title) throw httpError(400, 'Tieu de lich khong hop le.');

    db.prepare(`
      UPDATE weekly_tasks
      SET title = ?, task_date = ?, start_time = ?, end_time = ?, content = ?, location = ?,
          tt_hv = ?, tt_phong = ?, ban = ?, person_in_charge = ?, duty_officer = ?, color = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(payload.title, payload.taskDate, payload.startTime, payload.endTime, payload.content, payload.location, payload.ttHv, payload.ttPhong, payload.ban, payload.personInCharge, payload.dutyOfficer, payload.color, payload.status, current.id);
    const row = db.prepare('SELECT * FROM weekly_tasks WHERE id = ?').get(current.id);
    auditLog('Update', 'WeeklyCalendar', row.id, row, current, req);
    res.json(row);
  } catch (error) {
    sendError(res, error);
  }
});

app.delete('/api/calendar/:id', (req, res) => {
  const current = db.prepare('SELECT * FROM weekly_tasks WHERE id = ? AND is_active = 1').get(req.params.id);
  if (!current) return res.status(404).json({ message: 'Khong tim thay lich.' });
  db.prepare('UPDATE weekly_tasks SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(current.id);
  auditLog('Delete', 'WeeklyCalendar', current.id, null, current, req);
  res.json({ ok: true });
});

app.get('/api/students', (req, res) => {
  const limit = parseLimit(req.query.limit, 100, 500);
  const rows = db.prepare(`
    SELECT * FROM students
    WHERE is_active = 1
    ORDER BY id DESC
    LIMIT ?
  `).all(limit);
  res.json(rows);
});

app.get('/api/students/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM students WHERE id = ? AND is_active = 1').get(req.params.id);
  if (!row) return res.status(404).json({ message: 'Khong tim thay hoc vien.' });
  res.json(row);
});

app.post('/api/students', (req, res) => {
  try {
    const payload = normalizeStudentPayload(req.body || {});
    if (!payload.studentCode || !payload.fullName) throw httpError(400, 'Ma hoc vien va ho ten khong duoc de trong.');
    if (db.prepare('SELECT id FROM students WHERE student_code = ?').get(payload.studentCode)) {
      throw httpError(409, 'Ma hoc vien da ton tai.');
    }

    const info = db.prepare(`
      INSERT INTO students(student_code, full_name, birthday, rank, unit, phone, email, class_name, admission_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(payload.studentCode, payload.fullName, payload.birthday, payload.rank, payload.unit, payload.phone, payload.email, payload.className, payload.admissionDate, payload.status);
    const row = db.prepare('SELECT * FROM students WHERE id = ?').get(info.lastInsertRowid);
    auditLog('Create', 'Students', row.id, row, null, req);
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/students/import', (req, res) => {
  try {
    const lines = cleanText(req.body?.text || req.body?.names).split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (!lines.length && !Array.isArray(req.body?.students)) throw httpError(400, 'Chua co du lieu import.');
    const items = Array.isArray(req.body?.students)
      ? req.body.students
      : lines.map(line => {
        const [studentCode, fullName, rank = '', unit = '', className = ''] = line.split(/[,\t|;]/).map(part => part.trim());
        return { student_code: studentCode, full_name: fullName, rank, unit, class_name: className };
      });

    let inserted = 0;
    const insert = db.prepare(`
      INSERT INTO students(student_code, full_name, rank, unit, class_name, admission_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const trx = db.transaction(rows => {
      rows.forEach(item => {
        const payload = normalizeStudentPayload(item);
        if (!payload.studentCode || !payload.fullName) return;
        if (db.prepare('SELECT id FROM students WHERE student_code = ?').get(payload.studentCode)) return;
        insert.run(payload.studentCode, payload.fullName, payload.rank, payload.unit, payload.className, payload.admissionDate, payload.status);
        inserted++;
      });
    });
    trx(items);
    auditLog('Import', 'Students', null, { inserted }, null, req);
    res.json({ inserted });
  } catch (error) {
    sendError(res, error);
  }
});

app.put('/api/students/:id', (req, res) => {
  try {
    const current = db.prepare('SELECT * FROM students WHERE id = ? AND is_active = 1').get(req.params.id);
    if (!current) throw httpError(404, 'Khong tim thay hoc vien.');
    const payload = normalizeStudentPayload(req.body || {}, current);
    if (!payload.studentCode || !payload.fullName) throw httpError(400, 'Ma hoc vien va ho ten khong duoc de trong.');
    const duplicate = db.prepare('SELECT id FROM students WHERE student_code = ? AND id != ?').get(payload.studentCode, current.id);
    if (duplicate) throw httpError(409, 'Ma hoc vien da ton tai.');

    db.prepare(`
      UPDATE students
      SET student_code = ?, full_name = ?, birthday = ?, rank = ?, unit = ?, phone = ?, email = ?,
          class_name = ?, admission_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(payload.studentCode, payload.fullName, payload.birthday, payload.rank, payload.unit, payload.phone, payload.email, payload.className, payload.admissionDate, payload.status, current.id);
    const row = db.prepare('SELECT * FROM students WHERE id = ?').get(current.id);
    auditLog('Update', 'Students', row.id, row, current, req);
    res.json(row);
  } catch (error) {
    sendError(res, error);
  }
});

app.delete('/api/students/:id', (req, res) => {
  const current = db.prepare('SELECT * FROM students WHERE id = ? AND is_active = 1').get(req.params.id);
  if (!current) return res.status(404).json({ message: 'Khong tim thay hoc vien.' });
  db.prepare('UPDATE students SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(current.id);
  auditLog('Delete', 'Students', current.id, null, current, req);
  res.json({ ok: true });
});

app.get('/api/tasks', (req, res) => {
  const limit = parseLimit(req.query.limit, 100, 300);
  const rows = db.prepare(`
    SELECT * FROM daily_tasks
    WHERE is_active = 1
    ORDER BY due_date IS NULL, due_date ASC, id DESC
    LIMIT ?
  `).all(limit);
  res.json(rows);
});

app.post('/api/tasks', (req, res) => {
  try {
    const payload = normalizeTaskPayload(req.body || {});
    if (!payload.title) throw httpError(400, 'Tieu de cong viec khong hop le.');
    const info = db.prepare(`
      INSERT INTO daily_tasks(title, description, assignee, due_date, priority, status, progress)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(payload.title, payload.description, payload.assignee, payload.dueDate, payload.priority, payload.status, payload.progress);
    const row = db.prepare('SELECT * FROM daily_tasks WHERE id = ?').get(info.lastInsertRowid);
    auditLog('Create', 'Tasks', row.id, row, null, req);
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

app.put('/api/tasks/:id', (req, res) => {
  try {
    const current = db.prepare('SELECT * FROM daily_tasks WHERE id = ? AND is_active = 1').get(req.params.id);
    if (!current) throw httpError(404, 'Khong tim thay cong viec.');
    const payload = normalizeTaskPayload(req.body || {}, current);
    if (!payload.title) throw httpError(400, 'Tieu de cong viec khong hop le.');
    db.prepare(`
      UPDATE daily_tasks
      SET title = ?, description = ?, assignee = ?, due_date = ?, priority = ?, status = ?,
          progress = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(payload.title, payload.description, payload.assignee, payload.dueDate, payload.priority, payload.status, payload.progress, current.id);
    const row = db.prepare('SELECT * FROM daily_tasks WHERE id = ?').get(current.id);
    auditLog('Update', 'Tasks', row.id, row, current, req);
    res.json(row);
  } catch (error) {
    sendError(res, error);
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  const current = db.prepare('SELECT * FROM daily_tasks WHERE id = ? AND is_active = 1').get(req.params.id);
  if (!current) return res.status(404).json({ message: 'Khong tim thay cong viec.' });
  db.prepare('UPDATE daily_tasks SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(current.id);
  auditLog('Delete', 'Tasks', current.id, null, current, req);
  res.json({ ok: true });
});

app.post(['/api/tasks/remind', '/api/tasks/:id/remind'], (req, res) => {
  try {
    const id = req.params.id || req.body?.id;
    const task = id ? db.prepare('SELECT * FROM daily_tasks WHERE id = ? AND is_active = 1').get(id) : null;
    if (!task) throw httpError(404, 'Khong tim thay cong viec de nhac.');
    const notification = createNotification({
      title: `Nhắc việc: ${task.title}`,
      message: `${task.assignee || 'Người phụ trách'} cần xử lý trước hạn ${task.due_date || 'chưa đặt'}.`,
      priority: task.priority,
      status: 'Queued',
      entity_name: 'Tasks',
      entity_id: task.id
    }, req);
    auditLog('Remind', 'Tasks', task.id, notification, task, req);
    res.json({ ok: true, notification });
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/notifications', (req, res) => {
  const limit = parseLimit(req.query.limit, 50, 200);
  const rows = db.prepare('SELECT * FROM notifications ORDER BY id DESC LIMIT ?').all(limit);
  res.json(rows);
});

app.post(['/api/notifications', '/api/notifications/send'], (req, res) => {
  try {
    res.status(201).json(createNotification(req.body || {}, req));
  } catch (error) {
    sendError(res, error);
  }
});

app.put(['/api/notifications/read', '/api/notifications/:id/read'], (req, res) => {
  const id = req.params.id || req.body?.id;
  if (!id) return res.status(400).json({ message: 'Thieu id thong bao.' });
  const current = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ message: 'Khong tim thay thong bao.' });
  db.prepare(`
    UPDATE notifications
    SET is_read = 1, status = 'Read', read_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(id);
  const row = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
  auditLog('Read', 'Notifications', row.id, row, current, req);
  res.json(row);
});

app.get('/api/ai/documents', (req, res) => {
  const rows = db.prepare('SELECT * FROM ai_documents ORDER BY id DESC LIMIT 100').all();
  const docsFolder = listMarkdownDocuments().map(({ content, ...document }) => ({
    ...document,
    created_at: null
  }));
  res.json([...docsFolder, ...rows]);
});

app.post('/api/ai/upload', (req, res) => {
  try {
    const fileName = cleanText(req.body?.file_name ?? req.body?.fileName);
    if (!fileName) throw httpError(400, 'Ten tai lieu khong hop le.');
    const info = db.prepare(`
      INSERT INTO ai_documents(file_name, file_type, scope, uploaded_by, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(fileName, cleanText(req.body?.file_type ?? req.body?.fileType), cleanText(req.body?.scope || 'Công khai'), cleanText(req.body?.uploaded_by ?? req.body?.uploadedBy), 'Indexed');
    const row = db.prepare('SELECT * FROM ai_documents WHERE id = ?').get(info.lastInsertRowid);
    auditLog('Upload', 'AiDocuments', row.id, row, null, req);
    res.status(201).json(row);
  } catch (error) {
    sendError(res, error);
  }
});

app.delete('/api/ai/documents/:id', (req, res) => {
  const current = db.prepare('SELECT * FROM ai_documents WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ message: 'Khong tim thay tai lieu AI.' });
  db.prepare('DELETE FROM ai_documents WHERE id = ?').run(req.params.id);
  auditLog('Delete', 'AiDocuments', req.params.id, null, current, req);
  res.json({ ok: true });
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const question = cleanText(req.body?.question ?? req.body?.message);
    if (!question) throw httpError(400, 'Cau hoi khong duoc de trong.');
    const result = await aiAnswer(question);
    const info = db.prepare(`
      INSERT INTO ai_conversations(question, answer, sources)
      VALUES (?, ?, ?)
    `).run(question, result.answer, JSON.stringify(result.sources));
    auditLog('AI Chat', 'AiConversation', info.lastInsertRowid, { question, sources: result.sources, provider: result.provider, model: result.model }, null, req);
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

app.get('/api/ai/history', (req, res) => {
  const rows = db.prepare('SELECT * FROM ai_conversations ORDER BY id DESC LIMIT ?').all(parseLimit(req.query.limit, 20, 100));
  res.json(rows.map(row => ({ ...row, sources: JSON.parse(row.sources || '[]') })));
});

app.get('/api/audit-logs', (req, res) => {
  const rows = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?').all(parseLimit(req.query.limit, 50, 200));
  res.json(rows);
});

app.get('/api/exam-sessions', (req, res) => {
  res.json(listExamSessions(req.query.includeInactive === '1' || req.query.includeInactive === 'true'));
});

app.get('/api/exam-sessions/:id', (req, res) => {
  const row = getExamSession(req.params.id, req.query.includeInactive === '1' || req.query.includeInactive === 'true');
  if (!row) return res.status(404).json({ message: 'Không tìm thấy kỳ thi.' });
  res.json(row);
});

app.post('/api/exam-sessions', (req, res) => {
  try {
    const payload = normalizeExamSessionPayload(req.body || {}, {}, { requireAny: true });
    const insertSession = db.prepare(`
      INSERT INTO exam_sessions(target_name, student_count, note)
      VALUES (?, ?, ?)
    `);

    const trx = db.transaction(() => {
      const info = insertSession.run(payload.targetName, payload.studentCount, payload.note);
      syncExamSubjects(info.lastInsertRowid, payload.subjects);
      return info.lastInsertRowid;
    });

    const id = trx();
    const created = getExamSession(id);
    auditLog('Create', 'ExamSession', id, created, null, req);
    res.status(201).json(created);
  } catch (error) {
    sendError(res, error);
  }
});

app.put('/api/exam-sessions/:id', (req, res) => {
  try {
    const current = getExamSession(req.params.id, true);
    if (!current || Number(current.is_active) !== 1) throw httpError(404, 'Không tìm thấy kỳ thi.');
    const payload = normalizeExamSessionPayload(req.body || {}, current, { requireAny: true });

    const trx = db.transaction(() => {
      db.prepare(`
        UPDATE exam_sessions
        SET target_name = ?, student_count = ?, note = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(payload.targetName, payload.studentCount, payload.note, current.id);
      syncExamSubjects(current.id, payload.subjects);
    });
    trx();

    const updated = getExamSession(current.id);
    auditLog('Update', 'ExamSession', current.id, updated, current, req);
    res.json(updated);
  } catch (error) {
    sendError(res, error);
  }
});

app.delete('/api/exam-sessions/:id', (req, res) => {
  try {
    const current = getExamSession(req.params.id, true);
    if (!current || Number(current.is_active) !== 1) throw httpError(404, 'Không tìm thấy kỳ thi.');

    const trx = db.transaction(() => {
      db.prepare('UPDATE exam_sessions SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(current.id);
      db.prepare('UPDATE exam_subjects SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE exam_session_id = ?').run(current.id);
      db.prepare('UPDATE exam_documents SET is_active = 0 WHERE exam_session_id = ?').run(current.id);
    });
    trx();

    auditLog('Delete', 'ExamSession', current.id, null, current, req);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/exam-sessions/:id/documents', (req, res) => {
  try {
    const exam = getExamSession(req.params.id);
    if (!exam) throw httpError(404, 'Không tìm thấy kỳ thi.');
    const payload = normalizeExamDocumentPayload(req.body || {});
    const relativePath = `exam-${exam.id}/${payload.storedName}`;
    const fullPath = getDocumentFullPath(relativePath);
    ensureExamFolder(exam.id);
    fs.writeFileSync(fullPath, payload.buffer);

    const info = db.prepare(`
      INSERT INTO exam_documents(exam_session_id, document_type, original_name, stored_name, file_type, size, relative_path)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      exam.id,
      payload.documentType,
      payload.originalName,
      payload.storedName,
      payload.fileType,
      payload.buffer.length,
      relativePath
    );

    const created = listExamDocuments(exam.id).find(item => item.id === info.lastInsertRowid);
    auditLog('Upload', 'ExamDocument', info.lastInsertRowid, created, null, req);
    res.status(201).json(created);
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/exam-sessions/:id/documents/:documentId/download', (req, res) => {
  try {
    const exam = getExamSession(req.params.id);
    if (!exam) throw httpError(404, 'Không tìm thấy kỳ thi.');
    const document = db.prepare(`
      SELECT * FROM exam_documents
      WHERE id = ? AND exam_session_id = ? AND is_active = 1
    `).get(req.params.documentId, exam.id);
    if (!document) throw httpError(404, 'Không tìm thấy tài liệu.');

    const fullPath = getDocumentFullPath(document.relative_path);
    if (!fs.existsSync(fullPath)) throw httpError(404, 'File tài liệu không còn tồn tại trên máy chủ.');
    auditLog('Download', 'ExamDocument', document.id, { original_name: document.original_name }, null, req);
    res.download(fullPath, document.original_name);
  } catch (error) {
    sendError(res, error);
  }
});

app.delete('/api/exam-sessions/:id/documents/:documentId', (req, res) => {
  try {
    const exam = getExamSession(req.params.id);
    if (!exam) throw httpError(404, 'Không tìm thấy kỳ thi.');
    const document = db.prepare(`
      SELECT * FROM exam_documents
      WHERE id = ? AND exam_session_id = ? AND is_active = 1
    `).get(req.params.documentId, exam.id);
    if (!document) throw httpError(404, 'Không tìm thấy tài liệu.');

    db.prepare('UPDATE exam_documents SET is_active = 0 WHERE id = ?').run(document.id);
    auditLog('Delete', 'ExamDocument', document.id, null, document, req);
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/exams', (req, res) => {
  const examSessionId = normalizeExamSessionId(req.query.examSessionId ?? req.query.exam_session_id);
  res.json({
    examSessionId,
    examSessions: listExamSessions(),
    rooms: listRooms(examSessionId),
    teachers: {
      examiner1: listByRole('examiner1', examSessionId),
      examiner2: listByRole('examiner2', examSessionId),
      supervisor: listByRole('supervisor', examSessionId)
    },
    latestSession: db.prepare('SELECT * FROM draw_sessions ORDER BY id DESC LIMIT 1').get() || null,
    recentHistory: db.prepare('SELECT * FROM draw_sessions ORDER BY id DESC LIMIT 5').all()
  });
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

app.get('/api/users', (req, res) => {
  const includeInactive = req.query.includeInactive === '1' || req.query.includeInactive === 'true';
  const where = includeInactive ? '' : 'WHERE is_active = 1';
  const users = db.prepare(`SELECT ${USER_PUBLIC_COLUMNS} FROM users ${where} ORDER BY id DESC`).all().map(serializeUser);
  res.json(users);
});

app.get('/api/users/menu-permissions', (req, res) => {
  res.json(USER_MENU_PERMISSIONS);
});

app.get('/api/users/:id', (req, res) => {
  const includeInactive = req.query.includeInactive === '1' || req.query.includeInactive === 'true';
  const user = getPublicUser(req.params.id, includeInactive);
  if (!user) return res.status(404).json({ message: 'Khong tim thay user.' });
  res.json(user);
});

app.post('/api/users', (req, res) => {
  const body = req.body || {};
  const payload = normalizeUserPayload(body);
  const passwordError = validatePassword(body.password);
  if (passwordError) return res.status(400).json({ message: passwordError });

  const payloadError = validateUserPayload(payload, { requireUsername: true, requireFullName: true });
  if (payloadError) return res.status(400).json({ message: payloadError });

  if (usernameExists(payload.username)) {
    return res.status(409).json({ message: 'Username da ton tai.' });
  }

  const hasIsActive = Object.prototype.hasOwnProperty.call(body, 'is_active') || Object.prototype.hasOwnProperty.call(body, 'isActive');
  const isActiveValue = body.is_active ?? body.isActive;
  const isActive = hasIsActive ? (isActiveValue ? 1 : 0) : 1;

  const info = db.prepare(`
    INSERT INTO users(username, password_hash, full_name, rank, unit, role, email, phone, permissions, note, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
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
  );

  const created = getPublicUser(info.lastInsertRowid, true);
  auditLog('Create', 'Users', created.id, created, null, req);
  res.status(201).json(created);
});

function updateUser(req, res) {
  const body = req.body || {};
  const current = getPublicUser(req.params.id, true);
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

  if (usernameExists(payload.username, current.id)) {
    return res.status(409).json({ message: 'Username da ton tai.' });
  }

  const hasIsActive = Object.prototype.hasOwnProperty.call(body, 'is_active') || Object.prototype.hasOwnProperty.call(body, 'isActive');
  const isActiveValue = body.is_active ?? body.isActive;
  const isActive = hasIsActive ? (isActiveValue ? 1 : 0) : current.is_active;

  db.prepare(`
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
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
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
  );

  const updated = getPublicUser(current.id, true);
  auditLog('Update', 'Users', current.id, updated, current, req);
  res.json(updated);
}

app.patch('/api/users/:id/password', (req, res) => {
  const body = req.body || {};
  const current = getPublicUser(req.params.id, true);
  if (!current) return res.status(404).json({ message: 'Khong tim thay user.' });

  const passwordError = validatePassword(body.password);
  if (passwordError) return res.status(400).json({ message: passwordError });

  db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hashPassword(body.password), current.id);
  auditLog('UpdatePassword', 'Users', current.id, { username: current.username }, null, req);
  res.json({ ok: true });
});

app.put('/api/users/:id', updateUser);
app.patch('/api/users/:id', updateUser);

app.delete('/api/users/:id', (req, res) => {
  const current = getPublicUser(req.params.id, true);
  if (!current) return res.status(404).json({ message: 'Khong tim thay user.' });

  db.prepare('UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(current.id);
  auditLog('Lock', 'Users', current.id, { username: current.username, is_active: 0 }, current, req);
  res.json({ ok: true });
});

app.get('/api/bootstrap', (req, res) => {
  const examSessionId = normalizeExamSessionId(req.query.examSessionId ?? req.query.exam_session_id);
  res.json({
    plans: PLANS,
    examSessionId,
    examSessions: listExamSessions(),
    teachers: {
      examiner1: listByRole('examiner1', examSessionId),
      examiner2: listByRole('examiner2', examSessionId),
      supervisor: listByRole('supervisor', examSessionId)
    },
    rooms: listRooms(examSessionId),
    latestSession: db.prepare('SELECT * FROM draw_sessions ORDER BY id DESC LIMIT 1').get() || null
  });
});

app.post('/api/teachers', (req, res) => {
  const { name, role, unit = '', note = '' } = req.body;
  if (!name || !ROLES.includes(role)) return res.status(400).json({ message: 'Tên hoặc vai trò không hợp lệ.' });
  const examSessionId = normalizeExamSessionId(req.body?.examSessionId ?? req.body?.exam_session_id);
  const info = db.prepare('INSERT INTO teachers(name, role, unit, note, exam_session_id) VALUES (?, ?, ?, ?, ?)').run(name.trim(), role, unit.trim(), note.trim(), examSessionId);
  res.json({ id: info.lastInsertRowid, name, role, unit, note, exam_session_id: examSessionId });
});

app.post('/api/teachers/import', (req, res) => {
  const { role, names = '' } = req.body;
  if (!ROLES.includes(role)) return res.status(400).json({ message: 'Vai trò không hợp lệ.' });
  const examSessionId = normalizeExamSessionId(req.body?.examSessionId ?? req.body?.exam_session_id);
  const lines = names.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const insert = db.prepare('INSERT INTO teachers(name, role, exam_session_id) VALUES (?, ?, ?)');
  const trx = db.transaction(items => items.forEach(name => insert.run(name, role, examSessionId)));
  trx(lines);
  res.json({ inserted: lines.length });
});

app.delete('/api/teachers/:id', (req, res) => {
  db.prepare('UPDATE teachers SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.post('/api/rooms', (req, res) => {
  const { name, capacity = null, note = '' } = req.body;
  if (!name) return res.status(400).json({ message: 'Tên phòng thi không hợp lệ.' });
  const examSessionId = normalizeExamSessionId(req.body?.examSessionId ?? req.body?.exam_session_id);
  const info = db.prepare('INSERT INTO exam_rooms(name, capacity, note, exam_session_id) VALUES (?, ?, ?, ?)').run(name.trim(), capacity, note.trim(), examSessionId);
  res.json({ id: info.lastInsertRowid, name, capacity, note, exam_session_id: examSessionId });
});

app.post('/api/rooms/import', (req, res) => {
  const { names = '' } = req.body;
  const examSessionId = normalizeExamSessionId(req.body?.examSessionId ?? req.body?.exam_session_id);
  const lines = names.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const insert = db.prepare('INSERT INTO exam_rooms(name, exam_session_id) VALUES (?, ?)');
  const trx = db.transaction(items => items.forEach(name => insert.run(name, examSessionId)));
  trx(lines);
  res.json({ inserted: lines.length });
});

app.delete('/api/rooms/:id', (req, res) => {
  db.prepare('UPDATE exam_rooms SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.patch('/api/rooms/:id/supervisor-pair', (req, res) => {
  const allow = req.body.allow ? 1 : 0;
  db.prepare('UPDATE exam_rooms SET allow_supervisor_pair = ? WHERE id = ?').run(allow, req.params.id);
  res.json({ ok: true });
});

app.post('/api/draw', (req, res) => {
  try {
    const examSubjectId = Number(req.body?.examSubjectId ?? req.body?.exam_subject_id) || null;
    const subjectContext = examSubjectId ? getExamSubjectContext(examSubjectId) : null;
    const constraints = getRecentDrawConstraints(2, subjectContext?.subject_id || null, subjectContext?.exam_session_id || null);
    const last = subjectContext
      ? db.prepare('SELECT result_hash FROM draw_sessions WHERE exam_subject_id = ? ORDER BY id DESC LIMIT 1').get(subjectContext.subject_id)
      : db.prepare('SELECT result_hash FROM draw_sessions WHERE exam_subject_id IS NULL ORDER BY id DESC LIMIT 1').get();
    let draw;
    let resultHash;
    let attempts = 0;

    do {
      draw = buildDrawV2(constraints, subjectContext?.exam_session_id || null);
      resultHash = hashResult(draw.planName, draw.rows);
      attempts++;
    } while (last && resultHash === last.result_hash && attempts < 50);

    if (last && resultHash === last.result_hash) {
      return res.status(409).json({ message: 'Không tạo được kết quả khác các lần bốc thăm trước. Vui lòng bổ sung thêm cán bộ/phòng thi.' });
    }

    const insertSession = db.prepare('INSERT INTO draw_sessions(plan_name, result_hash, exam_session_id, exam_subject_id) VALUES (?, ?, ?, ?)');
    const insertResult = db.prepare(`
      INSERT INTO draw_results(session_id, room_id, room_name, examiner1_id, examiner1_name, examiner2_id, examiner2_name, supervisor_id, supervisor_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertReserve = db.prepare(`
      INSERT INTO draw_reserves(session_id, role, staff_id, staff_name)
      VALUES (?, ?, ?, ?)
    `);

    const trx = db.transaction(() => {
      const session = insertSession.run(
        draw.planName,
        resultHash,
        subjectContext?.exam_session_id || null,
        subjectContext?.subject_id || null
      );
      draw.rows.forEach(row => insertResult.run(
        session.lastInsertRowid,
        row.roomId,
        row.roomName,
        row.examiner1Id,
        row.examiner1Name,
        row.examiner2Id,
        row.examiner2Name,
        row.supervisorId,
        row.supervisorName
      ));
      draw.reserves.forEach(row => insertReserve.run(
        session.lastInsertRowid,
        row.role,
        row.staffId,
        row.staffName
      ));
      return session.lastInsertRowid;
    });

    const sessionId = trx();
    auditLog('Create', 'DrawSession', sessionId, {
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

app.get('/api/history', (req, res) => {
  const examSubjectId = Number(req.query.examSubjectId ?? req.query.exam_subject_id) || null;
  const baseQuery = `
    SELECT
      d.*,
      e.target_name,
      s.exam_date,
      s.subject_name
    FROM draw_sessions d
    LEFT JOIN exam_sessions e ON e.id = d.exam_session_id
    LEFT JOIN exam_subjects s ON s.id = d.exam_subject_id
  `;
  const sessions = examSubjectId
    ? db.prepare(`${baseQuery} WHERE d.exam_subject_id = ? ORDER BY d.id DESC LIMIT 5`).all(examSubjectId)
    : db.prepare(`${baseQuery} ORDER BY d.id DESC LIMIT 5`).all();
  res.json(sessions);
});

app.get('/api/history/:id', (req, res) => {
  const session = db.prepare(`
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
  `).get(req.params.id);
  if (!session) return res.status(404).json({ message: 'Không tìm thấy phiên bốc thăm.' });
  const rows = sortRooms(db.prepare('SELECT * FROM draw_results WHERE session_id = ? ORDER BY id ASC').all(req.params.id).map(r => ({ ...r, name: r.room_name })));
  const reserves = db.prepare('SELECT * FROM draw_reserves WHERE session_id = ? ORDER BY id ASC').all(req.params.id);
  rows.forEach(r => delete r.name);
  res.json({ session, rows, reserves });
});

app.delete('/api/history/:id', (req, res) => {
  try {
    const session = db.prepare(`
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
    `).get(req.params.id);
    if (!session) throw httpError(404, 'Không tìm thấy phiên bốc thăm.');

    const rows = db.prepare('SELECT * FROM draw_results WHERE session_id = ? ORDER BY id ASC').all(session.id);
    const reserves = db.prepare('SELECT * FROM draw_reserves WHERE session_id = ? ORDER BY id ASC').all(session.id);
    const deleteSession = db.transaction(() => {
      db.prepare('DELETE FROM draw_reserves WHERE session_id = ?').run(session.id);
      db.prepare('DELETE FROM draw_results WHERE session_id = ?').run(session.id);
      db.prepare('DELETE FROM draw_sessions WHERE id = ?').run(session.id);
    });

    deleteSession();
    auditLog('Delete', 'DrawSession', session.id, null, {
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

app.get('/api/history/:id/export', async (req, res) => {
  try {
    const session = db.prepare(`
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
    `).get(req.params.id);
    if (!session) return res.status(404).json({ message: 'Không tìm thấy phiên bốc thăm.' });
    let rows = db.prepare('SELECT * FROM draw_results WHERE session_id = ? ORDER BY id ASC').all(req.params.id);
    rows = sortRooms(rows.map(r => ({ ...r, name: r.room_name }))).map(({ name, ...r }) => r);
    const buffer = await buildExportDocx(session, rows);
    auditLog('Export', 'DrawSession', session.id, { file: `ket-qua-boc-tham-${session.id}.docx` }, null, req);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="ket-qua-boc-tham-${session.id}.docx"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Exam draw website running at http://localhost:${PORT}`);
});
