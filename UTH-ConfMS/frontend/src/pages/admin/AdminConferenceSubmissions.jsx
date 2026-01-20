// src/pages/admin/AdminConferenceSubmissions.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../../apiClient";
import AdminLayout from "../../components/Layout/AdminLayout";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";
import { FiSearch } from "react-icons/fi";

const AdminConferenceSubmissions = () => {
  const { t } = useTranslation();
  const { conferenceId } = useParams();
  const navigate = useNavigate();
  
  const [conference, setConference] = useState(null);
  const [papers, setPapers] = useState([]);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { currentPage, setCurrentPage, totalPages, paginatedItems } = usePagination(filteredPapers, 20);

  useEffect(() => { fetchData(); }, [conferenceId]);

  useEffect(() => {
    let result = papers;

    // Filter by status
    if (statusFilter !== "ALL") {
      result = result.filter(p => p.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title?.toLowerCase().includes(query) ||
        p.mainAuthor?.fullName?.toLowerCase().includes(query) ||
        p.mainAuthor?.email?.toLowerCase().includes(query) ||
        p.track?.name?.toLowerCase().includes(query) ||
        p.abstractText?.toLowerCase().includes(query)
      );
    }

    setFilteredPapers(result);
    setCurrentPage(1);
  }, [papers, searchQuery, statusFilter, setCurrentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const confRes = await apiClient.get(`/conferences/${conferenceId}`);
      setConference(confRes.data);
      const papersRes = await apiClient.get(`/decisions/papers/${conferenceId}`);
      setPapers(papersRes.data || []);
    } catch (err) {
      console.error(err);
      setError(t('admin.conferenceSubmissions.loadError'));
    } finally { setLoading(false); }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      SUBMITTED: { label: t('status.submitted').toUpperCase(), class: "badge badge-info" },
      UNDER_REVIEW: { label: t('status.underReview').toUpperCase(), class: "badge badge-warning" },
      ACCEPTED: { label: t('status.accepted').toUpperCase(), class: "badge badge-success" },
      REJECTED: { label: t('status.rejected').toUpperCase(), class: "badge badge-danger" },
      WITHDRAWN: { label: t('status.withdrawn').toUpperCase(), class: "badge badge-secondary" },
    };
    const info = statusMap[status] || { label: status, class: "badge badge-secondary" };
    return <span className={info.class} style={{ minWidth: "90px", display: "inline-block", textAlign: "center" }}>{info.label}</span>;
  };

  const getTrackName = (paper) => paper.track?.name || t('admin.conferenceSubmissions.noTrack');
  const getAuthorInfo = (paper) => {
    if (!paper.mainAuthor) return { name: t('admin.conferenceSubmissions.noAuthor'), coAuthorCount: 0 };
    const coAuthorCount = paper.coAuthors?.length || 0;
    return { name: paper.mainAuthor.fullName || paper.mainAuthor.email, coAuthorCount };
  };

  const stats = {
    total: filteredPapers.length,
    submitted: filteredPapers.filter(p => p.status === 'SUBMITTED').length,
    underReview: filteredPapers.filter(p => p.status === 'UNDER_REVIEW').length,
    accepted: filteredPapers.filter(p => p.status === 'ACCEPTED').length,
    rejected: filteredPapers.filter(p => p.status === 'REJECTED').length,
    withdrawn: filteredPapers.filter(p => p.status === 'WITHDRAWN').length,
  };

  return (
    <AdminLayout title={t('admin.conferenceSubmissions.title')} subtitle={t('admin.conferenceSubmissions.subtitle')}>
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-link" onClick={() => navigate("/admin/conferences")} style={{ cursor: "pointer" }}>{t('admin.conferences.title')}</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{t('admin.conferenceSubmissions.submissions')}</span>
          </div>
          <h2 className="data-page-title">{conference ? conference.name : t('app.loading')}</h2>
        </div>
        <div className="data-page-header-right">
          <button className="btn-secondary" type="button" onClick={fetchData}>{t('app.refresh')}</button>
          <button className="btn-secondary" type="button" onClick={() => navigate("/admin/conferences")}>{t('app.back')}</button>
        </div>
      </div>

      {/* Search and Filter */}
      {!loading && !error && papers.length > 0 && (
        <div style={{
          marginBottom: "1.5rem",
          background: "white",
          borderRadius: "10px",
          padding: "1rem 1.25rem",
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e2e8f0",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
            {/* Search */}
            <div>
              <label style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 600,
                color: "#64748b",
                fontSize: "0.875rem",
              }}>
                {t('app.search')}:
              </label>
              <div style={{ position: "relative" }}>
                <FiSearch style={{
                  position: "absolute",
                  left: "0.875rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                  width: "16px",
                  height: "16px"
                }} />
                <input
                  type="text"
                  placeholder="Tìm theo tiêu đề, tác giả, track, tóm tắt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.875rem 0.5rem 2.5rem",
                    borderRadius: "8px",
                    border: "1.5px solid #e2e8f0",
                    fontSize: "0.8125rem",
                    background: "white",
                    color: "#475569",
                  }}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 600,
                color: "#64748b",
                fontSize: "0.875rem",
              }}>
                {t('app.filter')}:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.875rem",
                  borderRadius: "8px",
                  border: "1.5px solid #e2e8f0",
                  fontSize: "0.8125rem",
                  background: "white",
                  color: "#475569",
                }}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="SUBMITTED">Đã nộp</option>
                <option value="UNDER_REVIEW">Đang đánh giá</option>
                <option value="ACCEPTED">Chấp nhận</option>
                <option value="REJECTED">Từ chối</option>
                <option value="WITHDRAWN">Đã rút</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && papers.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", borderRadius: "12px", padding: "1.25rem", color: "white" }}>
            <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>{t('admin.conferenceSubmissions.total')}</div>
            <div style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.total}</div>
          </div>
          <div style={{ background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)", borderRadius: "12px", padding: "1.25rem", color: "white" }}>
            <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>{t('status.submitted')}</div>
            <div style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.submitted}</div>
          </div>
          <div style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", borderRadius: "12px", padding: "1.25rem", color: "white" }}>
            <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>{t('status.underReview')}</div>
            <div style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.underReview}</div>
          </div>
          <div style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", borderRadius: "12px", padding: "1.25rem", color: "white" }}>
            <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>{t('status.accepted')}</div>
            <div style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.accepted}</div>
          </div>
          <div style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", borderRadius: "12px", padding: "1.25rem", color: "white" }}>
            <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>{t('status.rejected')}</div>
            <div style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.rejected}</div>
          </div>
          <div style={{ background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)", borderRadius: "12px", padding: "1.25rem", color: "white" }}>
            <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>{t('status.withdrawn')}</div>
            <div style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.withdrawn}</div>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table className="simple-table">
          <thead>
            <tr>
              <th style={{ width: "60px" }}>ID</th>
              <th>{t('admin.conferenceSubmissions.paperTitle')}</th>
              <th style={{ width: "120px" }}>{t('common.track')}</th>
              <th style={{ width: "150px" }}>{t('common.author')}</th>
              <th style={{ width: "110px" }}>{t('admin.conferenceSubmissions.submittedDate')}</th>
              <th style={{ width: "120px", whiteSpace: "nowrap" }}>{t('common.status')}</th>
              <th style={{ width: "130px", whiteSpace: "nowrap" }}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="table-empty">{t('app.loading')}</td></tr>
            ) : error ? (
              <tr><td colSpan={7} className="table-empty" style={{ color: "#d72d2d" }}>{error}</td></tr>
            ) : filteredPapers.length === 0 ? (
              <tr><td colSpan={7} className="table-empty">
                {searchQuery || statusFilter !== "ALL" ? "Không tìm thấy kết quả phù hợp" : t('admin.conferenceSubmissions.noPapers')}
              </td></tr>
            ) : (
              paginatedItems.map((paper) => {
                const authorInfo = getAuthorInfo(paper);
                return (
                  <tr key={paper.id}>
                    <td>{paper.id}</td>
                    <td>
                      <strong>{paper.title}</strong>
                      {paper.abstractText && (<div style={{ fontSize: "0.85em", color: "#666", marginTop: "0.25rem", maxWidth: "400px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{paper.abstractText}</div>)}
                    </td>
                    <td>{getTrackName(paper)}</td>
                    <td>
                      <div>
                        <div>{authorInfo.name}</div>
                        {authorInfo.coAuthorCount > 0 && (<div style={{ fontSize: "0.85em", color: "#666" }}>+{authorInfo.coAuthorCount} {t('admin.conferenceSubmissions.coAuthors')}</div>)}
                      </div>
                    </td>
                    <td>{paper.createdAt ? new Date(paper.createdAt).toLocaleDateString() : "—"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{getStatusBadge(paper.status)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button className="btn-primary table-action" type="button" onClick={() => navigate(`/author/submissions/${paper.id}`)}>{t('app.details')}</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && filteredPapers.length > 0 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredPapers.length} itemsPerPage={20} onPageChange={setCurrentPage} itemName={t('admin.conferenceSubmissions.submissions')} />
      )}
    </AdminLayout>
  );
};

export default AdminConferenceSubmissions;