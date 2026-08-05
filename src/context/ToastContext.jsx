import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, AlertCircle } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const showError = useCallback((msg) => addToast(msg, 'error'), [addToast]);
  const showInfo = useCallback((msg) => addToast(msg, 'info'), [addToast]);
  const showWarning = useCallback((msg) => addToast(msg, 'warning'), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, showSuccess, showError, showInfo, showWarning }}>
      {children}
      
      {/* Floating Toast Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item toast-${toast.type}`}>
            <div style={{ marginTop: '2px' }}>
              {toast.type === 'success' && <CheckCircle2 size={18} style={{ color: '#10b981' }} />}
              {toast.type === 'error' && <AlertCircle size={18} style={{ color: '#ef4444' }} />}
              {toast.type === 'warning' && <AlertTriangle size={18} style={{ color: '#f59e0b' }} />}
              {toast.type === 'info' && <Info size={18} style={{ color: '#4f46e5' }} />}
            </div>
            
            <div style={{ flex: 1, wordBreak: 'break-word' }}>{toast.message}</div>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="btn btn-ghost btn-sm"
              style={{ padding: '2px', height: 'auto', minWidth: 'auto', color: '#94a3b8' }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
