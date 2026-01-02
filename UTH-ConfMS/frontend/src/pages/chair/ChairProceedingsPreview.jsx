import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import { FiDownload, FiEye, FiFilter } from "react-icons/fi";
import "../../styles/PublicProceedings.css";

const ChairProceedingsPreview = () => {
  const navigate = useNavigate();
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState("");
  const [proceedings, setProceedings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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
      alert("Không thể tải kỷ yếu!");
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

  const handleExportJSON = async () => {
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
      a.download = `proceedings-${selectedConference}-${new Date()
        .toISOString()
        .split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      alert("Đã xuất JSON thành công!");
    } catch (err) {
      console.error(err);
      alert("Lỗi export proceedings!");
    }
  };

  const handleExportCSV = () => {
    if (!selectedConference || proceedings.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    try {
      const csvData = [];

      csvData.push(["STT", "Tiêu đề", "Chủ đề", "Tác giả", "Tóm tắt"]);

      proceedings.forEach((paper, index) => {
        const allAuthors = paper.coAuthors
          ? `${paper.authorName}, ${paper.coAuthors}`
          : paper.authorName || "Không có thông tin tác giả";

        csvData.push([
          index + 1,
          `"${paper.title?.replace(/"/g, '""') || ""}"`,
          paper.trackName || "N/A",
          `"${allAuthors.replace(/"/g, '""')}"`,
          `"${paper.abstractText?.replace(/"/g, '""') || ""}"`,
        ]);
      });

      const csvContent = csvData.map((row) => row.join(",")).join("\n");
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `ky-yeu-${selectedConference}-${Date.now()}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert("Đã xuất CSV thành công!");
    } catch (err) {
      console.error("Export error:", err);
      alert("Lỗi khi xuất CSV: " + err.message);
    }
  };

  const tracks = [...new Set(proceedings.map((p) => p.trackName).filter(Boolean))];

  const filteredProceedings = proceedings.filter((paper) => {
    const matchTrack =
      selectedTrack === "ALL" || paper.trackName === selectedTrack;
    const allAuthors = paper.coAuthors
      ? `${paper.authorName} ${paper.coAuthors}`
      : paper.authorName || "";
    const matchSearch =
      !searchQuery.trim() ||
      paper.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      allAuthors.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTrack && matchSearch;
  });

  if (loading) {
    return (
      <DashboardLayout roleLabel="Program / Track Chair" title="Xem trước kỷ yếu">
        <div style={{ textAlign: "center", padding: "3rem" }}>Đang tải...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      roleLabel="Program / Track Chair"
      title="Xem trước kỷ yếu"
      subtitle="Kiểm tra danh sách kỷ yếu và xuất dữ liệu"
    >
      {/* Filter Bar */}
      {proceedings.length > 0 && (
        <div
          style={{
            marginBottom: "1.5rem",
            background: "white",
            borderRadius: "10px",
            padding: "1rem 1.25rem",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label
                style={{
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                  color: "#64748b",
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                }}
              >
                <FiFilter size={14} />
                Lọc theo chủ đề:
              </label>

              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
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
                <option value="ALL">
                  Tất cả chủ đề ({proceedings.length})
                </option>
                {tracks.map((track) => (
                  <option key={track} value={track}>
                    {track} (
                    {proceedings.filter((p) => p.trackName === track).length})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ChairProceedingsPreview;
