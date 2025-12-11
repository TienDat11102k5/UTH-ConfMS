// src/pages/author/AuthorSubmissionsPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/Layout/DashboardLayout.jsx";

const AuthorSubmissionsPage = () => {
  // Sau này sẽ load dữ liệu thật từ API:
  // const [submissions, setSubmissions] = useState([]);

  const submissions = []; // tạm thời để bảng hiển thị trạng thái trống

  return (
    <DashboardLayout
      roleLabel="Author"
      title="Danh sách bài đã nộp"
      subtitle="Xem và quản lý tất cả submission mà bạn là tác giả hoặc đồng tác giả."
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <Link to="/author" className="breadcrumb-link">
              Author Dashboard
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Submissions</span>
          </div>
          <h2 className="data-page-title">Submissions của tôi</h2>
          <p className="data-page-subtitle">
            Mỗi hàng tương ứng một submission; sau này sẽ có trạng thái review, quyết định
            và vòng camera-ready.
          </p>
        </div>

        <div className="data-page-header-right">
          <Link to="/author/submit" className="btn-primary">
            + Nộp bài mới
          </Link>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="simple-table">
          <thead>
            <tr>
              <th>Mã bài</th>
              <th>Tiêu đề</th>
              <th>Track / Topic</th>
              <th>Trạng thái</th>
              <th>Decision</th>
              <th>Cập nhật cuối</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  Chưa có submission nào. Nhấn{" "}
                  <Link to="/author/submit" className="link-inline">
                    “Nộp bài mới”
                  </Link>{" "}
                  để tạo submission đầu tiên.
                </td>
              </tr>
            ) : (
              submissions.map((s) => (
                <tr key={s.id}>
                  <td>{s.code}</td>
                  <td>{s.title}</td>
                  <td>{s.trackName}</td>
                  <td>{s.status}</td>
                  <td>{s.decision || "-"}</td>
                  <td>{s.lastUpdated}</td>
                  <td>
                    <button className="btn-secondary table-action">
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default AuthorSubmissionsPage;
