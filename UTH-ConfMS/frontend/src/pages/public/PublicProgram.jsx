import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import apiClient from "../../apiClient";
import PortalHeader from "../../components/PortalHeader";
import { FiCalendar, FiClock, FiMapPin, FiLayers, FiSearch } from "react-icons/fi";
import "../../styles/PublicProgram.css";

const PublicProgram = () => {
  const { conferenceId } = useParams();
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState("");
  const [program, setProgram] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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
      fetchProgram(conferenceId);
    }
  }, [conferenceId]);

  const fetchConferences = async () => {
    try {
      const response = await apiClient.get("/conferences", { skipAuth: true });
      setConferences(response.data);

      if (!conferenceId && response.data && response.data.length > 0) {
        const firstConfId = response.data[0].id;
        setSelectedConference(firstConfId);
        fetchProgram(firstConfId);
      } else if (!conferenceId && (!response.data || response.data.length === 0)) {
        setLoading(false);
        setError("Chưa có hội nghị nào trong hệ thống.");
      }
    } catch (err) {
      console.error("Error fetching conferences:", err);
      setError("Không thể tải danh sách hội nghị.");
      setLoading(false);
    }
  };

  const fetchProgram = async (confId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/proceedings/program/${confId}`, {
        skipAuth: true,
      });

      setProgram(response.data);
    } catch (err) {
      console.error("Error fetching program:", err);

      if (err.response?.status === 404) {
        setError("Không tìm thấy chương trình hội nghị.");
      } else {
        setError("Không thể tải chương trình. Vui lòng thử lại sau.");
      }
      setProgram([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConferenceChange = (e) => {
    const confId = e.target.value;
    setSelectedConference(confId);
    if (confId) {
      fetchProgram(confId);
    }
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    // Nếu là format YYYY-MM-DD, chuyển sang DD/MM/YYYY
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  if (loading) {
    return (
      <div className="program-page">
        <PortalHeader
          title="UTH Conference Portal · Program"
          ctaHref="/proceedings"
          ctaText="Xem kỷ yếu"
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
              Chương trình hội nghị
            </h1>
            <p style={{
              fontSize: "1.0625rem",
              color: "#64748b",
              fontWeight: 500,
              margin: 0,
              letterSpacing: "0.01em"
            }}>
              Lịch trình các phiên trình bày và hoạt động
            </p>
          </div>
        </div>

        <div className="program-container">
          <div className="loading-state">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="program-page">
      {/* Header */}
      <PortalHeader
        title="UTH Conference Portal · Program"
        ctaHref="/proceedings"
        ctaText="Xem kỷ yếu"
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
            <FiCalendar size={40} style={{ color: "white" }} />
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
            Chương trình hội nghị
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
              Lịch trình các phiên trình bày và hoạt động
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="program-container">
        {/* Statistics Summary */}
        {program.length > 0 && (
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
                <FiLayers size={24} />
                <span style={{ fontSize: "0.875rem", opacity: 0.9, fontWeight: 500 }}>Tổng số phiên</span>
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700 }}>{program.length}</div>
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
                <FiCalendar size={24} />
                <span style={{ fontSize: "0.875rem", opacity: 0.9, fontWeight: 500 }}>Tổng số bài báo</span>
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700 }}>
                {program.reduce((total, session) => total + session.papers.length, 0)}
              </div>
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
                <FiMapPin size={24} />
                <span style={{ fontSize: "0.875rem", opacity: 0.9, fontWeight: 500 }}>Địa điểm</span>
              </div>
              <div style={{ fontSize: "1.125rem", fontWeight: 700 }}>
                {[...new Set(program.map(s => s.room).filter(Boolean))].length || "N/A"} phòng
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        {program.length > 0 && (
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
              display: "flex",
              alignItems: "center",
              gap: "0.375rem"
            }}>
              <FiSearch size={14} />
              Tìm kiếm bài báo:
            </label>
            <input
              type="text"
              placeholder="Nhập tiêu đề bài báo hoặc tên tác giả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.625rem 0.875rem",
                borderRadius: "8px",
                border: "1.5px solid #e2e8f0",
                fontSize: "0.875rem",
                background: "white",
                color: "#475569",
              }}
            />
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
              {conferences.map((conf) => (
                <option key={conf.id} value={conf.id}>
                  {conf.name}
                </option>
              ))}
            </select>
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

        {!error && program.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {program.filter(session => {
              if (!searchQuery.trim()) return true;
              const query = searchQuery.toLowerCase();
              return session.papers.some(paper => 
                paper.title?.toLowerCase().includes(query) ||
                paper.authorName?.toLowerCase().includes(query) ||
                paper.coAuthors?.toLowerCase().includes(query)
              );
            }).map((session, index) => {
              // Filter papers within session
              const filteredPapers = searchQuery.trim() 
                ? session.papers.filter(paper => {
                    const query = searchQuery.toLowerCase();
                    return paper.title?.toLowerCase().includes(query) ||
                      paper.authorName?.toLowerCase().includes(query) ||
                      paper.coAuthors?.toLowerCase().includes(query);
                  })
                : session.papers;

              return (
              <div key={index} style={{
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
                overflow: "hidden",
                border: "1px solid #e5e7eb"
              }}>
                {/* Session Header */}
                <div style={{
                  background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
                  padding: "1.25rem 1.5rem",
                  color: "white"
                }}>
                  <h2 style={{
                    fontSize: "1.375rem",
                    fontWeight: 700,
                    margin: "0 0 0.5rem 0",
                    letterSpacing: "-0.01em"
                  }}>
                    {session.trackName}
                  </h2>
                  {session.trackDescription && (
                    <p style={{
                      fontSize: "0.9375rem",
                      margin: "0 0 1rem 0",
                      opacity: 0.95,
                      lineHeight: 1.5
                    }}>
                      {session.trackDescription}
                    </p>
                  )}

                  {(session.sessionDate || session.sessionTime || session.room) && (
                    <div style={{
                      display: "flex",
                      gap: "1.5rem",
                      flexWrap: "wrap",
                      fontSize: "0.875rem",
                      fontWeight: 600
                    }}>
                      {session.sessionDate && (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          background: "rgba(255, 255, 255, 0.2)",
                          padding: "0.375rem 0.75rem",
                          borderRadius: "6px"
                        }}>
                          <FiCalendar size={16} />
                          {formatDisplayDate(session.sessionDate)}
                        </div>
                      )}
                      {session.sessionTime && (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          background: "rgba(255, 255, 255, 0.2)",
                          padding: "0.375rem 0.75rem",
                          borderRadius: "6px"
                        }}>
                          <FiClock size={16} />
                          {session.sessionTime}
                        </div>
                      )}
                      {session.room && (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          background: "rgba(255, 255, 255, 0.2)",
                          padding: "0.375rem 0.75rem",
                          borderRadius: "6px"
                        }}>
                          <FiMapPin size={16} />
                          {session.room}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Papers List */}
                <div style={{ padding: "1.5rem" }}>
                  <div style={{
                    marginBottom: "1rem",
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    fontWeight: 600
                  }}>
                    {filteredPapers.length} bài báo
                    {searchQuery.trim() && filteredPapers.length !== session.papers.length && (
                      <span style={{ color: "#0d9488", marginLeft: "0.5rem" }}>
                        (đã lọc từ {session.papers.length})
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {filteredPapers.map((paper, paperIndex) => (
                      <div key={paper.paperId} style={{
                        padding: "1rem",
                        background: "#f9fafb",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        display: "flex",
                        gap: "1rem"
                      }}>
                        <div style={{
                          minWidth: "36px",
                          height: "36px",
                          background: "linear-gradient(135deg, #008689, #00a8ac)",
                          color: "white",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "0.9375rem"
                        }}>
                          {paperIndex + 1}
                        </div>

                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            fontSize: "1rem",
                            fontWeight: 600,
                            color: "#008689",
                            margin: "0 0 0.5rem 0",
                            lineHeight: 1.4
                          }}>
                            {paper.title}
                          </h3>
                          <div style={{
                            fontSize: "0.875rem",
                            color: "#6b7280",
                            lineHeight: 1.5
                          }}>
                            <span style={{ fontWeight: 600, color: "#475569" }}>Tác giả:</span> {paper.authorName}
                            {paper.coAuthors && `, ${paper.coAuthors}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}

        {!error && program.length === 0 && !loading && (
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "3rem",
            textAlign: "center",
            color: "#6b7280",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
          }}>
            Chưa có chương trình nào được công bố.
          </div>
        )}

        <div style={{
          marginTop: "2rem",
          textAlign: "center"
        }}>
          <Link to="/" style={{
            color: "#0d9488",
            textDecoration: "none",
            fontSize: "0.9375rem",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "color 0.2s ease"
          }}
            onMouseOver={(e) => e.currentTarget.style.color = "#14b8a6"}
            onMouseOut={(e) => e.currentTarget.style.color = "#0d9488"}
          >
            ← Quay lại trang chủ
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        background: "#f9fafb",
        borderTop: "1px solid #e5e7eb",
        padding: "1.5rem 2rem",
        marginTop: "3rem",
        textAlign: "center"
      }}>
        <span style={{
          fontSize: "0.875rem",
          color: "#6b7280"
        }}>
          © {new Date().getFullYear()} Hệ thống quản lý hội nghị khoa học - Trường Đại học Giao thông Vận tải
        </span>
      </footer>
    </div>
  );
};

export default PublicProgram;
