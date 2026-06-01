import { Link } from 'react-router-dom';

const JobCard = ({ job, onToggleStatus, onDelete }) => {
  const getMethodClass = (method) => `method-${method}`;

  const isPaused = job.status === 'paused';

  return (
    <div className="job-card">
      <div className="job-card-header">
        <div className="job-name" title={job.name}>{job.name}</div>
        <span className={`badge badge-${job.status}`}>
          {job.status === 'active' ? 'Active' : 'Paused'}
        </span>
      </div>

      <div className="job-meta">
        <div className="job-meta-row">
          <span className={`method-badge ${getMethodClass(job.callbackMethod)}`}>
            {job.callbackMethod}
          </span>
          <span className="job-url mono" title={job.callbackUrl}>{job.callbackUrl}</span>
        </div>
        <div className="job-meta-row" style={{ marginTop: '0.25rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <span className="mono">{job.schedule}</span>
        </div>
        {job.nextRunAt && (
          <div className="job-meta-row" style={{ marginTop: '0.25rem' }}>
            <span style={{ color: 'var(--text-disabled)' }}>Next:</span>
            <span>{new Date(job.nextRunAt).toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="job-card-footer">
        <div className="job-actions">
          <Link to={`/jobs/${job._id}`} className="btn btn-secondary btn-sm">
            View
          </Link>
          <button 
            className="btn btn-ghost btn-icon" 
            title={isPaused ? "Resume Job" : "Pause Job"}
            onClick={(e) => { e.preventDefault(); onToggleStatus(job._id); }}
          >
            {isPaused ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            )}
          </button>
        </div>
        
        <button 
          className="btn btn-ghost btn-icon text-error" 
          title="Delete Job"
          onClick={(e) => { 
            e.preventDefault(); 
            if(window.confirm('Are you sure you want to delete this job?')) {
              onDelete(job._id);
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
  );
};

export default JobCard;
