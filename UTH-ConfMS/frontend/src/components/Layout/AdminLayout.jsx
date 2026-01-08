// src/components/Layout/AdminLayout.jsx
import React from "react";
import DashboardLayout from "./DashboardLayout";
import AdminSidebar from "./AdminSidebar";

/**
 * Wrapper component for admin pages with sidebar
 */
const AdminLayout = ({ title, subtitle, children }) => {
    return (
        <DashboardLayout
            roleLabel="Admin"
            title={title}
            subtitle={subtitle}
            showSidebar={true}
            sidebarContent={<AdminSidebar />}
            showAdminNav={true}
        >
            {children}
        </DashboardLayout>
    );
};

export default AdminLayout;
