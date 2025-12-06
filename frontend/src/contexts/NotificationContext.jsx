import { createContext, useState, useCallback } from 'react';
import NotificationContainer from '../components/shared/NotificationContainer';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showNotification = useCallback(({ 
    type = 'info', 
    title, 
    message, 
    duration = 5000, 
    action = null 
  }) => {
    const id = Date.now() + Math.random();
    const notification = { id, type, title, message, action };
    
    setNotifications(prev => [...prev, notification]);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, [removeNotification]);

  const showSuccess = useCallback((message, title = 'Success') => {
    return showNotification({ type: 'success', title, message });
  }, [showNotification]);

  const showError = useCallback((message, title = 'Error') => {
    return showNotification({ type: 'error', title, message, duration: 7000 });
  }, [showNotification]);

  const showWarning = useCallback((message, title = 'Warning') => {
    return showNotification({ type: 'warning', title, message });
  }, [showNotification]);

  const showInfo = useCallback((message, title = 'Info') => {
    return showNotification({ type: 'info', title, message });
  }, [showNotification]);

  const value = {
    notifications,
    showNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer
        notifications={notifications}
        onClose={removeNotification}
      />
    </NotificationContext.Provider>
  );
};
