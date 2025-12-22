import React, { useEffect } from "react";

export default function FloatingMessage({ message, type = "success" }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      document.getElementById("floating-message").remove();
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div id="floating-message" className={`floating-message message-${type}`}>
      <div className="message-content">
        <i className={`fas ${
          type === "error" ? "fa-times-circle error-icon" :
          type === "warning" ? "fa-exclamation-triangle warning-icon" :
          type === "info" ? "fa-info-circle info-icon" :
          "fa-check-circle check-icon"
        }`}></i>
        <span>{message}</span>
      </div>
    </div>
  );
}
