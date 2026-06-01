import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { IconBell, IconInbox } from '../Icons/Icons';

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
    <div className="notif-root" ref={dropdownRef}>
      <button
        type="button"
        className={`notif-trigger ${isOpen ? 'notif-trigger--open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} new` : ''}`}
        aria-expanded={isOpen}
      >
        <IconBell size={18} />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notif-clear"
                onClick={(e) => {
                  e.stopPropagation();
                  clearNotifications();
                }}
              >
                Clear all
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <div className="notif-empty-icon">
                  <IconInbox size={20} />
                </div>
                <p>No recent notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className="notif-item">
                  <div className={`notif-dot ${notif.type}`} />
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
