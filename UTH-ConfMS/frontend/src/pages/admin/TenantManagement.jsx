// src/pages/admin/TenantManagement.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import AdminLayout from "../../components/Layout/AdminLayout";
import Pagination from '../../components/Pagination';
import { usePagination } from '../../hooks/usePagination';
import apiClient from "../../apiClient";
import { ToastContainer } from "../../components/Toast";

const TenantManagement = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = "success") => { const id = Date.now(); setToasts((prev) => [...prev, { id, message, type }]); }, []);
  const removeToast = useCallback((id) => { setToasts((prev) => prev.filter((t) => t.id !== id)); }, []);

  const fetchUsers = async () => {
    try { setLoading(true); const res = await apiClient.get("/admin/users"); setUsers(res.data || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter((u) => u.name?.toLowerCase().includes(keyword.toLowerCase()) || u.email?.toLowerCase().includes(keyword.toLowerCase()));
  const { currentPage, setCurrentPage, totalPages, paginatedItems: paginatedUsers } = usePagination(filtered, 20);

  return (
    <AdminLayout title={t('admin.users.title')}>
      <div className="data-page-header">
        <div className="data-page-header-left"><div className="breadcrumb"></div></div>
        <div className="data-page-header-right">
          <input type="text" placeholder={t('admin.tenant.searchPlaceholder')} value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ padding: "0.65rem 0.9rem", borderRadius: "10px", border: "1px solid #e5e7eb", minWidth: "220px" }} />
          <button className="btn-primary" type="button" onClick={() => navigate("/admin/users/create")}>+ {t('admin.tenant.createAccount')}</button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="simple-table">
          <thead>
            <tr>
              <th style={{ width: "60px" }}>ID</th>
              <th>{t('common.name')}</th>
              <th>{t('common.email')}</th>
              <th>{t('common.role')}</th>
              <th>{t('common.status')}</th>
              <th style={{ width: "120px" }}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (<tr><td colSpan={6} className="table-empty">{t('app.loading')}</td></tr>)
              : paginatedUsers.length === 0 ? (<tr><td colSpan={6} className="table-empty">{t('admin.tenant.noResults')}</td></tr>)
              : (paginatedUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td><span className="badge-soft">{u.status === "Active" ? t('status.active') : t('admin.userEdit.disabled')}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button onClick={() => navigate(`/admin/users/${u.id}/edit`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }} title={t('app.edit')}><FiEdit2 size={18} color="#2563eb" /></button>
                      <button onClick={async () => { if (!window.confirm(t('admin.tenant.confirmDelete'))) return; try { await apiClient.delete(`/admin/users/${u.id}`); setUsers((s) => s.filter((x) => x.id !== u.id)); } catch (err) { console.error(err); addToast(t('admin.tenant.deleteFailed'), "error"); } }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }} title={t('app.delete')}><FiTrash2 size={18} color="#dc2626" /></button>
                    </div>
                  </td>
                </tr>
              )))}
          </tbody>
        </table>
      </div>

      {!loading && filtered.length > 0 && (<Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={20} onPageChange={setCurrentPage} itemName={t('admin.users.users')} />)}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AdminLayout>
  );
};

export default TenantManagement;
