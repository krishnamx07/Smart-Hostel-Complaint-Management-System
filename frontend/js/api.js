/* ============================================================
   api.js — Shared API fetch wrapper
   ============================================================ */

const API_BASE = '';

const api = {
  async request(method, path, body = null) {
    const opts = {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(API_BASE + path, opts);
    const data = await res.json().catch(() => ({ success: false, message: 'Server returned non-JSON response.' }));

    if (res.status === 401) {
      // Don't redirect if we are already on the login or register page to avoid loops
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register' && path !== '/') {
        window.location.href = '/login';
      }
      return { success: false, message: 'Unauthorized' };
    }

    return { ok: res.ok, status: res.status, ...data };
  },

  get:    (path)         => api.request('GET',    path),
  post:   (path, body)   => api.request('POST',   path, body),
  put:    (path, body)   => api.request('PUT',    path, body),
  patch:  (path, body)   => api.request('PATCH',  path, body),
  delete: (path)         => api.request('DELETE', path)
};

/* ── Toast Notification System ─────────────────────────── */
const toast = {
  container: null,

  _getContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
    return this.container;
  },

  show(message, type = 'info', duration = 3500) {
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <span>${icons[type] || 'ℹ️'}</span>
      <span>${message}</span>
      <span class="toast-dismiss" onclick="this.parentElement.remove()">✕</span>
    `;
    this._getContainer().appendChild(el);
    setTimeout(() => { el.style.animation = 'toastOut 0.3s ease forwards'; setTimeout(() => el.remove(), 300); }, duration);
  },

  success: (msg, dur) => toast.show(msg, 'success', dur),
  error:   (msg, dur) => toast.show(msg, 'error',   dur),
  info:    (msg, dur) => toast.show(msg, 'info',    dur),
  warning: (msg, dur) => toast.show(msg, 'warning', dur)
};

/* ── Auth State ───────────────────────────────────────── */
const auth = {
  user: null,

  async init() {
    try {
      const data = await api.get('/api/auth/me');
      if (data && data.success) {
        this.user = data.user;
        return data.user;
      }
    } catch { /* Not logged in */ }
    return null;
  },

  async requireAuth(allowedRoles = []) {
    const user = await this.init();
    if (!user) { window.location.href = '/login'; return null; }
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      window.location.href = `/${user.role}/dashboard`;
      return null;
    }
    return user;
  },

  async logout() {
    await api.post('/api/auth/logout');
    window.location.href = '/login';
  }
};

/* ── Sidebar Builder ──────────────────────────────────── */
const sidebar = {
  build(role, activePath) {
    const navItems = {
      student: [
        { icon: '🏠', label: 'Dashboard',        path: '/student/dashboard' },
        { icon: '📝', label: 'Raise Complaint',   path: '/student/raise-complaint' },
        { icon: '📋', label: 'My Complaints',     path: '/student/my-complaints' },
        { icon: '👤', label: 'My Profile',        path: '/student/profile' }
      ],
      staff: [
        { icon: '🏠', label: 'Dashboard',         path: '/staff/dashboard' },
        { icon: '📋', label: 'Assigned Complaints', path: '/staff/complaints' },
        { icon: '👤', label: 'My Profile',         path: '/staff/profile' }
      ],
      admin: [
        { icon: '📊', label: 'Dashboard',          path: '/admin/dashboard', section: 'OVERVIEW' },
        { icon: '📋', label: 'All Complaints',      path: '/admin/complaints' },
        { icon: '👥', label: 'User Management',     path: '/admin/user-management', section: 'MANAGEMENT' },
        { icon: '➕', label: 'Create User',         path: '/admin/create-user' },
        { icon: '🔐', label: 'Privilege Manager',   path: '/admin/privilege-manager', section: 'DATABASE' },
        { icon: '📈', label: 'Reports',             path: '/admin/reports' }
      ]
    };

    const items = navItems[role] || [];
    let navHTML = '';
    let lastSection = null;

    for (const item of items) {
      if (item.section && item.section !== lastSection) {
        navHTML += `<div class="nav-section-label">${item.section}</div>`;
        lastSection = item.section;
      }
      const isActive = window.location.pathname === item.path || activePath === item.path;
      navHTML += `
        <a class="nav-item ${isActive ? 'active' : ''}" href="${item.path}">
          <span class="nav-icon">${item.icon}</span>
          <span>${item.label}</span>
        </a>`;
    }

    return navHTML;
  },

  render(role, user, activePath) {
    const roleLabel = { student: 'Student', staff: 'Staff Member', admin: 'Administrator' };
    return `
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="brand-icon">🏨</div>
          <div class="brand-name">Hostel Mgmt</div>
          <div class="brand-tagline">Complaint Portal</div>
        </div>
        <div class="sidebar-user">
          <div class="user-avatar">${(user.full_name || 'U')[0].toUpperCase()}</div>
          <div class="user-info">
            <div class="user-name">${escHtml(user.full_name || '')}</div>
            <div class="user-role">${roleLabel[role] || role}</div>
          </div>
        </div>
        <nav class="sidebar-nav">${this.build(role, activePath)}</nav>
        <div class="sidebar-footer">
          <button class="btn-logout" onclick="auth.logout()">
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>
      <div class="sidebar-overlay hidden" id="sidebarOverlay" onclick="closeSidebar()"></div>`;
  }
};

/* ── Notification Bell ────────────────────────────────── */
const notifications = {
  async loadBell(bellEl, badgeEl, dropdownEl) {
    try {
      const data = await api.get('/api/notifications');
      if (!data || !data.success) return;

      const count = data.unread_count;
      if (count > 0) {
        badgeEl.textContent = count > 9 ? '9+' : count;
        badgeEl.classList.add('active');
      } else {
        badgeEl.classList.remove('active');
      }

      const items = data.notifications;
      if (!items.length) {
        dropdownEl.querySelector('.notif-list').innerHTML = '<div class="notif-empty">🔔 No notifications</div>';
        return;
      }

      dropdownEl.querySelector('.notif-list').innerHTML = items.map(n => `
        <div class="notif-item ${n.is_read ? 'read' : 'unread'}" data-id="${n.notif_id}" onclick="notifications.markRead(${n.notif_id}, this)">
          <div class="notif-dot"></div>
          <div>
            <div class="notif-msg">${escHtml(n.message)}</div>
            <div class="notif-time">${timeAgo(n.created_at)}</div>
          </div>
        </div>`).join('');
    } catch (e) { console.warn('Notif load error', e); }
  },

  async markRead(id, el) {
    await api.put(`/api/notifications/${id}/read`);
    el.classList.remove('unread');
    el.classList.add('read');
    el.querySelector('.notif-dot').style.background = 'var(--border)';
  },

  async markAllRead() {
    await api.put('/api/notifications/read-all');
    document.querySelectorAll('.notif-item').forEach(el => {
      el.classList.remove('unread'); el.classList.add('read');
      el.querySelector('.notif-dot').style.background = 'var(--border)';
    });
    document.getElementById('notifBadge')?.classList.remove('active');
    toast.info('All notifications marked as read.');
  }
};

/* ── Helpers ──────────────────────────────────────────── */
function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function statusBadge(status) {
  const labels = { pending: 'Submitted', in_progress: 'In Progress', resolved: 'Fixed!', rejected: 'Declined' };
  const icons  = { pending: '⏳', in_progress: '🔧', resolved: '✅', rejected: '❌' };
  return `<span class="badge badge-${status}">${icons[status] || ''} ${labels[status] || status}</span>`;
}

function priorityBadge(priority) {
  const icons = { high: '🔴', medium: '🟡', low: '🟢' };
  return `<span class="badge badge-priority-${priority}">${icons[priority] || ''} ${capitalize(priority)}</span>`;
}

function categoryIcon(cat) {
  const icons = {
    electrical: '⚡', plumbing: '🚿', cleanliness: '🧹',
    food: '🍽️', security: '🔒', noise: '🔊', other: '📌'
  };
  return icons[cat] || '📌';
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1).replace('_', ' ') : '';
}

function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.add('hidden');
}

function openSidebar() {
  document.getElementById('sidebar')?.classList.add('open');
  document.getElementById('sidebarOverlay')?.classList.remove('hidden');
}

/* ── Pagination Helper ──────────────────────────────── */
function buildPagination(container, currentPage, totalPages, onPageChange) {
  if (totalPages <= 1) { container.innerHTML = ''; return; }
  let html = `
    <button class="page-btn" onclick="(${onPageChange})(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>‹</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="(${onPageChange})(${i})">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += `<span class="page-btn" style="border:none;background:none;">…</span>`;
    }
  }
  html += `<button class="page-btn" onclick="(${onPageChange})(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>›</button>`;
  container.innerHTML = html;
}
