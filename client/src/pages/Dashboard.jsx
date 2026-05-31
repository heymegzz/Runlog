import { useAuthStore } from '../store/authStore';

const Dashboard = () => {
  const { user } = useAuthStore();

  return (
    <div>
      <h1>Welcome back, {user?.name}!</h1>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
        This is your central hub for the <strong>{user?.activeWorkspace}</strong> workspace.
      </p>
      
      <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#e0e7ff', borderRadius: '8px', color: '#3730a3' }}>
        <strong>Setup Complete!</strong>
        <p style={{ marginTop: '0.5rem' }}>
          Authentication, JWT storage, and Workspace selection are working perfectly.
          We can now proceed to building the Jobs and Execution features.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
