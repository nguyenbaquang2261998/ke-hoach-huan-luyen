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
  currentUser: null,
  taskFilter: 'all',
  taskSearch: '',
  taskFilterPriority: '',
  taskFilterColor: '',
  selectedTaskColor: '#15803d',
  editingTaskId: null,
  completedTasksCollapsed: false,
  dashboardDeadlineTab: 'overdue',
  weather: {
    locationKey: localStorage.getItem('armyTechWeatherLoc') || 'hanoi',
    unit: localStorage.getItem('armyTechWeatherUnit') || 'C',
    activeTab: 'temperature',
    selectedDayIndex: 0,
    data: null,
    loading: false
  }
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
  { 
    key: 'dashboard', 
    label: 'Dashboard', 
    shortLabel: 'Tổng quan', 
    desc: 'Tổng quan chỉ số & lịch trình', 
    href: 'index.html', 
    icon: 'dashboard', 
    color: '#10b981', 
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    category: 'ops'
  },
  { 
    key: 'calendar', 
    label: 'Lịch tuần', 
    shortLabel: 'Lịch tuần', 
    desc: 'Kế hoạch công tác & huấn luyện', 
    href: 'calendar.html', 
    permission: 'calendar', 
    icon: 'calendar', 
    color: '#f59e0b', 
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    category: 'ops'
  },
  { 
    key: 'tasks', 
    label: 'Nhắc việc', 
    shortLabel: 'Nhắc việc', 
    desc: 'Sổ tay & tiến độ công việc', 
    href: 'tasks.html', 
    permission: 'tasks', 
    icon: 'tasks', 
    color: '#22c55e', 
    gradient: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
    category: 'ops'
  },
  { 
    key: 'exam', 
    label: 'Thi tốt nghiệp', 
    shortLabel: 'Thi cử', 
    desc: 'Bốc thăm cán bộ & phòng thi', 
    href: 'exam.html', 
    permission: 'exam', 
    icon: 'exam', 
    color: '#f43f5e', 
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
    category: 'ops'
  },
  { 
    key: 'students', 
    label: 'Tiếp nhận học viên', 
    shortLabel: 'Học viên', 
    desc: 'Quản lý hồ sơ & biên chế', 
    href: 'students.html', 
    permission: 'students', 
    icon: 'students', 
    color: '#3b82f6', 
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    category: 'ops'
  },
  { 
    key: 'ai', 
    label: 'AI Assistant', 
    shortLabel: 'Trợ lý AI', 
    desc: 'Trợ lý thông minh tra cứu quy chế', 
    href: 'ai.html', 
    icon: 'ai', 
    color: '#8b5cf6', 
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    category: 'tools'
  },
  { 
    key: 'admin', 
    label: 'Quản trị hệ thống', 
    shortLabel: 'Quản trị', 
    desc: 'Phân quyền tài khoản & nhật ký', 
    href: 'admin.html', 
    permission: 'admin', 
    icon: 'admin', 
    color: '#64748b', 
    gradient: 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
    category: 'tools'
  }
];

