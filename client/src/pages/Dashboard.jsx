import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSocket } from '../hooks/useSocket';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { relativeTime } from '../utils/time';
import Logo from '../components/Brand/Logo';
import EmptyState from '../components/EmptyState/EmptyState';
import { IconPlus, IconArrowRight, IconRadio, IconJobs, IconActivity } from '../components/Icons/Icons';

const Dashboard = () => {
  const { user } = useAuthStore();
  const { liveExecutions } = useSocket();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/analytics/overview');
      setStats(data.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex-center" style={{ padding: '4rem' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0] || 'there'}</h1>
          <p className="page-subtitle">
            {user?.activeWorkspace || 'Workspace'} · overview and live runs
          </p>
        </div>
        {stats?.jobs?.total > 0 && (
          <Link to="/jobs/new" className="btn btn-primary btn-with-icon">
            <IconPlus size={16} />
            New job
          </Link>
        )}
      </div>

      {error && (
        <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={fetchStats}>
            Retry
          </button>
        </div>
      )}

      {!error && stats?.jobs?.total === 0 ? (
        <div className="page-empty">
          <Logo size="lg" unified className="empty-state-brand" />
          <h2 className="page-empty-title">Welcome to Runlog</h2>
          <p className="page-empty-text">
            Schedule your first HTTP job and watch every run stream in real time.
          </p>
          <Link to="/jobs/new" className="btn btn-primary btn-with-icon">
            Create your first job
            <IconArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon purple">
                <IconJobs size={22} />
              </div>
              <div className="stat-body">
                <div className="stat-value">{stats?.jobs?.total || 0}</div>
                <div className="stat-label">Total jobs</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">
                <IconActivity size={22} />
              </div>
              <div className="stat-body">
                <div className="stat-value">{stats?.executions?.total || 0}</div>
                <div className="stat-label">Total executions</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="M22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="stat-body">
                <div className="stat-value">{stats?.executions?.successRate || 0}%</div>
                <div className="stat-label">Success rate</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <div className="stat-body">
                <div className="stat-value">{stats?.executions?.failed || 0}</div>
                <div className="stat-label">Failed runs</div>
              </div>
            </div>
          </div>

          <div className="dashboard-split">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Live executions</h3>
                <IconRadio size={16} style={{ color: 'var(--green)' }} />
              </div>
              <div className="live-feed execution-log">
                {liveExecutions.length === 0 ? (
                  <div className="live-feed-empty">Waiting for executions…</div>
                ) : (
                  liveExecutions.map((exec, idx) => (
                    <div key={idx} className="log-entry">
                      <div className="log-job-name">{exec.jobName}</div>
                      <div className={`log-status ${exec.status}`}>{exec.status.toUpperCase()}</div>
                      <div className="log-duration">{exec.durationMs}ms</div>
                      <div className="log-time" title={new Date(exec.executedAt).toLocaleString()}>
                        {relativeTime(exec.executedAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
              <div className="card-header" style={{ padding: '1rem 1.25rem', marginBottom: 0 }}>
                <h3 className="card-title">Recent history</h3>
                <Link to="/executions" className="btn btn-ghost btn-sm btn-with-icon">
                  View all
                  <IconArrowRight size={14} />
                </Link>
              </div>
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Job</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.recentExecutions?.length > 0 ? (
                      stats.recentExecutions.slice(0, 5).map((ex) => (
                        <tr key={ex._id}>
                          <td className="truncate" style={{ maxWidth: '150px' }}>
                            {ex.job?.name || 'Deleted job'}
                          </td>
                          <td>
                            <span className={`badge badge-${ex.status}`}>{ex.status}</span>
                          </td>
                          <td className="text-muted" style={{ fontSize: '0.75rem' }} title={new Date(ex.executedAt).toLocaleString()}>
                            {relativeTime(ex.executedAt)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center text-muted" style={{ padding: '2rem' }}>
                          No recent executions
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
