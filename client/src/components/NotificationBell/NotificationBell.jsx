import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';

const NotificationBell = () => {
  const { notifications, clearNotifications } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        className="topbar-icon-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button 
                className="btn-ghost btn-sm" 
                onClick={(e) => { e.stopPropagation(); clearNotifications(); setIsOpen(false); }}
              >
                Clear all
              </button>
            )}
          </div>
          
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">No recent notifications</div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className="notif-item">
                  <div className={`notif-dot ${notif.type}`}></div>
                  <div className="notif-body">
                    <div className="notif-text">{notif.message}</div>
                    <div className="notif-time">
                      {new Date(notif.time).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
