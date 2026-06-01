import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import api from '../../api/axios';

const Team = () => {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('developer');
  const [inviting, setInviting] = useState(false);

  const fetchMembers = async () => {
    try {
      // Assuming a workspace members endpoint or just mock for now if not fully built.
      // The user asked to wire it up to /api/workspaces/:id/invite, we assume members list can be fetched.
      // If no members list endpoint, we'll just show the current user for now as it was originally.
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!user?.activeWorkspace) return;
    
    setInviting(true);
    try {
      await api.post(`/workspaces/${user.activeWorkspace}/invite`, { email: inviteEmail, role: inviteRole });
      showToast({ message: `Invitation sent to ${inviteEmail}`, type: 'success' });
      setShowModal(false);
      setInviteEmail('');
      setInviteRole('developer');
      fetchMembers();
    } catch (err) {
      showToast({ message: 'Failed to invite: ' + (err.message || err), type: 'error' });
    } finally {
      setInviting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Settings</h1>
          <p className="page-subtitle">Manage members in the {user?.activeWorkspace} workspace.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Workspace Members</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            Invite Member
          </button>
        </div>
        
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="flex" style={{ gap: '0.75rem', alignItems: 'center' }}>
                    <div className="user-avatar" style={{ width: '28px', height: '28px', fontSize: '0.65rem' }}>
                      {user?.name?.slice(0, 2).toUpperCase() || 'ME'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{user?.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{user?.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className="badge badge-success">Owner</span></td>
                <td className="text-muted" style={{ fontSize: '0.85rem' }}>Just now</td>
                <td><span className="text-muted" style={{ fontSize: '0.85rem' }}>It's you</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Invite Member</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleInvite}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={inviteEmail} 
                  onChange={e => setInviteEmail(e.target.value)} 
                  required 
                  placeholder="colleague@company.com" 
                />
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Role</label>
                <select 
                  className="form-select" 
                  value={inviteRole} 
                  onChange={e => setInviteRole(e.target.value)}
                >
                  <option value="developer">Developer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={inviting}>
                  {inviting ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
