import { useState, useEffect } from 'react';
import api from '../../api/axios';

const ApiKeys = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('');
  const [createdKey, setCreatedKey] = useState(null);

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
    } catch (err) {
      alert('Failed to create key: ' + err.message);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this API key? Any applications using it will lose access immediately.')) return;
    
    try {
      await api.delete(`/api-keys/${id}`);
      setKeys(keys.filter(k => k._id !== id));
    } catch (err) {
      alert('Failed to revoke key: ' + err.message);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">API Keys</h1>
          <p className="page-subtitle">Manage programmatic access to your workspace.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setCreatedKey(null); setShowModal(true); }}>
          + Generate New Key
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner"></div></div>
        ) : keys.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔑</div>
            <div className="empty-state-title">No API keys generated</div>
            <div className="empty-state-text">Generate an API key to access RunLog via scripts or external services.</div>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
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
                    alert('Copied to clipboard!');
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
