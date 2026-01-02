// src/components/Layout/AdminSidebar.jsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    FiHome,
    FiUsers,
    FiCalendar,
    FiShield,
    FiMail,
    FiCpu,
    FiDatabase,
    FiFileText,
    FiClock,
    FiMenu,
    FiX,
    FiChevronLeft,
    FiChevronRight,
} from "react-icons/fi";

const AdminSidebar = () => {
    const location = useLocation();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false); // Desktop collapse state

    const menuItems = [
        {
            path: "/admin/dashboard",
            icon: <FiHome />,
            label: "TỔNG QUAN",
            title: "Dashboard Overview",
        },
        {
            path: "/admin/users",
            icon: <FiUsers />,
            label: "NGƯỜI DÙNG",
            title: "Quản lý Người dùng",
        },
        {
            path: "/admin/conferences",
            icon: <FiCalendar />,
            label: "HỘI NGHỊ",
            title: "Quản lý Hội nghị",
        },
        {
            path: "/admin/rbac",
            icon: <FiShield />,
            label: "RBAC",
            title: "Phân quyền & RBAC",
        },
        {
            path: "/admin/email-settings",
            icon: <FiMail />,
            label: "EMAIL",
            title: "Cấu hình Email",
        },
        {
            path: "/admin/ai-governance",
            icon: <FiCpu />,
            label: "AI GOVERNANCE",
            title: "Quản lý AI",
        },
        {
            path: "/admin/backups",
            icon: <FiDatabase />,
            label: "BACKUP",
            title: "Backup & Restore",
        },
        {
            path: "/admin/logs",
            icon: <FiFileText />,
            label: "AUDIT LOGS",
            title: "Nhật ký Hệ thống",
        },
    ];

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + "/");
    };

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                className="sidebar-toggle-btn"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                aria-label="Toggle Sidebar"
            >
                {isMobileOpen ? <FiX /> : <FiMenu />}
            </button>

            {/* Sidebar */}
            <aside className={`admin-sidebar ${isMobileOpen ? "mobile-open" : ""} ${isCollapsed ? "collapsed" : ""}`}>
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="brand-icon">A</div>
                        {!isCollapsed && (
                            <div className="brand-text">
                                <h2>ADMIN PANEL</h2>
                                <p>UTH-CONFMS</p>
                            </div>
                        )}
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`sidebar-item ${isActive(item.path) ? "active" : ""}`}
                            title={isCollapsed ? item.title : ""}
                            onClick={() => setIsMobileOpen(false)}
                        >
                            <span className="sidebar-icon">{item.icon}</span>
                            {!isCollapsed && <span className="sidebar-label">{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                {/* Desktop Collapse Toggle Button */}
                <button
                    className="sidebar-collapse-btn"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    title={isCollapsed ? "Mở rộng" : "Thu gọn"}
                >
                    {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
                </button>
            </aside>

            {/* Overlay for mobile */}
            {isMobileOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
        </>
    );
};

export default AdminSidebar;
