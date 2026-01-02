// src/components/toastStyles.js
// Toast styles matching website design (teal theme)

export const toastStyles = {
  container: {
    position: "fixed",
    top: "24px",
    right: "24px",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  toast: {
    padding: "16px 20px",
    borderRadius: "25px",
    boxShadow: "0 4px 20px rgba(13, 148, 136, 0.3)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    animation: "toastSlideIn 0.4s ease-out",
    minWidth: "280px",
    maxWidth: "380px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  success: {
    background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
    color: "white",
  },
  error: {
    background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
    color: "white",
  },
  warning: {
    background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
    color: "white",
  },
  info: {
    background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
    color: "white",
  },
  icon: {
    fontSize: "18px",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  message: {
    flex: 1,
    fontSize: "14px",
    fontWeight: "600",
    letterSpacing: "0.3px",
  },
  closeBtn: {
    background: "rgba(255, 255, 255, 0.2)",
    border: "none",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px 8px",
    borderRadius: "50%",
    opacity: 0.9,
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
  },
};

// Inject keyframes once
if (typeof document !== "undefined" && !document.querySelector("#toast-keyframes-global")) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "toast-keyframes-global";
  styleSheet.textContent = `
    @keyframes toastSlideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(styleSheet);
}
