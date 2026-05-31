import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const Layout = () => {
  const { user, logout } = useAuthStore();

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2>RunLog</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link to="/">Dashboard</Link>
          <Link to="/jobs">Jobs</Link>
          <Link to="/executions">Executions</Link>
          <Link to="/settings/team">Team Settings</Link>
        </nav>
      </aside>
      
      <main className="main-content">
        <header className="topbar">
          <div>
            <strong>Workspace:</strong> {user?.activeWorkspace}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>{user?.name}</span>
            <button className="btn-logout" onClick={logout}>
              Logout
            </button>
          </div>
        </header>
        
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
