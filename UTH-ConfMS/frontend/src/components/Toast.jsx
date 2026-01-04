// src/components/Toast.jsx
import React, { useEffect } from "react";
import { toastStyles } from "./toastStyles";

/* =========================
   TOAST ICONS
   ========================= */
const getIcon = (type) => {
  switch (type) {
    case "success":
      return "✓";
    case "error":
      return "✕";
    case "warning":
      return "⚠";
    case "info":
      return "ℹ";
    default:
      return "✓";
  }
};

/* =========================
   TOAST COMPONENT
   ========================= */
const Toast = ({ message, type = "success", onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [onClose, duration]);

  return (
    <div 
      style={{ ...toastStyles.toast, ...toastStyles[type] }}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <span style={toastStyles.icon} aria-hidden="true">{getIcon(type)}</span>
      <span style={toastStyles.message}>{message}</span>
      <button 
        style={toastStyles.closeBtn} 
        onClick={onClose}
        aria-label="Đóng thông báo"
        title="Đóng"
      >
        ×
      </button>
    </div>
  );
};

/* =========================
   TOAST CONTAINER
   ========================= */
export const ToastContainer = ({ toasts, removeToast }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={toastStyles.container}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export { toastStyles };
export default Toast;
