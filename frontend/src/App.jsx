import { useState, useEffect } from "react";

function App() {
  // 1. Biến lưu trạng thái kết nối Backend
  const [backendStatus, setBackendStatus] = useState("Đang dò tìm Server...");

  // 2. Biến lưu vai trò hiện tại (Mặc định là Khách)
  const [role, setRole] = useState("GUEST");

  // 3. Tự động gọi Backend khi vừa vào web
  useEffect(() => {
    // LƯU Ý: Gọi vào cổng 9090 (Do ông vừa đổi bên Docker)
    fetch("http://localhost:9090/api/auth/hello")
      .then((res) => {
        if (res.ok) return res.text();
        throw new Error("Lỗi phản hồi");
      })
      .then((data) => setBackendStatus("✅ KẾT NỐI THÀNH CÔNG: " + data))
      .catch((err) =>
        setBackendStatus("❌ MẤT KẾT NỐI: Kiểm tra lại Docker (Cổng 9090)!")
      );
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* --- PHẦN HEADER --- */}
      <div
        style={{
          marginBottom: "20px",
          borderBottom: "2px solid #ddd",
          paddingBottom: "10px",
        }}
      >
        <h1 style={{ color: "#0056b3" }}>UTH CONFERENCE SYSTEM</h1>
        <p>
          Trạng thái Server: <strong>{backendStatus}</strong>
        </p>
      </div>

      {/* --- PHẦN MENU GIẢ LẬP (Cho 5 thành viên test) --- */}
      <div
        style={{
          background: "#f4f4f4",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h3>👋 Chào mừng! Bạn muốn đóng vai ai?</h3>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setRole("ADMIN")} style={btnStyle}>
            Admin (Quản trị)
          </button>
          <button onClick={() => setRole("AUTHOR")} style={btnStyle}>
            Tác giả (Author)
          </button>
          <button onClick={() => setRole("REVIEWER")} style={btnStyle}>
            Người chấm (Reviewer)
          </button>
          <button onClick={() => setRole("CHAIR")} style={btnStyle}>
            Chủ tịch (Chair)
          </button>
          <button
            onClick={() => setRole("GUEST")}
            style={{ ...btnStyle, background: "#666" }}
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* --- PHẦN HIỂN THỊ NỘI DUNG THEO VAI TRÒ (ROUTER ẢO) --- */}
      <div
        style={{
          border: "1px dashed #999",
          padding: "30px",
          borderRadius: "8px",
          minHeight: "300px",
        }}
      >
        {role === "GUEST" && (
          <div style={{ textAlign: "center", color: "#555" }}>
            <h2>TRANG CHỦ (PUBLIC PORTAL)</h2>
            <p>Nơi xem tin tức hội nghị, danh sách bài báo...</p>
          </div>
        )}

        {role === "ADMIN" && (
          <div style={{ color: "red" }}>
            <h2>🔧 TRANG QUẢN TRỊ (ADMIN)</h2>
            <p>Khu vực cấu hình hệ thống, quản lý User.</p>
            <ul>
              <li>Quản lý Users (TP1)</li>
              <li>Cấu hình SMTP</li>
            </ul>
          </div>
        )}

        {role === "AUTHOR" && (
          <div style={{ color: "green" }}>
            <h2>✍️ TRANG TÁC GIẢ (AUTHOR)</h2>
            <p>Khu vực nộp bài báo và theo dõi kết quả.</p>
            <ul>
              <li>Nộp bài mới (TP3)</li>
              <li>Xem Review của bài đã nộp</li>
            </ul>
          </div>
        )}

        {role === "REVIEWER" && (
          <div style={{ color: "purple" }}>
            <h2>🧐 TRANG CHẤM THI (PC MEMBER)</h2>
            <p>Khu vực chấm điểm bài báo được phân công.</p>
            <ul>
              <li>Danh sách bài cần chấm (TP5)</li>
              <li>Nhập điểm và nhận xét</li>
            </ul>
          </div>
        )}

        {role === "CHAIR" && (
          <div style={{ color: "blue" }}>
            <h2>👑 TRANG CHỦ TỊCH (CHAIR)</h2>
            <p>Khu vực ra quyết định cuối cùng.</p>
            <ul>
              <li>Xem thống kê</li>
              <li>Quyết định Accept/Reject (TP6)</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// CSS nhanh cho nút bấm
const btnStyle = {
  padding: "10px 15px",
  cursor: "pointer",
  background: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "5px",
  fontWeight: "bold",
};

export default App;
