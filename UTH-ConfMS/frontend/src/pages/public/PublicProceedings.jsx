import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import apiClient from "../../apiClient";
import PortalHeader from "../../components/PortalHeader";
import { ToastContainer } from "../../components/Toast";
import { FiDownload, FiFilter, FiSearch, FiGrid, FiList, FiBook, FiUsers, FiFolder } from "react-icons/fi";
import "../../styles/PublicProceedings.css";

const PublicProceedings = () => {
  const { conferenceId } = useParams();
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState("");
  const [proceedings, setProceedings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [currentUser, setCurrentUser] = useState(null);
  const [viewMode, setViewMode] = useState("cards"); // "cards" or "table"

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    // Check if user is logged in
    const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
    const userStr = sessionStorage.getItem("currentUser") || localStorage.getItem("currentUser");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
  }, []);

  useEffect(() => {
    fetchConferences();
  }, []);

  useEffect(() => {
    if (conferenceId) {
      setSelectedConference(conferenceId);
      fetchProceedings(conferenceId);
    }
  }, [conferenceId]);

  const fetchConferences = async () => {
    try {
      const response = await apiClient.get("/conferences/all", { skipAuth: true });
      // Lấy tất cả hội nghị (kể cả bị ẩn) để có thể lọc theo hội nghị cụ thể
      const allConferences = response.data;
      
      // Hiển thị TẤT CẢ hội nghị trong dropdown (kể cả bị ẩn)
      setConferences(allConferences);

      if (conferenceId) {
        setSelectedConference(conferenceId);
        fetchProceedings(conferenceId);
      } else if (allConferences && allConferences.length > 0) {
        // Load proceedings từ TẤT CẢ hội nghị (kể cả bị ẩn) sử dụng endpoint /all
        setSelectedConference("");
        fetchAllProceedings();
      } else {
        setLoading(false);
        setError("Chưa có hội nghị nào trong hệ thống.");
      }
    } catch (err) {
      console.error("Error fetching conferences:", err);
      setError("Không thể tải danh sách hội nghị.");
      setLoading(false);
    }
  };

  const fetchAllProceedings = async (confs) => {
    try {
      setLoading(true);
      setError(null);

      // Sử dụng endpoint /all để lấy tất cả bài ACCEPTED từ mọi hội nghị (kể cả bị ẩn)
      const response = await apiClient.get("/proceedings/all", {
        skipAuth: true,
      });
      
      setProceedings(response.data);
    } catch (err) {
      console.error("Error fetching all proceedings:", err);
      setError("Không thể tải danh sách kỷ yếu. Vui lòng thử lại sau.");
      setProceedings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProceedings = async (confId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/proceedings/${confId}`, {
        skipAuth: true,
      });

      // Backend đã filter ACCEPTED rồi, không cần filter thêm
      setProceedings(response.data);
    } catch (err) {
      console.error("Error fetching proceedings:", err);

      if (err.response?.status === 404) {
        setError("Không tìm thấy hội nghị này.");
      } else {
        setError("Không thể tải danh sách kỷ yếu. Vui lòng thử lại sau.");
      }
      setProceedings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConferenceChange = (e) => {
    const confId = e.target.value;
    setSelectedConference(confId);
    setSearchQuery("");
    setSelectedTrack("ALL");
    setCurrentPage(1);
    if (confId) {
      fetchProceedings(confId);
    } else {
      // Load all proceedings using /all endpoint
      fetchAllProceedings();
    }
  };

  const handleDownload = async (paperId, title) => {
    try {
      const response = await apiClient.get(`/proceedings/download/${paperId}`, {
        responseType: "blob",
        skipAuth: true,
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading paper:", err);
      addToast("Không thể tải xuống file. Vui lòng thử lại sau.", "error");
    }
  };

  // Get unique tracks
  const tracks = [...new Set(proceedings.map(p => p.trackName).filter(Boolean))];

  // Filter proceedings
  const filteredProceedings = proceedings.filter(paper => {
    const matchTrack = selectedTrack === "ALL" || paper.trackName === selectedTrack;
    const allAuthors = paper.coAuthors
      ? `${paper.authorName} ${paper.coAuthors}`
      : paper.authorName || "";
    const matchSearch = !searchQuery.trim() ||
      paper.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      allAuthors.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTrack && matchSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProceedings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProceedings = filteredProceedings.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTrack]);

  if (loading) {
    return (
      <div className="proceedings-page-modern">
        <PortalHeader
          title="UTH Conference Portal · Proceedings"
          ctaHref="/program"
          ctaText="Xem chương trình"
        />

        <div style={{
          background: "linear-gradient(135deg, rgba(13, 148, 136, 0.05) 0%, rgba(20, 184, 166, 0.08) 100%)",
          padding: "3rem 2rem",
          borderBottom: "3px solid #14b8a6",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%2314b8a6\" fill-opacity=\"0.03\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
            opacity: 0.4
          }}></div>
          <div style={{
            maxWidth: "1200px",
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
            zIndex: 1
          }}>
            <h1 style={{
              fontSize: "2.25rem",
              fontWeight: 700,
              color: "#0d9488",
              marginBottom: "0.75rem",
              letterSpacing: "-0.02em",
              textShadow: "0 2px 4px rgba(13, 148, 136, 0.1)"
            }}>
              Kỷ yếu hội nghị khoa học
            </h1>
            <p style={{
              fontSize: "1.0625rem",
              color: "#64748b",
              fontWeight: 500,
              margin: 0,
              letterSpacing: "0.01em"
            }}>
              Danh sách các bài báo đã được chấp nhận công bố
            </p>
          </div>
        </div>

        <div className="proceedings-container">
          <div className="loading-state">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="proceedings-page-modern">
      {/* Header */}
      <PortalHeader
        title="UTH Conference Portal · Proceedings"
        ctaHref="/program"
        ctaText="Xem chương trình"
      />

      {/* Hero Banner */}
      <div style={{
        background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #2dd4bf 100%)",
        padding: "4rem 2rem",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(13, 148, 136, 0.2)"
      }}>
        {/* Decorative circles */}
        <div style={{
          position: "absolute",
          top: "-50px",
          right: "-50px",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.1)",
          filter: "blur(40px)"
        }}></div>
        <div style={{
          position: "absolute",
          bottom: "-30px",
          left: "-30px",
          width: "150px",
          height: "150px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.08)",
          filter: "blur(30px)"
        }}></div>
        
        {/* Pattern overlay */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.05\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
          opacity: 0.3
        }}></div>

        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
          zIndex: 1
        }}>
          {/* Icon */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "80px",
            height: "80px",
            borderRadius: "20px",
            background: "rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(10px)",
            marginBottom: "1.5rem",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)"
          }}>
            <FiBook size={40} style={{ color: "white" }} />
          </div>

          <h1 style={{
            fontSize: "3rem",
            fontWeight: 800,
            color: "white",
            marginBottom: "1rem",
            letterSpacing: "-0.03em",
            textShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            lineHeight: 1.2
          }}>
            Kỷ yếu hội nghị khoa học
          </h1>
          
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(10px)",
            padding: "0.75rem 1.5rem",
            borderRadius: "50px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#fbbf24",
              boxShadow: "0 0 10px #fbbf24"
            }}></div>
            <p style={{
              fontSize: "1.0625rem",
              color: "white",
              fontWeight: 600,
              margin: 0,
              letterSpacing: "0.02em"
            }}>
              Danh sách các bài báo đã được chấp nhận công bố
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="proceedings-container">
        {/* Statistics Summary */}
        {proceedings.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem"
          }}>
            <div style={{
              background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
              borderRadius: "12px",
              padding: "1.5rem",
              color: "white",
              boxShadow: "0 4px 6px rgba(13, 148, 136, 0.15)"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "0.5rem"
              }}>
                <FiBook size={24} />
                <span style={{ fontSize: "0.875rem", opacity: 0.9, fontWeight: 500 }}>Tổng số bài báo</span>
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700 }}>{proceedings.length}</div>
            </div>

            <div style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
              borderRadius: "12px",
              padding: "1.5rem",
              color: "white",
              boxShadow: "0 4px 6px rgba(139, 92, 246, 0.15)"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "0.5rem"
              }}>
                <FiFolder size={24} />
                <span style={{ fontSize: "0.875rem", opacity: 0.9, fontWeight: 500 }}>Số chủ đề</span>
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700 }}>{tracks.length}</div>
            </div>

            <div style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
              borderRadius: "12px",
              padding: "1.5rem",
              color: "white",
              boxShadow: "0 4px 6px rgba(245, 158, 11, 0.15)"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "0.5rem"
              }}>
                <FiUsers size={24} />
                <span style={{ fontSize: "0.875rem", opacity: 0.9, fontWeight: 500 }}>Tác giả</span>
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700 }}>
                {new Set(proceedings.flatMap(p => {
                  const authors = [p.authorName];
                  if (p.coAuthors) {
                    authors.push(...p.coAuthors.split(',').map(a => a.trim()));
                  }
                  return authors.filter(Boolean);
                })).size}
              </div>
            </div>
          </div>
        )}

        {/* Conference Selector */}
        {conferences.length > 1 && (
          <div style={{
            marginBottom: "1.5rem",
            background: "white",
            borderRadius: "10px",
            padding: "1rem 1.25rem",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e2e8f0",
          }}>
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
              onChange={handleConferenceChange}
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
              <option value="">Tất cả hội nghị</option>
              {conferences.map((conf) => (
                <option key={conf.id} value={conf.id}>
                  {conf.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filter Bar */}
        {proceedings.length > 0 && (
          <div style={{
            marginBottom: "1.5rem",
            background: "white",
            borderRadius: "10px",
            padding: "1rem 1.25rem",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e2e8f0",
          }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <label style={{
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                  color: "#64748b",
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem"
                }}>
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
                  <option value="ALL">Tất cả chủ đề ({proceedings.length})</option>
                  {tracks.map((track) => (
                    <option key={track} value={track}>
                      {track} ({proceedings.filter(p => p.trackName === track).length})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1, minWidth: "200px" }}>
                <label style={{
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                  color: "#64748b",
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem"
                }}>
                  <FiSearch size={14} />
                  Tìm kiếm:
                </label>
                <input
                  type="text"
                  placeholder="Tìm theo tiêu đề, tác giả..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.875rem",
                    borderRadius: "8px",
                    border: "1.5px solid #e2e8f0",
                    fontSize: "0.8125rem",
                    background: "white",
                    color: "#475569",
                  }}
                />
              </div>

              {/* View Mode Toggle */}
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                <div style={{ flex: "0 0 auto" }}>
                  <label style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                    color: "#64748b",
                    fontSize: "0.875rem",
                  }}>Kiểu hiển thị:</label>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    <button
                      onClick={() => setViewMode("cards")}
                      style={{
                        padding: "0.5rem 0.875rem",
                        borderRadius: "8px",
                        border: "1.5px solid #e2e8f0",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        background: viewMode === "cards" ? "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)" : "white",
                        color: viewMode === "cards" ? "white" : "#475569",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <FiGrid size={16} />
                      Cards
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      style={{
                        padding: "0.5rem 0.875rem",
                        borderRadius: "8px",
                        border: "1.5px solid #e2e8f0",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        background: viewMode === "table" ? "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)" : "white",
                        color: viewMode === "table" ? "white" : "#475569",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <FiList size={16} />
                      Table
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "3rem",
            textAlign: "center",
            color: "#ef4444",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
          }}>
            {error}
          </div>
        )}

        {!error && proceedings.length === 0 && (
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "3rem",
            textAlign: "center",
            color: "#6b7280",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
          }}>
            Chưa có bài báo nào được công bố trong kỷ yếu.
          </div>
        )}

        {!error && proceedings.length > 0 && (
          <>
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "1.5rem",
              boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
            }}>
              <div style={{
                marginBottom: "1rem",
                fontSize: "0.875rem",
                color: "#6b7280",
                fontWeight: 600,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span>Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredProceedings.length)} / {filteredProceedings.length} bài báo</span>
              </div>

              {filteredProceedings.length === 0 ? (
                <div style={{
                  padding: "3rem",
                  textAlign: "center",
                  color: "#6b7280",
                }}>
                  Không tìm thấy bài báo phù hợp với tiêu chí tìm kiếm.
                </div>
              ) : (
                <>
                  {/* Card View */}
                  {viewMode === "cards" && (
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                      gap: "1.25rem",
                      marginBottom: "1.5rem"
                    }}>
                      {paginatedProceedings.map((paper, index) => {
                        const allAuthors = paper.coAuthors
                          ? `${paper.authorName}, ${paper.coAuthors}`
                          : paper.authorName || "Không có thông tin tác giả";
                        const globalIndex = startIndex + index + 1;

                        return (
                          <div key={paper.paperId || index} style={{
                            background: "white",
                            borderRadius: "12px",
                            border: "1px solid #e5e7eb",
                            overflow: "hidden",
                            transition: "all 0.3s ease",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column"
                          }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = "translateY(-4px)";
                              e.currentTarget.style.boxShadow = "0 12px 24px rgba(13, 148, 136, 0.15)";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            {/* Card Header */}
                            <div style={{
                              background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
                              padding: "1rem 1.25rem",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center"
                            }}>
                              <div style={{
                                background: "rgba(255, 255, 255, 0.2)",
                                color: "white",
                                padding: "0.25rem 0.75rem",
                                borderRadius: "6px",
                                fontSize: "0.875rem",
                                fontWeight: 700
                              }}>
                                #{globalIndex}
                              </div>
                              <div style={{
                                background: "rgba(255, 255, 255, 0.95)",
                                color: "#00695c",
                                padding: "0.375rem 0.75rem",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                fontWeight: 600
                              }}>
                                {paper.trackName || "N/A"}
                              </div>
                            </div>

                            {/* Card Body */}
                            <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
                              <h3 style={{
                                fontSize: "1.0625rem",
                                fontWeight: 700,
                                color: "#1f2937",
                                marginBottom: "0.75rem",
                                lineHeight: 1.4,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden"
                              }}>
                                {paper.title}
                              </h3>

                              <div style={{
                                fontSize: "0.875rem",
                                color: "#6b7280",
                                marginBottom: "0.75rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem"
                              }}>
                                <FiUsers size={14} style={{ flexShrink: 0 }} />
                                <span style={{
                                  display: "-webkit-box",
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden"
                                }}>{allAuthors}</span>
                              </div>

                              {paper.abstractText && (
                                <p style={{
                                  fontSize: "0.8125rem",
                                  color: "#9ca3af",
                                  lineHeight: 1.5,
                                  marginBottom: "1rem",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                  flex: 1
                                }}>
                                  {paper.abstractText}
                                </p>
                              )}

                              {/* Card Footer */}
                              <div style={{
                                marginTop: "auto",
                                paddingTop: "1rem",
                                borderTop: "1px solid #f3f4f6"
                              }}>
                                {paper.pdfUrl && paper.pdfUrl.trim() !== "" ? (
                                  <button
                                    onClick={() => handleDownload(paper.paperId, paper.title)}
                                    style={{
                                      width: "100%",
                                      padding: "0.625rem 1rem",
                                      background: "linear-gradient(135deg, #008689 0%, #00a8ac 100%)",
                                      color: "white",
                                      borderRadius: "8px",
                                      fontSize: "0.875rem",
                                      fontWeight: 600,
                                      border: "none",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: "0.5rem",
                                      transition: "all 0.2s ease"
                                    }}
                                    onMouseOver={(e) => {
                                      e.currentTarget.style.transform = "scale(1.02)";
                                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 134, 137, 0.3)";
                                    }}
                                    onMouseOut={(e) => {
                                      e.currentTarget.style.transform = "scale(1)";
                                      e.currentTarget.style.boxShadow = "none";
                                    }}
                                  >
                                    <FiDownload size={16} />
                                    Tải xuống PDF
                                  </button>
                                ) : (
                                  <div style={{
                                    width: "100%",
                                    padding: "0.625rem 1rem",
                                    background: "#f3f4f6",
                                    color: "#9ca3af",
                                    borderRadius: "8px",
                                    fontSize: "0.875rem",
                                    fontWeight: 600,
                                    textAlign: "center"
                                  }}>
                                    PDF chưa có sẵn
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Table View */}
                  {viewMode === "table" && (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.875rem"
                    }}>
                      <thead>
                        <tr style={{
                          background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
                          color: "white"
                        }}>
                          <th style={{
                            padding: "0.875rem",
                            textAlign: "left",
                            fontWeight: 700,
                            fontSize: "0.8125rem",
                            width: "50px",
                            whiteSpace: "nowrap"
                          }}>STT</th>
                          <th style={{
                            padding: "0.875rem",
                            textAlign: "left",
                            fontWeight: 700,
                            fontSize: "0.8125rem",
                            minWidth: "300px"
                          }}>Tiêu đề</th>
                          <th style={{
                            padding: "0.875rem",
                            textAlign: "left",
                            fontWeight: 700,
                            fontSize: "0.8125rem",
                            minWidth: "200px"
                          }}>Tác giả</th>
                          <th style={{
                            padding: "0.875rem",
                            textAlign: "left",
                            fontWeight: 700,
                            fontSize: "0.8125rem",
                            width: "150px",
                            whiteSpace: "nowrap"
                          }}>Chủ đề</th>
                          <th style={{
                            padding: "0.875rem",
                            textAlign: "center",
                            fontWeight: 700,
                            fontSize: "0.8125rem",
                            width: "100px",
                            whiteSpace: "nowrap"
                          }}>Tải xuống</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedProceedings.map((paper, index) => {
                          const allAuthors = paper.coAuthors
                            ? `${paper.authorName}, ${paper.coAuthors}`
                            : paper.authorName || "Không có thông tin tác giả";
                          const globalIndex = startIndex + index + 1;

                          return (
                            <tr key={paper.paperId || index} style={{
                              borderBottom: "1px solid #e5e7eb",
                              transition: "background 0.2s ease"
                            }}
                              onMouseOver={(e) => e.currentTarget.style.background = "#f9fafb"}
                              onMouseOut={(e) => e.currentTarget.style.background = "white"}
                            >
                              <td style={{
                                padding: "1rem 0.875rem",
                                color: "#6b7280",
                                fontWeight: 600
                              }}>{globalIndex}</td>
                              <td style={{
                                padding: "1rem 0.875rem"
                              }}>
                                <div style={{
                                  fontWeight: 600,
                                  color: "#008689",
                                  lineHeight: 1.4
                                }}>
                                  {paper.title}
                                </div>
                              </td>
                              <td style={{
                                padding: "1rem 0.875rem",
                                color: "#374151",
                                lineHeight: 1.4
                              }}>{allAuthors}</td>
                              <td style={{
                                padding: "1rem 0.875rem"
                              }}>
                                <span style={{
                                  padding: "0.25rem 0.625rem",
                                  background: "#e0f2f1",
                                  color: "#00695c",
                                  borderRadius: "6px",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  whiteSpace: "nowrap",
                                  display: "inline-block"
                                }}>
                                  {paper.trackName || "N/A"}
                                </span>
                              </td>
                              <td style={{
                                padding: "1rem 0.875rem",
                                textAlign: "center"
                              }}>
                                {paper.pdfUrl && paper.pdfUrl.trim() !== "" ? (
                                  <button
                                    onClick={() => handleDownload(paper.paperId, paper.title)}
                                    style={{
                                      padding: "0.375rem 0.75rem",
                                      background: "#008689",
                                      color: "white",
                                      borderRadius: "6px",
                                      fontSize: "0.75rem",
                                      fontWeight: 600,
                                      border: "none",
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.375rem",
                                      transition: "all 0.2s ease",
                                      whiteSpace: "nowrap"
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = "#006b6e"}
                                    onMouseOut={(e) => e.currentTarget.style.background = "#008689"}
                                  >
                                    <FiDownload size={14} />
                                    PDF
                                  </button>
                                ) : (
                                  <span style={{
                                    padding: "0.375rem 0.75rem",
                                    background: "#f3f4f6",
                                    color: "#9ca3af",
                                    borderRadius: "6px",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    display: "inline-block",
                                    whiteSpace: "nowrap"
                                  }}>
                                    Chưa có
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  )}

                  {/* Pagination - Shared by both views */}
                  {totalPages > 1 && (
                    <div style={{
                      marginTop: "1.5rem",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}>
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        style={{
                          padding: "0.5rem 0.875rem",
                          borderRadius: "6px",
                          border: "1px solid #e5e7eb",
                          background: currentPage === 1 ? "#f3f4f6" : "white",
                          color: currentPage === 1 ? "#9ca3af" : "#374151",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          cursor: currentPage === 1 ? "not-allowed" : "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        Trước
                      </button>

                      <div style={{
                        display: "flex",
                        gap: "0.25rem"
                      }}>
                        {[...Array(totalPages)].map((_, i) => {
                          const page = i + 1;
                          // Show first, last, current, and adjacent pages
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                style={{
                                  padding: "0.5rem 0.75rem",
                                  borderRadius: "6px",
                                  border: "1px solid #e5e7eb",
                                  background: currentPage === page
                                    ? "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)"
                                    : "white",
                                  color: currentPage === page ? "white" : "#374151",
                                  fontSize: "0.875rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  minWidth: "36px",
                                  transition: "all 0.2s ease"
                                }}
                              >
                                {page}
                              </button>
                            );
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return <span key={page} style={{ padding: "0.5rem 0.25rem", color: "#9ca3af" }}>...</span>;
                          }
                          return null;
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        style={{
                          padding: "0.5rem 0.875rem",
                          borderRadius: "6px",
                          border: "1px solid #e5e7eb",
                          background: currentPage === totalPages ? "#f3f4f6" : "white",
                          color: currentPage === totalPages ? "#9ca3af" : "#374151",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        Sau
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        <div className="back-link-container">
          <Link to="/" className="back-link">
            ← Quay lại trang chủ
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="proceedings-footer">
        <span>
          © {new Date().getFullYear()} Hệ thống quản lý hội nghị khoa học - Trường Đại học Giao thông Vận tải
        </span>
      </footer>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default PublicProceedings;
