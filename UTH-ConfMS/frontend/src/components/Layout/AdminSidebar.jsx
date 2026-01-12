// src/components/Layout/AdminSidebar.jsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    FiHome,
    FiUsers,
    FiCalendar,
    FiShield,
    FiMail,
    FiCpu,
    FiDatabase,
    FiFileText,
    FiChevronLeft,
    FiChevronRight,
    FiMenu,
    FiX,
} from "react-icons/fi";

const AdminSidebar = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const menuItems = [
        { path: "/admin/dashboard", icon: <FiHome />, label: t('admin.sidebar.dashboard'), title: t('admin.sidebar.dashboardTitle') },
        { path: "/admin/users", icon: <FiUsers />, label: t('admin.sidebar.users'), title: t('admin.sidebar.usersTitle') },
        { path: "/admin/conferences", icon: <FiCalendar />, label: t('admin.sidebar.conferences'), title: t('admin.sidebar.conferencesTitle') },
        { path: "/admin/rbac", icon: <FiShield />, label: t('admin.sidebar.rbac'), title: t('admin.sidebar.rbacTitle') },
        { path: "/admin/email-settings", icon: <FiMail />, label: t('admin.sidebar.email'), title: t('admin.sidebar.emailTitle') },
        { path: "/admin/ai-governance", icon: <FiCpu />, label: t('admin.sidebar.aiGovernance'), title: t('admin.sidebar.aiGovernanceTitle') },
        { path: "/admin/backups", icon: <FiDatabase />, label: t('admin.sidebar.backup'), title: t('admin.sidebar.backupTitle') },
        { path: "/admin/logs", icon: <FiFileText />, label: t('admin.sidebar.auditLogs'), title: t('admin.sidebar.auditLogsTitle') },
    ];

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

    return (
        <>
            <button className="sidebar-toggle-btn" onClick={() => setIsMobileOpen(!isMobileOpen)} aria-label="Toggle Sidebar">
                {isMobileOpen ? <FiX /> : <FiMenu />}
            </button>

            <aside className={`admin-sidebar ${isMobileOpen ? "mobile-open" : ""} ${isCollapsed ? "collapsed" : ""}`}>
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="brand-icon">A</div>
                        {!isCollapsed && (
                            <div className="brand-text">
                                <h2>{t('admin.sidebar.adminPanel')}</h2>
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

                <button
                    className="sidebar-collapse-btn"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    title={isCollapsed ? t('admin.sidebar.expand') : t('admin.sidebar.collapse')}
                >
                    {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
                </button>
            </aside>

            {isMobileOpen && (
                <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)} />
            )}
        </>
    );
};

export default AdminSidebar;
