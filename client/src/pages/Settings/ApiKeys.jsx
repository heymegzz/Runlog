import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../hooks/useToast';
import EmptyState from '../../components/EmptyState/EmptyState';
import { IconKey, IconPlus } from '../../components/Icons/Icons';

const ApiKeys = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('');
  const [createdKey, setCreatedKey] = useState(null);

  const { showToast } = useToast();

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api-keys');
      setKeys(data);
    } catch (err) {
      setError(err.message || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: newKeyName };
      if (newKeyExpiry) payload.expiresAt = newKeyExpiry;
      
      const { data } = await api.post('/api-keys', payload);
      setCreatedKey(data);
      setNewKeyName('');
      setNewKeyExpiry('');
      fetchKeys();
      showToast({ message: 'API key generated', type: 'success' });
    } catch (err) {
      showToast({ message: 'Failed to create key: ' + err.message, type: 'error' });
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this API key? Any applications using it will lose access immediately.')) return;
    
    try {
      await api.delete(`/api-keys/${id}`);
      setKeys(keys.filter(k => k._id !== id));
      showToast({ message: 'API key revoked', type: 'success' });
    } catch (err) {
      showToast({ message: 'Failed to revoke key: ' + err.message, type: 'error' });
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">API Keys</h1>
          <p className="page-subtitle">Manage programmatic access to your workspace.</p>
        </div>
        <button type="button" className="btn btn-primary btn-with-icon" onClick={() => { setCreatedKey(null); setShowModal(true); }}>
          <IconPlus size={16} />
          Generate key
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-panel">
        {loading ? (
          <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner"></div></div>
        ) : keys.length === 0 ? (
          <EmptyState
            icon={IconKey}
            title="No API keys yet"
            text="Generate a key to access Runlog from scripts or external services."
          >
            <button type="button" className="btn btn-primary btn-with-icon" style={{ marginTop: '1.25rem' }} onClick={() => { setCreatedKey(null); setShowModal(true); }}>
              <IconPlus size={16} />
              Generate key
            </button>
          </EmptyState>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Prefix</th>
                  <th>Created</th>
                  <th>Expires</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map(k => (
                  <tr key={k._id}>
                    <td style={{ fontWeight: 500 }}>{k.name}</td>
                    <td className="mono text-muted">{k.keyPrefix}...</td>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>{new Date(k.createdAt).toLocaleDateString()}</td>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                      {k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm text-error" onClick={() => handleRevoke(k._id)}>
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { if(!createdKey) setShowModal(false); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{createdKey ? 'API Key Generated' : 'Generate API Key'}</h2>
              {!createdKey && <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>}
            </div>

            {createdKey ? (
              <div>
                <div className="alert alert-warning" style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)', color: 'var(--warning)' }}>
                  <strong>Important:</strong> Copy your API key now. For security reasons, you will not be able to see it again after closing this window.
                </div>
                
                <div className="api-key-display">
                  {createdKey.rawKey}
                </div>
                
                <div className="form-actions" style={{ borderTop: 'none', marginTop: '1rem' }}>
                  <button className="btn btn-primary" onClick={() => {
                    navigator.clipboard.writeText(createdKey.rawKey);
                    showToast({ message: 'Copied to clipboard!', type: 'success' });
                    setShowModal(false);
                    setCreatedKey(null);
                  }}>
                    Copy and Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey}>
                <div className="form-group">
                  <label className="form-label">Key Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newKeyName} 
                    onChange={e => setNewKeyName(e.target.value)} 
                    placeholder="e.g. Production CI/CD Server" 
                    required 
                  />
                  <div className="form-hint">A descriptive name to help you identify this key later.</div>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Expiration Date (Optional)</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={newKeyExpiry} 
                    onChange={e => setNewKeyExpiry(e.target.value)} 
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <div className="form-hint">Leave blank for a key that never expires.</div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Generate Key</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeys;
