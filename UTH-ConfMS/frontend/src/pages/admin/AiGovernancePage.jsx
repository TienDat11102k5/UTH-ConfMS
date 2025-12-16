import React, { useState } from "react";
import DashboardLayout from "../../components/Layout/DashboardLayout";

const defaultFlags = [
  {
    key: "grammarCheck",
    label: "Grammar & spell check",
    description: "Kiểm tra chính tả/ngữ pháp khi nhập nội dung.",
    enabled: true,
  },
  {
    key: "summary",
    label: "Summarization",
    description: "Tóm tắt nội dung bài viết hoặc nhận xét.",
    enabled: true,
  },
  {
    key: "similarity",
    label: "Similarity hints",
    description: "Đề xuất nội dung liên quan dựa trên ngữ nghĩa.",
    enabled: false,
  },
  {
    key: "promptLog",
    label: "Prompt logging",
    description: "Lưu nhật ký prompt để phục vụ kiểm toán.",
    enabled: true,
  },
];

const AiGovernancePage = () => {
  const [flags, setFlags] = useState(defaultFlags);

  const toggleFlag = (key) => {
    setFlags((prev) =>
      prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f))
    );
  };

  return (
    <DashboardLayout
      roleLabel="Site Administrator"
      title="AI Governance"
      subtitle="Bật/tắt tính năng AI và theo dõi lịch sử sử dụng (demo)."
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">AI Governance</span>
          </div>
          <h2 className="data-page-title">Kiểm soát tính năng AI</h2>
          <p className="data-page-subtitle">
            Sau khi nối backend, việc bật/tắt sẽ được lưu xuống server và log sẽ lấy từ API.
          </p>
        </div>
      </div>

      <div className="dash-grid">
        {flags.map((flag) => (
          <div className="dash-card" key={flag.key}>
            <h3>{flag.label}</h3>
            <p>{flag.description}</p>
            <div className="inline-actions">
              <button
                className="btn-primary"
                type="button"
                onClick={() => toggleFlag(flag.key)}
              >
                {flag.enabled ? "Đang bật" : "Đang tắt"}
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => alert("Giả lập xem nhật ký AI")}
              >
                Xem nhật ký
              </button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AiGovernancePage;

