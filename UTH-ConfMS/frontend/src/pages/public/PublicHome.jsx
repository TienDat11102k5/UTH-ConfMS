import React from "react";
import { useTranslation } from "react-i18next";
import "../../styles/PublicHome.css";

const conferences = [
  { id: 1, title: "UTH Tech Conference 2026", date: "Jan 10-12, 2026", location: "UTH Campus" },
  { id: 2, title: "AI & Robotics Summit", date: "Feb 5-7, 2026", location: "Online" },
];

const programs = [
  { id: 1, title: "Keynote: Future of AI", speaker: "Dr. Nguyen Van A", time: "10:00 AM" },
  { id: 2, title: "Workshop: Cloud Computing", speaker: "Ms. Le Thi B", time: "2:00 PM" },
];

const news = [
  { id: 1, title: "Call for Papers is now open", date: "Dec 1, 2025" },
  { id: 2, title: "Early registration deadline approaching", date: "Dec 20, 2025" },
];

function PublicHome() {
  const { t } = useTranslation();

  return (
    <div className="public-home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>{t('public.publicHome.welcome')}</h1>
          <p>{t('public.publicHome.explore')}</p>
          <a href="#conferences" className="btn">{t('public.publicHome.viewConferences')}</a>
        </div>
      </section>

      {/* Conferences Section */}
      <section id="conferences" className="section">
        <h2>{t('public.publicHome.upcomingConferences')}</h2>
        <div className="cards">
          {conferences.map(c => (
            <div key={c.id} className="card">
              <h3>{c.title}</h3>
              <p><strong>{t('public.publicHome.date')}:</strong> {c.date}</p>
              <p><strong>{t('public.publicHome.location')}:</strong> {c.location}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="section">
        <h2>{t('public.publicHome.publicPrograms')}</h2>
        <div className="cards">
          {programs.map(p => (
            <div key={p.id} className="card">
              <h3>{p.title}</h3>
              <p><strong>{t('public.publicHome.speaker')}:</strong> {p.speaker}</p>
              <p><strong>{t('public.publicHome.time')}:</strong> {p.time}</p>
            </div>
          ))}
        </div>
      </section>

      {/* News Section */}
      <section id="news" className="section">
        <h2>{t('public.publicHome.newsAnnouncements')}</h2>
        <ul className="news-list">
          {news.map(n => (
            <li key={n.id}>
              <strong>{n.date}:</strong> {n.title}
            </li>
          ))}
        </ul>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} {t('public.publicHome.footerText')}</p>
        <p>{t('public.publicHome.contact')}</p>
      </footer>
    </div>
  );
}

export default PublicHome;

