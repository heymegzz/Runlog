import { useToast } from '../../hooks/useToast';

const Toast = () => {
  const { toast, hideToast } = useToast();

  if (!toast) return null;

  const bgColors = {
    success: 'var(--success)',
    error: 'var(--error)',
    warning: 'var(--warning)',
    info: 'var(--primary)'
  };

  const bgColor = bgColors[toast.type] || bgColors.info;

  return (
    <div 
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: bgColor,
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: 'slideInRight 0.3s ease-out forwards',
        fontWeight: 500,
        fontSize: '0.9rem'
      }}
    >
      <span>{toast.message}</span>
      <button 
        onClick={hideToast}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.8)',
          cursor: 'pointer',
          padding: '0',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
  );
};

export default Toast;
