import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as jobsApi from '../../api/jobs.api';
import JobCard from '../../components/JobCard/JobCard';
import { useToast } from '../../hooks/useToast';

const JobList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  // const [total, setTotal] = useState(0); // If backend pagination is fully supported
  
  const { showToast } = useToast();

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Backend listJobs currently returns all workspace jobs in an array, unpaginated.
      // We apply manual client-side limit for now, or update backend later.
      // But we pass the query params just in case backend supports it:
      const data = await jobsApi.listJobs({ page, limit });
      // Depending on API shape, it could be data.data.jobs or just data.data
      const resultJobs = Array.isArray(data.data) ? data.data : data.data.jobs || [];
      setJobs(resultJobs);
    } catch (err) {
      setError(err.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, limit]);

  const handleToggleStatus = async (id) => {
    try {
      const job = jobs.find(j => j._id === id);
      if (job.status === 'active') {
        await jobsApi.pauseJob(id);
        showToast({ message: 'Job paused', type: 'warning' });
      } else {
        await jobsApi.resumeJob(id);
        showToast({ message: 'Job resumed', type: 'success' });
      }
      fetchJobs();
    } catch (err) {
      showToast({ message: 'Failed to toggle job status: ' + err.message, type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await jobsApi.deleteJob(id);
      setJobs(jobs.filter(j => j._id !== id));
      showToast({ message: 'Job deleted', type: 'success' });
    } catch (err) {
      showToast({ message: 'Failed to delete job: ' + err.message, type: 'error' });
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    job.callbackUrl.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Client-side slice for UI pagination since listJobs is unpaginated on server
  const paginatedJobs = filteredJobs.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(filteredJobs.length / limit);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Jobs</h1>
          <p className="page-subtitle">Manage your scheduled API requests.</p>
        </div>
        <Link to="/jobs/new" className="btn btn-primary">
          + New Job
        </Link>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            className="form-input search-input" 
            placeholder="Search jobs..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button className="btn btn-ghost btn-sm" onClick={fetchJobs}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="flex-center" style={{ padding: '4rem' }}>
          <div className="spinner"></div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚡</div>
          <div className="empty-state-title">No jobs found</div>
          <div className="empty-state-text">
            {searchTerm ? 'Try adjusting your search filters.' : 'Create your first scheduled job to get started.'}
          </div>
          {!searchTerm && (
            <Link to="/jobs/new" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
              Create Job
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="jobs-grid">
            {paginatedJobs.map(job => (
              <JobCard 
                key={job._id} 
                job={job} 
                onToggleStatus={handleToggleStatus}
                onDelete={handleDelete}
              />
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="pagination" style={{ padding: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <button 
                className="page-btn btn btn-secondary btn-sm" 
                disabled={page <= 1} 
                onClick={() => setSearchParams({ page: page - 1, limit })}
              >
                &larr; Prev
              </button>
              <span className="text-muted" style={{ fontSize: '0.85rem', margin: '0 1rem' }}>
                Page {page} of {totalPages}
              </span>
              <button 
                className="page-btn btn btn-secondary btn-sm" 
                disabled={page >= totalPages} 
                onClick={() => setSearchParams({ page: page + 1, limit })}
              >
                Next &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JobList;
