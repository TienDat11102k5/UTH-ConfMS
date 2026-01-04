// src/components/EmptyState.jsx
import React from "react";
import { FiInbox, FiFileText, FiAlertCircle, FiSearch, FiCheckCircle } from "react-icons/fi";
import "../styles/EmptyState.css";

const iconMap = {
  inbox: FiInbox,
  file: FiFileText,
  alert: FiAlertCircle,
  search: FiSearch,
  check: FiCheckCircle,
};

/**
 * EmptyState component - Hiển thị khi không có dữ liệu
 * @param {String} icon - Icon type: inbox, file, alert, search, check
 * @param {String} title - Tiêu đề chính
 * @param {String} description - Mô tả chi tiết
 * @param {ReactNode} action - Button hoặc action element
 * @param {String} size - Kích thước: small, medium, large
 */
const EmptyState = ({ 
  icon = "inbox", 
  title = "Không có dữ liệu",
  description = "",
  action = null,
  size = "medium"
}) => {
  const IconComponent = iconMap[icon] || FiInbox;

  return (
    <div className={`empty-state empty-state-${size}`}>
      <div className="empty-state-icon">
        <IconComponent />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && (
        <p className="empty-state-description">{description}</p>
      )}
      {action && (
        <div className="empty-state-action">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
