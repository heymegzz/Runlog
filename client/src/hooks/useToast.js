import { create } from 'zustand';

// Use zustand for simple global toast state so we can call it from anywhere
export const useToastStore = create((set) => ({
  toast: null,
  showToast: (toast) => {
    set({ toast });
    if (toast) {
      setTimeout(() => {
        set({ toast: null });
      }, 4000);
    }
  },
  hideToast: () => set({ toast: null })
}));

export const useToast = () => {
  const { toast, showToast, hideToast } = useToastStore();
  return { toast, showToast, hideToast };
};
