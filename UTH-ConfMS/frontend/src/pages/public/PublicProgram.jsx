import React from "react";

const PublicProgram = () => {
  const program = [
    {
      time: "08:00 - 08:30",
      title: "Registration & Welcome Coffee",
      room: "Main Hall",
    },
    {
      time: "08:30 - 09:15",
      title: "Opening Ceremony & Keynote Speech",
      room: "Hall A",
    },
    {
      time: "09:30 - 11:30",
      title: "Technical Session 1: AI & Machine Learning",
      room: "Room 201",
    },
    {
      time: "13:30 - 15:30",
      title: "Technical Session 2: IoT & Smart Systems",
      room: "Room 202",
    },
    {
      time: "16:00 - 17:00",
      title: "Panel Discussion & Closing",
      room: "Hall A",
    },
  ];

  return (
    <div>
      {/* ===== Header ===== */}
      <div className="public-header">
        <div className="public-header-box">
          <h1 className="public-title">📅 Conference Program</h1>
          <p className="public-subtitle">
            Explore the full schedule of sessions, keynotes and activities
          </p>
        </div>
      </div>

      {/* ===== Timeline ===== */}
      <div className="timeline-container">
        <div className="timeline-line"></div>

        {program.map((item, index) => (
          <div
            key={index}
            className={`timeline-item ${index % 2 === 0 ? "left" : "right"}`}
            style={{ animationDelay: `${index * 0.25}s` }}
          >
            <div className="timeline-dot"></div>

            <div className="timeline-card">
              <p className="timeline-title">{item.title}</p>

              <p className="timeline-info">🕒 {item.time}</p>

              <p className="timeline-info">📍 {item.room}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PublicProgram;
