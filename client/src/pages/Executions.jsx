import { useState, useEffect } from 'react';
import * as execApi from '../api/executions.api';
import { Link } from 'react-router-dom';
import { relativeTime } from '../utils/time';
import EmptyState from '../components/EmptyState/EmptyState';
import { IconActivity } from '../components/Icons/Icons';

const Executions = () => {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const fetchExecutions = async (skip = 0) => {
    setLoading(true);
    setError(null);
    try {
      const data = await execApi.listExecutions({ skip, limit });
      setExecutions(data.data.executions || []);
      setTotal(data.data.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch executions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions(page * limit);
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Executions</h1>
          <p className="page-subtitle">History of all job runs across your workspace.</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => fetchExecutions(page * limit)}>Retry</button>
        </div>
      )}

      <div className="table-panel">
        {loading ? (
          <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner"></div></div>
        ) : executions.length === 0 && !error ? (
          <EmptyState
            icon={IconActivity}
            title="No executions yet"
            text="Your job execution history will appear here once schedules start firing."
          />
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Job</th>
                    <th>Duration</th>
                    <th>Status Code</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {executions.map(ex => (
                    <tr key={ex._id}>
                      <td><span className={`badge badge-${ex.status}`}>{ex.status.toUpperCase()}</span></td>
                      <td>
                        {ex.job ? (
                          <Link to={`/jobs/${ex.job._id}`}>{ex.job.name}</Link>
                        ) : (
                          <span className="text-muted">Deleted Job</span>
                        )}
                      </td>
                      <td className="mono">{ex.durationMs}ms</td>
                      <td className={`mono ${ex.status === 'failed' ? 'text-error' : ''}`}>{ex.statusCode}</td>
                      <td className="text-muted" style={{ fontSize: '0.85rem' }} title={new Date(ex.executedAt).toLocaleString()}>
                        {relativeTime(ex.executedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="pagination-bar">
                <button
                  type="button"
                  className="page-btn btn btn-secondary btn-sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Prev
                </button>
                <span className="pagination-label">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  className="page-btn btn btn-secondary btn-sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Executions;
