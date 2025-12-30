import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import "../../styles/ChairProceedingPreview.css";

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
      const res = await apiClient.get(
        `/proceedings/export/${selectedConference}`
      );
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

      {/* Phần còn lại giữ nguyên inline style */}
      {/* ... */}
    </DashboardLayout>
  );
};

export default ChairProceedingsPreview;
