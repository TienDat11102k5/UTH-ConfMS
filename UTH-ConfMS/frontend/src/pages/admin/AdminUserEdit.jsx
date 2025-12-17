import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import apiClient from "../../apiClient";

const AdminUserEdit = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [user, setUser] = useState(null);

	useEffect(() => {
		const fetchUserFromList = async () => {
			try {
				setLoading(true);
				setError("");

				// Đơn giản: dùng API sẵn có (GET /admin/users) rồi lọc theo id
				const res = await apiClient.get("/admin/users");
				const list = res.data || [];
				const found = list.find((u) => String(u.id) === String(id));
				setUser(found || null);
				if (!found) setError("Không tìm thấy người dùng (ID không tồn tại). ");
			} catch (err) {
				console.error(err);
				setError("Không thể tải dữ liệu người dùng.");
			} finally {
				setLoading(false);
			}
		};

		fetchUserFromList();
	}, [id]);

	const handleChangeRole = async () => {
		if (!user) return;

		const newRole = window.prompt(
			`Gán vai trò cho ${user.email} (ví dụ: AUTHOR, REVIEWER, CHAIR, ADMIN)`,
			user.role
		);
		if (!newRole) return;

		try {
			setError("");
			await apiClient.put(`/admin/users/${user.id}/role`, { role: newRole });
			setUser((prev) => (prev ? { ...prev, role: newRole.toUpperCase() } : prev));
			alert("Cập nhật vai trò thành công!");
		} catch (err) {
			console.error(err);
			const status = err?.response?.status;
			const msg = err?.response?.data?.message || err?.message || "Cập nhật vai trò thất bại.";
			setError(`Lỗi${status ? ` (HTTP ${status})` : ""}: ${msg}`);
		}
	};

	if (loading) {
		return (
			<DashboardLayout title="Đang tải..." roleLabel="Site Administrator">
				<div className="form-card">Đang tải dữ liệu...</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout
			roleLabel="Site Administrator"
			title={`Sửa người dùng #${id}`}
			subtitle="Trang sửa đơn giản (dùng lại API sẵn có)."
		>
			<div className="data-page-header">
				<div className="data-page-header-left">
					<div className="breadcrumb">
						<Link to="/admin/users" className="breadcrumb-link">
							Người dùng
						</Link>
						<span className="breadcrumb-separator">/</span>
						<span className="breadcrumb-current">Chỉnh sửa #{id}</span>
					</div>
					<h2 className="data-page-title">Cập nhật tài khoản</h2>
					<p className="data-page-subtitle">
						Hiện tại trang này chỉ hỗ trợ đổi vai trò (Phân quyền) để tránh lỗi; chỉnh sửa họ tên/trạng thái cần backend endpoint riêng.
					</p>
				</div>
			</div>

			{error && (
				<div className="form-card" style={{ border: "1px solid #ffd4d4", color: "#d72d2d" }}>
					{error}
				</div>
			)}

			<div className="form-card" style={{ maxWidth: 720 }}>
				<h3>Thông tin tài khoản</h3>

				<div className="form-grid">
					<div className="form-group">
						<label className="form-label">Họ tên</label>
						<input value={user?.name || ""} disabled />
					</div>
					<div className="form-group">
						<label className="form-label">Email</label>
						<input value={user?.email || ""} disabled />
					</div>
				</div>

				<div className="form-grid">
					<div className="form-group">
						<label className="form-label">Vai trò</label>
						<input value={user?.role || ""} disabled />
					</div>
					<div className="form-group">
						<label className="form-label">Trạng thái</label>
						<input value={user?.status === "Active" ? "Hoạt động" : "Tạm khóa"} disabled />
					</div>
				</div>

				<div className="form-actions">
					<button type="button" className="btn-secondary" onClick={handleChangeRole} disabled={!user}>
						Phân quyền
					</button>
					<button type="button" className="btn-secondary" onClick={() => navigate("/admin/users")}>
						Quay lại danh sách
					</button>
				</div>
			</div>
		</DashboardLayout>
	);
};

export default AdminUserEdit;
