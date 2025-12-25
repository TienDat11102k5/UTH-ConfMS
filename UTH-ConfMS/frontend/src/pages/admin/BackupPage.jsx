import React from "react";
import AdminLayout from "../../components/Layout/AdminLayout";
import Pagination from '../../components/Pagination';
import { usePagination } from '../../hooks/usePagination';

const backups = [
  {
    id: 1,
    name: "nightly-2025-01-10.zip",
    size: "320 MB",
    createdAt: "2025-01-10 02:00",
  },
  {
    id: 2,
    name: "nightly-2025-01-09.zip",
    size: "318 MB",
    createdAt: "2025-01-09 02:00",
  },
];

const BackupPage = () => {
  const { currentPage, setCurrentPage, totalPages, paginatedItems } =
    usePagination(backups, 20);

  return (
    <AdminLayout title="Backup & Restore"
      subtitle="Tạo bản sao lưu định kỳ và khôi phục khi cần (dữ liệu demo)."
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Backup</span>
          </div>
          <h2 className="data-page-title">Sao lưu &amp; khôi phục</h2>
          <p className="data-page-subtitle">
            Nối API để kích hoạt backup/restore thực tế và tải file từ server.
          </p>
        </div>
        <div className="data-page-header-right">
          <button
            className="btn-primary"
            type="button"
            onClick={() => alert("Giả lập tạo backup mới")}
          >
            + Tạo backup
          </button>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-card">
          <h3>Tạo backup</h3>
          <p>Thực hiện backup thủ công ngay lập tức.</p>
          <button
            className="btn-primary"
            type="button"
            onClick={() => alert("Giả lập backup ngay")}
          >
            Backup ngay
          </button>
        </div>
        <div className="dash-card">
          <h3>Khôi phục</h3>
          <p>Chọn file backup để khôi phục dữ liệu hệ thống.</p>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => alert("Giả lập chọn file khôi phục")}
          >
            Chọn file khôi phục
          </button>
        </div>
      </div>

      <div className="table-wrapper" style={{ marginTop: "2rem" }}>
        <table className="simple-table">
          <thead>
            <tr>
              <th style={{ width: "80px" }}>ID</th>
              <th>Tên file</th>
              <th>Kích thước</th>
              <th>Thời gian tạo</th>
              <th style={{ width: "180px" }}></th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((b) => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>{b.name}</td>
                <td>{b.size}</td>
                <td>{b.createdAt}</td>
                <td>
                  <div className="inline-actions">
                    <button className="btn-secondary table-action" type="button">
                      Tải xuống
                    </button>
                    <button className="btn-primary table-action" type="button">
                      Khôi phục
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {backups.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={backups.length}
          itemsPerPage={20}
          onPageChange={setCurrentPage}
          itemName="bản sao lưu"
        />
      )}
    </AdminLayout>
  );
};

export default BackupPage;