const iconPaths = {
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" stroke-width="2" fill="none"></rect><rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" stroke-width="2" fill="none"></rect><rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" stroke-width="2" fill="none"></rect><rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" stroke-width="2" fill="none"></rect>',
  calendar: '<rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" stroke-width="2" fill="none"></rect><path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path><circle cx="8" cy="14" r="1.2" fill="currentColor"></circle><circle cx="12" cy="14" r="1.2" fill="currentColor"></circle><circle cx="16" cy="14" r="1.2" fill="currentColor"></circle><circle cx="8" cy="17.5" r="1.2" fill="currentColor"></circle><circle cx="12" cy="17.5" r="1.2" fill="currentColor"></circle>',
  students: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"></path><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" fill="none"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"></path>',
  exam: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" fill="none"></path><path d="M14 2v6h6" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none"></path><path d="m9 15 2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>',
  tasks: '<path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path><path d="m4 6 1 1 2-2M4 12 5 13 7 11M4 18 5 19 7 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>',
  ai: '<path d="M12 2l1.35 4.1L17.5 7.5l-4.15 1.4L12 13l-1.35-4.1L6.5 7.5l4.15-1.4L12 2z" stroke="currentColor" stroke-width="1.8" fill="currentColor" fill-opacity="0.25"></path><rect x="4" y="13" width="16" height="8" rx="3" stroke="currentColor" stroke-width="2" fill="none"></rect><circle cx="9" cy="17" r="1.1" fill="currentColor"></circle><circle cx="15" cy="17" r="1.1" fill="currentColor"></circle>',
  admin: '<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="1.8" fill="none"></path>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"></path>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"></path><polyline points="16 17 21 12 16 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"></polyline><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>',
  panelClose: '<rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2" fill="none"></rect><path d="M9 4v16" stroke="currentColor" stroke-width="2"></path><path d="m16 10-2 2 2 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>',
  panelOpen: '<rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2" fill="none"></rect><path d="M9 4v16" stroke="currentColor" stroke-width="2"></path><path d="m14 10 2 2-2 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>',
  plus: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" stroke="currentColor" stroke-width="2" fill="none"></path><path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" stroke-width="2"></path>',
  check: '<path d="m20 6-11 11-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>',
  bell: '<path d="M10 21h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>',
  lock: '<rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" stroke-width="2" fill="none"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"></path>',
  unlock: '<rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" stroke-width="2" fill="none"></rect><path d="M7 11V7a5 5 0 0 1 9.5-2.2" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"></path>',
  x: '<path d="M18 6 6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>',
  maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>',
  refresh: '<path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>',
  send: '<path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>',
  play: '<path d="m6 3 15 9-15 9V3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="currentColor"></path>',
  chevronLeft: '<path d="m15 18-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>',
  chevronRight: '<path d="m9 18 6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>'
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
        <a class="${item.key === page ? 'active' : ''}" href="${item.href}" title="${escapeHtml(item.label)}" style="--item-color: ${item.color}; --item-gradient: ${item.gradient};">
          <span class="nav-icon-box" style="background: ${item.gradient};">${navIcon(item.icon)}</span>
          <span class="nav-label">${escapeHtml(item.label)}</span>
        </a>
      `).join('') + `
        <button class="nav-logout" onclick="logout()" title="Đăng xuất">
          <span class="nav-icon-box logout-box" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">${navIcon('logout')}</span>
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

  // Mobile drawer nav (Organized with category groups and vivid cards)
  const drawerNav = document.querySelector('.mobile-drawer .drawer-nav');
  if (drawerNav) {
    const opsItems = navItems.filter(item => item.category === 'ops' && canAccessMenu(item.permission));
    const toolItems = navItems.filter(item => item.category === 'tools' && canAccessMenu(item.permission));

    drawerNav.innerHTML = `
      <!-- User profile card in drawer header -->
      <div class="drawer-user-card" title="${escapeHtml(state.currentUser.full_name || state.currentUser.username)}">
        <div class="drawer-user-avatar" data-initials="${escapeHtml(getUserInitials(state.currentUser))}"></div>
        <div class="drawer-user-meta">
          <strong>${escapeHtml(state.currentUser.full_name || state.currentUser.username)}</strong>
          <span>${escapeHtml([state.currentUser.rank, state.currentUser.unit].filter(Boolean).join(' · ') || userRoleLabels[state.currentUser.role] || state.currentUser.role)}</span>
          <span class="drawer-role-tag">${escapeHtml(userRoleLabels[state.currentUser.role] || state.currentUser.role)}</span>
        </div>
      </div>

      <!-- Category 1: Điều hành & Huấn luyện -->
      <div class="drawer-nav-group">
        <div class="drawer-group-title">
          <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2" fill="none"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2" fill="none"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2" fill="none"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2" fill="none"/></svg>
          <span>Điều hành & Huấn luyện</span>
        </div>
        <div class="drawer-items-list">
          ${opsItems.map(item => `
            <a class="drawer-nav-item ${item.key === page ? 'active' : ''}" href="${item.href}" style="--item-color: ${item.color}; --item-gradient: ${item.gradient};" onclick="closeMobileDrawer()">
              <div class="drawer-item-icon" style="background: ${item.gradient};">
                ${navIcon(item.icon)}
              </div>
              <div class="drawer-item-content">
                <strong class="drawer-item-title">${escapeHtml(item.label)}</strong>
                <span class="drawer-item-desc">${escapeHtml(item.desc)}</span>
              </div>
              ${item.key === page 
                ? '<span class="drawer-active-pill">Đang xem</span>' 
                : '<svg class="drawer-item-chevron" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="m9 18 6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>'
              }
            </a>
          `).join('')}
        </div>
      </div>

      <!-- Category 2: Công cụ & Tiện ích -->
      <div class="drawer-nav-group">
        <div class="drawer-group-title">
          <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="2" fill="none"/></svg>
          <span>Công cụ & Hệ thống</span>
        </div>
        <div class="drawer-items-list">
          ${toolItems.map(item => `
            <a class="drawer-nav-item ${item.key === page ? 'active' : ''}" href="${item.href}" style="--item-color: ${item.color}; --item-gradient: ${item.gradient};" onclick="closeMobileDrawer()">
              <div class="drawer-item-icon" style="background: ${item.gradient};">
                ${navIcon(item.icon)}
              </div>
              <div class="drawer-item-content">
                <strong class="drawer-item-title">${escapeHtml(item.label)}</strong>
                <span class="drawer-item-desc">${escapeHtml(item.desc)}</span>
              </div>
              ${item.key === page 
                ? '<span class="drawer-active-pill">Đang xem</span>' 
                : '<svg class="drawer-item-chevron" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="m9 18 6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>'
              }
            </a>
          `).join('')}
        </div>
      </div>

      <!-- Logout button in drawer -->
      <button type="button" class="drawer-logout-btn" onclick="logout()" title="Đăng xuất">
        <div class="drawer-item-icon logout-icon" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
          ${navIcon('logout')}
        </div>
        <div class="drawer-item-content">
          <strong class="drawer-item-title" style="color: #ef4444;">Đăng xuất</strong>
          <span class="drawer-item-desc">Thoát tài khoản hiện tại</span>
        </div>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="m9 18 6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
      </button>
    `;

    document.querySelector('.mobile-drawer .drawer-user')?.remove();
  }

  // Bottom navigation bar for mobile (5 neatly arranged slots with vivid icons)
  const bottomNav = document.querySelector('.bottom-nav');
  if (bottomNav) {
    // 4 primary slots + 1 menu button
    const defaultSlots = ['dashboard', 'calendar', 'tasks', 'exam'];
    const activeIsOther = !defaultSlots.includes(page) && ['students', 'ai', 'admin'].includes(page);
    
    const activeSlots = activeIsOther 
      ? ['dashboard', 'calendar', 'tasks', page]
      : defaultSlots;

    const visibleItems = activeSlots
      .map(k => navItems.find(i => i.key === k))
      .filter(Boolean)
      .filter(item => canAccessMenu(item.permission));

    bottomNav.innerHTML = visibleItems.map(item => {
      const isActive = item.key === page;
      return `
        <a class="bottom-nav-item ${isActive ? 'active' : ''}" href="${item.href}" style="--item-color: ${item.color}; --item-gradient: ${item.gradient};">
          <div class="bottom-nav-icon-wrap" style="${isActive ? `background: ${item.gradient};` : ''}">
            ${navIcon(item.icon)}
          </div>
          <span class="bottom-nav-label">${escapeHtml(item.shortLabel || item.label)}</span>
          ${isActive ? '<span class="bottom-nav-dot" style="background: ' + item.color + ';"></span>' : ''}
        </a>
      `;
    }).join('') + `
      <button type="button" class="bottom-nav-item bottom-nav-more" onclick="openMobileDrawer()" aria-label="Mở menu tất cả chức năng">
        <div class="bottom-nav-icon-wrap more-icon-wrap" style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);">
          <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>
        </div>
        <span class="bottom-nav-label">Thêm</span>
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

/* --------------------------------------------------------------------------
   WEATHER ENGINE (GOOGLE WEATHER STYLE)
   -------------------------------------------------------------------------- */
const weatherLocations = {
  hanoi: { name: 'Hà Nội', region: 'Học viện Chính trị', lat: 21.0285, lon: 105.8542 },
  sontay: { name: 'Sơn Tây', region: 'Hà Nội', lat: 21.1394, lon: 105.5039 },
  thainguyen: { name: 'Thái Nguyên', region: 'Quân khu 1', lat: 21.5928, lon: 105.8442 },
  haiphong: { name: 'Hải Phòng', region: 'Quân khu 3', lat: 20.8449, lon: 106.6881 },
  danang: { name: 'Đà Nẵng', region: 'Quân khu 5', lat: 16.0544, lon: 108.2022 },
  nhatrang: { name: 'Nha Trang', region: 'Khánh Hòa', lat: 12.2388, lon: 109.1967 },
  hcm: { name: 'TP. Hồ Chí Minh', region: 'Quân khu 7', lat: 10.8231, lon: 106.6297 },
  cantho: { name: 'Cần Thơ', region: 'Quân khu 9', lat: 10.0452, lon: 105.7469 }
};

function getWeatherCondition(code) {
  if (code === 0) return { text: 'Trời quang đãng, nắng đẹp', icon: 'sunny', color: '#f59e0b' };
  if ([1, 2, 3].includes(code)) return { text: 'Có mây rải rác', icon: 'partly_cloudy', color: '#38bdf8' };
  if ([45, 48].includes(code)) return { text: 'Có sương mù nhẹ', icon: 'fog', color: '#94a3b8' };
  if ([51, 53, 55].includes(code)) return { text: 'Mưa phùn rải rác', icon: 'drizzle', color: '#60a5fa' };
  if ([61, 63, 65, 80, 81, 82].includes(code)) return { text: 'Mưa rào rải rác', icon: 'rain', color: '#2563eb' };
  if ([95, 96, 99].includes(code)) return { text: 'Có giông rải rác, sấm sét', icon: 'thunderstorm', color: '#f59e0b' };
  return { text: 'Nhiều mây', icon: 'overcast', color: '#64748b' };
}

function getWeatherIconSvg(iconKey, size = 52) {
  if (iconKey === 'sunny') {
    return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">
      <circle cx="32" cy="32" r="14" fill="#f59e0b"/>
      <g stroke="#f59e0b" stroke-width="3.5" stroke-linecap="round">
        <line x1="32" y1="5" x2="32" y2="12"/><line x1="32" y1="52" x2="32" y2="59"/>
        <line x1="5" y1="32" x2="12" y2="32"/><line x1="52" y1="32" x2="59" y2="32"/>
        <line x1="13" y1="13" x2="18" y2="18"/><line x1="46" y1="46" x2="51" y2="51"/>
        <line x1="13" y1="51" x2="18" y2="46"/><line x1="46" y1="18" x2="51" y2="13"/>
      </g>
    </svg>`;
  }
  if (iconKey === 'partly_cloudy') {
    return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">
      <circle cx="23" cy="23" r="11" fill="#f59e0b"/>
      <path d="M48 44H20a10 10 0 0 1-1.7-19.8A14 14 0 0 1 48 26a9 9 0 0 1 0 18z" fill="#94a3b8" fill-opacity="0.95"/>
    </svg>`;
  }
  if (iconKey === 'rain') {
    return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">
      <path d="M48 34H20a10 10 0 0 1-1.7-19.8A14 14 0 0 1 48 18a9 9 0 0 1 0 16z" fill="#64748b"/>
      <line x1="22" y1="40" x2="17" y2="52" stroke="#0284c7" stroke-width="3" stroke-linecap="round"/>
      <line x1="32" y1="40" x2="27" y2="52" stroke="#0284c7" stroke-width="3" stroke-linecap="round"/>
      <line x1="42" y1="40" x2="37" y2="52" stroke="#0284c7" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
  }
  if (iconKey === 'thunderstorm') {
    return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">
      <!-- Sun peek -->
      <circle cx="20" cy="18" r="9" fill="#f59e0b"/>
      <!-- Main Cloud -->
      <path d="M50 36H22a10 10 0 0 1-1.7-19.8A14 14 0 0 1 50 20a9 9 0 0 1 0 16z" fill="#64748b"/>
      <!-- Lightning bolt -->
      <polygon points="34,34 26,46 32,46 27,58 42,42 35,42" fill="#eab308" stroke="#ca8a04" stroke-width="1.2"/>
      <!-- Rain drops -->
      <line x1="18" y1="44" x2="14" y2="54" stroke="#0284c7" stroke-width="3" stroke-linecap="round"/>
      <line x1="48" y1="44" x2="44" y2="54" stroke="#0284c7" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
  }
  if (iconKey === 'fog') {
    return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">
      <path d="M46 26H22a9 9 0 0 1-1.5-17.8A12 12 0 0 1 47 13a8 8 0 0 1-1 13z" fill="#94a3b8"/>
      <line x1="14" y1="36" x2="50" y2="36" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
      <line x1="18" y1="44" x2="46" y2="44" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
  }
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">
    <path d="M48 38H20a11 11 0 0 1-2-21.8A15 15 0 0 1 50 21a10 10 0 0 1-2 17z" fill="#94a3b8"/>
  </svg>`;
}

function formatTempDisplay(celsius) {
  if (celsius === null || celsius === undefined || isNaN(celsius)) return '--';
  if (state.weather.unit === 'F') {
    return Math.round(celsius * 9 / 5 + 32);
  }
  return Math.round(celsius);
}

function generateFallbackWeatherData(loc) {
  const now = new Date();
  const times = [];
  const hourlyTemp = [];
  const hourlyRain = [];
  const hourlyWind = [];
  for (let i = 0; i < 24 * 7; i++) {
    const d = new Date(now.getTime() + i * 3600 * 1000);
    times.push(d.toISOString());
    const hour = d.getHours();
    const baseTemp = 28 + Math.sin((hour - 8) / 12 * Math.PI) * 5;
    hourlyTemp.push(Math.round(baseTemp));
    hourlyRain.push(hour >= 14 && hour <= 18 ? 45 : 15);
    hourlyWind.push(Math.round(10 + Math.random() * 6));
  }
  return {
    current: {
      temperature_2m: 31,
      relative_humidity_2m: 79,
      weather_code: 95,
      wind_speed_10m: 11
    },
    hourly: {
      time: times,
      temperature_2m: hourlyTemp,
      precipitation_probability: hourlyRain,
      wind_speed_10m: hourlyWind,
      weather_code: times.map(() => 95)
    },
    daily: {
      time: [0, 1, 2, 3, 4, 5, 6, 7].map(d => new Date(now.getTime() + d * 86400000).toISOString().slice(0, 10)),
      weather_code: [95, 95, 95, 95, 61, 2, 95, 95],
      temperature_2m_max: [31, 33, 31, 32, 33, 33, 32, 31],
      temperature_2m_min: [26, 27, 27, 27, 27, 27, 27, 26],
      precipitation_probability_max: [38, 55, 60, 40, 30, 20, 45, 38]
    }
  };
}

async function fetchWeatherData(locationKey, force = false) {
  const loc = weatherLocations[locationKey] || weatherLocations.hanoi;
  const cacheKey = `armyTechWeather_${locationKey}`;
  const cached = localStorage.getItem(cacheKey);

  if (!force && cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
        state.weather.data = parsed.data;
        return parsed.data;
      }
    } catch (e) {}
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FBangkok`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather API Error');
    const data = await res.json();
    state.weather.data = data;
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
    return data;
  } catch (err) {
    const fallback = generateFallbackWeatherData(loc);
    state.weather.data = fallback;
    return fallback;
  }
}

function toggleWeatherLocationMenu() {
  const menu = el('weatherLocationMenu');
  const btn = el('weatherLocBtn');
  if (!menu) return;
  const isOpen = !menu.classList.contains('hidden');
  menu.classList.toggle('hidden', isOpen);
  if (btn) btn.setAttribute('aria-expanded', String(!isOpen));
}

function selectWeatherLocation(locKey) {
  state.weather.locationKey = locKey;
  localStorage.setItem('armyTechWeatherLoc', locKey);
  toggleWeatherLocationMenu();
  document.querySelectorAll('.weather-loc-item').forEach(b => {
    b.classList.toggle('active', b.getAttribute('onclick')?.includes(locKey));
  });
  fetchWeatherData(locKey, true).then(() => renderWeatherWidget());
}

function refreshWeatherData() {
  toast('Đang cập nhật lại thời tiết...');
  fetchWeatherData(state.weather.locationKey, true).then(() => {
    renderWeatherWidget();
    toast('Đã cập nhật thời tiết mới nhất.');
  });
}

function setWeatherUnit(unit) {
  state.weather.unit = unit;
  localStorage.setItem('armyTechWeatherUnit', unit);
  el('unitBtnC')?.classList.toggle('active', unit === 'C');
  el('unitBtnF')?.classList.toggle('active', unit === 'F');
  renderWeatherWidget();
}

function switchWeatherTab(tabName) {
  state.weather.activeTab = tabName;
  document.querySelectorAll('.weather-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === `wtab-${tabName === 'temperature' ? 'temp' : tabName === 'precipitation' ? 'rain' : 'wind'}`);
  });
  renderWeatherHourlyChart();
}

function selectWeatherDay(dayIndex) {
  state.weather.selectedDayIndex = dayIndex;
  document.querySelectorAll('.weather-day-pill').forEach((pill, idx) => {
    pill.classList.toggle('active', idx === dayIndex);
  });
  renderWeatherHourlyChart();
}

function renderWeatherWidget() {
  if (!has('weatherWidgetCard')) return;
  const loc = weatherLocations[state.weather.locationKey] || weatherLocations.hanoi;
  const data = state.weather.data;

  if (has('weatherLocationName')) {
    el('weatherLocationName').textContent = `${loc.name} (${loc.region})`;
  }

  if (!data || !data.current) {
    fetchWeatherData(state.weather.locationKey).then(() => renderWeatherWidget());
    return;
  }

  const current = data.current;
  const condition = getWeatherCondition(current.weather_code);
  const now = new Date();

  // Update current metrics
  if (has('weatherCurrentTemp')) el('weatherCurrentTemp').textContent = formatTempDisplay(current.temperature_2m);
  if (has('weatherCurrentIconWrap')) el('weatherCurrentIconWrap').innerHTML = getWeatherIconSvg(condition.icon, 54);
  if (has('weatherHumidity')) el('weatherHumidity').textContent = `${Math.round(current.relative_humidity_2m)}%`;
  if (has('weatherWindSpeed')) el('weatherWindSpeed').textContent = `${Math.round(current.wind_speed_10m)} km/h`;

  const rainProb = data.daily?.precipitation_probability_max?.[0] || 38;
  if (has('weatherRainProb')) el('weatherRainProb').textContent = `${rainProb}%`;

  if (has('weatherTimestamp')) {
    const daysMap = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    el('weatherTimestamp').textContent = `${timeStr} ${daysMap[now.getDay()]}`;
  }

  if (has('weatherConditionText')) el('weatherConditionText').textContent = condition.text;

  // Render Daily Forecast Pills (7 Days)
  if (has('weatherDailyForecast') && data.daily) {
    const daily = data.daily;
    const daysShort = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const count = Math.min(8, daily.time.length);
    let html = '';

    for (let i = 0; i < count; i++) {
      const date = parseDateOnly(daily.time[i]) || new Date(now.getTime() + i * 86400000);
      const dayName = i === 0 ? 'Hôm nay' : daysShort[date.getDay()];
      const dayCond = getWeatherCondition(daily.weather_code[i]);
      const maxT = formatTempDisplay(daily.temperature_2m_max[i]);
      const minT = formatTempDisplay(daily.temperature_2m_min[i]);
      const isSelected = i === state.weather.selectedDayIndex;

      html += `
        <button type="button" class="weather-day-pill ${isSelected ? 'active' : ''}" onclick="selectWeatherDay(${i})">
          <span class="day-pill-name">${escapeHtml(dayName)}</span>
          <div class="day-pill-icon">${getWeatherIconSvg(dayCond.icon, 28)}</div>
          <div class="day-pill-temps">
            <strong>${maxT}°</strong>
            <span>${minT}°</span>
          </div>
        </button>
      `;
    }
    el('weatherDailyForecast').innerHTML = html;
  }

  renderWeatherHourlyChart();
}

function renderWeatherHourlyChart() {
  if (!has('weatherHourlyChart') || !state.weather.data) return;
  const data = state.weather.data;
  const dayIdx = state.weather.selectedDayIndex || 0;
  const tab = state.weather.activeTab || 'temperature';

  // Extract 8 hourly sample points for the selected day (e.g. 01:00, 04:00, 07:00, 10:00, 13:00, 16:00, 19:00, 22:00)
  const startHour = dayIdx * 24;
  const sampleIndices = [1, 4, 7, 10, 13, 16, 19, 22].map(h => startHour + h);

  const points = sampleIndices.map(idx => {
    const timeRaw = data.hourly?.time?.[idx];
    let hourStr = '00:00';
    if (timeRaw) {
      const d = new Date(timeRaw);
      hourStr = `${String(d.getHours()).padStart(2, '0')}:00`;
    }
    const temp = data.hourly?.temperature_2m?.[idx] ?? 30;
    const rain = data.hourly?.precipitation_probability?.[idx] ?? 20;
    const wind = data.hourly?.wind_speed_10m?.[idx] ?? 10;
    return { hourStr, temp, rain, wind };
  });

  // Calculate SVG curve coordinates
  const svgWidth = 640;
  const svgHeight = 110;
  const padX = 40;
  const padY = 28;
  const w = svgWidth - padX * 2;
  const h = svgHeight - padY * 2;

  let values = [];
  let unitSuffix = '°';
  let lineColor = '#f59e0b';
  let fillColor = 'rgba(245, 158, 11, 0.12)';

  if (tab === 'precipitation') {
    values = points.map(p => p.rain);
    unitSuffix = '%';
    lineColor = '#0284c7';
    fillColor = 'rgba(2, 132, 199, 0.12)';
  } else if (tab === 'wind') {
    values = points.map(p => p.wind);
    unitSuffix = ' km/h';
    lineColor = '#0d9488';
    fillColor = 'rgba(13, 148, 136, 0.12)';
  } else {
    values = points.map(p => formatTempDisplay(p.temp));
    unitSuffix = '°';
    lineColor = '#f59e0b';
    fillColor = 'rgba(245, 158, 11, 0.12)';
  }

  const minVal = Math.min(...values) - 2;
  const maxVal = Math.max(...values) + 2;
  const range = maxVal - minVal || 1;

  const coords = points.map((p, i) => {
    const x = padX + (i / (points.length - 1)) * w;
    const y = padY + h - ((values[i] - minVal) / range) * h;
    return { x, y, val: values[i], hour: p.hourStr };
  });

  // Build smooth bezier path
  let pathD = `M ${coords[0].x},${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    const mx = (p0.x + p1.x) / 2;
    pathD += ` C ${mx},${p0.y} ${mx},${p1.y} ${p1.x},${p1.y}`;
  }

  const areaD = `${pathD} L ${coords[coords.length - 1].x},${svgHeight} L ${coords[0].x},${svgHeight} Z`;

  const svgHtml = `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight + 25}" class="weather-curve-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="weatherChartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${lineColor}" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="${lineColor}" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <!-- Gradient Fill Area -->
      <path d="${areaD}" fill="url(#weatherChartGrad)"/>
      <!-- Curve Line -->
      <path d="${pathD}" fill="none" stroke="${lineColor}" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Value Labels & Dots -->
      ${coords.map(c => `
        <text x="${c.x}" y="${c.y - 8}" text-anchor="middle" class="chart-val-text">${c.val}${unitSuffix}</text>
        <circle cx="${c.x}" cy="${c.y}" r="3.5" fill="#ffffff" stroke="${lineColor}" stroke-width="2.5"/>
        <text x="${c.x}" y="${svgHeight + 16}" text-anchor="middle" class="chart-hour-text">${c.hour}</text>
      `).join('')}
    </svg>
  `;

  el('weatherHourlyChart').innerHTML = svgHtml;
}

