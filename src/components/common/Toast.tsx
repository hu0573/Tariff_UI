// Toast notification component
import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose?: () => void;
  duration?: number; // Duration in milliseconds, 0 means don't auto-close
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
  };

  const iconStyles = {
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-blue-400',
    warning: 'text-amber-400',
  };

  const icons = {
    success: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border min-w-[300px] max-w-[500px] ${typeStyles[type]} animate-in slide-in-from-top-5`}
      role="alert"
    >
      <div className={iconStyles[type]}>
        {icons[type]}
      </div>
      <p className="flex-1 text-sm font-medium">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 focus:outline-none"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};

// Toast container for managing multiple toasts
interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

let toastState: ToastState[] = [];
let listeners: Array<() => void> = [];

export const toastManager = {
  success: (message: string) => {
    const id = Date.now().toString();
    toastState = [...toastState, { id, message, type: 'success' }];
    listeners.forEach(listener => listener());
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      toastState = toastState.filter(t => t.id !== id);
      listeners.forEach(listener => listener());
    }, 3000);
  },
  error: (message: string) => {
    const id = Date.now().toString();
    toastState = [...toastState, { id, message, type: 'error' }];
    listeners.forEach(listener => listener());
    
    // Auto remove after 5 seconds (errors stay longer)
    setTimeout(() => {
      toastState = toastState.filter(t => t.id !== id);
      listeners.forEach(listener => listener());
    }, 5000);
  },
  info: (message: string) => {
    const id = Date.now().toString();
    toastState = [...toastState, { id, message, type: 'info' }];
    listeners.forEach(listener => listener());
    
    setTimeout(() => {
      toastState = toastState.filter(t => t.id !== id);
      listeners.forEach(listener => listener());
    }, 3000);
  },
  warning: (message: string) => {
    const id = Date.now().toString();
    toastState = [...toastState, { id, message, type: 'warning' }];
    listeners.forEach(listener => listener());
    
    setTimeout(() => {
      toastState = toastState.filter(t => t.id !== id);
      listeners.forEach(listener => listener());
    }, 4000);
  },
};

export const ToastContainer: React.FC = () => {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  React.useEffect(() => {
    const listener = () => forceUpdate();
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toastState.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => {
            toastState = toastState.filter(t => t.id !== toast.id);
            listeners.forEach(listener => listener());
          }}
          duration={0} // Manual close only for stacked toasts
        />
      ))}
    </div>
  );
};
