const state = {
  teachers: {},
  rooms: [],
  examSessions: [],
  selectedExamSessionId: null,
  selectedExamSubjectId: null,
  editingExamSessionId: null,
  examSubjectDrafts: [],
  examSearchQuery: '',
  examPage: 1,
  examPageSize: 5,
  plans: ['Phương án 1', 'Phương án 2', 'Phương án 3', 'Phương án 4'],
  currentSessionId: null,
  dashboard: null,
  calendar: [],
  students: [],
  tasks: [],
  notifications: [],
  users: [],
  auditLogs: [],
  aiDocuments: [],
  calendarWeekMeta: [],
  aiMessages: [],
  calendarCursor: new Date(),
  selectedCalendarDate: null,
  calendarView: 'month',
  drawStep: 0,
  drawBusy: false,
  sidebarCollapsed: false,
  currentUser: null
};

const roleMap = {
  examiner1: { count: 'countExaminer1', list: 'listExaminer1' },
  examiner2: { count: 'countExaminer2', list: 'listExaminer2' },
  supervisor: { count: 'countSupervisor', list: 'listSupervisor' }
};

const statusOptions = {
  student: ['Created', 'PendingReview', 'Approved', 'Rejected', 'Completed'],
  task: ['New', 'InProgress', 'Pending', 'Completed', 'Overdue', 'Cancelled']
};

const userRoleLabels = {
  admin: 'Quản trị hệ thống',
  manager: 'Cán bộ quản lý',
  viewer: 'Người xem'
};

const userMenuPermissions = [
  { key: 'calendar', label: 'Lịch tuần' },
  { key: 'students', label: 'Tiếp nhận học viên' },
  { key: 'exam', label: 'Thi tốt nghiệp' },
  { key: 'tasks', label: 'Nhắc việc' },
  { key: 'admin', label: 'Quản trị' }
];

const rolePermissionDefaults = {
  admin: { calendar: true, students: true, exam: true, tasks: true, admin: true },
  manager: { calendar: true, students: true, exam: true, tasks: true, admin: false },
  viewer: { calendar: true, students: true, exam: true, tasks: true, admin: false }
};

const authStorageKey = 'armyTechAuth';
const sidebarStorageKey = 'armyTechSidebarCollapsed';
const pagePermissions = {
  calendar: 'calendar',
  students: 'students',
  exam: 'exam',
  tasks: 'tasks',
  admin: 'admin'
};

const navItems = [
  { key: 'dashboard', label: 'Dashboard', href: 'index.html', icon: 'dashboard' },
  { key: 'calendar', label: 'Lịch tuần', href: 'calendar.html', permission: 'calendar', icon: 'calendar' },
  { key: 'students', label: 'Tiếp nhận học viên', href: 'students.html', permission: 'students', icon: 'students' },
  { key: 'exam', label: 'Thi tốt nghiệp', href: 'exam.html', permission: 'exam', icon: 'exam' },
  { key: 'tasks', label: 'Nhắc việc', href: 'tasks.html', permission: 'tasks', icon: 'tasks' },
  { key: 'ai', label: 'AI Assistant', href: 'ai.html', icon: 'ai' },
  { key: 'admin', label: 'Quản trị', href: 'admin.html', permission: 'admin', icon: 'admin' }
];

const iconPaths = {
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect>',
  calendar: '<rect x="3" y="4" width="18" height="17" rx="2"></rect><path d="M8 2v4"></path><path d="M16 2v4"></path><path d="M3 10h18"></path>',
  students: '<path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"></path><circle cx="9.5" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
  exam: '<path d="M8 4h8"></path><path d="M9 2h6v4H9z"></path><path d="M16 4h2a2 2 0 0 1 2 2v14H4V6a2 2 0 0 1 2-2h2"></path><path d="M8 13h8"></path><path d="M8 17h5"></path><path d="m8 9 1.5 1.5L12 8"></path>',
  tasks: '<path d="M9 6h12"></path><path d="M9 12h12"></path><path d="M9 18h12"></path><path d="m3 6 1 1 2-2"></path><path d="m3 12 1 1 2-2"></path><path d="m3 18 1 1 2-2"></path>',
  ai: '<path d="M12 2l1.35 4.1L17.5 7.5l-4.15 1.4L12 13l-1.35-4.1L6.5 7.5l4.15-1.4L12 2z"></path><rect x="4" y="13" width="16" height="8" rx="3"></rect><path d="M9 17h.01"></path><path d="M15 17h.01"></path>',
  admin: '<path d="M12 3l7 3v5c0 4.4-2.7 8.4-7 10-4.3-1.6-7-5.6-7-10V6l7-3z"></path><path d="M9.5 12a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0z"></path><path d="M12 14.5V17"></path>',
  logout: '<path d="M10 6H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h5"></path><path d="M15 8l4 4-4 4"></path><path d="M19 12H9"></path>',
  panelClose: '<rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M9 4v16"></path><path d="m16 10-2 2 2 2"></path>',
  panelOpen: '<rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M9 4v16"></path><path d="m14 10 2 2-2 2"></path>',
  plus: '<path d="M12 5v14"></path><path d="M5 12h14"></path>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"></path><path d="M17 21v-8H7v8"></path><path d="M7 3v5h8"></path>',
  check: '<path d="m20 6-11 11-5-5"></path>',
  bell: '<path d="M10 21h4"></path><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m17 8-5-5-5 5"></path><path d="M12 3v12"></path>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="M7 10l5 5 5-5"></path><path d="M12 15V3"></path>',
  lock: '<rect x="3" y="11" width="18" height="10" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>',
  unlock: '<rect x="3" y="11" width="18" height="10" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 9.5-2.2"></path>',
  x: '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>',
  maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M21 8V5a2 2 0 0 0-2-2h-3"></path><path d="M3 16v3a2 2 0 0 0 2 2h3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>',
  refresh: '<path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path><path d="M3 21v-5h5"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M21 3v5h-5"></path>',
  send: '<path d="m22 2-7 20-4-9-9-4 20-7Z"></path><path d="M22 2 11 13"></path>',
  play: '<path d="m6 3 15 9-15 9V3Z"></path>',
  chevronLeft: '<path d="m15 18-6-6 6-6"></path>',
  chevronRight: '<path d="m9 18 6-6-6-6"></path>'
};

const DRAW_SHAKE_MS = 3000;
const drawWizardSteps = [
  { key: 'examiner1', type: 'role', role: 'examiner1', title: 'Danh sách cán bộ coi thi số 1' },
  { key: 'examiner2', type: 'role', role: 'examiner2', title: 'Danh sách cán bộ coi thi số 2' },
  { key: 'supervisor', type: 'role', role: 'supervisor', title: 'Danh sách cán bộ giám sát thi' },
  { key: 'rooms', type: 'rooms', title: 'Danh sách phòng thi' },
  { key: 'plans', type: 'plans', title: 'Phương án đánh số báo danh' },
  { key: 'box', type: 'box', title: 'Hộp phiếu bốc thăm' }
];

function el(id) {
  return document.getElementById(id);
}

function has(id) {
  return Boolean(el(id));
}

function toast(message) {
  const box = el('toast');
  if (!box) return;
  box.textContent = message;
  box.classList.remove('hidden');
  setTimeout(() => box.classList.add('hidden'), 2800);
}

function currentPage() {
  return document.body?.dataset?.page || '';
}

function readAuth() {
  try {
    return JSON.parse(localStorage.getItem(authStorageKey) || 'null');
  } catch (error) {
    return null;
  }
}

function writeAuth(data) {
  const auth = {
    accessToken: data.accessToken,
    tokenType: data.tokenType || 'Bearer',
    expiresAt: data.expiresAt,
    user: data.user
  };
  localStorage.setItem(authStorageKey, JSON.stringify(auth));
  state.currentUser = data.user || null;
  return auth;
}

function clearAuth() {
  localStorage.removeItem(authStorageKey);
  state.currentUser = null;
}

function authExpired(auth) {
  if (!auth?.accessToken || !auth.expiresAt) return true;
  return new Date(auth.expiresAt).getTime() <= Date.now() + 1000;
}

function redirectToLogin() {
  const target = encodeURIComponent(`${location.pathname}${location.search}`);
  location.href = `login.html?next=${target}`;
}

function canAccessMenu(permissionKey, user = state.currentUser) {
  if (!permissionKey) return true;
  if (!user) return false;
  return Boolean(normalizeUserPermissions(user.permissions, user.role)[permissionKey]);
}

function firstAccessibleHref(user = state.currentUser) {
  const item = navItems.find(navItem => !navItem.external && canAccessMenu(navItem.permission, user));
  return item?.href || 'index.html';
}