/* --------------------------------------------------------------------------
   DASHBOARD COMMAND CENTER & OPERATIONS
   -------------------------------------------------------------------------- */
async function toggleDashboardTaskComplete(id) {
  const allList = (state.dashboard?.todayTasks || []).concat(state.dashboard?.dueTasks || [], state.tasks || []);
  const current = allList.find(item => item.id === id);
  if (!current) return;
  const isCompleted = current.status === 'Completed';
  const newStatus = isCompleted ? 'InProgress' : 'Completed';
  const newProgress = isCompleted ? 0 : 100;

  // Optimistic UI update
  current.status = newStatus;
  current.progress = newProgress;
  renderDashboard();

  try {
    await request(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...current,
        status: newStatus,
        progress: newProgress
      })
    });
    toast(isCompleted ? 'Đã bỏ đánh dấu hoàn thành.' : '🎉 Đã hoàn thành công việc!');
    loadData();
  } catch (error) {
    toast(error.message);
    loadData();
  }
}

function switchDashboardDeadlineTab(tab) {
  state.dashboardDeadlineTab = tab;
  el('btnTabOverdue')?.classList.toggle('active', tab === 'overdue');
  el('btnTabUpcomingDue')?.classList.toggle('active', tab === 'upcomingDue');
  el('dashboardOverdueTasksList')?.classList.toggle('hidden', tab !== 'overdue');
  el('dashboardUpcomingDueTasksList')?.classList.toggle('hidden', tab !== 'upcomingDue');
}

