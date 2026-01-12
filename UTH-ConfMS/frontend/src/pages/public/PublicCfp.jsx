import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  FiCalendar, 
  FiFileText, 
  FiUsers, 
  FiAward,
  FiBook,
  FiClock,
  FiCheckCircle,
  FiSend
} from "react-icons/fi";
import "../../styles/PublicCfp.css";

const PublicCfp = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("accessToken");

  const handleSubmitPaper = () => {
    if (isLoggedIn) {
      navigate("/author/submit");
    } else {
      navigate("/login");
    }
  };

  // Calculate days remaining until deadline
  const deadlineDate = new Date('2025-08-30');
  const today = new Date();
  const daysRemaining = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

  // Statistics data
  const stats = [
    { icon: FiFileText, label: "Topics", value: "5+", color: "#0d9488" },
    { icon: FiUsers, label: "Expected Authors", value: "100+", color: "#8b5cf6" },
    { icon: FiClock, label: "Days Remaining", value: daysRemaining > 0 ? daysRemaining : "Closed", color: "#f59e0b" }
  ];

  const topics = [
    "Trí tuệ nhân tạo & Machine Learning",
    "Khoa học dữ liệu & Big Data",
    "Công nghệ phần mềm",
    "An toàn thông tin",
    "Hệ thống thông tin & ERP"
  ];

  const timeline = [
    { date: "30/08/2025", event: "Hạn nộp bài", icon: FiSend },
    { date: "20/09/2025", event: "Thông báo kết quả", icon: FiCheckCircle },
    { date: "15/10/2025", event: "Hội nghị diễn ra", icon: FiAward }
  ];

  return (
    <div className="public-cfp-page">
      {/* Modern Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #2dd4bf 100%)',
        padding: '3rem 2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(40px)'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '150px',
          height: '150px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(40px)'
        }}></div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <FiBook style={{ fontSize: '2.5rem', color: 'white' }} />
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700',
              color: 'white',
              margin: 0
            }}>
              Call for Papers
            </h1>
          </div>
          <p style={{ 
            fontSize: '1.1rem', 
            color: 'rgba(255, 255, 255, 0.95)',
            maxWidth: '800px',
            lineHeight: '1.6',
            marginBottom: '1.5rem'
          }}>
            Hội nghị Khoa học Công nghệ UTH 2025 trân trọng kính mời các giảng viên,
            nhà nghiên cứu và sinh viên gửi bài tham gia.
          </p>
          <button 
            onClick={handleSubmitPaper}
            style={{
              background: 'white',
              color: '#0d9488',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
          >
            <FiSend /> Nộp bài ngay
          </button>
        </div>
      </div>

      {/* Statistics Summary */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '-2rem auto 2rem',
        padding: '0 2rem',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem'
        }}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
              >
                <div style={{
                  background: `linear-gradient(135deg, ${stat.color}, ${stat.color}dd)`,
                  padding: '1rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon style={{ fontSize: '1.5rem', color: 'white' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
                    {stat.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <section className="cfp-content">
        {/* Topics Section */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          marginBottom: '2rem'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
              padding: '0.75rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiBook style={{ fontSize: '1.25rem', color: 'white' }} />
            </div>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700',
              color: '#1e293b',
              margin: 0
            }}>
              Chủ đề (Topics)
            </h2>
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {topics.map((topic, index) => (
              <div key={index} style={{
                padding: '1rem',
                background: 'linear-gradient(to right, #f0fdfa, white)',
                borderLeft: '3px solid #14b8a6',
                borderRadius: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #ccfbf1, #f0fdfa)';
                e.currentTarget.style.paddingLeft = '1.5rem';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #f0fdfa, white)';
                e.currentTarget.style.paddingLeft = '1rem';
              }}
              >
                {topic}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Section */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          marginBottom: '2rem'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              padding: '0.75rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiCalendar style={{ fontSize: '1.25rem', color: 'white' }} />
            </div>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700',
              color: '#1e293b',
              margin: 0
            }}>
              Thời hạn quan trọng
            </h2>
          </div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {timeline.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.25rem',
                  background: 'linear-gradient(to right, #fffbeb, white)',
                  borderRadius: '8px',
                  border: '1px solid #fef3c7'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon style={{ fontSize: '1.25rem', color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: '0.25rem'
                    }}>
                      {item.event}
                    </div>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <FiClock style={{ fontSize: '0.875rem' }} />
                      {item.date}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Guidelines Section */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          marginBottom: '2rem'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
              padding: '0.75rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiFileText style={{ fontSize: '1.25rem', color: 'white' }} />
            </div>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700',
              color: '#1e293b',
              margin: 0
            }}>
              Hướng dẫn nộp bài
            </h2>
          </div>
          <div style={{ 
            padding: '1.5rem',
            background: 'linear-gradient(to right, #f0fdfa, white)',
            borderRadius: '8px',
            lineHeight: '1.8',
            color: '#334155'
          }}>
            <p style={{ marginBottom: '1rem' }}>
              Bài viết phải là công trình nghiên cứu gốc, chưa từng được công bố.
              Ngôn ngữ sử dụng: <strong>Tiếng Việt hoặc Tiếng Anh</strong>.
            </p>
            <p style={{ margin: 0 }}>
              Tác giả nộp bài thông qua hệ thống UTH-ConfMS và theo dõi phản biện
              trực tuyến.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={handleSubmitPaper}
            style={{
              background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
              color: 'white',
              border: 'none',
              padding: '0.875rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
          >
            <FiSend /> Nộp bài
          </button>
          <Link 
            to="/conferences"
            style={{
              background: 'white',
              color: '#0d9488',
              border: '2px solid #0d9488',
              padding: '0.875rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f0fdfa';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <FiUsers /> Xem danh sách hội nghị
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PublicCfp;