function navIcon(name) {
  const paths = iconPaths[name] || iconPaths.dashboard;
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths}</svg>`;
}

function inlineIcon(name) {
  return navIcon(name);
}

function readSidebarCollapsed() {
  try {
    return localStorage.getItem(sidebarStorageKey) === 'true';
  } catch (error) {
    return false;
  }
}

function writeSidebarCollapsed(collapsed) {
  try {
    localStorage.setItem(sidebarStorageKey, String(collapsed));
  } catch (error) {
    // Local storage is optional; the current page can still update visually.
  }
}

function applySidebarState() {
  state.sidebarCollapsed = readSidebarCollapsed();
  document.querySelector('.shell')?.classList.toggle('sidebar-collapsed', state.sidebarCollapsed);

  const toggle = document.querySelector('.sidebar-toggle');
  if (!toggle) return;

  const label = state.sidebarCollapsed ? 'Mở rộng menu trái' : 'Thu gọn menu trái';
  const icon = state.sidebarCollapsed ? 'panelOpen' : 'panelClose';
  toggle.setAttribute('aria-label', label);
  toggle.setAttribute('aria-expanded', String(!state.sidebarCollapsed));
  toggle.setAttribute('title', label);
  toggle.innerHTML = `
    <span class="sidebar-toggle-icon">${navIcon(icon)}</span>
    <span class="sidebar-toggle-label">${label}</span>
  `;
}

function toggleSidebar() {
  writeSidebarCollapsed(!state.sidebarCollapsed);
  applySidebarState();
}

function setupSidebarToggle() {
  const sidebar = document.querySelector('.sidebar');
  const brand = sidebar?.querySelector('.brand');
  if (!sidebar || !brand) return;

  let toggle = sidebar.querySelector('.sidebar-toggle');
  if (!toggle) {
    toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'sidebar-toggle';
    toggle.addEventListener('click', toggleSidebar);
    brand.insertAdjacentElement('afterend', toggle);
  }

  applySidebarState();
}

function getUserInitials(user) {
  const name = String(user?.full_name || user?.username || 'U').trim();
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) || 'U';
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return `${first}${last}`.toUpperCase();
}

function openMobileDrawer() {
  document.querySelector('.mobile-drawer')?.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeMobileDrawer() {
  document.querySelector('.mobile-drawer')?.classList.remove('open');
  document.body.classList.remove('modal-open');
}

function renderNavigation() {
  if (!state.currentUser) return;
  const page = currentPage();
  setupSidebarToggle();

  // Desktop sidebar nav
  const sidebarNav = document.querySelector('.sidebar .nav');
  if (sidebarNav) {
    sidebarNav.innerHTML = navItems
      .filter(item => canAccessMenu(item.permission))
      .map(item => `
        <a class="${item.key === page ? 'active' : ''}" href="${item.href}" title="${escapeHtml(item.label)}" ${item.external ? 'target="_blank" rel="noreferrer"' : ''}>
          <span class="nav-icon">${navIcon(item.icon)}</span>
          <span class="nav-label">${escapeHtml(item.label)}</span>
        </a>
      `).join('') + `
        <button class="nav-logout" onclick="logout()" title="Đăng xuất">
          <span class="nav-icon">${navIcon('logout')}</span>
          <span class="nav-label">Đăng xuất</span>
        </button>
      `;

    document.querySelector('.sidebar .sidebar-user')?.remove();
    sidebarNav.insertAdjacentHTML('afterend', `
      <div class="sidebar-user" title="${escapeHtml(state.currentUser.full_name || state.currentUser.username)}" data-initials="${escapeHtml(getUserInitials(state.currentUser))}">
        <strong>${escapeHtml(state.currentUser.full_name || state.currentUser.username)}</strong>
        <span>${escapeHtml([state.currentUser.rank, state.currentUser.unit].filter(Boolean).join(' · ') || userRoleLabels[state.currentUser.role] || state.currentUser.role)}</span>
      </div>
    `);
  }

  // Mobile drawer nav
  const drawerNav = document.querySelector('.mobile-drawer .drawer-nav');
  if (drawerNav) {
    drawerNav.innerHTML = navItems
      .filter(item => canAccessMenu(item.permission))
      .map(item => `
        <a class="${item.key === page ? 'active' : ''}" href="${item.href}" title="${escapeHtml(item.label)}" ${item.external ? 'target="_blank" rel="noreferrer"' : ''}>
          <span class="nav-icon">${navIcon(item.icon)}</span>
          <span class="nav-label">${escapeHtml(item.label)}</span>
        </a>
      `).join('') + `
        <button class="nav-logout" onclick="logout()" title="Đăng xuất">
          <span class="nav-icon">${navIcon('logout')}</span>
          <span class="nav-label">Đăng xuất</span>
        </button>
      `;

    document.querySelector('.mobile-drawer .drawer-user')?.remove();
    drawerNav.insertAdjacentHTML('afterend', `
      <div class="sidebar-user drawer-user" style="margin-top: auto;" title="${escapeHtml(state.currentUser.full_name || state.currentUser.username)}" data-initials="${escapeHtml(getUserInitials(state.currentUser))}">
        <strong>${escapeHtml(state.currentUser.full_name || state.currentUser.username)}</strong>
        <span>${escapeHtml([state.currentUser.rank, state.currentUser.unit].filter(Boolean).join(' · ') || userRoleLabels[state.currentUser.role] || state.currentUser.role)}</span>
      </div>
    `);
  }

  // Bottom navigation bar for mobile
  const bottomNav = document.querySelector('.bottom-nav');
  if (bottomNav) {
    const bottomNavKeys = ['dashboard', 'calendar', 'students', 'exam', 'tasks'];
    const accessibleItems = navItems.filter(item => bottomNavKeys.includes(item.key) && canAccessMenu(item.permission));
    bottomNav.innerHTML = accessibleItems.map(item => `
      <a class="bottom-nav-item ${item.key === page ? 'active' : ''}" href="${item.href}">
        ${navIcon(item.icon)}
        <span>${escapeHtml(item.label.split(' ')[0])}</span>
      </a>
    `).join('') + `
      <button type="button" class="bottom-nav-item" onclick="openMobileDrawer()" aria-label="Mở menu">
        <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <span>Thêm</span>
      </button>
    `;
  }
}

function showAuthNotice() {
  const notice = sessionStorage.getItem('authNotice');
  if (!notice) return;
  sessionStorage.removeItem('authNotice');
  toast(notice);
}

async function initializeAuth() {
  if (currentPage() === 'login') {
    setupLoginPage();
    const auth = readAuth();
    if (auth && !authExpired(auth)) {
      state.currentUser = auth.user || null;
      location.href = firstAccessibleHref(auth.user);
    }
    return false;
  }

  const auth = readAuth();
  if (!auth || authExpired(auth)) {
    clearAuth();
    redirectToLogin();
    return false;
  }

  state.currentUser = auth.user || null;
  try {
    const user = await request('/api/auth/profile');
    const refreshedAuth = { ...auth, user };
    localStorage.setItem(authStorageKey, JSON.stringify(refreshedAuth));
    state.currentUser = user;
  } catch (error) {
    return false;
  }

  const requiredPermission = pagePermissions[currentPage()];
  if (!canAccessMenu(requiredPermission)) {
    sessionStorage.setItem('authNotice', 'Bạn không có quyền truy cập menu này.');
    location.href = firstAccessibleHref();
    return false;
  }

  renderNavigation();
  showAuthNotice();
  return true;
}

function setupLoginPage() {
  if (!has('loginForm')) return;
  const params = new URLSearchParams(location.search);
  if (params.get('next')) {
    const hint = el('loginHint');
    if (hint) hint.textContent = 'Vui lòng đăng nhập để tiếp tục phiên làm việc.';
  }
  el('loginForm').addEventListener('submit', login);
  enhanceActionButtons();
}

async function login(event) {
  event.preventDefault();
  const button = el('loginSubmit');
  const errorBox = el('loginError');
  if (errorBox) errorBox.textContent = '';
  if (button) button.disabled = true;

  try {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: el('loginUsername').value,
        password: el('loginPassword').value
      })
    });
    const auth = writeAuth(data);
    location.href = firstAccessibleHref(auth.user);
  } catch (error) {
    if (errorBox) errorBox.textContent = error.message;
  } finally {
    if (button) button.disabled = false;
  }
}

async function logout() {
  try {
    await request('/api/auth/logout', { method: 'POST', body: '{}' });
  } catch (error) {
    // Logout should still clear the local session if the server token is stale.
  } finally {
    clearAuth();
    location.href = 'login.html';
  }
}

async function request(url, options = {}) {
  const auth = readAuth();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (auth?.accessToken) headers.Authorization = `${auth.tokenType || 'Bearer'} ${auth.accessToken}`;
  if (state.currentUser?.username) headers['x-user'] = state.currentUser.username;

  const res = await fetch(url, {
    ...options,
    headers
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && currentPage() !== 'login') {
      clearAuth();
      redirectToLogin();
    }
    throw new Error(data.message || (res.status === 403 ? 'Không có quyền truy cập.' : 'Có lỗi xảy ra'));
  }
  return data;
}

async function downloadFile(url, fallbackFileName) {
  const auth = readAuth();
  const headers = {};
  if (auth?.accessToken) headers.Authorization = `${auth.tokenType || 'Bearer'} ${auth.accessToken}`;
  if (state.currentUser?.username) headers['x-user'] = state.currentUser.username;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && currentPage() !== 'login') {
      clearAuth();
      redirectToLogin();
    }
    throw new Error(data.message || 'Không tải được file.');
  }

  const blob = await res.blob();
  const disposition = res.headers.get('content-disposition') || '';
  const fileNameMatch = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
  const fileName = fileNameMatch ? decodeURIComponent(fileNameMatch[1] || fileNameMatch[2]) : fallbackFileName;
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName || 'download';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

async function safeRequest(url, fallback) {
  try {
    return await request(url);
  } catch (error) {
    toast(error.message);
    return fallback;
  }
}

async function loadData() {
  const today = new Date();
  if (has('todayLabel')) {
    el('todayLabel').textContent = today.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  const page = currentPage();
  const shouldLoadExam = page === 'exam' && canAccessMenu('exam');
  const shouldLoadDashboard = page === 'dashboard';
  const shouldLoadCalendar = page === 'calendar' && canAccessMenu('calendar');
  const shouldLoadStudents = page === 'students' && canAccessMenu('students');
  const shouldLoadTasks = page === 'tasks' && canAccessMenu('tasks');
  const shouldLoadAdmin = page === 'admin' && canAccessMenu('admin');
  const shouldLoadAiDocuments = page === 'ai' && has('aiDocuments');

  const examBootstrapUrl = state.selectedExamSessionId
    ? `/api/bootstrap?examSessionId=${encodeURIComponent(state.selectedExamSessionId)}`
    : '/api/bootstrap';
  const [examData, dashboard, calendar, calendarWeekMeta, students, tasks, notifications, users, auditLogs, aiDocuments] = await Promise.all([
    shouldLoadExam ? safeRequest(examBootstrapUrl, { teachers: {}, rooms: [], examSessions: [] }) : Promise.resolve({ teachers: {}, rooms: [], examSessions: [] }),
    shouldLoadDashboard ? safeRequest('/api/dashboard', null) : Promise.resolve(null),
    shouldLoadCalendar ? safeRequest('/api/calendar', []) : Promise.resolve([]),
    shouldLoadCalendar ? safeRequest('/api/calendar/week-meta', []) : Promise.resolve([]),
    shouldLoadStudents ? safeRequest('/api/students', []) : Promise.resolve([]),
    shouldLoadTasks ? safeRequest('/api/tasks', []) : Promise.resolve([]),
    shouldLoadDashboard ? safeRequest('/api/notifications', []) : Promise.resolve([]),
    shouldLoadAdmin ? safeRequest('/api/users?includeInactive=1', []) : Promise.resolve([]),
    shouldLoadAdmin ? safeRequest('/api/audit-logs', []) : Promise.resolve([]),
    shouldLoadAiDocuments ? safeRequest('/api/ai/documents', []) : Promise.resolve([])
  ]);

  state.examSessions = examData.examSessions || [];
  state.plans = examData.plans || state.plans;
  syncExamSelection();
  state.teachers = state.selectedExamSessionId ? (examData.teachers || {}) : {};
  state.rooms = state.selectedExamSessionId ? (examData.rooms || []) : [];
  state.dashboard = dashboard;
  state.calendar = calendar;
  state.calendarWeekMeta = calendarWeekMeta;
  state.students = students;
  state.tasks = tasks;
  state.notifications = notifications;
  state.users = users;
  state.auditLogs = auditLogs;
  state.aiDocuments = aiDocuments;

  renderDashboard();
  renderCalendar();
  renderStudents();
  renderTasks();
  renderNotifications();
  renderExamSessions();
  renderLists();
  renderUsers();
  renderAuditLogs();
  renderAiDocuments();
  renderAiMessages();
  loadHistory();
  enhanceActionButtons();
}

function renderDashboard() {
  if (!has('kpiCalendar')) return;
  const kpis = state.dashboard?.kpis || {};
  el('kpiCalendar').textContent = kpis.calendarToday || 0;
  el('kpiTasks').textContent = kpis.tasksToday || 0;
  el('kpiOverdue').textContent = kpis.overdueTasks || 0;
  el('kpiStudents').textContent = kpis.activeStudents || 0;
  el('kpiRooms').textContent = kpis.rooms || 0;
  el('kpiUnread').textContent = kpis.unreadNotifications || 0;

  renderStack('dashboardCalendar', state.dashboard?.upcomingCalendar || [], item => `
    <div class="stack-item">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${formatDate(item.task_date)} ${escapeHtml(item.start_time || '')}</span>
      <small>${escapeHtml(item.location || 'Chưa có địa điểm')}</small>
    </div>
  `, 'Chưa có lịch sắp tới.');

  renderStack('dashboardTasks', state.dashboard?.dueTasks || [], item => `
    <div class="stack-item">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.assignee || 'Chưa giao')} · ${formatDate(item.due_date)}</span>
      <small class="${statusClass(item.status)}">${escapeHtml(item.status)}</small>
    </div>
  `, 'Chưa có công việc cần xử lý.');

  renderNotifications();
}

function renderStack(targetId, items, template, emptyText) {
  if (!has(targetId)) return;
  el(targetId).innerHTML = items.length
    ? items.map(template).join('')
    : `<p class="empty-small">${emptyText}</p>`;
}

function renderNotifications() {
  const items = state.notifications.slice(0, 5);
  renderStack('dashboardNotifications', items, item => `
    <div class="stack-item ${Number(item.is_read) === 1 ? 'muted-item' : ''}">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.priority)} · ${formatDateTime(item.created_at)}</span>
      <small>${escapeHtml(item.message || '')}</small>
      ${Number(item.is_read) === 1 ? '' : iconButton('check', 'Đánh dấu đã đọc', `markNotificationRead(${item.id})`)}
    </div>
  `, 'Chưa có thông báo.');
}

function renderCalendar() {
  if (has('calendarGrid')) {
    renderCalendarView();
    return;
  }

  if (has('calendarBody')) {
    el('calendarBody').innerHTML = state.calendar.length ? state.calendar.map(item => `
      <tr>
        <td>${formatDate(item.task_date)}</td>
        <td>${escapeHtml([item.start_time, item.end_time].filter(Boolean).join(' - '))}</td>
        <td><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.content || '')}</small></td>
        <td>${escapeHtml(item.location || '')}</td>
        <td>${escapeHtml(item.person_in_charge || '')}</td>
        <td>${deleteIconButton(item.id, 'Xóa lịch')}</td>
      </tr>
    `).join('') : '<tr><td colspan="7" class="empty">Chưa có lịch tuần.</td></tr>';
  }
}

function renderCalendarView() {
  if (!state.selectedCalendarDate) state.selectedCalendarDate = localDateString(new Date());
  renderCalendarViewButtons();
  if (state.calendarView === 'week') {
    renderCalendarWeek();
    return;
  }
  if (state.calendarView === 'day') {
    renderCalendarDay();
    return;
  }
  renderCalendarMonth();
}

function renderCalendarViewButtons() {
  ['Month', 'Week', 'Day'].forEach(name => {
    const id = `calendarView${name}`;
    if (!has(id)) return;
    el(id).classList.toggle('active', state.calendarView === name.toLowerCase());
  });
}

function renderCalendarMonth() {
  if (!state.selectedCalendarDate) state.selectedCalendarDate = localDateString(new Date());
  const cursor = state.calendarCursor || new Date();
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const today = localDateString(new Date());
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);
  const eventsByDate = groupCalendarByDate();

  if (has('calendarWeekdays')) el('calendarWeekdays').classList.remove('hidden');
  el('calendarGrid').className = 'calendar-grid month-grid';
  el('calendarMonthTitle').textContent = `Tháng ${month + 1}, ${year}`;
  el('calendarGrid').innerHTML = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
    const dateKey = localDateString(date);
    const events = eventsByDate.get(dateKey) || [];
    const isMuted = date.getMonth() !== month;
    const isToday = dateKey === today;
    const isSelected = dateKey === state.selectedCalendarDate;
    const visibleEvents = events.slice(0, 3);
    return `
      <button class="calendar-day ${isMuted ? 'muted-day' : ''} ${isToday ? 'today-day' : ''} ${isSelected ? 'selected-day' : ''}" onclick="selectCalendarDate('${dateKey}')">
        <span class="day-number">${date.getDate()}</span>
        <div class="day-events">
          ${visibleEvents.map(item => `
            <span class="calendar-event" title="${escapeHtml(item.title)}">
              ${escapeHtml(formatEventTime(item))}${escapeHtml(item.title)}
            </span>
          `).join('')}
          ${events.length > visibleEvents.length ? `<span class="more-events">+${events.length - visibleEvents.length} lịch khác</span>` : ''}
        </div>
      </button>
    `;
  }).join('');

  renderCalendarSelectedDay(eventsByDate);
  renderCalendarMiniStats();
  renderWorkScheduleTable(eventsByDate);
}

function renderCalendarWeek() {
  const selectedDate = parseDateOnly(state.selectedCalendarDate) || new Date();
  const weekStart = getWeekStart(selectedDate);
  const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
  const eventsByDate = groupCalendarByDate();
  const today = localDateString(new Date());

  if (has('calendarWeekdays')) el('calendarWeekdays').classList.remove('hidden');
  el('calendarGrid').className = 'calendar-grid week-grid';
  el('calendarMonthTitle').textContent = `Tuần ${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`;
  el('calendarGrid').innerHTML = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + index);
    const dateKey = localDateString(date);
    const events = eventsByDate.get(dateKey) || [];
    return `
      <button class="calendar-day week-day ${dateKey === today ? 'today-day' : ''} ${dateKey === state.selectedCalendarDate ? 'selected-day' : ''}" onclick="selectCalendarDate('${dateKey}')">
        <span class="day-number">${date.getDate()}</span>
        <div class="week-day-label">${date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}</div>
        <div class="day-events">
          ${events.length ? events.map(item => `
            <span class="calendar-event" title="${escapeHtml(item.title)}">
              ${escapeHtml(formatEventTime(item))}${escapeHtml(item.title)}
            </span>
          `).join('') : '<span class="empty-small">Không có lịch</span>'}
        </div>
      </button>
    `;
  }).join('');

  renderCalendarSelectedDay(eventsByDate);
  renderCalendarMiniStats();
  renderWorkScheduleTable(eventsByDate);
}

function renderCalendarDay() {
  const selected = state.selectedCalendarDate || localDateString(new Date());
  const selectedDate = parseDateOnly(selected) || new Date();
  const eventsByDate = groupCalendarByDate();
  const events = (eventsByDate.get(selected) || []).slice().sort(sortCalendarEvents);

  if (has('calendarWeekdays')) el('calendarWeekdays').classList.add('hidden');
  el('calendarGrid').className = 'calendar-grid day-grid';
  el('calendarMonthTitle').textContent = selectedDate.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  el('calendarGrid').innerHTML = `
    <div class="calendar-day-view">
      ${events.length ? events.map(item => `
        <article class="day-agenda-item">
          <time>${escapeHtml([item.start_time, item.end_time].filter(Boolean).join(' - ') || 'Cả ngày')}</time>
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml([item.location, item.person_in_charge, item.tt_hv, item.tt_phong, item.ban].filter(Boolean).join(' · '))}</span>
            <div class="inline-actions">${deleteIconButton(item.id, 'Xóa lịch')}</div>
          </div>
        </article>
      `).join('') : '<p class="empty">Không có lịch trong ngày này.</p>'}
    </div>
  `;

  renderCalendarSelectedDay(eventsByDate);
  renderCalendarMiniStats();
  renderWorkScheduleTable(eventsByDate);
}

function renderCalendarSelectedDay(eventsByDate = groupCalendarByDate()) {
  const selected = state.selectedCalendarDate || localDateString(new Date());
  const events = (eventsByDate.get(selected) || []).slice().sort(sortCalendarEvents);
  if (has('calendarDate')) el('calendarDate').value = selected;
  if (has('calendarSelectedDate')) {
    el('calendarSelectedDate').textContent = new Date(`${selected}T00:00:00`).toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  renderStack('calendarSelectedList', events, item => `
    <div class="calendar-detail-item">
      <div class="event-dot"></div>
      <div>
        <strong class="schedule-time">${escapeHtml([item.start_time, item.end_time].filter(Boolean).join(' - ') || 'Cả ngày')}</strong>
        <strong>${escapeHtml(item.title)}</strong>
        <small>${escapeHtml([item.location, item.person_in_charge, item.tt_hv, item.tt_phong, item.ban].filter(Boolean).join(' · '))}</small>
        <div class="inline-actions">${deleteIconButton(item.id, 'Xóa lịch')}</div>
      </div>
    </div>
  `, 'Không có lịch trong ngày này.');
}

function renderCalendarMiniStats() {
  if (!has('calendarMiniStats')) return;
  const year = state.calendarCursor.getFullYear();
  const month = state.calendarCursor.getMonth();
  const monthly = state.calendar.filter(item => {
    const date = parseDateOnly(item.task_date);
    return date && date.getFullYear() === year && date.getMonth() === month;
  });
  el('calendarMiniStats').innerHTML = `
    <div><strong>${monthly.length}</strong><span>Tổng lịch</span></div>
    <div><strong>${new Set(monthly.map(item => item.task_date)).size}</strong><span>Ngày có lịch</span></div>
  `;
}

function renderWorkScheduleTable(eventsByDate = groupCalendarByDate()) {
  if (!has('workScheduleBody')) return;
  const selectedDate = parseDateOnly(state.selectedCalendarDate) || new Date();
  const weekStart = getWeekStart(selectedDate);
  const weekStartKey = localDateString(weekStart);
  const weekDays = Array.from({ length: 7 }, (_, index) => new Date(
    weekStart.getFullYear(),
    weekStart.getMonth(),
    weekStart.getDate() + index
  ));
  const weekEnd = weekDays[weekDays.length - 1];
  const weekMeta = getWeekMeta(weekStartKey);

  renderWeekMetaInputs(weekStartKey, weekStart, weekEnd, weekMeta);

  if (has('scheduleDutySummary')) {
    el('scheduleDutySummary').textContent = weekMeta.duty_summary
      ? `TCH Học viện: ${weekMeta.duty_summary}`
      : 'TCH Học viện: Chưa có dữ liệu';
  }
  if (has('scheduleRoomSummary')) {
    el('scheduleRoomSummary').textContent = weekMeta.room_summary
      ? `TCH Phòng: ${weekMeta.room_summary}`
      : 'TCH Phòng: Chưa có dữ liệu';
  }

  el('workScheduleBody').innerHTML = weekDays.map((date, dayIndex) => {
    const dateKey = localDateString(date);
    const events = (eventsByDate.get(dateKey) || []).slice().sort(sortCalendarEvents);
    const rows = events.length ? events : [null];
    return rows.map((item, rowIndex) => {
      const highlight = dayIndex % 2 === 1 || !item ? 'schedule-highlight' : '';
      return `
        <tr class="${highlight}">
          ${rowIndex === 0 ? `<td class="schedule-day" rowspan="${rows.length}">${formatScheduleDay(date)}</td>` : ''}
          ${rowIndex === 0 ? `<td class="schedule-duty" rowspan="${rows.length}">${escapeHtml(firstText(events.map(event => event.duty_officer)))}</td>` : ''}
          <td class="schedule-time">${item ? escapeHtml(item.start_time || '') : ''}</td>
          <td class="schedule-content">${item ? escapeHtml(item.title || item.content || '') : ''}</td>
          <td>${item ? escapeHtml(item.tt_hv || '') : ''}</td>
          <td>${item ? escapeHtml(item.tt_phong || '') : ''}</td>
          <td>${item ? escapeHtml(item.person_in_charge || '') : ''}</td>
          <td>${item ? escapeHtml(item.ban || '') : ''}</td>
          <td>${item ? escapeHtml(item.location || '') : ''}</td>
        </tr>
      `;
    }).join('');
  }).join('');
}

function getWeekMeta(weekStartKey) {
  return state.calendarWeekMeta.find(item => item.week_start === weekStartKey) || {
    week_start: weekStartKey,
    duty_summary: '',
    room_summary: ''
  };
}

function renderWeekMetaInputs(weekStartKey, weekStart, weekEnd, weekMeta) {
  if (has('weekMetaRange')) {
    el('weekMetaRange').textContent = `Tuần ${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`;
  }
  if (has('weekDutySummary') && el('weekDutySummary').dataset.weekStart !== weekStartKey) {
    el('weekDutySummary').value = weekMeta.duty_summary || '';
    el('weekDutySummary').dataset.weekStart = weekStartKey;
  }
  if (has('weekRoomSummary') && el('weekRoomSummary').dataset.weekStart !== weekStartKey) {
    el('weekRoomSummary').value = weekMeta.room_summary || '';
    el('weekRoomSummary').dataset.weekStart = weekStartKey;
  }
}

async function saveWeekMeta(event) {
  event.preventDefault();
  const selectedDate = parseDateOnly(state.selectedCalendarDate) || new Date();
  const weekStart = getWeekStart(selectedDate);
  const weekStartKey = localDateString(weekStart);
  try {
    const row = await request('/api/calendar/week-meta', {
      method: 'PUT',
      body: JSON.stringify({
        weekStart: weekStartKey,
        dutySummary: el('weekDutySummary').value,
        roomSummary: el('weekRoomSummary').value
      })
    });
    state.calendarWeekMeta = [
      ...state.calendarWeekMeta.filter(item => item.week_start !== row.week_start),
      row
    ];
    if (has('weekDutySummary')) el('weekDutySummary').dataset.weekStart = row.week_start;
    if (has('weekRoomSummary')) el('weekRoomSummary').dataset.weekStart = row.week_start;
    toast('Đã lưu thông tin tuần.');
    renderCalendar();
  } catch (error) {
    toast(error.message);
  }
}

function uniqueTexts(values) {
  return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))];
}

function firstText(values) {
  return uniqueTexts(values)[0] || '';
}

function formatScheduleDay(date) {
  const weekdays = ['CN', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return `${weekdays[date.getDay()]}<br>${date.toLocaleDateString('vi-VN')}`;
}

function groupCalendarByDate() {
  const map = new Map();
  state.calendar.forEach(item => {
    const key = item.task_date;
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  map.forEach(items => items.sort(sortCalendarEvents));
  return map;
}

function sortCalendarEvents(a, b) {
  return String(a.start_time || '').localeCompare(String(b.start_time || '')) || String(a.title || '').localeCompare(String(b.title || ''), 'vi');
}

function formatEventTime(item) {
  return item.start_time ? `${item.start_time} ` : '';
}

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateOnly(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function getWeekStart(date) {
  const value = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (value.getDay() + 6) % 7;
  value.setDate(value.getDate() - offset);
  return value;
}

function formatShortDate(date) {
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function selectCalendarDate(dateKey) {
  state.selectedCalendarDate = dateKey;
  const date = parseDateOnly(dateKey);
  if (date) state.calendarCursor = new Date(date.getFullYear(), date.getMonth(), 1);
  renderCalendar();
}

function setCalendarView(view) {
  if (!['month', 'week', 'day'].includes(view)) return;
  state.calendarView = view;
  const selected = parseDateOnly(state.selectedCalendarDate) || new Date();
  state.calendarCursor = new Date(selected.getFullYear(), selected.getMonth(), 1);
  renderCalendar();
}

function moveCalendarPeriod(delta) {
  const selected = parseDateOnly(state.selectedCalendarDate) || new Date();
  if (state.calendarView === 'day') {
    const next = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() + delta);
    state.selectedCalendarDate = localDateString(next);
    state.calendarCursor = new Date(next.getFullYear(), next.getMonth(), 1);
    renderCalendar();
    return;
  }

  if (state.calendarView === 'week') {
    const next = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() + delta * 7);
    state.selectedCalendarDate = localDateString(next);
    state.calendarCursor = new Date(next.getFullYear(), next.getMonth(), 1);
    renderCalendar();
    return;
  }

  const cursor = state.calendarCursor || selected;
  state.calendarCursor = new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1);
  renderCalendar();
}

function goCalendarToday() {
  const today = new Date();
  state.calendarCursor = new Date(today.getFullYear(), today.getMonth(), 1);
  state.selectedCalendarDate = localDateString(today);
  renderCalendar();
}

function focusCalendarTitle() {
  if (has('calendarTitle')) el('calendarTitle').focus();
}

async function createCalendar(event) {
  event.preventDefault();
  try {
    const body = {
      title: el('calendarTitle').value,
      content: el('calendarTitle').value,
      date: el('calendarDate').value,
      startTime: el('calendarStart').value,
      endTime: el('calendarEnd').value,
      location: el('calendarLocation').value,
      ttHv: el('calendarTtHv').value,
      ttPhong: el('calendarTtPhong').value,
      ban: el('calendarBan').value,
      personInCharge: el('calendarOwner').value,
      dutyOfficer: el('calendarDutyOfficer').value,
      status: 'Published'
    };
    await request('/api/calendar', { method: 'POST', body: JSON.stringify(body) });
    if (body.date) {
      state.selectedCalendarDate = body.date;
      const date = parseDateOnly(body.date);
      if (date) state.calendarCursor = new Date(date.getFullYear(), date.getMonth(), 1);
    }
    event.target.reset();
    setDefaultDates();
    toast('Đã thêm lịch tuần.');
    loadData();
  } catch (error) {
    toast(error.message);
  }
}

function deleteIconButton(id, label = 'Xóa') {
  return iconButton('trash', label, `deleteCalendar(${id})`, 'danger-btn');
}

function toggleWorkScheduleFullscreen() {
  const target = el('workScheduleCard');
  if (!target) return;
  if (!document.fullscreenElement) {
    target.requestFullscreen?.();
    target.classList.add('fullscreen-mode');
  } else {
    document.exitFullscreen?.();
  }
}

async function deleteCalendar(id) {
  await mutate(`/api/calendar/${id}`, { method: 'DELETE' }, 'Đã xóa lịch.');
}

function renderStudents() {
  if (!has('studentBody')) return;
  el('studentBody').innerHTML = state.students.length ? state.students.map(item => `
    <tr>
      <td><strong>${escapeHtml(item.student_code)}</strong></td>
      <td>${escapeHtml(item.full_name)}</td>
      <td>${escapeHtml(item.rank || '')}</td>
      <td>${escapeHtml(item.unit || '')}</td>
      <td>${escapeHtml(item.class_name || '')}</td>
      <td>${selectHtml(statusOptions.student, item.status, `updateStudentStatus(${item.id}, this.value)`)}</td>
      <td>${iconButton('trash', 'Xóa học viên', `deleteStudent(${item.id})`, 'danger-btn')}</td>
    </tr>
  `).join('') : '<tr><td colspan="7" class="empty">Chưa có hồ sơ học viên.</td></tr>';
}

async function createStudent(event) {
  event.preventDefault();
  try {
    const body = {
      studentCode: el('studentCode').value,
      fullName: el('studentName').value,
      rank: el('studentRank').value,
      unit: el('studentUnit').value,
      className: el('studentClass').value,
      status: el('studentStatus').value
    };
    await request('/api/students', { method: 'POST', body: JSON.stringify(body) });
    event.target.reset();
    toast('Đã thêm học viên.');
    loadData();
  } catch (error) {
    toast(error.message);
  }
}

async function updateStudentStatus(id, status) {
  const current = state.students.find(item => item.id === id);
  if (!current) return;
  try {
    await request(`/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...current, status })
    });
    toast('Đã cập nhật học viên.');
    loadData();
  } catch (error) {
    toast(error.message);
  }
}