function renderDashboard() {
  if (!has('kpiCalendar')) return;
  const dash = state.dashboard || {};
  const kpis = dash.kpis || {};

  // 1. Render Google Weather Widget
  renderWeatherWidget();

  // 2. Render KPI Metrics Bar
  if (has('kpiCalendar')) el('kpiCalendar').textContent = kpis.calendarToday || 0;
  if (has('kpiTasksToday')) el('kpiTasksToday').textContent = dash.todayTasks?.length || kpis.tasksToday || 0;
  if (has('kpiOverdue')) el('kpiOverdue').textContent = kpis.overdueTasks || 0;
  if (has('kpiUpcomingDue')) el('kpiUpcomingDue').textContent = kpis.upcomingDue || 0;
  if (has('kpiStudents')) el('kpiStudents').textContent = kpis.activeStudents || 0;
  if (has('kpiUnread')) el('kpiUnread').textContent = kpis.unreadNotifications || 0;

  // 3. Card 1: Today's Tasks Overview & Checklist
  const todayProgress = dash.todayProgress || { total: 0, completed: 0, percent: 0 };
  if (has('dashboardTodayPercent')) el('dashboardTodayPercent').textContent = `${todayProgress.percent}%`;
  if (has('dashboardTodayProgressBar')) {
    el('dashboardTodayProgressBar').style.width = `${todayProgress.percent}%`;
    el('dashboardTodayProgressBar').style.backgroundColor = todayProgress.percent === 100 ? '#16a34a' : todayProgress.percent >= 50 ? '#15803d' : '#2563eb';
  }
  if (has('dashboardTodayRatio')) el('dashboardTodayRatio').textContent = `${todayProgress.completed}/${todayProgress.total} việc đã xong`;

  if (has('dashboardTodayOverdueWarn')) {
    if (kpis.overdueTasks > 0) {
      el('dashboardTodayOverdueWarn').textContent = `⚠️ ${kpis.overdueTasks} việc quá hạn`;
      el('dashboardTodayOverdueWarn').classList.remove('hidden');
    } else {
      el('dashboardTodayOverdueWarn').classList.add('hidden');
    }
  }

  // Today Tasks List with interactive circular checkboxes
  const todayTasks = dash.todayTasks || [];
  if (has('dashboardTodayTasksList')) {
    el('dashboardTodayTasksList').innerHTML = todayTasks.length ? todayTasks.map(item => {
      const isCompleted = item.status === 'Completed';
      const accent = item.color || '#15803d';
      return `
        <div class="dash-today-task-item ${isCompleted ? 'is-completed' : ''}" style="--task-accent: ${escapeHtml(accent)};">
          <button type="button" class="dash-task-check ${isCompleted ? 'checked' : ''}" onclick="toggleDashboardTaskComplete(${item.id})" aria-label="Hoàn thành việc">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
          </button>
          <div class="dash-today-task-info" onclick="toggleDashboardTaskComplete(${item.id})">
            <strong class="dash-task-title ${isCompleted ? 'completed-strike' : ''}">${escapeHtml(item.title)}</strong>
            <div class="dash-task-meta">
              <span class="dash-task-color-dot" style="background-color: ${escapeHtml(accent)};"></span>
              ${item.assignee ? `<span class="dash-task-assignee">${escapeHtml(item.assignee)}</span>` : ''}
              <span class="todo-badge ${priorityClass(item.priority)}">${escapeHtml(priorityLabel(item.priority))}</span>
            </div>
          </div>
        </div>
      `;
    }).join('') : '<p class="empty-hint">Không có công việc nào có hạn hôm nay. Tuyệt vời!</p>';
  }

  // 4. Card 2: Upcoming Calendar Timeline
  const upcomingCalendar = dash.upcomingCalendar || [];
  if (has('dashboardCalendar')) {
    el('dashboardCalendar').innerHTML = upcomingCalendar.length ? upcomingCalendar.map(item => `
      <div class="dash-calendar-timeline-item" style="border-left-color: ${escapeHtml(item.color || '#15803d')};">
        <div class="dash-cal-time-chip">
          <strong>${formatDate(item.task_date)}</strong>
          <span>${escapeHtml(item.start_time || 'Cả ngày')}${item.end_time ? ` - ${escapeHtml(item.end_time)}` : ''}</span>
        </div>
        <div class="dash-cal-content">
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.content || item.location || 'Chưa có địa điểm cụ thể')}</p>
          <div class="dash-cal-meta-row">
            ${item.location ? `<span>📍 ${escapeHtml(item.location)}</span>` : ''}
            ${item.duty_officer ? `<span>👤 Trực ban: ${escapeHtml(item.duty_officer)}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('') : '<p class="empty-hint">Chưa có lịch công tác sắp tới.</p>';
  }

  // 5. Card 3: Overdue & Upcoming Due Deadlines
  const overdueList = dash.overdueTasksList || [];
  const upcomingDueList = dash.upcomingDueTasks || [];

  if (has('badgeOverdueTasksCount')) el('badgeOverdueTasksCount').textContent = overdueList.length;
  if (has('badgeUpcomingDueCount')) el('badgeUpcomingDueCount').textContent = upcomingDueList.length;

  if (has('dashboardOverdueTasksList')) {
    el('dashboardOverdueTasksList').innerHTML = overdueList.length ? overdueList.map(item => {
      const urgency = getTaskUrgency(item.due_date, item.status);
      return `
        <div class="dash-deadline-item overdue">
          <div class="dash-deadline-main">
            <strong>${escapeHtml(item.title)}</strong>
            <div class="dash-deadline-meta">
              <span class="todo-badge urgency-overdue">${escapeHtml(urgency.label)} (${formatDate(item.due_date)})</span>
              ${item.assignee ? `<span>👤 ${escapeHtml(item.assignee)}</span>` : ''}
            </div>
          </div>
          <div class="dash-deadline-actions">
            <button type="button" class="dash-quick-remind-btn" onclick="remindTask(${item.id})" title="Gửi thông báo nhắc nhở">
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M10 21h4M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>
              <span>Nhắc</span>
            </button>
            <button type="button" class="dash-quick-done-btn" onclick="toggleDashboardTaskComplete(${item.id})" title="Đánh dấu hoàn thành">
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="m5 13 4 4L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('') : '<p class="empty-hint">Không có công việc nào bị quá hạn 🎉</p>';
  }

  if (has('dashboardUpcomingDueTasksList')) {
    el('dashboardUpcomingDueTasksList').innerHTML = upcomingDueList.length ? upcomingDueList.map(item => {
      const urgency = getTaskUrgency(item.due_date, item.status);
      return `
        <div class="dash-deadline-item due-soon">
          <div class="dash-deadline-main">
            <strong>${escapeHtml(item.title)}</strong>
            <div class="dash-deadline-meta">
              <span class="todo-badge ${urgency.class}">${escapeHtml(urgency.label)}</span>
              ${item.assignee ? `<span>👤 ${escapeHtml(item.assignee)}</span>` : ''}
              <span class="todo-badge ${priorityClass(item.priority)}">${escapeHtml(priorityLabel(item.priority))}</span>
            </div>
          </div>
          <div class="dash-deadline-actions">
            <button type="button" class="dash-quick-done-btn" onclick="toggleDashboardTaskComplete(${item.id})" title="Đánh dấu hoàn thành">
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="m5 13 4 4L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('') : '<p class="empty-hint">Không có công việc nào sắp đến hạn.</p>';
  }

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
  const eventsByDate = groupCalendarByDate();
  const today = localDateString(new Date());
  if (!state.selectedCalendarDate || (!eventsByDate.has(state.selectedCalendarDate) && eventsByDate.size > 0)) {
    if (eventsByDate.has(today)) {
      state.selectedCalendarDate = today;
    } else {
      const allDates = [...eventsByDate.keys()].sort();
      const upcomingDate = allDates.find(d => d >= today);
      state.selectedCalendarDate = upcomingDate || allDates[allDates.length - 1] || today;
    }
    const selDateObj = parseDateOnly(state.selectedCalendarDate);
    if (selDateObj) {
      state.calendarCursor = new Date(selDateObj.getFullYear(), selDateObj.getMonth(), 1);
    }
  }

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
      <button class="calendar-day ${isMuted ? 'muted-day' : ''} ${isToday ? 'today-day' : ''} ${isSelected ? 'selected-day' : ''} ${events.length ? 'has-events' : ''}" onclick="selectCalendarDate('${dateKey}')">
        <div class="calendar-day-header">
          <span class="day-number">${date.getDate()}</span>
          ${events.length ? `<span class="day-event-badge">${events.length}</span>` : ''}
        </div>
        <div class="day-events">
          ${visibleEvents.map(item => {
            const color = item.color || '#15803d';
            const tooltip = [item.start_time, item.title, item.location, item.person_in_charge, item.duty_officer ? `TB: ${item.duty_officer}` : ''].filter(Boolean).join(' · ');
            return `
              <div class="calendar-event-pill" style="--event-pill-color: ${escapeHtml(color)};" title="${escapeHtml(tooltip)}">
                <span class="event-pill-dot" style="background-color: ${escapeHtml(color)};"></span>
                ${item.start_time ? `<span class="event-pill-time">${escapeHtml(item.start_time)}</span>` : ''}
                <span class="event-pill-title">${escapeHtml(item.title)}</span>
              </div>
            `;
          }).join('')}
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
    const isToday = dateKey === today;
    const isSelected = dateKey === state.selectedCalendarDate;
    return `
      <button class="calendar-day week-day ${isToday ? 'today-day' : ''} ${isSelected ? 'selected-day' : ''} ${events.length ? 'has-events' : ''}" onclick="selectCalendarDate('${dateKey}')">
        <div class="week-day-header">
          <span class="day-number">${date.getDate()}</span>
          <div class="week-day-title-wrap">
            <span class="week-day-name">${date.toLocaleDateString('vi-VN', { weekday: 'short' })}</span>
            <span class="week-day-date">${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
          </div>
          ${events.length ? `<span class="week-event-count-badge">${events.length} lịch</span>` : ''}
        </div>
        <div class="week-day-events-list">
          ${events.length ? events.map(item => {
            const color = item.color || '#15803d';
            return `
              <div class="week-event-card" style="--event-color: ${escapeHtml(color)};">
                <div class="week-event-time">⏰ ${escapeHtml([item.start_time, item.end_time].filter(Boolean).join(' - ') || 'Cả ngày')}</div>
                <div class="week-event-title">${escapeHtml(item.title)}</div>
                ${item.location ? `<div class="week-event-meta location-meta">📍 ${escapeHtml(item.location)}</div>` : ''}
                ${item.person_in_charge ? `<div class="week-event-meta owner-meta">👤 ${escapeHtml(item.person_in_charge)}</div>` : ''}
                ${(item.tt_hv || item.tt_phong) ? `
                  <div class="week-event-attendees">
                    ${item.tt_hv ? `<span class="week-att-tag">🎓 ${escapeHtml(item.tt_hv)}</span>` : ''}
                    ${item.tt_phong ? `<span class="week-att-tag">🏢 ${escapeHtml(item.tt_phong)}</span>` : ''}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('') : '<div class="week-empty-placeholder">Chưa có lịch</div>'}
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
      <div class="day-view-banner">
        <div class="day-view-badge">
          <strong>${selectedDate.getDate()}</strong>
          <span>${selectedDate.toLocaleDateString('vi-VN', { weekday: 'long' })}</span>
        </div>
        <div class="day-view-meta">
          <h4>Lịch công tác chi tiết trong ngày</h4>
          <p>${events.length ? `Có tổng số ${events.length} nội dung công tác & huấn luyện` : 'Không có sự kiện nào'}</p>
        </div>
        <button type="button" class="btn-primary-soft" onclick="quickAddEventForSelectedDate()">+ Thêm lịch ngày này</button>
      </div>

      <div class="day-agenda-list">
        ${events.length ? events.map(item => {
          const color = item.color || '#15803d';
          return `
            <article class="day-agenda-item" style="--event-color: ${escapeHtml(color)};">
              <div class="day-agenda-time-box">
                <time class="agenda-time">${escapeHtml([item.start_time, item.end_time].filter(Boolean).join(' - ') || 'Cả ngày')}</time>
                ${item.duty_officer ? `<span class="agenda-duty-pill">Trực: ${escapeHtml(item.duty_officer)}</span>` : ''}
              </div>
              <div class="day-agenda-main">
                <div class="agenda-header-row">
                  <strong class="agenda-title">${escapeHtml(item.title)}</strong>
                  <div class="agenda-actions">
                    <button type="button" class="daily-action-btn edit-btn" onclick="openEditCalendarModal(${item.id})" title="Chỉnh sửa">
                      <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
                    </button>
                    <button type="button" class="daily-action-btn delete-btn" onclick="deleteCalendar(${item.id})" title="Xóa">
                      <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>
                    </button>
                  </div>
                </div>
                <div class="agenda-meta-grid">
                  ${item.location ? `<span><strong>Địa điểm:</strong> ${escapeHtml(item.location)}</span>` : ''}
                  ${item.person_in_charge ? `<span><strong>Chủ trì:</strong> ${escapeHtml(item.person_in_charge)}</span>` : ''}
                  ${item.ban ? `<span><strong>Ban:</strong> ${escapeHtml(item.ban)}</span>` : ''}
                </div>
                ${(item.tt_hv || item.tt_phong) ? `
                  <div class="agenda-attendees-row">
                    ${item.tt_hv ? `<span class="attendee-chip hv-chip">🎓 TT HV: ${escapeHtml(item.tt_hv)}</span>` : ''}
                    ${item.tt_phong ? `<span class="attendee-chip phong-chip">🏢 TT Phòng: ${escapeHtml(item.tt_phong)}</span>` : ''}
                  </div>
                ` : ''}
              </div>
            </article>
          `;
        }).join('') : '<p class="empty">Không có lịch trong ngày này.</p>'}
      </div>
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

  const dateObj = parseDateOnly(selected) || new Date();
  const todayStr = localDateString(new Date());
  const isToday = selected === todayStr;

  const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  if (has('dailyDateDayNum')) el('dailyDateDayNum').textContent = String(dateObj.getDate()).padStart(2, '0');
  if (has('dailyDateWeekday')) el('dailyDateWeekday').textContent = weekdays[dateObj.getDay()];
  if (has('dailyDateMonthYear')) el('dailyDateMonthYear').textContent = `Tháng ${months[dateObj.getMonth()]}, ${dateObj.getFullYear()}`;
  if (has('dailyDateTodayBadge')) el('dailyDateTodayBadge').classList.toggle('hidden', !isToday);

  if (has('dailyEventCountBadge')) {
    el('dailyEventCountBadge').textContent = events.length ? `${events.length} lịch công tác` : '0 lịch công tác';
  }

  if (has('calendarSelectedDate')) {
    el('calendarSelectedDate').textContent = `${weekdays[dateObj.getDay()]}, ${String(dateObj.getDate()).padStart(2, '0')}/${months[dateObj.getMonth()]}/${dateObj.getFullYear()}`;
  }

  if (has('calendarSelectedList')) {
    if (!events.length) {
      el('calendarSelectedList').innerHTML = `
        <div class="daily-schedule-empty">
          <div class="empty-icon-wrap">
            <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/></svg>
          </div>
          <strong>Không có lịch công tác</strong>
          <p>Chưa có kế hoạch công tác nào được xếp vào ngày này.</p>
          <button type="button" class="btn-quick-add-daily" onclick="quickAddEventForSelectedDate()">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
            <span>Tạo lịch cho ngày này</span>
          </button>
        </div>
      `;
      return;
    }

    el('calendarSelectedList').innerHTML = events.map(item => {
      const accent = item.color || '#15803d';
      const timeRange = [item.start_time, item.end_time].filter(Boolean).join(' - ') || 'Cả ngày';
      return `
        <div class="daily-event-card" style="--event-accent: ${escapeHtml(accent)};">
          <!-- Card Top Bar: Time & Actions -->
          <div class="daily-event-topbar">
            <div class="daily-event-time-badge">
              <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              <span>${escapeHtml(timeRange)}</span>
            </div>
            <div class="daily-event-actions">
              <button type="button" class="daily-action-btn edit-btn" onclick="openEditCalendarModal(${item.id})" title="Chỉnh sửa lịch">
                <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
              </button>
              <button type="button" class="daily-action-btn delete-btn" onclick="deleteCalendar(${item.id})" title="Xóa lịch">
                <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>
              </button>
            </div>
          </div>

          <!-- Title -->
          <h5 class="daily-event-title">${escapeHtml(item.title)}</h5>

          <!-- Structured Details Grid -->
          <div class="daily-event-meta-grid">
            ${item.location ? `
              <div class="daily-meta-row location-row">
                <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 7 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" fill="currentColor"/></svg>
                <span><strong>Địa điểm:</strong> ${escapeHtml(item.location)}</span>
              </div>
            ` : ''}

            ${item.person_in_charge ? `
              <div class="daily-meta-row owner-row">
                <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" fill="none"/></svg>
                <span><strong>Chủ trì:</strong> ${escapeHtml(item.person_in_charge)}</span>
              </div>
            ` : ''}

            ${item.duty_officer ? `
              <div class="daily-meta-row duty-row">
                <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" fill="none"/></svg>
                <span><strong>Trực ban:</strong> ${escapeHtml(item.duty_officer)}</span>
              </div>
            ` : ''}

            ${item.ban ? `
              <div class="daily-meta-row ban-row">
                <span class="daily-tag-pill ban-tag">🏛️ ${escapeHtml(item.ban)}</span>
              </div>
            ` : ''}

            ${(item.tt_hv || item.tt_phong) ? `
              <div class="daily-attendees-box">
                <div class="daily-attendees-label">Thành phần tham gia:</div>
                <div class="daily-attendees-chips">
                  ${item.tt_hv ? `<span class="attendee-chip hv-chip">🎓 TT HV: ${escapeHtml(item.tt_hv)}</span>` : ''}
                  ${item.tt_phong ? `<span class="attendee-chip phong-chip">🏢 TT Phòng: ${escapeHtml(item.tt_phong)}</span>` : ''}
                </div>
              </div>
            ` : ''}

            ${(item.content && item.content !== item.title) ? `
              <div class="daily-content-note">
                <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" fill="none"/><polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="2" fill="none"/></svg>
                <p>${escapeHtml(item.content)}</p>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
}

function openCreateCalendarModal(prefillDate) {
  const selectedDate = prefillDate || state.selectedCalendarDate || localDateString(new Date());
  if (has('modalCalendarDate')) el('modalCalendarDate').value = selectedDate;
  if (has('modalCalendarTitle')) el('modalCalendarTitle').value = '';
  if (has('modalCalendarStart')) el('modalCalendarStart').value = '';
  if (has('modalCalendarEnd')) el('modalCalendarEnd').value = '';
  if (has('modalCalendarLocation')) el('modalCalendarLocation').value = '';
  if (has('modalCalendarOwner')) el('modalCalendarOwner').value = '';
  if (has('modalCalendarDutyOfficer')) el('modalCalendarDutyOfficer').value = '';
  if (has('modalCalendarBan')) el('modalCalendarBan').value = '';
  if (has('modalCalendarColor')) el('modalCalendarColor').value = '#15803d';
  if (has('modalCalendarTtHv')) el('modalCalendarTtHv').value = '';
  if (has('modalCalendarTtPhong')) el('modalCalendarTtPhong').value = '';
  el('createCalendarModal')?.classList.remove('hidden');
  setTimeout(() => el('modalCalendarTitle')?.focus(), 60);
}

function closeCreateCalendarModal() {
  el('createCalendarModal')?.classList.add('hidden');
}

async function handleCreateCalendarSubmit(event) {
  event.preventDefault();
  try {
    const taskDate = el('modalCalendarDate').value;
    const body = {
      title: el('modalCalendarTitle').value,
      content: el('modalCalendarTitle').value,
      date: taskDate,
      startTime: el('modalCalendarStart').value,
      endTime: el('modalCalendarEnd').value,
      location: el('modalCalendarLocation').value,
      ttHv: el('modalCalendarTtHv').value,
      ttPhong: el('modalCalendarTtPhong').value,
      ban: el('modalCalendarBan').value,
      personInCharge: el('modalCalendarOwner').value,
      dutyOfficer: el('modalCalendarDutyOfficer').value,
      color: el('modalCalendarColor').value || '#15803d',
      status: 'Published'
    };
    await request('/api/calendar', { method: 'POST', body: JSON.stringify(body) });
    closeCreateCalendarModal();
    if (body.date) {
      state.selectedCalendarDate = body.date;
      const date = parseDateOnly(body.date);
      if (date) state.calendarCursor = new Date(date.getFullYear(), date.getMonth(), 1);
    }
    toast('Đã tạo lịch công tác mới thành công.');
    loadData();
  } catch (error) {
    toast(error.message);
  }
}

function quickAddEventForSelectedDate() {
  const selected = state.selectedCalendarDate || localDateString(new Date());
  openCreateCalendarModal(selected);
}

function openEditCalendarModal(id, event) {
  if (event) event.stopPropagation();
  const item = state.calendar.find(c => Number(c.id) === Number(id));
  if (!item) return;
  if (has('editCalendarId')) el('editCalendarId').value = item.id;
  if (has('editCalendarTitle')) el('editCalendarTitle').value = item.title || '';
  if (has('editCalendarDate')) el('editCalendarDate').value = item.task_date || '';
  if (has('editCalendarStart')) el('editCalendarStart').value = item.start_time || '';
  if (has('editCalendarEnd')) el('editCalendarEnd').value = item.end_time || '';
  if (has('editCalendarLocation')) el('editCalendarLocation').value = item.location || '';
  if (has('editCalendarOwner')) el('editCalendarOwner').value = item.person_in_charge || '';
  if (has('editCalendarDutyOfficer')) el('editCalendarDutyOfficer').value = item.duty_officer || '';
  if (has('editCalendarBan')) el('editCalendarBan').value = item.ban || '';
  if (has('editCalendarColor')) el('editCalendarColor').value = item.color || '#15803d';
  if (has('editCalendarTtHv')) el('editCalendarTtHv').value = item.tt_hv || '';
  if (has('editCalendarTtPhong')) el('editCalendarTtPhong').value = item.tt_phong || '';
  el('editCalendarModal')?.classList.remove('hidden');
}

function closeEditCalendarModal() {
  el('editCalendarModal')?.classList.add('hidden');
}

async function saveEditCalendar(event) {
  event.preventDefault();
  const id = el('editCalendarId').value;
  if (!id) return;
  try {
    const body = {
      title: el('editCalendarTitle').value,
      content: el('editCalendarTitle').value,
      date: el('editCalendarDate').value,
      startTime: el('editCalendarStart').value,
      endTime: el('editCalendarEnd').value,
      location: el('editCalendarLocation').value,
      personInCharge: el('editCalendarOwner').value,
      dutyOfficer: el('editCalendarDutyOfficer').value,
      ban: el('editCalendarBan').value,
      color: el('editCalendarColor').value,
      ttHv: el('editCalendarTtHv').value,
      ttPhong: el('editCalendarTtPhong').value,
      status: 'Published'
    };
    await request(`/api/calendar/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
    closeEditCalendarModal();
    toast('Đã cập nhật lịch công tác.');
    loadData();
  } catch (error) {
    toast(error.message);
  }
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
  return iconButton('trash', label, `deleteCalendar(${id}, event)`, 'danger-btn');
}

function openWorkScheduleModal() {
  const modal = el('workScheduleModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  const selectedDate = parseDateOnly(state.selectedCalendarDate) || new Date();
  const weekStart = getWeekStart(selectedDate);
  const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
  if (has('scheduleModalSubtitle')) {
    el('scheduleModalSubtitle').textContent = `Tuần từ ${formatShortDate(weekStart)} đến ${formatShortDate(weekEnd)}`;
  }
}

function closeWorkScheduleModal() {
  const modal = el('workScheduleModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
  if (document.fullscreenElement) {
    document.exitFullscreen?.();
  }
}

function printWorkSchedule() {
  window.print();
}

function toggleWorkScheduleFullscreen() {
  const target = el('workScheduleModal') || el('workScheduleCard');
  if (!target) return;
  if (!document.fullscreenElement) {
    target.requestFullscreen?.();
    target.classList.add('fullscreen-mode');
  } else {
    document.exitFullscreen?.();
    target.classList.remove('fullscreen-mode');
  }
}

async function deleteCalendar(id, event) {
  if (event) event.stopPropagation();
  if (!confirm('Bạn có chắc chắn muốn xóa lịch công tác này khỏi hệ thống?')) return;
  await mutate(`/api/calendar/${id}`, { method: 'DELETE' }, 'Đã xóa lịch công tác.');
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

const taskColorPresets = [
  { hex: '#15803d', label: 'Xanh quân đội' },
  { hex: '#2563eb', label: 'Xanh dương' },
  { hex: '#7c3aed', label: 'Tím hoàng gia' },
  { hex: '#dc2626', label: 'Đỏ' },
  { hex: '#ea580c', label: 'Cam' },
  { hex: '#0d9488', label: 'Xanh ngọc' },
  { hex: '#d97706', label: 'Vàng' },
  { hex: '#475569', label: 'Xám chì' }
];

function getTaskUrgency(dueDate, status) {
  if (status === 'Completed') {
    return { label: 'Đã hoàn thành', class: 'urgency-done', isOverdue: false };
  }
  if (!dueDate) {
    return { label: 'Chưa đặt hạn', class: 'urgency-none', isOverdue: false };
  }
  const today = localDateString(new Date());
  if (dueDate === today) {
    return { label: 'Hôm nay', class: 'urgency-today', isOverdue: false };
  }
  const due = parseDateOnly(dueDate);
  const now = parseDateOnly(today);
  if (!due || !now) return { label: formatDate(dueDate), class: 'urgency-normal', isOverdue: false };

  const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { label: `Quá hạn ${Math.abs(diffDays)} ngày`, class: 'urgency-overdue', isOverdue: true };
  }
  if (diffDays === 1) {
    return { label: 'Ngày mai', class: 'urgency-tomorrow', isOverdue: false };
  }
  if (diffDays <= 3) {
    return { label: `Còn ${diffDays} ngày`, class: 'urgency-soon', isOverdue: false };
  }
  return { label: formatDate(dueDate), class: 'urgency-normal', isOverdue: false };
}

function priorityLabel(priority) {
  const map = {
    Critical: 'Khẩn cấp',
    High: 'Ưu tiên cao',
    Normal: 'Bình thường',
    Low: 'Ưu tiên thấp'
  };
  return map[priority] || priority || 'Bình thường';
}

function priorityClass(priority) {
  const map = {
    Critical: 'priority-critical',
    High: 'priority-high',
    Normal: 'priority-normal',
    Low: 'priority-low'
  };
  return map[priority] || 'priority-normal';
}

function renderTaskCardItem(item) {
  const isCompleted = item.status === 'Completed';
  const urgency = getTaskUrgency(item.due_date, item.status);
  const accentColor = item.color || '#15803d';

  return `
    <article class="todo-card-item ${isCompleted ? 'is-completed' : ''} ${urgency.isOverdue ? 'is-overdue' : ''}" style="--task-accent: ${escapeHtml(accentColor)};" data-task-id="${item.id}">
      <div class="todo-card-accent-bar" style="background-color: ${escapeHtml(accentColor)};"></div>
      
      <!-- Interactive Circular Checkbox -->
      <button type="button" class="todo-checkbox ${isCompleted ? 'checked' : ''}" onclick="toggleTaskComplete(${item.id})" aria-label="${isCompleted ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã hoàn thành'}" title="${isCompleted ? 'Nhấn để hủy hoàn thành' : 'Nhấn để đánh dấu đã xong'}">
        <svg viewBox="0 0 24 24" class="todo-check-icon" aria-hidden="true">
          <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
      </button>

      <!-- Main Todo Content -->
      <div class="todo-card-body" onclick="onTodoCardClick(event, ${item.id})">
        <div class="todo-card-top">
          <strong class="todo-card-title ${isCompleted ? 'completed-strikethrough' : ''}">${escapeHtml(item.title)}</strong>
        </div>

        ${item.description ? `<p class="todo-card-desc ${isCompleted ? 'completed-muted' : ''}">${escapeHtml(item.description)}</p>` : ''}

        <div class="todo-card-tags">
          <!-- Color Dot Tag -->
          <span class="todo-tag-color-dot" style="background-color: ${escapeHtml(accentColor)};" title="Màu: ${escapeHtml(accentColor)}"></span>

          <!-- Due Date / Urgency Badge -->
          <span class="todo-badge ${urgency.class}">
            <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2"/></svg>
            ${escapeHtml(urgency.label)}
          </span>

          <!-- Assignee Chip -->
          ${item.assignee ? `
            <span class="todo-badge todo-assignee-badge" title="Người phụ trách">
              <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" fill="none"/></svg>
              ${escapeHtml(item.assignee)}
            </span>
          ` : ''}

          <!-- Priority Badge -->
          <span class="todo-badge ${priorityClass(item.priority)}">
            ${escapeHtml(priorityLabel(item.priority))}
          </span>
        </div>
      </div>

      <!-- Quick Color Palette Dropdown / Switcher on Card -->
      <div class="todo-card-controls">
        <div class="todo-card-color-swatches" title="Đổi màu nhanh">
          ${taskColorPresets.map(c => `
            <button type="button" class="todo-card-mini-color ${item.color === c.hex ? 'active' : ''}" style="background-color: ${c.hex};" onclick="setTaskColor(${item.id}, '${c.hex}')" title="${c.label}"></button>
          `).join('')}
        </div>

        <div class="todo-card-actions">
          ${iconButton('bell', 'Gửi nhắc việc', `remindTask(${item.id})`)}
          ${iconButton('edit', 'Chỉnh sửa', `openEditTaskModal(${item.id})`)}
          ${iconButton('trash', 'Xóa công việc', `deleteTask(${item.id})`, 'danger-btn')}
        </div>
      </div>
    </article>
  `;
}

function onTodoCardClick(event, id) {
  // If user clicked inside a button, select, or link, don't trigger
  if (event.target.closest('button') || event.target.closest('select') || event.target.closest('input')) return;
}

function renderTasks() {
  const allTasks = state.tasks || [];
  const todayStr = localDateString(new Date());

  // Compute Overall Stats
  const totalCount = allTasks.length;
  const completedCount = allTasks.filter(t => t.status === 'Completed').length;
  const activeCount = allTasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled').length;
  const overdueCount = allTasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled' && t.due_date && t.due_date < todayStr).length;
  const todayCount = allTasks.filter(t => t.due_date === todayStr).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Update Header Progress Bar & Text
  if (has('todoProgressPercent')) el('todoProgressPercent').textContent = `${progressPercent}%`;
  if (has('todoProgressBar')) {
    el('todoProgressBar').style.width = `${progressPercent}%`;
    el('todoProgressBar').style.backgroundColor = progressPercent === 100 ? '#16a34a' : progressPercent >= 50 ? '#15803d' : '#2563eb';
  }
  if (has('todoRatioText')) el('todoRatioText').textContent = `${completedCount}/${totalCount} việc đã xong`;

  if (has('todoStatsSummary')) {
    if (totalCount === 0) {
      el('todoStatsSummary').textContent = 'Chưa có công việc nào trong danh sách. Hãy tạo việc mới bên dưới.';
    } else if (progressPercent === 100) {
      el('todoStatsSummary').textContent = 'Tuyệt vời! Bạn đã hoàn thành xuất sắc 100% công việc hôm nay 🎉';
    } else {
      el('todoStatsSummary').textContent = `${activeCount} việc đang thực hiện • ${completedCount} đã xong${overdueCount > 0 ? ` • ${overdueCount} việc quá hạn` : ''}`;
    }
  }

  if (has('todoOverdueAlert')) {
    if (overdueCount > 0) {
      el('todoOverdueAlert').textContent = `⚠️ ${overdueCount} việc quá hạn`;
      el('todoOverdueAlert').classList.remove('hidden');
    } else {
      el('todoOverdueAlert').classList.add('hidden');
    }
  }

  // Update Tab Badges
  if (has('tabCountAll')) el('tabCountAll').textContent = totalCount;
  if (has('tabCountToday')) el('tabCountToday').textContent = todayCount;
  if (has('tabCountActive')) el('tabCountActive').textContent = activeCount;
  if (has('tabCountOverdue')) el('tabCountOverdue').textContent = overdueCount;
  if (has('tabCountCompleted')) el('tabCountCompleted').textContent = completedCount;

  // Filter Tasks
  const filter = state.taskFilter || 'all';
  const query = (state.taskSearch || '').toLowerCase();
  const priorityFilter = state.taskFilterPriority || '';
  const colorFilter = state.taskFilterColor || '';

  const filteredTasks = allTasks.filter(item => {
    // Tab filter
    if (filter === 'today' && item.due_date !== todayStr) return false;
    if (filter === 'active' && (item.status === 'Completed' || item.status === 'Cancelled')) return false;
    if (filter === 'overdue' && (item.status === 'Completed' || item.status === 'Cancelled' || !item.due_date || item.due_date >= todayStr)) return false;
    if (filter === 'completed' && item.status !== 'Completed') return false;

    // Search query
    if (query) {
      const matchTitle = (item.title || '').toLowerCase().includes(query);
      const matchAssignee = (item.assignee || '').toLowerCase().includes(query);
      const matchDesc = (item.description || '').toLowerCase().includes(query);
      if (!matchTitle && !matchAssignee && !matchDesc) return false;
    }

    // Priority filter
    if (priorityFilter && item.priority !== priorityFilter) return false;

    // Color filter
    if (colorFilter && (item.color || '#15803d').toLowerCase() !== colorFilter.toLowerCase()) return false;

    return true;
  });

  // Separate Active and Completed from filtered tasks
  const activeList = filteredTasks.filter(t => t.status !== 'Completed');
  const completedList = filteredTasks.filter(t => t.status === 'Completed');

  // Render Active Section
  if (has('activeTasksList')) {
    el('activeTasksList').innerHTML = activeList.length
      ? activeList.map(renderTaskCardItem).join('')
      : `<p class="todo-empty-group-text">${filter === 'completed' ? 'Đang lọc xem mục đã hoàn thành' : 'Không có công việc đang thực hiện.'}</p>`;
  }
  if (has('activeTasksCount')) el('activeTasksCount').textContent = activeList.length;

  // Render Completed Section
  if (has('completedTasksList')) {
    el('completedTasksList').innerHTML = completedList.length
      ? completedList.map(renderTaskCardItem).join('')
      : `<p class="todo-empty-group-text">Chưa có công việc nào hoàn thành.</p>`;
  }
  if (has('completedTasksCount')) el('completedTasksCount').textContent = completedList.length;

  // Toggle Visibility of Completed Section if on 'active' tab and no completed tasks
  if (has('completedTasksSection')) {
    if (filter === 'active' || completedList.length === 0) {
      el('completedTasksSection').classList.toggle('hidden', filter === 'active');
    } else {
      el('completedTasksSection').classList.remove('hidden');
    }
  }

  // Handle Empty State
  if (has('emptyTasksState')) {
    const isEmpty = filteredTasks.length === 0;
    el('emptyTasksState').classList.toggle('hidden', !isEmpty);
    if (isEmpty) {
      if (has('activeTasksList')) el('activeTasksList').innerHTML = '';
      if (has('completedTasksList')) el('completedTasksList').innerHTML = '';
      if (query) {
        if (has('emptyStateTitle')) el('emptyStateTitle').textContent = 'Không tìm thấy kết quả';
        if (has('emptyStateDesc')) el('emptyStateDesc').textContent = `Không có công việc nào khớp với từ khóa "${state.taskSearch}".`;
      } else if (filter === 'overdue') {
        if (has('emptyStateTitle')) el('emptyStateTitle').textContent = 'Không có việc quá hạn';
        if (has('emptyStateDesc')) el('emptyStateDesc').textContent = 'Tất cả công việc đều đang đúng tiến độ!';
      } else if (filter === 'today') {
        if (has('emptyStateTitle')) el('emptyStateTitle').textContent = 'Hôm nay thảnh thơi';
        if (has('emptyStateDesc')) el('emptyStateDesc').textContent = 'Không có hạn công việc nào cần xử lý trong ngày hôm nay.';
      } else if (filter === 'completed') {
        if (has('emptyStateTitle')) el('emptyStateTitle').textContent = 'Chưa có việc hoàn thành';
        if (has('emptyStateDesc')) el('emptyStateDesc').textContent = 'Hãy tích chọn hoàn thành các công việc khi bạn làm xong nhé.';
      } else {
        if (has('emptyStateTitle')) el('emptyStateTitle').textContent = 'Chưa có công việc nào';
        if (has('emptyStateDesc')) el('emptyStateDesc').textContent = 'Nhập tên công việc ở ô phía trên và nhấn "Thêm việc" để bắt đầu.';
      }
    }
  }

  // Fallback for legacy taskCards container if present elsewhere
  if (has('taskCards') && !has('activeTasksList')) {
    el('taskCards').innerHTML = allTasks.map(renderTaskCardItem).join('');
  }

  enhanceActionButtons();
}

async function toggleTaskComplete(id) {
  const current = state.tasks.find(item => item.id === id);
  if (!current) return;
  const isCompleted = current.status === 'Completed';
  const newStatus = isCompleted ? 'InProgress' : 'Completed';
  const newProgress = isCompleted ? 0 : 100;

  // Optimistic instant UI update
  current.status = newStatus;
  current.progress = newProgress;
  renderTasks();

  try {
    await request(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...current,
        status: newStatus,
        progress: newProgress
      })
    });
    toast(isCompleted ? 'Đã bỏ đánh dấu hoàn thành.' : '🎉 Đã hoàn thành công việc!');
    loadData();
  } catch (error) {
    toast(error.message);
    loadData();
  }
}

async function setTaskColor(id, color) {
  const current = state.tasks.find(item => item.id === id);
  if (!current) return;
  current.color = color;
  renderTasks();
  try {
    await request(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...current,
        color
      })
    });
    toast('Đã đổi màu sắc công việc.');
    loadData();
  } catch (error) {
    toast(error.message);
    loadData();
  }
}

