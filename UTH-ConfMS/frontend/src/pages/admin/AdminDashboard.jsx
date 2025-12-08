// frontend/src/pages/admin/AdminDashboard.jsx
export default function AdminDashboard() {
  return (
    <div style={{ padding: 20, border: "5px solid red", borderRadius: 10 }}>
      <h1 style={{ color: "red" }}>🛑 KHU VỰC QUẢN TRỊ VIÊN (ADMIN)</h1>
      <p>Chỉ Admin mới nhìn thấy bảng này.</p>

      {/* Giả lập chức năng Admin */}
      <table border="1" style={{ width: "100%", marginTop: 20 }}>
        <thead>
          <tr style={{ background: "#ddd" }}>
            <th>User ID</th>
            <th>Tên</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>001</td>
            <td>Nguyễn Văn A</td>
            <td>
              <button>Xóa User</button>
            </td>
          </tr>
          <tr>
            <td>002</td>
            <td>Trần Thị B</td>
            <td>
              <button>Xóa User</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