async function deleteStudent(id) {
  await mutate(`/api/students/${id}`, { method: 'DELETE' }, 'Đã xóa học viên.');
}

function renderTasks() {
  if (!has('taskCards')) return;
  el('taskCards').innerHTML = state.tasks.length ? state.tasks.map(item => `
    <article class="task-card ${statusClass(item.status)}">
      <div>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.description || '')}</p>
      </div>
      <div class="task-meta">
        <span>${escapeHtml(item.assignee || 'Chưa giao')}</span>
        <span>${formatDate(item.due_date)}</span>
        <span>${escapeHtml(item.priority)}</span>
      </div>
      <div class="progress"><span data-progress="${Math.min(100, Math.max(0, Number(item.progress) || 0))}"></span></div>
      <div class="task-actions">
        ${selectHtml(statusOptions.task, item.status, `updateTaskStatus(${item.id}, this.value)`)}
        ${iconButton('bell', 'Gửi nhắc việc', `remindTask(${item.id})`)}
        ${iconButton('trash', 'Xóa công việc', `deleteTask(${item.id})`, 'danger-btn')}
      </div>
    </article>
  `).join('') : '<p class="empty">Chưa có công việc.</p>';
  el('taskCards').querySelectorAll('.progress span[data-progress]').forEach(span => {
    span.style.width = `${span.dataset.progress}%`;
  });
}

