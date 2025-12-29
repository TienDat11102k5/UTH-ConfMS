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
  const [filteredProceedings, setFilteredProceedings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("all");
  const [expandedPapers, setExpandedPapers] = useState({});

  useEffect(() => {
    fetchConferences();
  }, []);

  useEffect(() => {
    if (conferenceId) {
      setSelectedConference(conferenceId);
      fetchProceedings(conferenceId);
    }
  }, [conferenceId]);

  useEffect(() => {
    filterProceedings();
  }, [proceedings, searchQuery, selectedTrack]);

  const fetchConferences = async () => {
    try {
      const response = await apiClient.get("/conferences", { skipAuth: true });
      setConferences(response.data);
      
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
      
      const response = await apiClient.get(`/proceedings/${confId}`, {
        skipAuth: true,
      });
      
      setProceedings(response.data);
      setFilteredProceedings(response.data);
    } catch (err) {
      console.error("Error fetching proceedings:", err);
      
      if (err.response?.status === 404) {
        setError("Không tìm thấy hội nghị này.");
      } else {
        setError("Không thể tải danh sách kỷ yếu. Vui lòng thử lại sau.");
      }
      setProceedings([]);
      setFilteredProceedings([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProceedings = () => {
    let filtered = [...proceedings];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (paper) =>
          paper.title.toLowerCase().includes(query) ||
          paper.authorName.toLowerCase().includes(query) ||
          (paper.coAuthors && paper.coAuthors.toLowerCase().includes(query)) ||
          (paper.abstractText && paper.abstractText.toLowerCase().includes(query))
      );
    }

    // Filter by track
    if (selectedTrack !== "all") {
      filtered = filtered.filter((paper) => paper.trackName === selectedTrack);
    }

    setFilteredProceedings(filtered);
  };

  const handleConferenceChange = (e) => {
    const confId = e.target.value;
    setSelectedConference(confId);
    setSearchQuery("");
    setSelectedTrack("all");
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
      
      let errorMessage = "Không thể tải xuống file. ";
      
      // Parse error message from backend
      if (err.response?.data) {
        try {
          if (err.response.data instanceof Blob) {
            const text = await err.response.data.text();
            const errorData = JSON.parse(text);
            errorMessage += errorData.error || "File không tồn tại hoặc không thể truy cập.";
          } else if (typeof err.response.data === 'object') {
            errorMessage += err.response.data.error || "File không tồn tại hoặc không thể truy cập.";
          } else {
            errorMessage += err.response.data;
          }
        } catch (parseErr) {
          errorMessage += "File không tồn tại hoặc không thể truy cập.";
        }
      } else {
        errorMessage += "Vui lòng thử lại sau.";
      }
      
      alert(errorMessage);
    }
  };

  const toggleExpand = (paperId) => {
    setExpandedPapers((prev) => ({
      ...prev,
      [paperId]: !prev[paperId],
    }));
  };

  const getUniqueTracks = () => {
    const tracks = [...new Set(proceedings.map((p) => p.trackName).filter(Boolean))];
    return tracks.sort();
  };

  const truncateText = (text, maxLength = 200) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div className="proceedings-page-modern">
        <div className="proceedings-header">
          <div className="header-content">
            <div className="logo-section">
              <img src={logoUth} alt="UTH Logo" className="uth-logo" />
              <div className="logo-text">
                <div className="logo-title">UTH-CONFMS</div>
                <div className="logo-subtitle">CONFERENCE PROCEEDINGS</div>
              </div>
            </div>
            <nav className="header-nav">
              <Link to="/" className="nav-link">Trang chủ</Link>
              <Link to="/login" className="nav-link">Đăng nhập</Link>
            </nav>
          </div>
        </div>

        <div className="hero-banner">
          <h1>Conference Proceedings</h1>
          <p>Kỷ yếu hội nghị - Danh sách các bài báo đã được chấp nhận</p>
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
      <div className="portal-header-container">
        <header className="portal-header">
          <div className="portal-logo">
            <img
              src={logoUth}
              alt="Logo UTH"
              className="portal-logo-img"
              style={{
                height: "190px",
                width: "auto",
                marginRight: "0px",
                mixBlendMode: "multiply",
              }}
            />
            <div className="portal-logo-text">
              <div className="portal-logo-title">HỆ THỐNG QUẢN LÝ HỘI NGHỊ KHOA HỌC</div>
              <div className="portal-logo-subtitle">
                Trường Đại học Giao thông Vận tải
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

      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-content">
          <h1>KỶ YẾU HỘI NGHỊ KHOA HỌC</h1>
          <p>Danh sách các bài báo đã được chấp nhận công bố</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="proceedings-container">
        {/* Unified Filter Bar */}
        <div className="unified-filter-bar">
          {/* Conference Selector */}
          {conferences.length > 1 && (
            <div className="filter-group">
              <label>Hội nghị:</label>
              <select value={selectedConference} onChange={handleConferenceChange}>
                {conferences.map((conf) => (
                  <option key={conf.id} value={conf.id}>
                    {conf.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Track Filter */}
          <div className="filter-group">
            <label>Chủ đề:</label>
            <select value={selectedTrack} onChange={(e) => setSelectedTrack(e.target.value)}>
              <option value="all">Tất cả chủ đề</option>
              {getUniqueTracks().map((track) => (
                <option key={track} value={track}>
                  {track}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="filter-group search-group">
            <label>Tìm kiếm:</label>
            <div className="search-input-wrapper">
              <svg className="search-icon" width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Nhập tiêu đề, tác giả hoặc nội dung..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {!error && proceedings.length > 0 && (
          <>
            {/* Results Count */}
            <div className="results-info">
              Hiển thị <strong>{filteredProceedings.length}</strong> / {proceedings.length} bài báo
            </div>

            {/* Papers List */}
            {filteredProceedings.length === 0 ? (
              <div className="empty-results">
                Không tìm thấy bài báo phù hợp với tiêu chí tìm kiếm.
              </div>
            ) : (
              <div className="papers-list">
                {filteredProceedings.map((paper, index) => (
                  <div key={paper.paperId} className="paper-card">
                    <div className="paper-number">{index + 1}</div>
                    
                    <div className="paper-content">
                      <h3 className="paper-title">{paper.title}</h3>
                      
                      <div className="paper-authors">
                        {paper.authorName}
                        {paper.coAuthors && `, ${paper.coAuthors}`}
                      </div>

                      {paper.abstractText && (
                        <div className="paper-abstract">
                          <p>
                            {expandedPapers[paper.paperId]
                              ? paper.abstractText
                              : truncateText(paper.abstractText, 200)}
                          </p>
                          {paper.abstractText.length > 200 && (
                            <button
                              className="show-more-btn"
                              onClick={() => toggleExpand(paper.paperId)}
                            >
                              {expandedPapers[paper.paperId] ? "Thu gọn" : "Xem thêm"}
                            </button>
                          )}
                        </div>
                      )}

                      <div className="paper-footer">
                        <span className="track-badge">{paper.trackName || "Other"}</span>
                        
                        {paper.pdfUrl && paper.pdfUrl.trim() !== "" ? (
                          <button
                            className="pdf-download-btn"
                            onClick={() => handleDownload(paper.paperId, paper.title)}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M8 12L3 7h3V1h4v6h3l-5 5z"/>
                              <path d="M1 14h14v2H1z"/>
                            </svg>
                            PDF
                          </button>
                        ) : (
                          <span className="no-pdf-badge">Chưa có file</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!error && proceedings.length === 0 && !loading && (
          <div className="empty-state">
            Chưa có bài báo nào được công bố trong kỷ yếu.
          </div>
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
