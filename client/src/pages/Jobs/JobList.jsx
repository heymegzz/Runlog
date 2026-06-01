import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as jobsApi from '../../api/jobs.api';
import JobCard from '../../components/JobCard/JobCard';

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await jobsApi.listJobs();
      setJobs(data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleToggleStatus = async (id) => {
    try {
      const job = jobs.find(j => j._id === id);
      if (job.status === 'active') {
        await jobsApi.pauseJob(id);
      } else {
        await jobsApi.resumeJob(id);
      }
      fetchJobs();
    } catch (err) {
      alert('Failed to toggle job status: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await jobsApi.deleteJob(id);
      setJobs(jobs.filter(j => j._id !== id));
    } catch (err) {
      alert('Failed to delete job: ' + err.message);
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    job.callbackUrl.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      {error && <div className="alert alert-error">{error}</div>}

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
        <div className="jobs-grid">
          {filteredJobs.map(job => (
            <JobCard 
              key={job._id} 
              job={job} 
              onToggleStatus={handleToggleStatus}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default JobList;