async function createTask(event) {
  event.preventDefault();
  try {
    const body = {
      title: el('taskTitle').value,
      assignee: el('taskAssignee').value,
      dueDate: el('taskDueDate').value,
      priority: el('taskPriority').value,
      status: el('taskStatus').value
    };
    await request('/api/tasks', { method: 'POST', body: JSON.stringify(body) });
    event.target.reset();
    setDefaultDates();
    toast('Đã thêm công việc.');
    loadData();
  } catch (error) {
    toast(error.message);
  }
}

async function updateTaskStatus(id, status) {
  const current = state.tasks.find(item => item.id === id);
  if (!current) return;
  const progress = status === 'Completed' ? 100 : current.progress;
  try {
    await request(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...current, status, progress })
    });
    toast('Đã cập nhật công việc.');
    loadData();
  } catch (error) {
    toast(error.message);
  }
}

async function remindTask(id) {
  await mutate(`/api/tasks/${id}/remind`, { method: 'POST', body: '{}' }, 'Đã gửi nhắc việc.');
}

async function deleteTask(id) {
  await mutate(`/api/tasks/${id}`, { method: 'DELETE' }, 'Đã xóa công việc.');
}

async function markNotificationRead(id) {
  await mutate(`/api/notifications/${id}/read`, { method: 'PUT', body: '{}' }, 'Đã đánh dấu thông báo.');
}

