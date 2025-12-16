import React from "react";
import { Link } from "react-router-dom";
import "../../styles/PublicAcceptedPapers.css";

const PublicAcceptedPapers = () => {
  return (
    <div className="public-accepted-page">
      <section className="accepted-hero">
        <h1>Accepted Papers</h1>
        <p>
          Danh sách các bài báo được chấp nhận tại Hội nghị Khoa học Công nghệ
          UTH 2025.
        </p>
      </section>

      <section className="accepted-content">
        <div className="accepted-table-wrapper">
          <table className="accepted-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên bài báo</th>
                <th>Tác giả</th>
                <th>Đơn vị</th>
                <th>Chủ đề</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="5" className="empty-row">
                  Chưa có bài báo được công bố.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <Link to="/" className="btn-secondary">
            ← Quay lại cổng thông tin hội nghị
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PublicAcceptedPapers;
