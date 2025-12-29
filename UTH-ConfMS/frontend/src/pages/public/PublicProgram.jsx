import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import apiClient from "../../apiClient";
import logoUth from "../../assets/logoUTH.jpg";
import "../../styles/PublicProgram.css";

const PublicProgram = () => {
  const { conferenceId } = useParams();
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState("");
  const [program, setProgram] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
              <Link to="/" className="nav-link">Trang chủ</Link>
              <Link to="/login" className="nav-link">Đăng nhập</Link>
            </nav>
          </header>
        </div>

        <div className="program-hero">
          <div className="hero-content">
            <h1>CHƯƠNG TRÌNH HỘI NGHỊ</h1>
            <p>Lịch trình các phiên trình bày và hoạt động</p>
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
            <Link to="/" className="nav-link">Trang chủ</Link>
            <Link to="/login" className="nav-link">Đăng nhập</Link>
          </nav>
        </header>
      </div>

      {/* Hero Banner */}
      <div className="program-hero">
        <div className="hero-content">
          <h1>CHƯƠNG TRÌNH HỘI NGHỊ</h1>
          <p>Lịch trình các phiên trình bày và hoạt động</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="program-container">
        {/* Conference Selector */}
        {conferences.length > 1 && (
          <div className="conference-selector">
            <label>Chọn hội nghị:</label>
            <select value={selectedConference} onChange={handleConferenceChange}>
              {conferences.map((conf) => (
                <option key={conf.id} value={conf.id}>
                  {conf.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {!error && program.length > 0 && (
          <div className="program-list">
            {program.map((session, index) => (
              <div key={index} className="session-card">
                <div className="session-header">
                  <div className="session-info">
                    <h2 className="session-title">{session.trackName}</h2>
                    {session.trackDescription && (
                      <p className="session-description">{session.trackDescription}</p>
                    )}
                  </div>
                  {(session.sessionDate || session.sessionTime || session.room) && (
                    <div className="session-meta">
                      {session.sessionDate && (
                        <div className="session-date">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"/>
                          </svg>
                          {formatDisplayDate(session.sessionDate)}
                        </div>
                      )}
                      {session.sessionTime && (
                        <div className="session-time">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm1-6V6H9v5h5V9h-3z"/>
                          </svg>
                          {session.sessionTime}
                        </div>
                      )}
                      {session.room && (
                        <div className="session-room">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 2L2 7v11h6v-6h4v6h6V7l-8-5z"/>
                          </svg>
                          {session.room}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="papers-list">
                  {session.papers.map((paper, paperIndex) => (
                    <div key={paper.paperId} className="paper-item">
                      <div className="paper-number">{paperIndex + 1}</div>
                      <div className="paper-details">
                        <h3 className="paper-title">{paper.title}</h3>
                        <div className="paper-authors">
                          <span className="author-label">Tác giả:</span> {paper.authorName}
                          {paper.coAuthors && `, ${paper.coAuthors}`}
                        </div>
                        <div className="paper-meta">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M3 3h10a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1zm1 2v6h8V5H4z"/>
                          </svg>
                          Bài số {paperIndex + 1} / {session.papers.length}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!error && program.length === 0 && !loading && (
          <div className="empty-state">
            Chưa có chương trình nào được công bố.
          </div>
        )}

        <div className="back-link-container">
          <Link to="/" className="back-link">
            ← Quay lại trang chủ
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="program-footer">
        <span>
          © {new Date().getFullYear()} Hệ thống quản lý hội nghị khoa học - Trường Đại học Giao thông Vận tải
        </span>
      </footer>
    </div>
  );
};

export default PublicProgram;
