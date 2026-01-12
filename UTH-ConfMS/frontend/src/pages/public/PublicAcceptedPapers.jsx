import React from "react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/EmptyState";
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
        <EmptyState
          icon="file"
          title="Chưa có bài báo được công bố"
          description="Danh sách các bài báo được chấp nhận sẽ được cập nhật sau khi hội nghị kết thúc."
          size="large"
        />

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
