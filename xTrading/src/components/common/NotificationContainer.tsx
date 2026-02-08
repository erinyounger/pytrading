import React, { createContext, useContext, useState, useCallback } from 'react';
import Notification, { NotificationProps } from './Notification';
import { createPortal } from 'react-dom';

interface NotificationContextType {
  addNotification: (notification: Omit<NotificationProps, 'id' | 'onClose'>) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const addNotification = useCallback(
    (notification: Omit<NotificationProps, 'id' | 'onClose'>) => {
      const id = Math.random().toString(36).substr(2, 9);
      setNotifications((prev) => [...prev, { ...notification, id, onClose: removeNotification }]);
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      <NotificationContainer notifications={notifications} />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

const NotificationContainer: React.FC<{ notifications: NotificationProps[] }> = ({
  notifications,
}) => {
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <Notification key={notification.id} {...notification} />
      ))}
    </div>,
    document.body
  );
};

export default NotificationContainer;
