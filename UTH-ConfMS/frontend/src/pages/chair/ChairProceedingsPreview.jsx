import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";

const ChairProceedingsPreview = () => {
  const navigate = useNavigate();
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState("");
  const [proceedings, setProceedings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [groupByTrack, setGroupByTrack] = useState(true);

  useEffect(() => {
    fetchConferences();
  }, []);

  const fetchConferences = async () => {
    try {
      const res = await apiClient.get("/conferences");
      setConferences(res.data);
      if (res.data && res.data.length > 0) {
        setSelectedConference(res.data[0].id);
        fetchProceedings(res.data[0].id);
      }
    } catch (err) {
      console.error("Error fetching conferences:", err);
    }
  };

  const fetchProceedings = async (confId) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/proceedings/${confId}`);
      setProceedings(res.data);
    } catch (err) {
      console.error("Error fetching proceedings:", err);
      alert("Không thể tải proceedings!");
    } finally {
      setLoading(false);
    }
  };

  const handleConferenceChange = (e) => {
    const confId = e.target.value;
    setSelectedConference(confId);
    if (confId) {
      fetchProceedings(confId);
    } else {
      setProceedings([]);
    }
  };

  const handleExport = async () => {
    if (!selectedConference) {
      alert("Vui lòng chọn hội nghị!");
      return;
    }
    try {
      const res = await apiClient.get(`/proceedings/export/${selectedConference}`);
      const data = JSON.stringify(res.data, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `proceedings-${selectedConference}-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Lỗi export proceedings!");
    }
  };

  const groupedProceedings = () => {
    if (!groupByTrack) return { "All Papers": proceedings };
    return proceedings.reduce((acc, paper) => {
      const track = paper.trackName || "Other";
      if (!acc[track]) acc[track] = [];
      acc[track].push(paper);
      return acc;
    }, {});
  };

  return (
    <DashboardLayout
      roleLabel="Program / Track Chair"
      title="Xem trước Proceedings"
      subtitle="Kiểm tra danh sách kỷ yếu và export dữ liệu"
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Chair</span>
          </div>
          <h2 className="data-page-title">Xem trước Proceedings</h2>
        </div>
        <div className="data-page-header-right">
          <button className="btn-secondary" onClick={() => navigate("/chair")}>
            ← Quay lại
          </button>
        </div>
      </div>

      <div style={{
        marginBottom: "2rem",
        padding: "1rem",
        background: "#f5f5f5",
        borderRadius: "8px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <label style={{ fontWeight: "600" }}>Chọn hội nghị:</label>
          <select
            value={selectedConference}
            onChange={handleConferenceChange}
            style={{
              padding: "0.6rem 1rem",
              border: "1px solid #ddd",
              borderRadius: "6px",
              minWidth: "250px"
            }}
          >
            <option value="">-- Chọn hội nghị --</option>
            {conferences.map((conf) => (
              <option key={conf.id} value={conf.id}>
                {conf.name}
              </option>
            ))}
          </select>
        </div>

        {selectedConference && (
          <div style={{ display: "flex", gap: "1rem" }}>
            <button className="btn-secondary" onClick={() => setGroupByTrack(!groupByTrack)}>
              {groupByTrack ? "Hiển thị tất cả" : "Nhóm theo Track"}
            </button>
            <button className="btn-primary" onClick={handleExport}>
              📥 Export JSON
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#525252" }}>
          Đang tải proceedings...
        </div>
      )}

      {!loading && selectedConference && proceedings.length === 0 && (
        <div style={{
          background: "#f9fefe",
          padding: "3rem",
          borderRadius: "8px",
          textAlign: "center",
          color: "#6b7280"
        }}>
          Chưa có bài báo nào được chấp nhận trong hội nghị này.
        </div>
      )}

      {!loading && proceedings.length > 0 && (
        <>
          <div className="dash-grid" style={{ marginBottom: "2rem" }}>
            <div className="dash-card">
              <h3>Tổng số bài</h3>
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#0f62fe" }}>
                {proceedings.length}
              </div>
            </div>
            <div className="dash-card">
              <h3>Số tracks</h3>
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#2e7d32" }}>
                {Object.keys(groupedProceedings()).length}
              </div>
            </div>
          </div>

          {Object.entries(groupedProceedings()).map(([track, papers]) => (
            <div key={track} style={{ marginBottom: "2rem" }}>
              {groupByTrack && (
                <h3 style={{
                  background: "#e6f4f4",
                  color: "#006666",
                  padding: "1rem 1.5rem",
                  margin: "0 0 0 0",
                  borderRadius: "8px 8px 0 0",
                  fontSize: "1.2rem"
                }}>
                  {track} <span style={{ opacity: 0.8 }}>({papers.length})</span>
                </h3>
              )}

              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Tiêu đề</th>
                      <th>Tác giả</th>
                      <th>Đồng tác giả</th>
                      {!groupByTrack && <th>Track</th>}
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {papers.map((paper, index) => (
                      <tr key={paper.paperId}>
                        <td>{index + 1}</td>
                        <td style={{ fontWeight: "600" }}>{paper.title}</td>
                        <td>{paper.authorName}</td>
                        <td style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                          {paper.coAuthors || "-"}
                        </td>
                        {!groupByTrack && <td>{paper.trackName}</td>}
                        <td>
                          <span style={{
                            padding: "0.4rem 0.8rem",
                            borderRadius: "12px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            background: (paper.pdfUrl && paper.pdfUrl.trim() !== "") ? "#d4edda" : "#fff3cd",
                            color: (paper.pdfUrl && paper.pdfUrl.trim() !== "") ? "#155724" : "#856404"
                          }}>
                            {(paper.pdfUrl && paper.pdfUrl.trim() !== "") ? "✓ Có PDF" : "⚠ Chưa có PDF"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}
    </DashboardLayout>
  );
};

export default ChairProceedingsPreview;
