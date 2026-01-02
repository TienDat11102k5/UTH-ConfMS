// src/components/UserProfileDropdown.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, clearAuth } from "../auth";
import "../styles/UserProfileDropdown.css";

const UserProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const user = getCurrentUser();

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    setIsOpen(false);
    clearAuth();
    
    // Chuyển về trang login với thông báo đăng xuất thành công
    navigate("/login", { 
      replace: true, 
      state: { logoutSuccess: true } 
    });
  };

  if (!user) {
    return null;
  }

  // Lấy thông tin hiển thị
  const displayName = user.fullName || user.name || user.email || "User";
  const userEmail = user.email || "";
  const userAvatar = user.photoURL || user.avatarUrl || user.avatar || null;
  const userRole = user.role || user.primaryRole || "";

  // Xác định dashboard path dựa trên role
  const getDashboardPath = () => {
    if (!userRole) return "/author/dashboard";
    
    const role = userRole.toUpperCase();
    
    if (role.includes("ADMIN")) {
      return "/admin/dashboard";
    }
    if (role.includes("CHAIR")) {
      return "/chair";
    }
    if (role.includes("REVIEWER") || role.includes("PC")) {
      return "/reviewer";
    }
    
    return "/author/dashboard"; // Default for AUTHOR or other roles
  };

  // Tạo avatar initials nếu không có ảnh
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="user-profile-dropdown" ref={dropdownRef}>
      <button
        className="profile-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
      >
        {userAvatar ? (
          <img src={userAvatar} alt={displayName} className="profile-avatar" />
        ) : (
          <div className="profile-avatar-placeholder">
            {getInitials(displayName)}
          </div>
        )}
        <span className="profile-name">{displayName}</span>
        <svg
          className={`dropdown-arrow ${isOpen ? "open" : ""}`}
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
        >
          <path
            d="M1 1.5L6 6.5L11 1.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            <div className="dropdown-user-info">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={displayName}
                  className="dropdown-avatar"
                />
              ) : (
                <div className="dropdown-avatar-placeholder">
                  {getInitials(displayName)}
                </div>
              )}
              <div className="dropdown-user-details">
                <div className="dropdown-user-name">{displayName}</div>
                <div className="dropdown-user-email">{userEmail}</div>
                {userRole && (
                  <div className="dropdown-user-role">
                    {userRole.replace("ROLE_", "")}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="dropdown-divider"></div>

          <Link
            to={getDashboardPath()}
            className="dropdown-item"
            onClick={() => setIsOpen(false)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M6.5 14.5V9.5H9.5V14.5H13V8H15.5L8 1L0.5 8H3V14.5H6.5Z"
                fill="currentColor"
              />
            </svg>
            Trang quản lý
          </Link>

          <Link
            to="/profile"
            className="dropdown-item"
            onClick={() => setIsOpen(false)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 8C10.21 8 12 6.21 12 4C12 1.79 10.21 0 8 0C5.79 0 4 1.79 4 4C4 6.21 5.79 8 8 8ZM8 10C5.33 10 0 11.34 0 14V16H16V14C16 11.34 10.67 10 8 10Z"
                fill="currentColor"
              />
            </svg>
            Thông tin cá nhân
          </Link>

          <Link
            to="/settings"
            className="dropdown-item"
            onClick={() => setIsOpen(false)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M13.5 8C13.5 8.17 13.49 8.34 13.47 8.51L15.12 9.77C15.26 9.88 15.3 10.07 15.22 10.24L13.65 13.03C13.57 13.2 13.39 13.26 13.22 13.2L11.27 12.43C10.89 12.72 10.47 12.96 10.02 13.14L9.72 15.23C9.69 15.41 9.54 15.55 9.35 15.55H6.22C6.03 15.55 5.88 15.41 5.85 15.23L5.55 13.14C5.1 12.96 4.68 12.72 4.3 12.43L2.35 13.2C2.18 13.26 2 13.2 1.92 13.03L0.35 10.24C0.27 10.07 0.31 9.88 0.45 9.77L2.1 8.51C2.08 8.34 2.07 8.17 2.07 8C2.07 7.83 2.08 7.66 2.1 7.49L0.45 6.23C0.31 6.12 0.27 5.93 0.35 5.76L1.92 2.97C2 2.8 2.18 2.74 2.35 2.8L4.3 3.57C4.68 3.28 5.1 3.04 5.55 2.86L5.85 0.77C5.88 0.59 6.03 0.45 6.22 0.45H9.35C9.54 0.45 9.69 0.59 9.72 0.77L10.02 2.86C10.47 3.04 10.89 3.28 11.27 3.57L13.22 2.8C13.39 2.74 13.57 2.8 13.65 2.97L15.22 5.76C15.3 5.93 15.26 6.12 15.12 6.23L13.47 7.49C13.49 7.66 13.5 7.83 13.5 8ZM7.78 5.5C6.4 5.5 5.28 6.62 5.28 8C5.28 9.38 6.4 10.5 7.78 10.5C9.16 10.5 10.28 9.38 10.28 8C10.28 6.62 9.16 5.5 7.78 5.5Z"
                fill="currentColor"
              />
            </svg>
            Cài đặt
          </Link>

          <Link
            to="/history"
            className="dropdown-item"
            onClick={() => setIsOpen(false)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 0C6.41775 0 4.87103 0.469192 3.55544 1.34824C2.23985 2.22729 1.21447 3.47672 0.608967 4.93853C0.00346629 6.40034 -0.15496 8.00887 0.153721 9.56072C0.462403 11.1126 1.22433 12.538 2.34315 13.6569C3.46197 14.7757 4.88743 15.5376 6.43928 15.8463C7.99113 16.155 9.59966 15.9965 11.0615 15.391C12.5233 14.7855 13.7727 13.7602 14.6518 12.4446C15.5308 11.129 16 9.58225 16 8C16 5.87827 15.1571 3.84344 13.6569 2.34315C12.1566 0.842855 10.1217 0 8 0ZM8 14C6.81331 14 5.65328 13.6481 4.66658 12.9888C3.67989 12.3295 2.91085 11.3925 2.45673 10.2961C2.0026 9.19974 1.88378 7.99334 2.11529 6.82946C2.3468 5.66557 2.91825 4.59647 3.75736 3.75736C4.59648 2.91824 5.66558 2.3468 6.82946 2.11529C7.99335 1.88378 9.19975 2.0026 10.2961 2.45672C11.3925 2.91085 12.3295 3.67988 12.9888 4.66658C13.6481 5.65327 14 6.81331 14 8C14 9.5913 13.3679 11.1174 12.2426 12.2426C11.1174 13.3679 9.5913 14 8 14ZM11 7H9V4C9 3.73478 8.89464 3.48043 8.70711 3.29289C8.51957 3.10536 8.26522 3 8 3C7.73478 3 7.48043 3.10536 7.29289 3.29289C7.10536 3.48043 7 3.73478 7 4V8C7 8.26522 7.10536 8.51957 7.29289 8.70711C7.48043 8.89464 7.73478 9 8 9H11C11.2652 9 11.5196 8.89464 11.7071 8.70711C11.8946 8.51957 12 8.26522 12 8C12 7.73478 11.8946 7.48043 11.7071 7.29289C11.5196 7.10536 11.2652 7 11 7Z"
                fill="currentColor"
              />
            </svg>
            Lịch sử hoạt động
          </Link>

          <div className="dropdown-divider"></div>

          <button className="dropdown-item" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M6 14H3C2.73478 14 2.48043 13.8946 2.29289 13.7071C2.10536 13.5196 2 13.2652 2 13V3C2 2.73478 2.10536 2.48043 2.29289 2.29289C2.48043 2.10536 2.73478 2 3 2H6M11 11L14 8L11 5M14 8H6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;
