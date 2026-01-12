import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import AdminLayout from "../../components/Layout/AdminLayout";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";

const AdminConferenceSubmissions = () => {
  const { conferenceId } = useParams();
  const navigate = useNavigate();
  
  const [conference, setConference] = useState(null);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { currentPage, setCurrentPage, totalPages, paginatedItems } =
    usePagination(papers, 20);

  useEffect(() => {
    fetchData();
  }, [conferenceId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Fetch conference info
      const confRes = await apiClient.get(`/conferences/${conferenceId}`);
      setConference(confRes.data);
      
      // Fetch all papers for this conference
      const papersRes = await apiClient.get(`/decisions/papers/${conferenceId}`);
      setPapers(papersRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      SUBMITTED: { label: "ĐÃ NỘP", class: "badge badge-info" },
      UNDER_REVIEW: { label: "ĐANG REVIEW", class: "badge badge-warning" },
      ACCEPTED: { label: "CHẤP NHẬN", class: "badge badge-success" },
      REJECTED: { label: "TỪ CHỐI", class: "badge badge-danger" },
      WITHDRAWN: { label: "ĐÃ RÚT", class: "badge badge-secondary" },
    };
    const info = statusMap[status] || { label: status, class: "badge badge-secondary" };
    return <span className={info.class} style={{ minWidth: "90px", display: "inline-block", textAlign: "center" }}>{info.label}</span>;
  };

  const getTrackName = (paper) => {
    return paper.track?.name || "Chưa có track";
  };

  const getAuthorInfo = (paper) => {
    if (!paper.mainAuthor) {
      return { name: "Chưa có", coAuthorCount: 0 };
    }
    const coAuthorCount = paper.coAuthors?.length || 0;
    return {
      name: paper.mainAuthor.fullName || paper.mainAuthor.email,
      coAuthorCount: coAuthorCount,
    };
  };

  // Calculate stats
  const stats = {
    total: papers.length,
    submitted: papers.filter(p => p.status === 'SUBMITTED').length,
    underReview: papers.filter(p => p.status === 'UNDER_REVIEW').length,
    accepted: papers.filter(p => p.status === 'ACCEPTED').length,
    rejected: papers.filter(p => p.status === 'REJECTED').length,
    withdrawn: papers.filter(p => p.status === 'WITHDRAWN').length,
  };

  return (
    <AdminLayout
      title="Bài nộp của hội nghị"
      subtitle="Xem toàn bộ bài báo đã nộp vào hội nghị"
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span
              className="breadcrumb-link"
              onClick={() => navigate("/admin/conferences")}
              style={{ cursor: "pointer" }}
            >
              Hội nghị
            </span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Bài nộp</span>
          </div>
          <h2 className="data-page-title">
            {conference ? conference.name : "Đang tải..."}
          </h2>
        </div>

        <div className="data-page-header-right">
          <button className="btn-secondary" type="button" onClick={fetchData}>
            Làm mới
          </button>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => navigate("/admin/conferences")}
          >
            Quay lại
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {!loading && !error && papers.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem"
        }}>
          <div style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            borderRadius: "12px",
            padding: "1.25rem",
            color: "white"
          }}>
            <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>Tổng số bài</div>
            <div style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.total}</div>
          </div>
          <div style={{
            background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
            borderRadius: "12px",
            padding: "1.25rem",
            color: "white"
          }}>
            <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>Đã nộp</div>
            <div style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.submitted}</div>
          </div>
          <div style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            borderRadius: "12px",
            padding: "1.25rem",
            color: "white"
          }}>
            <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>Đang chấm</div>
            <div style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.underReview}</div>
          </div>
          <div style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            borderRadius: "12px",
            padding: "1.25rem",
            color: "white"
          }}>
            <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>Chấp nhận</div>
            <div style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.accepted}</div>
          </div>
          <div style={{
            background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            borderRadius: "12px",
            padding: "1.25rem",
            color: "white"
          }}>
            <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>Từ chối</div>
            <div style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.rejected}</div>
          </div>
          <div style={{
            background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
            borderRadius: "12px",
            padding: "1.25rem",
            color: "white"
          }}>
            <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>Đã rút</div>
            <div style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.withdrawn}</div>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table className="simple-table">
          <thead>
            <tr>
              <th style={{ width: "60px" }}>ID</th>
              <th>Tiêu đề bài báo</th>
              <th style={{ width: "120px" }}>Track</th>
              <th style={{ width: "150px" }}>Tác giả</th>
              <th style={{ width: "110px" }}>Ngày nộp</th>
              <th style={{ width: "120px", whiteSpace: "nowrap" }}>Trạng thái</th>
              <th style={{ width: "130px", whiteSpace: "nowrap" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="table-empty" style={{ color: "#d72d2d" }}>
                  {error}
                </td>
              </tr>
            ) : papers.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  Chưa có bài nộp nào cho hội nghị này.
                </td>
              </tr>
            ) : (
              paginatedItems.map((paper) => {
                const authorInfo = getAuthorInfo(paper);
                return (
                  <tr key={paper.id}>
                    <td>{paper.id}</td>
                    <td>
                      <strong>{paper.title}</strong>
                      {paper.abstractText && (
                        <div
                          style={{
                            fontSize: "0.85em",
                            color: "#666",
                            marginTop: "0.25rem",
                            maxWidth: "400px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {paper.abstractText}
                        </div>
                      )}
                    </td>
                    <td>{getTrackName(paper)}</td>
                    <td>
                      <div>
                        <div>{authorInfo.name}</div>
                        {authorInfo.coAuthorCount > 0 && (
                          <div style={{ fontSize: "0.85em", color: "#666" }}>
                            +{authorInfo.coAuthorCount} đồng tác giả
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {paper.createdAt
                        ? new Date(paper.createdAt).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{getStatusBadge(paper.status)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button
                        className="btn-primary table-action"
                        type="button"
                        onClick={() => navigate(`/author/submissions/${paper.id}`)}
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && papers.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={papers.length}
          itemsPerPage={20}
          onPageChange={setCurrentPage}
          itemName="bài nộp"
        />
      )}
    </AdminLayout>
  );
};

export default AdminConferenceSubmissions;