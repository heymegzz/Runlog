import { useAuthStore } from '../../store/authStore';

const Team = () => {
  const { user } = useAuthStore();

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
          <button className="btn btn-primary btn-sm">Invite Member</button>
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
    </div>
  );
};

export default Team;
