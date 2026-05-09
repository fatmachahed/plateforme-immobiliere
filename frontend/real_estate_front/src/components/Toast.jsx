import { useState, useCallback, createContext, useContext } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3800);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <span className="toast__icon">{t.type === "success" ? "✓" : "✕"}</span>
            <span className="toast__msg">{t.msg}</span>
          </div>
        ))}
      </div>
      <style>{`
        .toast-container {
          position: fixed; bottom: 24px; right: 24px; z-index: 99999;
          display: flex; flex-direction: column; gap: 10px; pointer-events: none;
        }
        .toast {
          display: flex; align-items: center; gap: 11px;
          padding: 13px 18px; border-radius: 12px;
          font-size: 14px; font-weight: 500; min-width: 250px; max-width: 360px;
          box-shadow: 0 8px 30px rgba(0,0,0,.13);
          font-family: 'Inter', system-ui, sans-serif;
          animation: toastIn .28s cubic-bezier(.21,1.02,.73,1) forwards;
        }
        .toast--success { background: #f0fdf4; border: 1px solid #86efac; color: #15803d; }
        .toast--error   { background: #fef2f2; border: 1px solid #fca5a5; color: #b91c1c; }
        .toast__icon {
          width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 900; line-height: 1;
        }
        .toast--success .toast__icon { background: #22c55e; color: #fff; }
        .toast--error   .toast__icon { background: #ef4444; color: #fff; }
        .toast__msg { line-height: 1.4; }
        @keyframes toastIn {
          from { transform: translateX(60px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
