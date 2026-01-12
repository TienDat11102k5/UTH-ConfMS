// src/pages/admin/RbacManagement.jsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import AdminLayout from "../../components/Layout/AdminLayout";
import Pagination from '../../components/Pagination';
import { usePagination } from '../../hooks/usePagination';
import apiClient from '../../apiClient';

const RbacManagement = () => {
  const { t } = useTranslation();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { currentPage, setCurrentPage, totalPages, paginatedItems } = usePagination(roles, 20);

  useEffect(() => { fetchRoles(); }, []);

  const fetchRoles = async () => {
    try { setLoading(true); const response = await apiClient.get('/roles'); setRoles(response.data); setError(null); }
    catch (err) { console.error('Error fetching roles:', err); setError(t('admin.rbac.loadError')); }
    finally { setLoading(false); }
  };

  const translateRoleName = (roleName) => {
    const translations = { 'ROLE_ADMIN': 'Admin', 'ROLE_CHAIR': 'Chair', 'ROLE_REVIEWER': 'Reviewer', 'ROLE_AUTHOR': 'Author' };
    return translations[roleName] || roleName;
  };

  const translatePermission = (permission) => {
    const key = `admin.rbac.permissions.${permission}`;
    const translated = t(key);
    return translated !== key ? translated : permission;
  };

  if (loading) {
    return (<AdminLayout title={t('admin.rbac.title')} subtitle={t('admin.rbac.subtitle')}><div style={{ padding: '2rem', textAlign: 'center' }}><p>{t('app.loading')}</p></div></AdminLayout>);
  }

  if (error) {
    return (<AdminLayout title={t('admin.rbac.title')} subtitle={t('admin.rbac.subtitle')}><div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}><p>{error}</p></div></AdminLayout>);
  }

  return (
    <AdminLayout title={t('admin.rbac.title')}>
      <div className="data-page-header"><div className="data-page-header-left"><div className="breadcrumb"></div></div></div>
      <div className="table-wrapper">
        <table className="simple-table">
          <thead>
            <tr>
              <th style={{ width: "120px" }}>{t('common.role')}</th>
              <th style={{ width: "140px" }}>{t('admin.rbac.userCount')}</th>
              <th>{t('admin.rbac.permissionsLabel')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((role) => (
              <tr key={role.id}>
                <td><strong>{translateRoleName(role.name)}</strong></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ padding: '0.25rem 0.6rem', borderRadius: '999px', background: '#e0e7ff', color: '#3730a3', fontSize: '0.85rem', fontWeight: 600, display: 'inline-block' }}>
                    {role.userCount} {t('admin.rbac.users')}
                  </span>
                </td>
                <td>
                  <div className="inline-actions" style={{ gap: '0.4rem', flexWrap: 'wrap' }}>
                    {role.permissions.map((p) => (<span key={p} className="badge-soft" style={{ fontSize: '0.8rem' }}>{translatePermission(p)}</span>))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {roles.length > 0 && (<Pagination currentPage={currentPage} totalPages={totalPages} totalItems={roles.length} itemsPerPage={20} onPageChange={setCurrentPage} itemName={t('common.role')} />)}
    </AdminLayout>
  );
};

export default RbacManagement;
