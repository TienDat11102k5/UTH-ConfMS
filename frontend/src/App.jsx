import { useState, useEffect } from "react";
import "./App.css";

function App() {
  // 1. Tạo một cái biến để chứa lời nhắn từ Java
  const [message, setMessage] = useState("Đang chờ kết nối tới Backend...");

  // 2. Dùng useEffect để gọi điện ngay khi Web vừa hiện lên
  useEffect(() => {
    // Gọi sang số máy 8080 của Java
    fetch("http://localhost:8080/")
      .then((response) => {
        // Nếu Java nghe máy (OK) thì lấy tin nhắn
        if (response.ok) {
          return response.text();
        }
        throw new Error("Java không trả lời!");
      })
      .then((data) => {
        // Cập nhật tin nhắn lên màn hình
        setMessage(data);
      })
      .catch((error) => {
        // Nếu gọi không được
        setMessage("LỖI: Không kết nối được với Backend Java (Port 8080)!");
        console.error(error);
      });
  }, []);

  return (
    <div className="card">
      <h1>TEST KẾT NỐI HỆ THỐNG</h1>
      <p>Frontend (5173) đang gọi cho Backend (8080)...</p>

      <div
        style={{
          padding: "20px",
          border: "2px dashed red",
          marginTop: "20px",
          backgroundColor: "#242424",
          color: "white",
        }}
      >
        <h2>KẾT QUẢ TỪ SERVER:</h2>
        {/* Chỗ này sẽ hiện dòng chữ lấy từ Java */}
        <h3 style={{ color: "#61dafb" }}>{message}</h3>
      </div>
    </div>
  );
}

export default App;
