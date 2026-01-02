import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import apiClient from "../../apiClient";
import logoUth from "../../assets/logoUTH.jpg";
import UserProfileDropdown from "../../components/UserProfileDropdown";
import { FiDownload, FiFilter, FiSearch } from "react-icons/fi";
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
      const response = await apiClient.get("/conferences", { skipAuth: true });
      setConferences(response.data);
      
      if (conferenceId) {
        setSelectedConference(conferenceId);
        fetchProceedings(conferenceId);
      } else if (response.data && response.data.length > 0) {
        // Load all conferences by default
        setSelectedConference("");
        fetchAllProceedings(response.data);
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
      
      const allProceedings = [];
      for (const conf of confs) {
        try {
          const response = await apiClient.get(`/proceedings/${conf.id}`, {
            skipAuth: true,
          });
          allProceedings.push(...response.data);
        } catch (err) {
          console.error(`Error fetching proceedings for conference ${conf.id}:`, err);
        }
      }
      
      setProceedings(allProceedings);
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
      // Load all conferences
      fetchAllProceedings(conferences);
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
      alert("Không thể tải xuống file. Vui lòng thử lại sau.");
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
        <div style={{
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)"
        }}>
          <header style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "1rem 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem"
            }}>
              <img
                src={logoUth}
                alt="Logo UTH"
                style={{
                  height: "60px",
                  width: "auto",
                  mixBlendMode: "multiply"
                }}
              />
              <div>
                <div style={{
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "#0d9488",
                  lineHeight: 1.2,
                  marginBottom: "0.25rem"
                }}>
                  HỆ THỐNG QUẢN LÝ HỘI NGHỊ KHOA HỌC
                </div>
                <div style={{
                  fontSize: "0.8125rem",
                  color: "#64748b",
                  fontWeight: 500
                }}>
                  Trường Đại học Giao thông Vận tải
                </div>
              </div>
            </div>
            <nav style={{
              display: "flex",
              gap: "1.5rem",
              alignItems: "center"
            }}>
              <Link to="/" style={{
                color: "#475569",
                textDecoration: "none",
                fontSize: "0.9375rem",
                fontWeight: 600
              }}>Trang chủ</Link>
              {currentUser ? (
                <UserProfileDropdown />
              ) : (
                <Link to="/login" style={{
                  color: "#475569",
                  textDecoration: "none",
                  fontSize: "0.9375rem",
                  fontWeight: 600
                }}>Đăng nhập</Link>
              )}
            </nav>
          </header>
        </div>

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
      <div style={{
        background: "white",
        borderBottom: "1px solid #e5e7eb",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)"
      }}>
        <header style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem"
          }}>
            <img
              src={logoUth}
              alt="Logo UTH"
              style={{
                height: "60px",
                width: "auto",
                mixBlendMode: "multiply"
              }}
            />
            <div>
              <div style={{
                fontSize: "1.125rem",
                fontWeight: 700,
                color: "#0d9488",
                lineHeight: 1.2,
                marginBottom: "0.25rem"
              }}>
                HỆ THỐNG QUẢN LÝ HỘI NGHỊ KHOA HỌC
              </div>
              <div style={{
                fontSize: "0.8125rem",
                color: "#64748b",
                fontWeight: 500
              }}>
                Trường Đại học Giao thông Vận tải
              </div>
            </div>
          </div>
          <nav style={{
            display: "flex",
            gap: "1.5rem",
            alignItems: "center"
          }}>
            <Link to="/" style={{
              color: "#475569",
              textDecoration: "none",
              fontSize: "0.9375rem",
              fontWeight: 600,
              transition: "color 0.2s ease"
            }}
            onMouseOver={(e) => e.currentTarget.style.color = "#0d9488"}
            onMouseOut={(e) => e.currentTarget.style.color = "#475569"}
            >
              Trang chủ
            </Link>
            {currentUser ? (
              <UserProfileDropdown />
            ) : (
              <Link to="/login" style={{
                color: "#475569",
                textDecoration: "none",
                fontSize: "0.9375rem",
                fontWeight: 600,
                transition: "color 0.2s ease"
              }}
              onMouseOver={(e) => e.currentTarget.style.color = "#0d9488"}
              onMouseOut={(e) => e.currentTarget.style.color = "#475569"}
              >
                Đăng nhập
              </Link>
            )}
          </nav>
        </header>
      </div>

      {/* Hero Banner */}
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

      {/* Main Content */}
      <div className="proceedings-container">
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
                                  marginBottom: "0.25rem",
                                  lineHeight: 1.4
                                }}>
                                  {paper.title}
                                </div>
                                {paper.abstractText && (
                                  <div style={{
                                    fontSize: "0.75rem",
                                    color: "#9ca3af",
                                    lineHeight: 1.4,
                                    marginTop: "0.25rem"
                                  }}>
                                    {paper.abstractText.length > 150 
                                      ? paper.abstractText.substring(0, 150) + "..." 
                                      : paper.abstractText}
                                  </div>
                                )}
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

                  {/* Pagination */}
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
    </div>
  );
};

export default PublicProceedings;