async function mutate(url, options, successMessage) {
  try {
    await request(url, options);
    toast(successMessage);
    loadData();
  } catch (error) {
    toast(error.message);
  }
}

function defaultExamSubjectDraft() {
  return {
    id: null,
    examDate: localDateString(new Date()),
    subjectName: '',
    note: ''
  };
}

function iconSvg(name) {
  const icons = {
    plus: iconPaths.plus,
    save: iconPaths.save,
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle>',
    edit: '<path d="M12 20h9"></path><path d="m16.5 3.5 4 4L7 21H3v-4L16.5 3.5Z"></path>',
    trash: '<path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path>',
    check: iconPaths.check,
    bell: iconPaths.bell,
    upload: iconPaths.upload,
    download: iconPaths.download,
    lock: iconPaths.lock,
    unlock: iconPaths.unlock,
    x: iconPaths.x,
    maximize: iconPaths.maximize,
    refresh: iconPaths.refresh,
    send: iconPaths.send,
    play: iconPaths.play,
    calendar: iconPaths.calendar,
    chevronLeft: iconPaths.chevronLeft,
    chevronRight: iconPaths.chevronRight
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24">${icons[name] || icons.eye}</svg>`;
}

function iconButton(name, label, handler, extraClass = '') {
  return `<button type="button" class="icon-action-btn ${extraClass}" onclick="${handler}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">${iconSvg(name)}</button>`;
}

const buttonIconLabels = {
  'Đăng nhập': 'lock',
  'Tạo lịch': 'plus',
  'Lưu thông tin tuần': 'save',
  'Lưu lịch': 'save',
  'Thêm học viên': 'plus',
  'Thêm việc': 'plus',
  'Bốc thăm ngay': 'play',
  'Bốc thăm': 'play',
  'Thêm môn': 'plus',
  'Hủy sửa': 'x',
  'Tải tài liệu': 'upload',
  'Đóng chi tiết': 'x',
  'Toàn màn hình': 'maximize',
  'Xuất Word': 'download',
  'Tải lại': 'refresh',
  'Quay lại': 'chevronLeft',
  'Tiếp tục': 'chevronRight',
  'Gửi': 'send',
  'Làm mới': 'refresh',
  'Thêm tài khoản': 'plus',
  'Lưu cập nhật': 'save',
  'Lưu cập nhật kỳ thi': 'save',
  'Tạo kỳ thi': 'plus',
  'Hôm nay': 'calendar',
  'Trước': 'chevronLeft',
  'Sau': 'chevronRight',
  'Thêm danh sách': 'plus',
  'Thêm phòng thi': 'plus'
};

function enhanceActionButtons(root = document) {
  root.querySelectorAll('button').forEach(button => {
    if (button.querySelector('svg')) return;
    if (button.classList.contains('calendar-day') || button.classList.contains('exam-subject-chip')) return;
    if (button.closest('.calendar-view-switch')) return;
    const label = button.textContent.trim().replace(/\s+/g, ' ');
    const icon = buttonIconLabels[label];
    if (!icon) return;
    button.insertAdjacentHTML('afterbegin', iconSvg(icon));
  });
}

function setExamSubmitButton(isEditing) {
  if (!has('examSubmitButton')) return;
  const label = isEditing ? 'Lưu cập nhật kỳ thi' : 'Tạo kỳ thi';
  el('examSubmitButton').innerHTML = iconSvg(isEditing ? 'save' : 'plus');
  el('examSubmitButton').setAttribute('title', label);
  el('examSubmitButton').setAttribute('aria-label', label);
}

function selectedExamSession() {
  return state.examSessions.find(item => item.id === state.selectedExamSessionId) || null;
}

function selectedExamSubject() {
  const exam = selectedExamSession();
  return exam?.subjects?.find(item => item.id === state.selectedExamSubjectId) || null;
}

function syncExamSelection() {
  if (!state.examSessions.length) {
    state.selectedExamSessionId = null;
    state.selectedExamSubjectId = null;
    return;
  }

  const exam = selectedExamSession();
  if (!exam) {
    state.selectedExamSessionId = null;
    state.selectedExamSubjectId = null;
    return;
  }

  const subjects = exam.subjects || [];
  if (!subjects.length) {
    state.selectedExamSubjectId = null;
    return;
  }

  if (!subjects.some(item => item.id === state.selectedExamSubjectId)) {
    state.selectedExamSubjectId = subjects[0].id;
  }
}

function formatExamSubjectLine(subject) {
  return `${formatDate(subject.exam_date)} · ${subject.subject_name}`;
}

function renderExamSubjectDrafts() {
  if (!has('examSubjectRows')) return;
  if (!state.examSubjectDrafts.length) state.examSubjectDrafts = [defaultExamSubjectDraft()];
  el('examSubjectRows').innerHTML = state.examSubjectDrafts.map((item, index) => `
    <div class="exam-subject-row" data-subject-id="${item.id || ''}">
      <input data-field="examDate" type="date" value="${escapeHtml(item.examDate || localDateString(new Date()))}" required />
      <input data-field="subjectName" value="${escapeHtml(item.subjectName || '')}" placeholder="Môn thi" required />
      <input data-field="note" value="${escapeHtml(item.note || '')}" placeholder="Ghi chú" />
      ${iconButton('trash', 'Xóa môn thi', `removeExamSubjectRow(${index})`, 'danger-btn')}
    </div>
  `).join('');
}

function collectExamSubjectDrafts() {
  const rows = [...document.querySelectorAll('.exam-subject-row')];
  if (!rows.length) return state.examSubjectDrafts;
  return rows.map(row => ({
    id: Number(row.dataset.subjectId) || null,
    examDate: row.querySelector('[data-field="examDate"]')?.value || '',
    subjectName: row.querySelector('[data-field="subjectName"]')?.value || '',
    note: row.querySelector('[data-field="note"]')?.value || ''
  }));
}

function addExamSubjectRow() {
  state.examSubjectDrafts = collectExamSubjectDrafts();
  state.examSubjectDrafts.push(defaultExamSubjectDraft());
  renderExamSubjectDrafts();
}

function removeExamSubjectRow(index) {
  state.examSubjectDrafts = collectExamSubjectDrafts();
  if (state.examSubjectDrafts.length <= 1) return toast('Kỳ thi cần ít nhất một ngày thi - môn thi.');
  state.examSubjectDrafts.splice(index, 1);
  renderExamSubjectDrafts();
}

function resetExamSessionForm() {
  state.editingExamSessionId = null;
  state.examSubjectDrafts = [defaultExamSubjectDraft()];
  if (has('examSessionForm')) el('examSessionForm').reset();
  if (has('examFormTitle')) el('examFormTitle').textContent = 'Tạo kỳ thi';
  setExamSubmitButton(false);
  if (has('examCancelEditButton')) el('examCancelEditButton').classList.add('hidden');
  renderExamSubjectDrafts();
}

function editExamSession(id) {
  const exam = state.examSessions.find(item => item.id === id);
  if (!exam) return;
  state.editingExamSessionId = id;
  state.examSubjectDrafts = (exam.subjects || []).map(item => ({
    id: item.id,
    examDate: item.exam_date,
    subjectName: item.subject_name,
    note: item.note || ''
  }));
  if (!state.examSubjectDrafts.length) state.examSubjectDrafts = [defaultExamSubjectDraft()];

  if (has('examTargetName')) el('examTargetName').value = exam.target_name || '';
  if (has('examStudentCount')) el('examStudentCount').value = exam.student_count || 0;
  if (has('examNote')) el('examNote').value = exam.note || '';
  if (has('examFormTitle')) el('examFormTitle').textContent = 'Cập nhật kỳ thi';
  setExamSubmitButton(true);
  if (has('examCancelEditButton')) el('examCancelEditButton').classList.remove('hidden');
  renderExamSubjectDrafts();
  el('examSessionForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function saveExamSession(event) {
  event.preventDefault();
  const body = {
    targetName: el('examTargetName')?.value || '',
    studentCount: Number(el('examStudentCount')?.value || 0),
    note: el('examNote')?.value || '',
    subjects: collectExamSubjectDrafts()
  };
  const isEditing = Boolean(state.editingExamSessionId);
  try {
    const saved = await request(isEditing ? `/api/exam-sessions/${state.editingExamSessionId}` : '/api/exam-sessions', {
      method: isEditing ? 'PUT' : 'POST',
      body: JSON.stringify(body)
    });
    state.selectedExamSessionId = saved.id;
    state.selectedExamSubjectId = saved.subjects?.[0]?.id || null;
    resetExamSessionForm();
    toast(isEditing ? 'Đã cập nhật kỳ thi.' : 'Đã tạo kỳ thi.');
    loadData();
  } catch (error) {
    toast(error.message);
  }
}

async function deleteExamSession(id) {
  const exam = state.examSessions.find(item => item.id === id);
  if (!exam) return;
  if (!confirm(`Xóa kỳ thi "${exam.target_name}"?`)) return;
  try {
    await request(`/api/exam-sessions/${id}`, { method: 'DELETE' });
    if (state.selectedExamSessionId === id) {
      state.selectedExamSessionId = null;
      state.selectedExamSubjectId = null;
    }
    toast('Đã xóa kỳ thi.');
    loadData();
  } catch (error) {
    toast(error.message);
  }
}

function selectExamSession(id) {
  state.selectedExamSessionId = id;
  const exam = selectedExamSession();
  state.selectedExamSubjectId = exam?.subjects?.[0]?.id || null;
  state.teachers = {};
  state.rooms = [];
  clearDrawResult();
  renderExamSessions();
  renderLists();
  loadData();
}

function closeExamDetail() {
  state.selectedExamSessionId = null;
  state.selectedExamSubjectId = null;
  state.teachers = {};
  state.rooms = [];
  clearDrawResult();
  renderExamSessions();
  renderLists();
  loadHistory();
}

function selectExamSubject(examId, subjectId) {
  state.selectedExamSessionId = examId;
  state.selectedExamSubjectId = subjectId;
  clearDrawResult();
  renderExamSessions();
  loadHistory();
}

function renderExamSessions() {
  if (!has('examSessionList')) return;
  syncExamSelection();
  renderExamSubjectDrafts();
  renderExamSessionList();
  renderExamDetail();
  renderExamDocuments();
  updateDrawContext();
}

function filteredExamSessions() {
  const query = state.examSearchQuery.trim().toLowerCase();
  if (!query) return state.examSessions;
  return state.examSessions.filter(exam => String(exam.target_name || '').toLowerCase().includes(query));
}

function setExamSearch(value) {
  state.examSearchQuery = value || '';
  state.examPage = 1;
  renderExamSessionList();
}

function moveExamPage(delta) {
  const totalPages = Math.max(1, Math.ceil(filteredExamSessions().length / state.examPageSize));
  state.examPage = Math.min(totalPages, Math.max(1, state.examPage + delta));
  renderExamSessionList();
}

function renderExamSessionList() {
  const target = el('examSessionList');
  if (!target) return;
  if (has('examSearchInput') && el('examSearchInput').value !== state.examSearchQuery) {
    el('examSearchInput').value = state.examSearchQuery;
  }

  const items = filteredExamSessions();
  const totalPages = Math.max(1, Math.ceil(items.length / state.examPageSize));
  state.examPage = Math.min(totalPages, Math.max(1, state.examPage));
  const start = (state.examPage - 1) * state.examPageSize;
  const pageItems = items.slice(start, start + state.examPageSize);

  target.innerHTML = pageItems.length ? pageItems.map(exam => {
    const summary = exam.summary || {};
    return `
      <article class="exam-session-item ${exam.id === state.selectedExamSessionId ? 'active' : ''}">
        <div class="exam-session-main">
          <button type="button" onclick="selectExamSession(${exam.id})" aria-label="Xem chi tiết kỳ thi ${escapeHtml(exam.target_name)}">
            <span class="exam-session-kicker">${Number(exam.student_count) || 0} học viên</span>
            <strong>${escapeHtml(exam.target_name)}</strong>
            <small>${escapeHtml(exam.note || 'Chưa có ghi chú')}</small>
          </button>
          <div class="exam-session-metrics">
            <span>${summary.subjects || 0} môn</span>
            <span>${summary.documents || 0} tài liệu</span>
            <span>${summary.rooms || 0} phòng</span>
          </div>
        </div>
        <div class="exam-session-actions">
          ${iconButton('eye', 'Chi tiết kỳ thi', `selectExamSession(${exam.id})`, 'primary')}
          ${iconButton('edit', 'Sửa kỳ thi', `editExamSession(${exam.id})`)}
          ${iconButton('trash', 'Xóa kỳ thi', `deleteExamSession(${exam.id})`, 'danger-btn')}
        </div>
      </article>
    `;
  }).join('') : '<p class="empty-small">Không có kỳ thi phù hợp.</p>';

  if (has('examPaginationInfo')) {
    const from = items.length ? start + 1 : 0;
    const to = Math.min(items.length, start + state.examPageSize);
    el('examPaginationInfo').textContent = `${from}-${to}/${items.length}`;
  }
  if (has('examPrevPage')) el('examPrevPage').disabled = state.examPage <= 1;
  if (has('examNextPage')) el('examNextPage').disabled = state.examPage >= totalPages;
}

function renderExamDetail() {
  const exam = selectedExamSession();
  const detail = el('examDetailPanel');
  const empty = el('examNoSelection');
  if (!detail || !empty) return;

  if (!exam) {
    detail.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  detail.classList.remove('hidden');
  if (has('examDetailTitle')) el('examDetailTitle').textContent = exam.target_name;
  if (has('examDetailMeta')) {
    const summary = exam.summary || {};
    const teachers = summary.teachers || {};
    el('examDetailMeta').textContent = [
      `${Number(exam.student_count) || 0} học viên`,
      `${summary.subjects || 0} môn thi`,
      `${summary.documents || 0} tài liệu`,
      `${summary.rooms || 0} phòng`,
      `${(teachers.examiner1 || 0) + (teachers.examiner2 || 0) + (teachers.supervisor || 0)} cán bộ`
    ].join(' · ');
  }
  if (has('examDetailSubjects')) {
    el('examDetailSubjects').innerHTML = (exam.subjects || []).length ? exam.subjects.map(subject => `
      <button type="button" class="exam-subject-chip ${subject.id === state.selectedExamSubjectId ? 'active' : ''}" onclick="selectExamSubject(${exam.id}, ${subject.id})">
        <strong>${escapeHtml(formatDate(subject.exam_date))}</strong>
        <span>${escapeHtml(subject.subject_name)}</span>
        <small>${Number(subject.draw_count) || 0} lần bốc thăm</small>
      </button>
    `).join('') : '<p class="empty-small">Kỳ thi chưa có ngày thi - môn thi.</p>';
  }
}

function renderExamDocuments() {
  if (!has('examDocumentList')) return;
  const exam = selectedExamSession();
  const context = el('examDocumentContext');
  if (context) context.textContent = exam ? `${(exam.documents || []).length} tài liệu đã tải lên` : 'Chọn một kỳ thi để tải tài liệu.';

  if (!exam) {
    el('examDocumentList').innerHTML = '<p class="empty-small">Chưa chọn kỳ thi.</p>';
    return;
  }

  const documents = exam.documents || [];
  el('examDocumentList').innerHTML = documents.length ? documents.map(item => `
    <div class="exam-document-item">
      <div class="exam-document-info">
        <span class="exam-document-icon">DOC</span>
        <div>
          <strong>${escapeHtml(item.original_name)}</strong>
          <small>${formatFileSize(item.size)} · ${formatDateTime(item.created_at)}</small>
        </div>
      </div>
      <div class="actions">
        ${iconButton('download', 'Tải tài liệu', `downloadExamDocument(${exam.id}, ${item.id})`)}
        ${iconButton('trash', 'Xóa tài liệu', `deleteExamDocument(${exam.id}, ${item.id})`, 'danger-btn')}
      </div>
    </div>
  `).join('') : '<p class="empty-small">Chưa có tài liệu nào.</p>';
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Không đọc được file.'));
    reader.readAsDataURL(file);
  });
}

async function uploadExamDocument(event) {
  event.preventDefault();
  const exam = selectedExamSession();
  if (!exam) return toast('Vui lòng chọn kỳ thi.');
  const fileInput = el('examDocumentFile');
  const file = fileInput?.files?.[0];
  if (!file) return toast('Vui lòng chọn file PDF, DOC hoặc DOCX.');

  try {
    const contentBase64 = await readFileAsDataUrl(file);
    await request(`/api/exam-sessions/${exam.id}/documents`, {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        contentBase64
      })
    });
    event.target.reset();
    toast('Đã tải tài liệu kỳ thi.');
    loadData();
  } catch (error) {
    toast(error.message);
  }
}

