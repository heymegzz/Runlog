import { create } from 'zustand';
import { authApi } from '../api/auth.api';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(credentials);
      const { user, accessToken } = response.data;
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('activeWorkspace', user.activeWorkspace);

      set({
        user,
        token: accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (error) {
      set({ error: error.message || 'Login failed', isLoading: false });
      return false;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register(data);
      const { user, accessToken } = response.data;
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('activeWorkspace', user.activeWorkspace);

      set({
        user,
        token: accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (error) {
      set({ error: error.message || 'Registration failed', isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('activeWorkspace');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));
