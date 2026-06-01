import { Outlet, NavLink, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import NotificationBell from '../NotificationBell/NotificationBell';
import Toast from '../Toast/Toast';
import Logo from '../Brand/Logo';
import { IconLogOut } from '../Icons/Icons';

const Layout = () => {
  const { user, logout, token } = useAuthStore();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <div className="layout app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <Logo to="/dashboard" unified className="sidebar-logo brand--nav" />

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main</div>
          <NavLink to="/dashboard" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Dashboard
          </NavLink>
          <NavLink to="/jobs" className={({ isActive }) => `nav-link ${isActive || location.pathname.startsWith('/jobs') ? 'active' : ''}`}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Jobs
          </NavLink>
          <NavLink to="/executions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Executions
          </NavLink>

          <div className="sidebar-section-label">Settings</div>
          <NavLink to="/settings/team" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Team
          </NavLink>
          <NavLink to="/settings/api-keys" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
            API Keys
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-menu" onClick={logout} title="Click to logout">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="user-role">
                <IconLogOut size={12} />
                Sign out
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            <div className="workspace-selector">
              <span className="workspace-dot"></span>
              <span className="workspace-name">{user?.activeWorkspace || 'Workspace'}</span>
            </div>
          </div>
          <div className="topbar-right">
            <NotificationBell />
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  );
};

export default Layout;
