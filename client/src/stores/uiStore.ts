import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface UIState {
  isLoading: boolean;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  }>;
  modal: {
    isOpen: boolean;
    type: string | null;
    data: unknown;
  };
  setLoading: (loading: boolean) => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  openModal: (type: string, data?: unknown) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()(
  subscribeWithSelector((set, get) => ({
    isLoading: false,
    notifications: [],
    modal: {
      isOpen: false,
      type: null,
      data: null,
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },

    addNotification: notification => {
      const id = Date.now().toString();
      const newNotification = { ...notification, id };

      set(state => ({
        notifications: [...state.notifications, newNotification],
      }));

      // Auto-remove notification after duration (default 5 seconds)
      const duration = notification.duration || 5000;
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    },

    removeNotification: (id: string) => {
      set(state => ({
        notifications: state.notifications.filter(n => n.id !== id),
      }));
    },

    clearNotifications: () => {
      set({ notifications: [] });
    },

    openModal: (type: string, data?: unknown) => {
      set({
        modal: {
          isOpen: true,
          type,
          data,
        },
      });
    },

    closeModal: () => {
      set({
        modal: {
          isOpen: false,
          type: null,
          data: null,
        },
      });
    },
  })),
);
