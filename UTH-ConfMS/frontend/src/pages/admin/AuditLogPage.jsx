import React from "react";
import DashboardLayout from "../../components/Layout/DashboardLayout";

const sampleLogs = [
  {
    id: 1,
    actor: "admin@uth.edu.vn",
    action: "CREATE_CONFERENCE",
    target: "UTH 2025",
    time: "2025-01-10 09:30",
  },
  {
    id: 2,
    actor: "chair@uth.edu.vn",
    action: "ASSIGN_REVIEWER",
    target: "Paper #42",
    time: "2025-01-10 10:12",
  },
  {
    id: 3,
    actor: "system",
    action: "BACKUP_DONE",
    target: "Nightly backup",
    time: "2025-01-10 02:00",
  },
];

const AuditLogPage = () => {
  return (
    <DashboardLayout
      roleLabel="Site Administrator"
      title="Audit Logs"
      subtitle="Theo dõi các thao tác quan trọng để phục vụ kiểm toán (dữ liệu demo)."
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Audit Logs</span>
          </div>
          <h2 className="data-page-title">Nhật ký hệ thống</h2>
          <p className="data-page-subtitle">
            Khi nối backend, có thể lọc theo thời gian, actor, loại hành động và phân trang.
          </p>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="simple-table">
          <thead>
            <tr>
              <th style={{ width: "80px" }}>ID</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {sampleLogs.map((log) => (
              <tr key={log.id}>
                <td>{log.id}</td>
                <td>{log.actor}</td>
                <td>{log.action}</td>
                <td>{log.target}</td>
                <td>{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default AuditLogPage;

