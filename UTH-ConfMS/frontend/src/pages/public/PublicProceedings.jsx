import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import apiClient from "../../apiClient";
import logoUth from "../../assets/logoUTH.jpg";
import "../../styles/PublicProceedings.css";

const PublicProceedings = () => {
  const { conferenceId } = useParams();
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState("");
  const [proceedings, setProceedings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupByTrack, setGroupByTrack] = useState(true);

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
      
      // Nếu không có conferenceId từ URL, chọn conference đầu tiên
      if (!conferenceId && response.data && response.data.length > 0) {
        const firstConfId = response.data[0].id;
        setSelectedConference(firstConfId);
        fetchProceedings(firstConfId);
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

  const fetchProceedings = async (confId) => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching proceedings for conference:", confId);
      console.log("API URL:", `/proceedings/${confId}`);
      
      const response = await apiClient.get(`/proceedings/${confId}`, {
        skipAuth: true,
      });
      
      console.log("Proceedings response:", response.data);
      console.log("Number of proceedings:", response.data.length);
      
      setProceedings(response.data);
    } catch (err) {
      console.error("Error fetching proceedings:", err);
      console.error("Error response:", err.response);
      console.error("Error status:", err.response?.status);
      console.error("Error data:", err.response?.data);
      
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
    if (confId) {
      fetchProceedings(confId);
    }
  };

  const handleDownload = async (paperId, title) => {
    try {
      console.log("Downloading paper:", paperId, title);
      const response = await apiClient.get(`/proceedings/download/${paperId}`, {
        responseType: "blob",
        skipAuth: true,
      });

      console.log("Download response:", response);
      console.log("Response type:", response.headers['content-type']);
      console.log("Response size:", response.data.size);

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
      console.error("Error response:", err.response);
      console.error("Error status:", err.response?.status);
      console.error("Error data:", err.response?.data);
      
      let errorMessage = "Không thể tải xuống file. ";
      
      // Nếu response là JSON error từ backend
      if (err.response?.data) {
        try {
          // Nếu data là Blob, convert sang text
          if (err.response.data instanceof Blob) {
            const text = await err.response.data.text();
            const errorData = JSON.parse(text);
            errorMessage += errorData.error || "Vui lòng thử lại sau.";
          } else if (typeof err.response.data === 'object') {
            errorMessage += err.response.data.error || "Vui lòng thử lại sau.";
          } else {
            errorMessage += err.response.data;
          }
        } catch (parseErr) {
          errorMessage += "Vui lòng thử lại sau.";
        }
      } else {
        errorMessage += "Vui lòng thử lại sau.";
      }
      
      alert(errorMessage);
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

  if (loading) {
    return (
      <div className="public-proceedings-page">
        <div className="portal-header-container">
          <header className="portal-header">
            <div className="portal-logo">
              <img
                src={logoUth}
                alt="UTH Logo"
                className="portal-logo-img"
                style={{
                  height: "190px",
                  width: "auto",
                  marginRight: "0px",
                  mixBlendMode: "multiply",
                }}
              />
              <div className="portal-logo-text">
                <div className="portal-logo-title">UTH-CONFMS</div>
                <div className="portal-logo-subtitle">
                  Conference Proceedings
                </div>
              </div>
            </div>
            <nav className="portal-nav">
              <Link to="/" className="nav-link">
                Trang chủ
              </Link>
              <Link to="/login" className="nav-link">
                Đăng nhập
              </Link>
            </nav>
          </header>
        </div>
        <section className="proceedings-hero">
          <h1>Conference Proceedings</h1>
          <p>Kỷ yếu hội nghị - Danh sách các bài báo đã được chấp nhận</p>
        </section>
        <section className="proceedings-content">
          <div className="loading-state">Đang tải...</div>
        </section>
      </div>
    );
  }

  return (
    <div className="public-proceedings-page">
      <div className="portal-header-container">
        <header className="portal-header">
          <div className="portal-logo">
            <img
              src={logoUth}
              alt="UTH Logo"
              className="portal-logo-img"
              style={{
                height: "190px",
                width: "auto",
                marginRight: "0px",
                mixBlendMode: "multiply",
              }}
            />
            <div className="portal-logo-text">
              <div className="portal-logo-title">UTH-CONFMS</div>
              <div className="portal-logo-subtitle">
                Conference Proceedings
              </div>
            </div>
          </div>
          <nav className="portal-nav">
            <Link to="/" className="nav-link">
              Trang chủ
            </Link>
            <Link to="/login" className="nav-link">
              Đăng nhập
            </Link>
          </nav>
        </header>
      </div>

      <section className="proceedings-hero">
        <h1>Conference Proceedings</h1>
        <p>Kỷ yếu hội nghị - Danh sách các bài báo đã được chấp nhận</p>
      </section>

      <section className="proceedings-content">
        {/* Conference Selector */}
        {conferences.length > 1 && (
          <div style={{
            marginBottom: "2rem",
            padding: "1rem",
            background: "#f6f8f8",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap"
          }}>
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
              {conferences.map((conf) => (
                <option key={conf.id} value={conf.id}>
                  {conf.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {!error && proceedings.length === 0 && !loading && (
          <div className="empty-state">
            Chưa có bài báo nào được công bố trong kỷ yếu.
          </div>
        )}

        {!error && proceedings.length > 0 && (
          <>
            <div className="proceedings-controls">
              <div className="proceedings-stats">
                <span className="stat-badge">
                  Tổng số: <strong>{proceedings.length}</strong> bài báo
                </span>
                <span className="stat-badge">
                  Tracks: <strong>{Object.keys(groupedProceedings()).length}</strong>
                </span>
              </div>
              <button
                className="btn-toggle"
                onClick={() => setGroupByTrack(!groupByTrack)}
              >
                {groupByTrack ? "Hiển thị tất cả" : "Nhóm theo Track"}
              </button>
            </div>

            {Object.entries(groupedProceedings()).map(([track, papers]) => (
              <div key={track} className="track-section">
                {groupByTrack && (
                  <h2 className="track-title">
                    {track} <span className="track-count">({papers.length})</span>
                  </h2>
                )}

                <div className="proceedings-table-wrapper">
                  <table className="proceedings-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Tiêu đề</th>
                        <th>Tác giả</th>
                        <th>Đồng tác giả</th>
                        {!groupByTrack && <th>Track</th>}
                        <th>Tải xuống</th>
                      </tr>
                    </thead>
                    <tbody>
                      {papers.map((paper, index) => (
                        <tr key={paper.paperId}>
                          <td>{index + 1}</td>
                          <td className="paper-title">{paper.title}</td>
                          <td>{paper.authorName}</td>
                          <td className="co-authors">{paper.coAuthors || "-"}</td>
                          {!groupByTrack && <td>{paper.trackName}</td>}
                          <td>
                            {(paper.pdfUrl && paper.pdfUrl.trim() !== "") ? (
                              <button
                                className="btn-download"
                                onClick={() =>
                                  handleDownload(paper.paperId, paper.title)
                                }
                              >
                                📄 PDF
                              </button>
                            ) : (
                              <span className="no-pdf">-</span>
                            )}
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

        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <Link to="/" className="btn-secondary">
            ← Quay lại cổng thông tin hội nghị
          </Link>
        </div>
      </section>

      <footer className="portal-footer">
        <span>
          © {new Date().getFullYear()} UTH-ConfMS. Hệ thống quản lý hội nghị
          nghiên cứu khoa học UTH.
        </span>
      </footer>
    </div>
  );
};

export default PublicProceedings;
