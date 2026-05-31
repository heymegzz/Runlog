import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="auth-container">
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '1rem' }}>404</h1>
        <h2>Page Not Found</h2>
        <p style={{ color: 'var(--text-muted)', margin: '1rem 0 2rem' }}>
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary" style={{ display: 'inline-block', width: 'auto', padding: '0.75rem 2rem' }}>
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
