import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSocket } from '../hooks/useSocket';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { relativeTime } from '../utils/time';

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

  if (loading) return <div className="page-content flex-center"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.name}!</h1>
          <p className="page-subtitle">Here's what's happening in your {user?.activeWorkspace} workspace.</p>
        </div>
        {stats?.jobs?.total > 0 && (
          <Link to="/jobs/new" className="btn btn-primary">
            + New Job
          </Link>
        )}
      </div>

      {error && (
        <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button className="btn btn-ghost btn-sm" onClick={fetchStats}>Retry</button>
        </div>
      )}

      {!error && stats?.jobs?.total === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.5rem' }}>
            Welcome to RunLog
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '360px', margin: '0 auto 1.5rem' }}>
            Schedule your first HTTP job and see it execute in real time.
          </p>
          <Link to="/jobs/new" className="btn btn-primary">
            Create your first job →
          </Link>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <div className="stat-body">
                <div className="stat-value">{stats?.jobs?.total || 0}</div>
                <div className="stat-label">Total Jobs</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              </div>
              <div className="stat-body">
                <div className="stat-value">{stats?.executions?.total || 0}</div>
                <div className="stat-label">Total Executions</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon amber">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <div className="stat-body">
                <div className="stat-value">{stats?.executions?.successRate || 0}%</div>
                <div className="stat-label">Success Rate</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon red">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <div className="stat-body">
                <div className="stat-value">{stats?.executions?.failed || 0}</div>
                <div className="stat-label">Failed Executions</div>
              </div>
            </div>
          </div>

          <div className="form-row" style={{ marginTop: '2rem' }}>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Live Executions</h3>
              </div>
              <div className="execution-log">
                {liveExecutions.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                    <div className="empty-state-text">Waiting for executions...</div>
                  </div>
                ) : (
                  liveExecutions.map((exec, idx) => (
                    <div key={idx} className={`log-entry ${exec.status}`}>
                      <div className="log-job-name">{exec.jobName}</div>
                      <div className={`log-status ${exec.status}`}>{exec.status.toUpperCase()}</div>
                      <div className="log-duration">{exec.durationMs}ms</div>
                      <div className="log-time" title={new Date(exec.executedAt).toLocaleString()}>{relativeTime(exec.executedAt)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Recent History</h3>
                <Link to="/executions" className="btn btn-ghost btn-sm">View All</Link>
              </div>
              <div className="table-wrapper">
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
                      stats.recentExecutions.slice(0, 5).map(ex => (
                        <tr key={ex._id}>
                          <td className="truncate" style={{ maxWidth: '150px' }}>{ex.job?.name || 'Deleted Job'}</td>
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
                        <td colSpan="3" className="text-center text-muted" style={{ padding: '2rem' }}>No recent executions</td>
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
