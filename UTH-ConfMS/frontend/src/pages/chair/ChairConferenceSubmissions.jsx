import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";

const ChairConferenceSubmissions = () => {
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
      SUBMITTED: { label: "ĐÃ NỘP", class: "badge-info" },
      UNDER_REVIEW: { label: "ĐANG REVIEW", class: "badge-warning" },
      ACCEPTED: { label: "CHẤP NHẬN", class: "badge-success" },
      REJECTED: { label: "TỪ CHỐI", class: "badge-danger" },
      WITHDRAWN: { label: "ĐÃ RÚT", class: "badge-secondary" },
    };
    const info = statusMap[status] || { label: status, class: "badge-secondary" };
    return <span className={info.class}>{info.label}</span>;
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

  return (
    <DashboardLayout
      roleLabel="Chủ tịch Chương trình / Chủ tịch Chuyên đề"
      title="Bài nộp của hội nghị"
      subtitle="Xem toàn bộ bài báo đã nộp vào hội nghị"
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span
              className="breadcrumb-link"
              onClick={() => navigate("/chair/conferences")}
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
          {conference && (
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
              {papers.length} bài nộp
            </p>
          )}
        </div>

        <div className="data-page-header-right">
          <button className="btn-secondary" type="button" onClick={fetchData}>
            Làm mới
          </button>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => navigate("/chair/conferences")}
          >
            Quay lại
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="simple-table">
          <thead>
            <tr>
              <th style={{ width: "60px" }}>ID</th>
              <th>Tiêu đề bài báo</th>
              <th style={{ width: "150px" }}>Track</th>
              <th style={{ width: "180px" }}>Tác giả</th>
              <th style={{ width: "120px" }}>Ngày nộp</th>
              <th style={{ width: "100px" }}>Trạng thái</th>
              <th style={{ width: "120px" }}>Thao tác</th>
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
                    <td>{getStatusBadge(paper.status)}</td>
                    <td>
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
    </DashboardLayout>
  );
};

export default ChairConferenceSubmissions;
