import React, { useEffect, useState } from "react";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import { StatsSkeleton } from "../../components/LoadingSkeleton";
import { FiDownload, FiFileText, FiBarChart2, FiTrendingUp } from "react-icons/fi";
import "../../styles/ReviewerAssignments.css";
import "../../styles/ChairReports.css";

const ChairReports = () => {
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState("ALL");
  const [papers, setPapers] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalPapers: 0,
    submitted: 0,
    underReview: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0,
    acceptanceRate: 0,
    totalAssignments: 0,
    completedReviews: 0,
    pendingReviews: 0,
    completionRate: 0,
    trackStats: {}
  });
  const [exporting, setExporting] = useState(false);
  const [showTrackExportModal, setShowTrackExportModal] = useState(false);
  const [selectedTrackForExport, setSelectedTrackForExport] = useState("ALL");

  // Load conferences
  useEffect(() => {
    const loadConferences = async () => {
      try {
        const res = await apiClient.get("/conferences");
        setConferences(res.data || []);
        setSelectedConference("ALL");
      } catch (err) {
        console.error("Load conferences error:", err);
      }
    };
    loadConferences();
  }, []);

  // Load data and calculate statistics
  useEffect(() => {
    if (!selectedConference) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        let allPapers = [];

        if (selectedConference === "ALL") {
          for (const conf of conferences) {
            try {
              const papersRes = await apiClient.get(`/decisions/papers/${conf.id}`);
              allPapers = [...allPapers, ...(papersRes.data || [])];
            } catch (err) {
              console.error(`Error loading papers for conference ${conf.id}:`, err);
            }
          }
        } else {
          const papersRes = await apiClient.get(`/decisions/papers/${selectedConference}`);
          allPapers = papersRes.data || [];
        }

        setPapers(allPapers);

        // Load assignments and reviews
        const assignmentsMap = {};
        const reviewsMap = {};
        let totalAssignments = 0;
        let completedReviews = 0;

        for (const paper of allPapers) {
          try {
            const [assignRes, reviewsRes] = await Promise.all([
              apiClient.get(`/assignments/paper/${paper.id}`),
              apiClient.get(`/reviews/paper/${paper.id}`)
            ]);
            assignmentsMap[paper.id] = assignRes.data || [];
            reviewsMap[paper.id] = reviewsRes.data || [];

            totalAssignments += (assignRes.data || []).length;
            completedReviews += (reviewsRes.data || []).length;
          } catch (err) {
            assignmentsMap[paper.id] = [];
            reviewsMap[paper.id] = [];
          }
        }

        setAssignments(assignmentsMap);
        setReviews(reviewsMap);

        // Calculate statistics
        const submitted = allPapers.filter(p => p.status === 'SUBMITTED').length;
        const underReview = allPapers.filter(p => p.status === 'UNDER_REVIEW').length;
        const accepted = allPapers.filter(p => p.status === 'ACCEPTED').length;
        const rejected = allPapers.filter(p => p.status === 'REJECTED').length;
        const withdrawn = allPapers.filter(p => p.status === 'WITHDRAWN').length;
        const acceptanceRate = allPapers.length > 0 ? (accepted / allPapers.length) * 100 : 0;
        const completionRate = totalAssignments > 0 ? (completedReviews / totalAssignments) * 100 : 0;

        // Calculate track statistics
        const trackStats = {};
        allPapers.forEach(paper => {
          const trackName = paper.track?.name || "Không có track";
          if (!trackStats[trackName]) {
            trackStats[trackName] = {
              total: 0,
              submitted: 0,
              underReview: 0,
              accepted: 0,
              rejected: 0,
              withdrawn: 0
            };
          }
          trackStats[trackName].total++;
          if (paper.status === 'SUBMITTED') trackStats[trackName].submitted++;
          if (paper.status === 'UNDER_REVIEW') trackStats[trackName].underReview++;
          if (paper.status === 'ACCEPTED') trackStats[trackName].accepted++;
          if (paper.status === 'REJECTED') trackStats[trackName].rejected++;
          if (paper.status === 'WITHDRAWN') trackStats[trackName].withdrawn++;
        });

        setStats({
          totalPapers: allPapers.length,
          submitted,
          underReview,
          accepted,
          rejected,
          withdrawn,
          acceptanceRate,
          totalAssignments,
          completedReviews,
          pendingReviews: totalAssignments - completedReviews,
          completionRate,
          trackStats
        });
      } catch (err) {
        console.error("Load error:", err);
        setError("Không thể tải dữ liệu báo cáo.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedConference, conferences]);

  // Export to CSV
  const exportToCSV = () => {
    setExporting(true);

    try {
      // Prepare data
      const csvData = [];

      // Header
      csvData.push([
        "ID",
        "Tiêu đề",
        "Track",
        "Tác giả chính",
        "Email tác giả",
        "Trạng thái",
        "Số reviewers",
        "Số reviews",
        "Điểm trung bình",
        "Ngày nộp"
      ]);

      // Data rows
      papers.forEach(paper => {
        const paperAssignments = assignments[paper.id] || [];
        const paperReviews = reviews[paper.id] || [];
        const avgScore = paperReviews.length > 0
          ? (paperReviews.reduce((sum, r) => sum + (r.score || 0), 0) / paperReviews.length).toFixed(2)
          : "N/A";

        csvData.push([
          paper.id,
          `"${paper.title?.replace(/"/g, '""') || ''}"`,
          paper.track?.name || "N/A",
          paper.mainAuthor?.fullName || "N/A",
          paper.mainAuthor?.email || "N/A",
          paper.status || "N/A",
          paperAssignments.length,
          paperReviews.length,
          avgScore,
          paper.createdAt ? new Date(paper.createdAt).toLocaleDateString("vi-VN") : "N/A"
        ]);
      });

      // Convert to CSV string
      const csvContent = csvData.map(row => row.join(",")).join("\n");

      // Add BOM for UTF-8
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

      // Download
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `bao-cao-hoi-nghi-${Date.now()}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert("Đã xuất báo cáo CSV thành công!");
    } catch (err) {
      console.error("Export error:", err);
      alert("Lỗi khi xuất báo cáo: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  // Export track statistics to CSV
  const exportTrackStatsToCSV = () => {
    setExporting(true);

    try {
      const csvData = [];

      // Header
      csvData.push([
        "Chủ đề",
        "Tổng số bài",
        "Đã nộp",
        "Đang đánh giá",
        "Chấp nhận",
        "Từ chối",
        "Đã rút",
        "Tỷ lệ chấp nhận (%)"
      ]);

      // Data rows - filter by selected track
      const tracksToExport = selectedTrackForExport === "ALL"
        ? Object.entries(stats.trackStats)
        : Object.entries(stats.trackStats).filter(([trackName]) => trackName === selectedTrackForExport);

      tracksToExport.forEach(([trackName, trackData]) => {
        const acceptanceRate = trackData.total > 0
          ? ((trackData.accepted / trackData.total) * 100).toFixed(1)
          : "0.0";

        csvData.push([
          `"${trackName}"`,
          trackData.total,
          trackData.submitted,
          trackData.underReview,
          trackData.accepted,
          trackData.rejected,
          trackData.withdrawn,
          acceptanceRate
        ]);
      });

      // Convert to CSV string
      const csvContent = csvData.map(row => row.join(",")).join("\n");

      // Add BOM for UTF-8
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

      // Download
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      const fileName = selectedTrackForExport === "ALL"
        ? `thong-ke-tat-ca-chu-de-${Date.now()}.csv`
        : `thong-ke-chu-de-${selectedTrackForExport}-${Date.now()}.csv`;
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert("Đã xuất thống kê chủ đề CSV thành công!");
      setShowTrackExportModal(false);
      setSelectedTrackForExport("ALL");
    } catch (err) {
      console.error("Export error:", err);
      alert("Lỗi khi xuất báo cáo: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout roleLabel="Chair" title="Báo cáo & Thống kê">
        <StatsSkeleton count={4} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      roleLabel="Chair"
      title="Báo cáo & Thống kê"
      subtitle="Xem tổng quan và xuất báo cáo chi tiết"
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Chair</span>
          </div>
          <h2 className="data-page-title">Báo cáo & Thống kê</h2>
          <p className="data-page-subtitle">
            Xem tổng quan thống kê và xuất báo cáo chi tiết về hội nghị
          </p>
        </div>
      </div>

      {/* Conference Selector */}
      {conferences.length > 0 && (
        <div
          style={{
            marginBottom: "1.5rem",
            background: "white",
            borderRadius: "10px",
            padding: "1rem 1.25rem",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ flex: 1, maxWidth: "400px" }}>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: 600,
              color: "#64748b",
              fontSize: "0.875rem",
            }}>
              Chọn hội nghị:
            </label>
            <select
              value={selectedConference}
              onChange={(e) => setSelectedConference(e.target.value === "ALL" ? "ALL" : parseInt(e.target.value))}
              style={{
                width: "100%",
                padding: "0.5rem 0.875rem",
                borderRadius: "8px",
                border: "1.5px solid #e2e8f0",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
                background: "white",
                color: "#475569",
              }}
            >
              <option value="ALL">Tất cả hội nghị</option>
              {conferences.map((conf) => (
                <option key={conf.id} value={conf.id}>
                  {conf.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              className="btn-primary"
              onClick={exportToCSV}
              disabled={exporting || papers.length === 0}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <FiDownload size={16} />
              {exporting ? "Đang xuất..." : "Xuất báo cáo CSV"}
            </button>
            <button
              className="btn-secondary"
              onClick={() => setShowTrackExportModal(true)}
              disabled={exporting || Object.keys(stats.trackStats).length === 0}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <FiBarChart2 size={16} />
              Xuất thống kê chủ đề
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          background: "#ffebee",
          border: "1px solid #d32f2f",
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          color: "#d32f2f",
        }}>
          {error}
        </div>
      )}

      {/* Overview Statistics */}
      <div style={{ marginBottom: "2rem" }}>
        <h3 style={{
          fontSize: "1.125rem",
          fontWeight: 600,
          marginBottom: "1rem",
          color: "#1f2937",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <FiFileText size={20} style={{ color: "#008689" }} />
          Tổng quan bài báo
        </h3>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: "0.75rem"
        }}>
          <div style={{
            background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
            padding: "1rem",
            borderRadius: "10px",
            color: "white",
            boxShadow: "0 2px 8px rgba(13, 148, 136, 0.15)"
          }}>
            <div style={{ fontSize: "0.75rem", opacity: 0.9, marginBottom: "0.375rem", whiteSpace: "nowrap" }}>
              Tổng số bài
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1 }}>
              {stats.totalPapers}
            </div>
          </div>

          <div style={{
            background: "white",
            padding: "1rem",
            borderRadius: "10px",
            border: "2px solid #e5e7eb",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)"
          }}>
            <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.375rem", whiteSpace: "nowrap" }}>
              Đã nộp
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#3b82f6", lineHeight: 1 }}>
              {stats.submitted}
            </div>
          </div>

          <div style={{
            background: "white",
            padding: "1rem",
            borderRadius: "10px",
            border: "2px solid #e5e7eb",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)"
          }}>
            <div style={{ fontSize: "0.75rem", opacity: 0.9, marginBottom: "0.375rem", whiteSpace: "nowrap" }}>
              Đang đánh giá
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#f59e0b", lineHeight: 1 }}>
              {stats.underReview}
            </div>
          </div>

          <div style={{
            background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
            padding: "1rem",
            borderRadius: "10px",
            color: "white",
            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.15)"
          }}>
            <div style={{ fontSize: "0.75rem", opacity: 0.9, marginBottom: "0.375rem", whiteSpace: "nowrap" }}>
              Chấp nhận
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1 }}>
              {stats.accepted}
            </div>
            <div style={{ fontSize: "0.6875rem", opacity: 0.85, marginTop: "0.25rem" }}>
              {stats.acceptanceRate.toFixed(1)}% tỷ lệ
            </div>
          </div>

          <div style={{
            background: "linear-gradient(135deg, #ef4444 0%, #f87171 100%)",
            padding: "1rem",
            borderRadius: "10px",
            color: "white",
            boxShadow: "0 2px 8px rgba(239, 68, 68, 0.15)"
          }}>
            <div style={{ fontSize: "0.75rem", opacity: 0.9, marginBottom: "0.375rem", whiteSpace: "nowrap" }}>
              Từ chối
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1 }}>
              {stats.rejected}
            </div>
          </div>

          <div style={{
            background: "white",
            padding: "1rem",
            borderRadius: "10px",
            border: "2px solid #e5e7eb",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)"
          }}>
            <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.375rem", whiteSpace: "nowrap" }}>
              Đã rút
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#94a3b8", lineHeight: 1 }}>
              {stats.withdrawn}
            </div>
          </div>
        </div>
      </div>

      {/* Review Progress */}
      <div style={{ marginBottom: "2rem" }}>
        <h3 style={{
          fontSize: "1.125rem",
          fontWeight: 600,
          marginBottom: "1rem",
          color: "#1f2937",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <FiTrendingUp size={20} style={{ color: "#008689" }} />
          Tiến độ đánh giá
        </h3>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0.75rem"
        }}>
          <div style={{
            background: "white",
            padding: "1rem",
            borderRadius: "10px",
            border: "2px solid #e5e7eb",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)"
          }}>
            <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.375rem", whiteSpace: "nowrap" }}>
              Tổng assignments
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#1f2937", lineHeight: 1 }}>
              {stats.totalAssignments}
            </div>
          </div>

          <div style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
            padding: "1rem",
            borderRadius: "10px",
            color: "white",
            boxShadow: "0 2px 8px rgba(59, 130, 246, 0.15)"
          }}>
            <div style={{ fontSize: "0.75rem", opacity: 0.9, marginBottom: "0.375rem", whiteSpace: "nowrap" }}>
              Tỷ lệ hoàn thành
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1 }}>
              {stats.completionRate.toFixed(1)}%
            </div>
            <div style={{ fontSize: "0.6875rem", opacity: 0.85, marginTop: "0.25rem" }}>
              {stats.completedReviews}/{stats.totalAssignments} đánh giá
            </div>
          </div>

          <div style={{
            background: "white",
            padding: "1rem",
            borderRadius: "10px",
            border: "2px solid #10b981",
            boxShadow: "0 2px 6px rgba(16, 185, 129, 0.1)"
          }}>
            <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.375rem", whiteSpace: "nowrap" }}>
              Đã hoàn thành
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#10b981", lineHeight: 1 }}>
              {stats.completedReviews}
            </div>
          </div>

          <div style={{
            background: "white",
            padding: "1rem",
            borderRadius: "10px",
            border: "2px solid #f59e0b",
            boxShadow: "0 2px 6px rgba(245, 158, 11, 0.1)"
          }}>
            <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.375rem", whiteSpace: "nowrap" }}>
              Đang chờ
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#f59e0b", lineHeight: 1 }}>
              {stats.pendingReviews}
            </div>
          </div>
        </div>
      </div>

      {/* Track Statistics */}
      {Object.keys(stats.trackStats).length > 0 && (
        <div>
          <h3 style={{
            fontSize: "1.125rem",
            fontWeight: 600,
            marginBottom: "1rem",
            color: "#1f2937",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <FiBarChart2 size={20} style={{ color: "#008689" }} />
            Thống kê theo chủ đề
          </h3>
          <div className="table-wrapper">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Chủ đề</th>
                  <th>Tổng</th>
                  <th>Đã nộp</th>
                  <th>Đang đánh giá</th>
                  <th>Chấp nhận</th>
                  <th>Từ chối</th>
                  <th>Đã rút</th>
                  <th>Tỷ lệ chấp nhận</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.trackStats).map(([trackName, trackData]) => {
                  const acceptanceRate = trackData.total > 0
                    ? ((trackData.accepted / trackData.total) * 100).toFixed(1)
                    : "0.0";

                  return (
                    <tr key={trackName}>
                      <td><strong>{trackName}</strong></td>
                      <td>{trackData.total}</td>
                      <td>{trackData.submitted}</td>
                      <td>{trackData.underReview}</td>
                      <td style={{ color: "#10b981", fontWeight: 600 }}>{trackData.accepted}</td>
                      <td style={{ color: "#ef4444", fontWeight: 600 }}>{trackData.rejected}</td>
                      <td style={{ color: "#94a3b8" }}>{trackData.withdrawn}</td>
                      <td>
                        <span style={{
                          fontWeight: 600,
                          color: parseFloat(acceptanceRate) >= 50 ? "#10b981" : "#6b7280"
                        }}>
                          {acceptanceRate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal chọn chủ đề để xuất */}
      {showTrackExportModal && (
        <div className="modal-overlay" onClick={() => setShowTrackExportModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <h3 style={{ marginBottom: "1rem" }}>Xuất thống kê chủ đề</h3>

            <div className="form-group">
              <label className="form-label">Chọn chủ đề muốn xuất *</label>
              <select
                value={selectedTrackForExport}
                onChange={(e) => setSelectedTrackForExport(e.target.value)}
                className="form-input"
              >
                <option value="ALL">📋 Tất cả chủ đề</option>
                {Object.keys(stats.trackStats).map((trackName) => (
                  <option key={trackName} value={trackName}>
                    {trackName} ({stats.trackStats[trackName].total} bài)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button
                className="btn-primary"
                onClick={exportTrackStatsToCSV}
                disabled={exporting}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <FiDownload size={16} />
                {exporting ? "Đang xuất..." : "Xuất CSV"}
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowTrackExportModal(false);
                  setSelectedTrackForExport("ALL");
                }}
                disabled={exporting}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ChairReports;
