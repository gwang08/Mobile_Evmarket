import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast, { ToastType } from '../components/Toast';

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const [duration, setDuration] = useState(3000);

  const showToast = (msg: string, toastType: ToastType, toastDuration = 3000) => {
    setMessage(msg);
    setType(toastType);
    setDuration(toastDuration);
    setVisible(true);
  };

  const showSuccess = (msg: string, toastDuration = 3000) => {
    showToast(msg, 'success', toastDuration);
  };

  const showError = (msg: string, toastDuration = 3000) => {
    showToast(msg, 'error', toastDuration);
  };

  const showWarning = (msg: string, toastDuration = 3000) => {
    showToast(msg, 'warning', toastDuration);
  };

  const showInfo = (msg: string, toastDuration = 3000) => {
    showToast(msg, 'info', toastDuration);
  };

  const hideToast = () => {
    setVisible(false);
  };

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
      <Toast
        message={message}
        type={type}
        visible={visible}
        onHide={hideToast}
        duration={duration}
      />
    </ToastContext.Provider>
  );
};
