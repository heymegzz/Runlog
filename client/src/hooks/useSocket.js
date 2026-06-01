import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

export const useSocket = () => {
  const { user, token } = useAuthStore();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [liveExecutions, setLiveExecutions] = useState([]);

  useEffect(() => {
    if (!user?.activeWorkspace || !token) return;

    const socketUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : 'http://localhost:5005';

    const newSocket = io(socketUrl, {
      auth: { token },
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      newSocket.emit('join:workspace', user.activeWorkspace);
    });

    newSocket.on('execution:done', (payload) => {
      // Add to live executions log
      setLiveExecutions((prev) => [payload, ...prev].slice(0, 50));
      
      // Add to notifications
      setNotifications((prev) => [
        {
          id: Date.now().toString(),
          type: payload.status,
          message: `Job "${payload.jobName}" finished with status ${payload.status} (${payload.statusCode}) in ${payload.durationMs}ms`,
          time: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 20)); // Keep last 20
    });

    // We can also listen for 'job:updated' if we want to live-update the jobs list
    // newSocket.on('job:updated', (payload) => { ... });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave:workspace', user.activeWorkspace);
      newSocket.disconnect();
    };
  }, [user?.activeWorkspace, token]);

  const clearNotifications = () => setNotifications([]);

  return { socket, notifications, liveExecutions, clearNotifications };
};
