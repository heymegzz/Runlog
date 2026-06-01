import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as jobsApi from '../../api/jobs.api';
import CronBuilder from '../../components/CronBuilder/CronBuilder';
import { useToast } from '../../hooks/useToast';

const JobForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    callbackUrl: '',
    callbackMethod: 'POST',
    schedule: '* * * * *',
    callbackHeaders: '',
    callbackBody: '',
    timeout: 30000,
    retryCount: 3,
    alertEmail: '',
    alertSlack: ''
  });

  useEffect(() => {
    if (isEditing) {
      const fetchJob = async () => {
        try {
          const res = await jobsApi.getJob(id);
          const job = res.data;
          
          let headersStr = '';
          if (job.callbackHeaders) {
            const headersObj = job.callbackHeaders instanceof Map
              ? Object.fromEntries(job.callbackHeaders)
              : job.callbackHeaders;
            headersStr = Object.entries(headersObj).map(([k, v]) => `${k}: ${v}`).join('\n');
          }

          setFormData({
            ...job,
            callbackHeaders: headersStr,
            callbackBody: job.callbackBody || ''
          });
        } catch (err) {
          setError(err.message || 'Failed to load job details');
        } finally {
          setLoading(false);
        }
      };
      fetchJob();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = { ...formData };
      
      // Parse headers
      if (payload.callbackHeaders) {
        const headers = {};
        payload.callbackHeaders.split('\n').forEach(line => {
          const idx = line.indexOf(':');
          if (idx > 0) {
            const key = line.slice(0, idx).trim();
            const val = line.slice(idx + 1).trim();
            if (key) headers[key] = val;
          }
        });
        payload.callbackHeaders = headers;
      } else {
        payload.callbackHeaders = {};
      }

      if (isEditing) {
        await jobsApi.updateJob(id, payload);
        showToast({ message: 'Job updated', type: 'success' });
      } else {
        await jobsApi.createJob(payload);
        showToast({ message: 'Job created successfully', type: 'success' });
      }
      
      navigate('/jobs');
    } catch (err) {
      const errMsg = err.message || 'Failed to save job';
      setError(errMsg);
      showToast({ message: `Failed: ${errMsg}`, type: 'error' });
      setSaving(false);
    }
  };

  if (loading) return <div className="page-content flex-center"><div className="spinner"></div></div>;

  return (
    <div className="page-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">{isEditing ? 'Edit Job' : 'Create New Job'}</h1>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="card" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Job Name</label>
            <input 
              type="text" 
              name="name" 
              className="form-input" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              placeholder="e.g. Sync Users"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Schedule <span className="form-label-hint">(Cron Expression)</span></label>
            <CronBuilder 
              value={formData.schedule} 
              onChange={(val) => setFormData(p => ({ ...p, schedule: val }))} 
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description (Optional)</label>
          <input 
            type="text" 
            name="description" 
            className="form-input" 
            value={formData.description || ''} 
            onChange={handleChange} 
          />
        </div>

        <div className="divider"></div>

        <h3 className="card-title" style={{ marginBottom: '1rem' }}>HTTP Request</h3>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group" style={{ width: '150px' }}>
            <label className="form-label">Method</label>
            <select 
              name="callbackMethod" 
              className="form-select" 
              value={formData.callbackMethod} 
              onChange={handleChange}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Endpoint URL</label>
            <input 
              type="url" 
              name="callbackUrl" 
              className="form-input mono" 
              value={formData.callbackUrl} 
              onChange={handleChange} 
              required 
              placeholder="https://api.example.com/webhook"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Headers <span className="form-label-hint">(Key: Value format)</span></label>
            <textarea 
              name="callbackHeaders" 
              className="form-textarea mono" 
              value={formData.callbackHeaders} 
              onChange={handleChange} 
              placeholder="Authorization: Bearer token..."
            ></textarea>
          </div>
          <div className="form-group">
            <label className="form-label">Body <span className="form-label-hint">(JSON string)</span></label>
            <textarea 
              name="callbackBody" 
              className="form-textarea mono" 
              value={formData.callbackBody} 
              onChange={handleChange} 
              placeholder='{"key": "value"}'
              disabled={formData.callbackMethod === 'GET'}
            ></textarea>
          </div>
        </div>

        <div className="divider"></div>
        <h3 className="card-title" style={{ marginBottom: '1rem' }}>Advanced & Alerts</h3>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Timeout (ms)</label>
            <input type="number" name="timeout" className="form-input" value={formData.timeout} onChange={handleChange} min="1000" max="300000" />
          </div>
          <div className="form-group">
            <label className="form-label">Retries</label>
            <input type="number" name="retryCount" className="form-input" value={formData.retryCount} onChange={handleChange} min="0" max="5" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Alert Email</label>
            <input type="email" name="alertEmail" className="form-input" value={formData.alertEmail || ''} onChange={handleChange} placeholder="team@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Slack Webhook URL</label>
            <input type="url" name="alertSlack" className="form-input" value={formData.alertSlack || ''} onChange={handleChange} placeholder="https://hooks.slack.com/services/..." />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEditing ? 'Update Job' : 'Create Job'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobForm;