async function downloadExamDocument(examId, documentId) {
  try {
    await downloadFile(`/api/exam-sessions/${examId}/documents/${documentId}/download`, 'tai-lieu-ky-thi');
  } catch (error) {
    toast(error.message);
  }
}

async function deleteExamDocument(examId, documentId) {
  if (!confirm('Xóa tài liệu này khỏi kỳ thi?')) return;
  try {
    await request(`/api/exam-sessions/${examId}/documents/${documentId}`, { method: 'DELETE' });
    toast('Đã xóa tài liệu.');
    loadData();
  } catch (error) {
    toast(error.message);
  }
}

function formatFileSize(size) {
  const bytes = Number(size) || 0;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function updateDrawContext() {
  const exam = selectedExamSession();
  const subject = selectedExamSubject();
  const contextText = exam && subject
    ? `${exam.target_name} · ${formatExamSubjectLine(subject)}`
    : 'Chọn ngày thi - môn thi trước khi bốc thăm.';
  if (has('examSelectedContext')) el('examSelectedContext').textContent = contextText;
  if (has('drawExamContext')) el('drawExamContext').textContent = contextText;
}

function clearDrawResult() {
  state.currentSessionId = null;
  if (has('planBox')) {
    el('planBox').textContent = '';
    el('planBox').classList.add('hidden');
  }
  if (has('draw')) {
    el('draw').classList.remove('result-large');
  }
  if (has('resultBody')) {
    el('resultBody').innerHTML = '<tr><td colspan="5" class="empty">Chưa có kết quả bốc thăm.</td></tr>';
  }
  if (has('reserveBox')) {
    el('reserveBox').innerHTML = '';
    el('reserveBox').classList.add('hidden');
  }
}

function renderLists() {
  const exam = selectedExamSession();
  Object.entries(roleMap).forEach(([role, cfg]) => {
    if (!has(cfg.count) || !has(cfg.list)) return;
    const items = state.teachers[role] || [];
    el(cfg.count).textContent = items.length;
    el(cfg.list).innerHTML = !exam
      ? '<span class="empty-small">Chọn chi tiết kỳ thi để nhập danh sách.</span>'
      : items.length
      ? items.map(item => `<span class="pill">${escapeHtml(item.name)} <button onclick="deleteTeacher(${item.id})" title="Xóa cán bộ" aria-label="Xóa cán bộ">${iconSvg('x')}</button></span>`).join('')
      : '<span class="empty-small">Chưa có dữ liệu</span>';
  });

  renderRooms();
}

function renderRooms() {
  if (!has('countRooms') || !has('listRooms')) return;
  const exam = selectedExamSession();
  el('countRooms').textContent = state.rooms.length;
  el('listRooms').innerHTML = !exam
    ? '<span class="empty-small">Chọn chi tiết kỳ thi để nhập phòng thi.</span>'
    : state.rooms.length
    ? state.rooms.map(room => `
      <span class="pill room-pill">
        ${escapeHtml(room.name)}
        <label class="pair-toggle">
          <input type="checkbox" ${Number(room.allow_supervisor_pair) === 1 ? 'checked' : ''} onchange="toggleSupervisorPair(${room.id}, this.checked)" />
          Ghép GS
        </label>
        <button onclick="deleteRoom(${room.id})" title="Xóa phòng thi" aria-label="Xóa phòng thi">${iconSvg('x')}</button>
      </span>
    `).join('')
    : '<span class="empty-small">Chưa có dữ liệu</span>';
}

async function importTeachers(role, textareaId) {
  const exam = selectedExamSession();
  if (!exam) return toast('Vui lòng chọn chi tiết kỳ thi trước khi thêm danh sách.');
  const textarea = el(textareaId);
  const names = textarea.value.trim();
  if (!names) return toast('Vui lòng nhập danh sách.');
  try {
    const data = await request('/api/teachers/import', {
      method: 'POST',
      body: JSON.stringify({ role, names, examSessionId: exam.id })
    });
    textarea.value = '';
    toast(`Đã thêm ${data.inserted} cán bộ.`);
    loadData();
  } catch (error) {
    toast(error.message);
  }
}

async function importRooms() {
  const exam = selectedExamSession();
  if (!exam) return toast('Vui lòng chọn chi tiết kỳ thi trước khi thêm phòng thi.');
  const textarea = el('bulkRooms');
  const names = textarea.value.trim();
  if (!names) return toast('Vui lòng nhập danh sách phòng thi.');
  try {
    const data = await request('/api/rooms/import', {
      method: 'POST',
      body: JSON.stringify({ names, examSessionId: exam.id })
    });
    textarea.value = '';
    toast(`Đã thêm ${data.inserted} phòng thi.`);
    loadData();
  } catch (error) {
    toast(error.message);
  }
}

async function deleteTeacher(id) {
  await mutate(`/api/teachers/${id}`, { method: 'DELETE' }, 'Đã xóa cán bộ.');
}

async function deleteRoom(id) {
  await mutate(`/api/rooms/${id}`, { method: 'DELETE' }, 'Đã xóa phòng thi.');
}

async function toggleSupervisorPair(id, allow) {
  try {
    await request(`/api/rooms/${id}/supervisor-pair`, {
      method: 'PATCH',
      body: JSON.stringify({ allow })
    });
    state.rooms = state.rooms.map(room => room.id === id ? { ...room, allow_supervisor_pair: allow ? 1 : 0 } : room);
    renderRooms();
  } catch (error) {
    toast(error.message);
    loadData();
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function rolePeople(role) {
  return state.teachers?.[role] || [];
}

function renderDrawPeople(items) {
  if (!items.length) return '<p class="empty">Chưa có dữ liệu.</p>';
  return `
    <div class="draw-roll-list">
      ${items.map((item, index) => `
        <div class="draw-roll-item">
          <span>${index + 1}</span>
          <strong>${escapeHtml(item.name)}</strong>
          <small>${escapeHtml(item.unit || item.note || '')}</small>
        </div>
      `).join('')}
    </div>
  `;
}

function renderDrawRooms() {
  if (!state.rooms.length) return '<p class="empty">Chưa có danh sách phòng thi.</p>';
  return `
    <div class="draw-roll-list rooms">
      ${state.rooms.map((room, index) => `
        <div class="draw-roll-item">
          <span>${index + 1}</span>
          <strong>${escapeHtml(room.name)}</strong>
          <small>${Number(room.allow_supervisor_pair) === 1 ? 'Ghép giám sát' : 'Giám sát riêng'}</small>
        </div>
      `).join('')}
    </div>
  `;
}

function renderDrawPlans() {
  return `
    <div class="draw-plan-grid">
      ${state.plans.map((plan, index) => `
        <div class="draw-plan-card">
          <span>${index + 1}</span>
          <strong>${escapeHtml(plan)}</strong>
        </div>
      `).join('')}
    </div>
  `;
}

function renderBallotBox() {
  const subject = selectedExamSubject();
  return `
    <div class="ballot-stage">
      <p class="ballot-context">${subject ? escapeHtml(formatExamSubjectLine(subject)) : 'Chưa chọn ngày thi - môn thi.'}</p>
      <div id="ballotBox" class="ballot-box">
        <img src="img/7330764.png" alt="Hộp phiếu bốc thăm" />
      </div>
      <button id="modalDrawButton" class="primary ballot-draw-button" onclick="executeDrawFromModal()">Bốc thăm</button>
      <p id="drawCountdown" class="ballot-status">Sẵn sàng bốc thăm.</p>
    </div>
  `;
}

function drawStepHtml(step) {
  if (step.type === 'role') return renderDrawPeople(rolePeople(step.role));
  if (step.type === 'rooms') return renderDrawRooms();
  if (step.type === 'plans') return renderDrawPlans();
  return renderBallotBox();
}

function renderDrawModalStep() {
  if (!has('drawModal')) return;
  const step = drawWizardSteps[state.drawStep];
  const isBoxStep = step.type === 'box';

  el('drawStepKicker').textContent = isBoxStep ? 'Hộp phiếu bốc thăm' : `Bước ${state.drawStep + 1}/${drawWizardSteps.length}`;
  el('drawStepTitle').textContent = step.title;
  el('drawStepProgress').classList.toggle('hidden', isBoxStep);
  el('drawStepContent').innerHTML = drawStepHtml(step);

  const prevButton = el('drawPrevButton');
  const nextButton = el('drawNextButton');
  const footer = el('drawModal')?.querySelector('.draw-modal-footer');
  if (prevButton) prevButton.classList.toggle('hidden', isBoxStep);
  if (nextButton) nextButton.classList.toggle('hidden', isBoxStep);
  if (footer) footer.classList.toggle('hidden', isBoxStep);
  if (prevButton) prevButton.disabled = state.drawBusy || state.drawStep === 0;
  if (nextButton) nextButton.disabled = state.drawBusy;
}

function openDrawModal() {
  if (!has('drawModal')) return;
  state.drawStep = drawWizardSteps.findIndex(step => step.type === 'box');
  if (state.drawStep < 0) state.drawStep = 0;
  state.drawBusy = false;
  renderDrawModalStep();
  el('drawModal').classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function hideDrawModal() {
  if (!has('drawModal')) return;
  el('drawModal').classList.add('hidden');
  document.body.classList.remove('modal-open');
  el('ballotBox')?.classList.remove('shaking');
}

function closeDrawModal() {
  if (state.drawBusy) return;
  hideDrawModal();
}

function nextDrawStep() {
  if (state.drawBusy) return;
  state.drawStep = Math.min(state.drawStep + 1, drawWizardSteps.length - 1);
  renderDrawModalStep();
}

function prevDrawStep() {
  if (state.drawBusy) return;
  state.drawStep = Math.max(state.drawStep - 1, 0);
  renderDrawModalStep();
}

async function drawNow() {
  if (!selectedExamSubject()) return toast('Vui lòng chọn ngày thi - môn thi trước khi bốc thăm.');
  openDrawModal();
}

async function executeDrawFromModal() {
  if (state.drawBusy) return;
  state.drawBusy = true;
  const ballotBox = el('ballotBox');
  const drawButton = el('modalDrawButton');
  const countdown = el('drawCountdown');
  const prevButton = el('drawPrevButton');
  const nextButton = el('drawNextButton');

  ballotBox?.classList.add('shaking');
  if (drawButton) drawButton.disabled = true;
  if (prevButton) prevButton.disabled = true;
  if (nextButton) nextButton.disabled = true;

  let remaining = DRAW_SHAKE_MS / 1000;
  if (countdown) countdown.textContent = `Đang lắc hộp phiếu: ${remaining}s`;
  const timer = setInterval(() => {
    remaining -= 1;
    if (countdown && remaining > 0) countdown.textContent = `Đang lắc hộp phiếu: ${remaining}s`;
  }, 1000);

  try {
    await wait(DRAW_SHAKE_MS);
    clearInterval(timer);
    if (countdown) countdown.textContent = 'Đang mở phiếu...';
    const data = await request('/api/draw', {
      method: 'POST',
      body: JSON.stringify({ examSubjectId: state.selectedExamSubjectId })
    });
    state.currentSessionId = data.sessionId;
    renderResult(data.planName, data.rows, data.reserves);
    toast('Bốc thăm thành công.');
    loadHistory();
    loadData();
    hideDrawModal();
    el('draw')?.scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    clearInterval(timer);
    if (countdown) countdown.textContent = error.message;
    toast(error.message);
  } finally {
    state.drawBusy = false;
    ballotBox?.classList.remove('shaking');
    if (drawButton) drawButton.disabled = false;
    if (prevButton) prevButton.disabled = state.drawStep === 0;
    if (nextButton) nextButton.disabled = false;
  }
}

function renderResult(planName, rows, reserves = []) {
  if (!has('planBox') || !has('resultBody')) return;
  const planBox = el('planBox');
  const exam = selectedExamSession();
  const subject = selectedExamSubject();
  const context = exam && subject ? `${exam.target_name} · ${formatExamSubjectLine(subject)} · ` : '';
  planBox.textContent = `${context}Phương án đánh số báo danh: ${planName}`;
  planBox.classList.remove('hidden');
  el('draw')?.classList.add('result-large');
  el('resultBody').innerHTML = rows.map((row, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><strong>${escapeHtml(row.roomName)}</strong></td>
      <td>${escapeHtml(row.examiner1Name)}</td>
      <td>${escapeHtml(row.examiner2Name)}</td>
      <td>${escapeHtml(row.supervisorName)}</td>
    </tr>
  `).join('');
  renderReserves(reserves);
}

function renderReserves(reserves = []) {
  const reserveBox = el('reserveBox');
  if (!reserveBox) return;
  if (!reserves.length) {
    reserveBox.classList.add('hidden');
    reserveBox.innerHTML = '';
    return;
  }

  const labels = {
    examiner1: 'Cán bộ coi thi 1',
    examiner2: 'Cán bộ coi thi 2',
    supervisor: 'Cán bộ giám sát'
  };
  const html = Object.entries(labels).map(([role, label]) => {
    const items = reserves.filter(item => item.role === role);
    if (!items.length) return '';
    return `
      <div>
        <h5>${label} dự bị</h5>
        <div class="reserve-list">${items.map(item => `<span class="pill">${escapeHtml(item.staffName || item.staff_name)}</span>`).join('')}</div>
      </div>
    `;
  }).join('');

  reserveBox.innerHTML = `<h4>Danh sách dự bị</h4>${html}`;
  reserveBox.classList.remove('hidden');
}

async function loadHistory() {
  if (!has('historyList')) return;
  const subject = selectedExamSubject();
  const url = subject ? `/api/history?examSubjectId=${subject.id}` : '/api/history';
  const items = await safeRequest(url, []);
  el('historyList').innerHTML = items.length ? items.map(item => `
    <div class="history-item">
      <div>
        <strong>${escapeHtml(item.plan_name)}</strong>
        <p>${escapeHtml([item.target_name, item.subject_name, item.exam_date ? formatDate(item.exam_date) : ''].filter(Boolean).join(' · '))}</p>
        <small>${formatDateTime(item.created_at)}</small>
      </div>
      <div class="history-actions">
        ${iconButton('eye', 'Xem lại lịch sử', `viewHistory(${item.id})`)}
        ${iconButton('trash', 'Xóa lịch sử', `deleteHistory(${item.id})`, 'danger-btn')}
      </div>
    </div>
  `).join('') : '<p class="empty-small">Chưa có lịch sử bốc thăm.</p>';
}

async function viewHistory(id) {
  try {
    const data = await request(`/api/history/${id}`);
    const rows = data.rows.map(item => ({
      roomName: item.room_name,
      examiner1Name: item.examiner1_name,
      examiner2Name: item.examiner2_name,
      supervisorName: item.supervisor_name
    }));
    const reserves = (data.reserves || []).map(item => ({
      role: item.role,
      staffName: item.staff_name
    }));
    state.currentSessionId = id;
    if (data.session.exam_session_id) state.selectedExamSessionId = data.session.exam_session_id;
    if (data.session.exam_subject_id) state.selectedExamSubjectId = data.session.exam_subject_id;
    renderExamSessions();
    renderResult(data.session.plan_name, rows, reserves);
    el('draw').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    toast(error.message);
  }
}

async function deleteHistory(id) {
  if (!confirm('Xóa phiên bốc thăm này khỏi lịch sử?')) return;
  try {
    await request(`/api/history/${id}`, { method: 'DELETE' });
    if (Number(state.currentSessionId) === Number(id)) clearDrawResult();
    toast('Đã xóa lịch sử bốc thăm.');
    await loadData();
  } catch (error) {
    toast(error.message);
  }
}

function toggleFullscreen() {
  const target = el('draw');
  if (!target) return;
  if (!document.fullscreenElement) {
    target.requestFullscreen?.();
    target.classList.add('fullscreen-mode');
  } else {
    document.exitFullscreen?.();
  }
}

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && has('draw')) el('draw').classList.remove('fullscreen-mode');
  if (!document.fullscreenElement && has('workScheduleCard')) el('workScheduleCard').classList.remove('fullscreen-mode');
});

async function exportCurrent() {
  if (!state.currentSessionId) return toast('Chưa có kết quả để xuất Word.');
  try {
    await downloadFile(`/api/history/${state.currentSessionId}/export`, `ket-qua-boc-tham-${state.currentSessionId}.docx`);
  } catch (error) {
    toast(error.message);
  }
}

function renderAiDocuments() {
  if (!has('aiDocuments')) return;
  renderStack('aiDocuments', state.aiDocuments.slice(0, 12), item => `
    <div class="stack-item">
      <strong>${escapeHtml(item.file_name)}</strong>
      <span>${escapeHtml(item.file_type || 'md')} · ${escapeHtml(item.status || 'Indexed')}${item.size ? ` · ${Math.ceil(Number(item.size) / 1024)} KB` : ''}</span>
      <small>${escapeHtml(item.scope || '')}</small>
    </div>
  `, 'Chưa có tài liệu AI.');
}

async function askAi(event, source) {
  event.preventDefault();
  const input = source === 'widget' ? el('aiWidgetQuestion') : el('aiQuestion');
  const question = input.value.trim();
  if (!question) return;

  const pendingId = `ai-${Date.now()}`;
  state.aiMessages.push({ role: 'user', text: question });
  state.aiMessages.push({
    id: pendingId,
    role: 'assistant',
    text: 'Đang đọc docs và soạn câu trả lời...',
    sources: [],
    loading: true
  });
  input.value = '';
  renderAiMessages();

  try {
    const data = await request('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ question })
    });
    const pendingIndex = state.aiMessages.findIndex(message => message.id === pendingId);
    const answer = {
      role: 'assistant',
      text: data.answer,
      sources: data.sources || [],
      provider: data.provider,
      model: data.model
    };
    if (pendingIndex >= 0) state.aiMessages[pendingIndex] = answer;
    else state.aiMessages.push(answer);
    renderAiMessages();
  } catch (error) {
    const pendingIndex = state.aiMessages.findIndex(message => message.id === pendingId);
    const answer = { role: 'assistant', text: error.message, sources: [] };
    if (pendingIndex >= 0) state.aiMessages[pendingIndex] = answer;
    else state.aiMessages.push(answer);
    renderAiMessages();
  }
}

function renderAiMessages() {
  const welcome = [{
    role: 'assistant',
    text: 'Tôi có thể đọc các file Markdown trong docs để trả lời về lịch công tác, học viên, thi tốt nghiệp, nhắc việc, SSO và audit.',
    sources: ['docs/README.md']
  }];
  const messages = state.aiMessages.length ? state.aiMessages : welcome;
  const html = messages.map(message => `
    <div class="chat-message ${message.role}${message.loading ? ' loading' : ''}">
      <p>${escapeHtml(message.text).replace(/\n/g, '<br>')}</p>
      ${message.provider ? `<small>${escapeHtml(message.provider === 'openai' ? `OpenAI${message.model ? ` · ${message.model}` : ''}` : 'Fallback nội bộ')}</small>` : ''}
      ${message.sources?.length ? `<div class="chat-sources">${message.sources.map(source => `<span>${escapeHtml(source)}</span>`).join('')}</div>` : ''}
    </div>
  `).join('');
  ['aiMessages', 'aiWidgetMessages'].forEach(id => {
    if (!has(id)) return;
    const target = el(id);
    target.innerHTML = html;
    target.scrollTop = target.scrollHeight;
  });
}

function toggleAiWidget() {
  if (has('aiWidget')) el('aiWidget').classList.toggle('collapsed');
}

function defaultUserPermissions(role = 'viewer') {
  return { ...(rolePermissionDefaults[role] || rolePermissionDefaults.viewer) };
}

function normalizeUserPermissions(permissions, role = 'viewer') {
  const normalized = defaultUserPermissions(role);
  let source = permissions;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch (error) {
      source = {};
    }
  }
  if (source && typeof source === 'object' && !Array.isArray(source)) {
    userMenuPermissions.forEach(menu => {
      if (Object.prototype.hasOwnProperty.call(source, menu.key)) {
        normalized[menu.key] = Boolean(source[menu.key]);
      }
    });
  }
  return normalized;
}

function renderUserPermissionFields(permissions = null) {
  if (!has('userPermissionFields')) return;
  const selected = normalizeUserPermissions(permissions, el('userRole')?.value || 'viewer');
  el('userPermissionFields').innerHTML = userMenuPermissions.map(menu => `
    <label class="permission-check">
      <input id="permission_${menu.key}" type="checkbox" ${selected[menu.key] ? 'checked' : ''} />
      <span>${escapeHtml(menu.label)}</span>
    </label>
  `).join('');
}

function collectUserPermissions() {
  return Object.fromEntries(userMenuPermissions.map(menu => [
    menu.key,
    Boolean(el(`permission_${menu.key}`)?.checked)
  ]));
}

function applyUserRoleDefaults() {
  renderUserPermissionFields(defaultUserPermissions(el('userRole')?.value || 'viewer'));
}

function resetUserForm() {
  if (!has('userForm')) return;
  el('userForm').reset();
  el('userId').value = '';
  el('userFormTitle').textContent = 'Thêm tài khoản';
  el('userSubmit').textContent = 'Thêm tài khoản';
  el('userPassword').required = true;
  el('userPassword').placeholder = 'Mật khẩu';
  renderUserPermissionFields(defaultUserPermissions(el('userRole')?.value || 'viewer'));
  enhanceActionButtons(el('userForm'));
}

function editUser(id) {
  const user = state.users.find(item => item.id === id);
  if (!user || !has('userForm')) return;
  el('userId').value = user.id;
  el('userFullName').value = user.full_name || '';
  el('userRank').value = user.rank || '';
  el('userUnit').value = user.unit || '';
  el('userUsername').value = user.username || '';
  el('userPassword').value = '';
  el('userPassword').required = false;
  el('userPassword').placeholder = 'Để trống nếu không đổi';
  el('userRole').value = user.role || 'viewer';
  el('userEmail').value = user.email || '';
  el('userPhone').value = user.phone || '';
  el('userNote').value = user.note || '';
  el('userIsActive').checked = Number(user.is_active) === 1;
  el('userFormTitle').textContent = 'Cập nhật tài khoản';
  el('userSubmit').textContent = 'Lưu cập nhật';
  renderUserPermissionFields(user.permissions);
  enhanceActionButtons(el('userForm'));
  el('userForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function saveUser(event) {
  event.preventDefault();
  const id = el('userId').value;
  const password = el('userPassword').value;
  const body = {
    full_name: el('userFullName').value,
    rank: el('userRank').value,
    unit: el('userUnit').value,
    username: el('userUsername').value,
    role: el('userRole').value,
    email: el('userEmail').value,
    phone: el('userPhone').value,
    note: el('userNote').value,
    is_active: el('userIsActive').checked ? 1 : 0,
    permissions: collectUserPermissions()
  };

  try {
    if (id) {
      await request(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      if (password.trim()) {
        await request(`/api/users/${id}/password`, {
          method: 'PATCH',
          body: JSON.stringify({ password })
        });
      }
      toast('Đã cập nhật tài khoản.');
    } else {
      await request('/api/users', {
        method: 'POST',
        body: JSON.stringify({ ...body, password })
      });
      toast('Đã thêm tài khoản.');
    }
    resetUserForm();
    loadData();
  } catch (error) {
    toast(error.message);
  }
}

async function toggleUserStatus(id) {
  const current = state.users.find(item => item.id === id);
  if (!current) return;
  const nextActive = Number(current.is_active) === 1 ? 0 : 1;
  try {
    await request(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...current, is_active: nextActive })
    });
    toast(nextActive ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.');
    loadData();
  } catch (error) {
    toast(error.message);
  }
}

function renderUsers() {
  if (!has('userList')) return;
  if (!state.users.length) {
    el('userList').innerHTML = '<p class="empty">Chưa có người dùng.</p>';
    return;
  }

  el('userList').innerHTML = `
    <div class="table-wrap user-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Họ tên</th>
            <th>Tài khoản</th>
            <th>Quyền menu</th>
            <th>Trạng thái</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${state.users.map(item => {
            const permissions = normalizeUserPermissions(item.permissions, item.role);
            const enabledMenus = userMenuPermissions.filter(menu => permissions[menu.key]);
            return `
              <tr>
                <td>
                  <strong>${escapeHtml(item.full_name)}</strong>
                  <small>${escapeHtml([item.rank, item.unit].filter(Boolean).join(' · ') || 'Chưa cập nhật cấp bậc, đơn vị')}</small>
                </td>
                <td>
                  <strong>${escapeHtml(item.username)}</strong>
                  <small>${escapeHtml(userRoleLabels[item.role] || item.role)}${item.email ? ` · ${escapeHtml(item.email)}` : ''}</small>
                </td>
                <td>
                  <div class="permission-chip-list">
                    ${enabledMenus.length ? enabledMenus.map(menu => `<span>${escapeHtml(menu.label)}</span>`).join('') : '<small>Chưa cấp quyền</small>'}
                  </div>
                </td>
                <td>
                  <span class="status-pill ${Number(item.is_active) === 1 ? 'status-ok' : 'status-danger'}">
                    ${Number(item.is_active) === 1 ? 'Đang hoạt động' : 'Đã khóa'}
                  </span>
                </td>
                <td>
                  <div class="actions user-row-actions">
                    ${iconButton('edit', 'Sửa tài khoản', `editUser(${item.id})`)}
                    ${iconButton(Number(item.is_active) === 1 ? 'lock' : 'unlock', Number(item.is_active) === 1 ? 'Khóa tài khoản' : 'Mở khóa tài khoản', `toggleUserStatus(${item.id})`, Number(item.is_active) === 1 ? 'danger-btn' : '')}
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderAuditLogs() {
  if (!has('auditList')) return;
  renderStack('auditList', state.auditLogs.slice(0, 20), item => `
    <div class="stack-item audit-item">
      <strong>${escapeHtml(item.action)} · ${escapeHtml(item.entity_name)}</strong>
      <span>${formatDateTime(item.created_at)} · ${escapeHtml(item.username || 'system')}</span>
      <small>ID: ${escapeHtml(item.entity_id || '')}</small>
    </div>
  `, 'Chưa có audit log.');
}

function selectHtml(options, value, handler) {
  return `<select onchange="${handler}">${options.map(option => (
    `<option value="${escapeHtml(option)}" ${option === value ? 'selected' : ''}>${escapeHtml(option)}</option>`
  )).join('')}</select>`;
}

function statusClass(status) {
  const value = String(status || '').toLowerCase();
  if (value.includes('overdue') || value.includes('critical') || value.includes('rejected')) return 'status-danger';
  if (value.includes('pending') || value.includes('progress') || value.includes('draft')) return 'status-warn';
  if (value.includes('completed') || value.includes('approved') || value.includes('published') || value.includes('read')) return 'status-ok';
  return 'status-neutral';
}

function formatDate(value) {
  if (!value) return 'Chưa đặt hạn';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return date.toLocaleDateString('vi-VN');
}

function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return date.toLocaleString('vi-VN');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));
}

function setDefaultDates() {
  const today = localDateString(new Date());
  if (!state.selectedCalendarDate) state.selectedCalendarDate = today;
  if (el('calendarDate')) el('calendarDate').value = state.selectedCalendarDate;
  if (el('taskDueDate')) el('taskDueDate').value = today;
}

document.addEventListener('DOMContentLoaded', async () => {
  const authenticated = await initializeAuth();
  if (!authenticated) return;
  setDefaultDates();
  resetUserForm();
  loadData();
});
