import React from "react";
import "../../styles/PublicProgram.css";
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
    <div className="program-page">
      {/* HEADER */}
      <section className="program-hero">
        <h1>Conference Program</h1>
        <p>Full agenda of sessions, keynotes and activities</p>
      </section>

      {/* AGENDA */}
      <section className="program-list">
        {program.map((item, index) => (
          <div key={index} className="program-card">
            <div className="program-time">{item.time}</div>

            <div className="program-content">
              <h3>{item.title}</h3>
              <span>📍 {item.room}</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default PublicProgram;
