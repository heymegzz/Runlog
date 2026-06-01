import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as jobsApi from '../../api/jobs.api';
import * as execApi from '../../api/executions.api';
import { useSocket } from '../../hooks/useSocket';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { liveExecutions } = useSocket();
  
  const [job, setJob] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobRes, execRes] = await Promise.all([
          jobsApi.getJob(id),
          execApi.getJobExecutions(id, { limit: 20 })
        ]);
        setJob(jobRes.data);
        setExecutions(execRes.data.executions || []);
      } catch (err) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Live update the job if we see an execution for it
  useEffect(() => {
    if (!job) return;
    const latest = liveExecutions.find(ex => ex.jobId === id);
    if (latest) {
      setExecutions(prev => {
        if (prev.some(p => p._id === latest.executionId)) return prev; // Avoid dupe
        return [
          {
            _id: latest.executionId,
            status: latest.status,
            statusCode: latest.statusCode,
            durationMs: latest.durationMs,
            executedAt: latest.executedAt
          },
          ...prev
        ].slice(0, 20);
      });
      // Update job summary stats (fake increment for visual feedback)
      setJob(prev => ({
        ...prev,
        lastRunAt: latest.executedAt,
        lastRunStatus: latest.status,
        successCount: latest.status === 'success' ? prev.successCount + 1 : prev.successCount,
        failureCount: latest.status === 'failed' ? prev.failureCount + 1 : prev.failureCount
      }));
    }
  }, [liveExecutions, id, job]);

  const handleTrigger = async () => {
    try {
      await jobsApi.triggerJob(id);
      alert('Job triggered successfully. Waiting for execution...');
    } catch (err) {
      alert('Trigger failed: ' + err.message);
    }
  };

  if (loading) return <div className="page-content flex-center"><div className="spinner"></div></div>;
  if (error) return <div className="page-content"><div className="alert alert-error">{error}</div></div>;
  if (!job) return <div className="page-content">Job not found</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="flex" style={{ gap: '0.75rem', alignItems: 'center' }}>
            <h1 className="page-title">{job.name}</h1>
            <span className={`badge badge-${job.status}`}>{job.status.toUpperCase()}</span>
          </div>
          <p className="page-subtitle">{job.description || 'No description provided'}</p>
        </div>
        <div className="flex gap-sm">
          <button className="btn btn-secondary" onClick={handleTrigger}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            Trigger Now
          </button>
          <Link to={`/jobs/${id}/edit`} className="btn btn-secondary">Edit</Link>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-body">
            <div className="stat-value">{job.successCount || 0}</div>
            <div className="stat-label">Successful Runs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-body">
            <div className="stat-value">{job.failureCount || 0}</div>
            <div className="stat-label">Failed Runs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-body">
            <div className="stat-value" style={{ fontSize: '1.25rem' }}>{job.lastRunStatus ? job.lastRunStatus.toUpperCase() : 'NEVER'}</div>
            <div className="stat-label">Last Run Status</div>
          </div>
        </div>
      </div>

      <div className="form-row" style={{ marginTop: '2rem' }}>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Configuration</h3></div>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>Endpoint</div>
              <div className="flex" style={{ gap: '0.5rem', marginTop: '0.25rem' }}>
                <span className={`method-badge method-${job.callbackMethod}`}>{job.callbackMethod}</span>
                <span className="mono">{job.callbackUrl}</span>
              </div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>Schedule</div>
              <div className="mono" style={{ marginTop: '0.25rem' }}>{job.schedule}</div>
            </div>
            {job.nextRunAt && (
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Next Run</div>
                <div style={{ marginTop: '0.25rem' }}>{new Date(job.nextRunAt).toLocaleString()}</div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Recent Executions</h3></div>
          <div className="execution-log">
            {executions.length === 0 ? (
              <div className="text-muted text-center" style={{ padding: '2rem' }}>No executions yet</div>
            ) : (
              executions.map(ex => (
                <div key={ex._id} className={`log-entry ${ex.status}`}>
                  <div className={`log-status ${ex.status}`} style={{ width: '60px' }}>{ex.status.toUpperCase()}</div>
                  <div className="log-duration">{ex.durationMs}ms</div>
                  <div className="mono text-muted" style={{ fontSize: '0.75rem', flex: 1, textAlign: 'right' }}>{ex.statusCode}</div>
                  <div className="log-time">{new Date(ex.executedAt).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