function selectTaskColor(color, btn) {
  state.selectedTaskColor = color;
  if (has('taskColor')) el('taskColor').value = color;
  if (has('taskCustomColorPicker')) el('taskCustomColorPicker').value = color;
  document.querySelectorAll('#taskColorSwatches .color-swatch-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.color === color);
  });
}

function onCustomColorPicked(color) {
  selectTaskColor(color);
}

function selectEditTaskColor(color, btn) {
  if (has('editTaskColor')) el('editTaskColor').value = color;
  if (has('editTaskCustomColorPicker')) el('editTaskCustomColorPicker').value = color;
  document.querySelectorAll('#editTaskColorSwatches .color-swatch-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.color === color);
  });
}

function onEditCustomColorPicked(color) {
  selectEditTaskColor(color);
}

function toggleTaskNoteField() {
  el('taskNoteContainer')?.classList.toggle('hidden');
}

function setTaskFilter(filter) {
  state.taskFilter = filter;
  document.querySelectorAll('.todo-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  renderTasks();
}

function onTaskSearch(query) {
  state.taskSearch = String(query || '').trim().toLowerCase();
  if (has('taskSearchClearBtn')) {
    el('taskSearchClearBtn').classList.toggle('hidden', !state.taskSearch);
  }
  renderTasks();
}

function clearTaskSearch() {
  if (has('taskSearchInput')) el('taskSearchInput').value = '';
  onTaskSearch('');
}

function onTaskFilterChange() {
  state.taskFilterPriority = el('taskFilterPriority')?.value || '';
  state.taskFilterColor = el('taskFilterColor')?.value || '';
  renderTasks();
}

function toggleCompletedSection() {
  state.completedTasksCollapsed = !state.completedTasksCollapsed;
  const list = el('completedTasksList');
  const chevron = el('completedChevronIcon');
  if (list) list.classList.toggle('hidden', state.completedTasksCollapsed);
  if (chevron) chevron.classList.toggle('collapsed', state.completedTasksCollapsed);
}

async function createTask(event) {
  event.preventDefault();
  const titleInput = el('taskTitle');
  if (!titleInput || !titleInput.value.trim()) return;

  try {
    const body = {
      title: titleInput.value.trim(),
      description: el('taskDescription')?.value?.trim() || '',
      assignee: el('taskAssignee')?.value?.trim() || '',
      dueDate: el('taskDueDate')?.value || '',
      priority: el('taskPriority')?.value || 'Normal',
      status: 'New',
      progress: 0,
      color: el('taskColor')?.value || state.selectedTaskColor || '#15803d'
    };
    await request('/api/tasks', { method: 'POST', body: JSON.stringify(body) });
    event.target.reset();
    setDefaultDates();
    selectTaskColor('#15803d');
    if (has('taskNoteContainer')) el('taskNoteContainer').classList.add('hidden');
    toast('Đã thêm công việc vào danh sách.');
    loadData();
  } catch (error) {
    toast(error.message);
  }
}

function openEditTaskModal(id) {
  const item = state.tasks.find(t => t.id === id);
  if (!item) return;
  state.editingTaskId = id;
  if (has('editTaskId')) el('editTaskId').value = item.id;
  if (has('editTaskTitle')) el('editTaskTitle').value = item.title || '';
  if (has('editTaskDescription')) el('editTaskDescription').value = item.description || '';
  if (has('editTaskAssignee')) el('editTaskAssignee').value = item.assignee || '';
  if (has('editTaskDueDate')) el('editTaskDueDate').value = item.due_date || '';
  if (has('editTaskPriority')) el('editTaskPriority').value = item.priority || 'Normal';
  if (has('editTaskStatus')) el('editTaskStatus').value = item.status || 'New';
  if (has('editTaskColor')) el('editTaskColor').value = item.color || '#15803d';
  if (has('editTaskCustomColorPicker')) el('editTaskCustomColorPicker').value = item.color || '#15803d';

  selectEditTaskColor(item.color || '#15803d');
  el('editTaskModal')?.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function closeEditTaskModal() {
  state.editingTaskId = null;
  el('editTaskModal')?.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

async function saveEditTask(event) {
  event.preventDefault();
  const id = state.editingTaskId || Number(el('editTaskId')?.value);
  if (!id) return;
  const current = state.tasks.find(t => t.id === id) || {};
  const status = el('editTaskStatus')?.value || current.status || 'New';
  const progress = status === 'Completed' ? 100 : current.progress;

  try {
    const body = {
      ...current,
      title: el('editTaskTitle')?.value?.trim() || current.title,
      description: el('editTaskDescription')?.value?.trim() || '',
      assignee: el('editTaskAssignee')?.value?.trim() || '',
      dueDate: el('editTaskDueDate')?.value || '',
      priority: el('editTaskPriority')?.value || 'Normal',
      status,
      progress,
      color: el('editTaskColor')?.value || current.color || '#15803d'
    };
    await request(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    closeEditTaskModal();
    toast('Đã lưu thay đổi công việc.');
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
  await mutate(`/api/tasks/${id}/remind`, { method: 'POST', body: '{}' }, 'Đã gửi thông báo nhắc việc.');
}

async function deleteTask(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa công việc này?')) return;
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
