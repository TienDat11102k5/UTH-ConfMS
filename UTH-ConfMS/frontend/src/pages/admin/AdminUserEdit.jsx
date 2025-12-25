import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/Layout/AdminLayout";
import apiClient from "../../apiClient";

const AdminUserEdit = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [successMsg, setSuccessMsg] = useState("");
	const [user, setUser] = useState(null);
	const [nameDraft, setNameDraft] = useState("");
	const [roleDraft, setRoleDraft] = useState("");
	const [statusDraft, setStatusDraft] = useState("");

	const roleOptions = ["AUTHOR", "REVIEWER", "CHAIR", "ADMIN"];

	useEffect(() => {
		const fetchUserFromList = async () => {
			try {
				setLoading(true);
				setError("");
				setSuccessMsg("");

				// Đơn giản: dùng API sẵn có (GET /admin/users) rồi lọc theo id
				const res = await apiClient.get("/admin/users");
				const list = res.data || [];
				const found = list.find((u) => String(u.id) === String(id));
				setUser(found || null);
				setNameDraft(found?.name || "");
				setRoleDraft(found?.role || "");
				setStatusDraft(found?.status || "");
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

	const handleSave = async () => {
		if (!user) return;
		if (saving) return;

		const nextName = (nameDraft || "").trim();
		const nextRole = (roleDraft || "").trim().toUpperCase();
		const nextStatus = statusDraft;

		const nameChanged = nextName && nextName !== (user.name || "");
		const roleChanged = nextRole && nextRole !== (user.role || "").toUpperCase();
		const statusChanged = nextStatus && nextStatus !== user.status;

		if (!nameChanged && !roleChanged && !statusChanged) {
			setSuccessMsg("Không có thay đổi nào để cập nhật.");
			return;
		}

		try {
			setSaving(true);
			setError("");
			setSuccessMsg("");

			let updated = user;
			if (nameChanged) {
				const res = await apiClient.put(`/admin/users/${user.id}/name`, { fullName: nextName });
				updated = res.data || updated;
			}

			if (roleChanged) {
				const res = await apiClient.put(`/admin/users/${user.id}/role`, { role: nextRole });
				updated = res.data || updated;
			}

			if (statusChanged) {
				const enabled = nextStatus === "Active";
				const res = await apiClient.put(`/admin/users/${user.id}/status`, { enabled });
				updated = res.data || updated;
			}

			setUser(updated);
			setNameDraft(updated?.name || nextName);
			setRoleDraft(updated?.role || nextRole);
			setStatusDraft(updated?.status || nextStatus);
			setSuccessMsg("Cập nhật thành công!");
		} catch (err) {
			console.error(err);
			const httpStatus = err?.response?.status;
			const msg = err?.response?.data?.message || err?.message || "Cập nhật thất bại.";
			setError(`Lỗi${httpStatus ? ` (HTTP ${httpStatus})` : ""}: ${msg}`);
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<AdminLayout title="Đang tải...">
				<div className="form-card">Đang tải dữ liệu...</div>
			</AdminLayout>
		);
	}

	return (
		<AdminLayout title={`Sửa người dùng #${id}`}
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
						Bạn có thể cập nhật vai trò và trạng thái tài khoản tại đây; chỉnh sửa họ tên cần backend endpoint riêng.
					</p>
				</div>
			</div>

			<div className="form-card" style={{ maxWidth: 720 }}>
				<h3>Thông tin tài khoản</h3>

				{successMsg && (
					<div className="auth-success" style={{ marginBottom: "0.75rem" }}>
						{successMsg}
					</div>
				)}

				{error && (
					<div className="auth-error" style={{ marginBottom: "0.75rem" }}>
						{error}
					</div>
				)}

				<div className="form-grid">
					<div className="form-group">
						<label className="form-label">Họ tên</label>
						<input
							value={nameDraft}
							onChange={(e) => {
								setNameDraft(e.target.value);
								if (successMsg) setSuccessMsg("");
							}}
							disabled={!user || saving}
							placeholder="Nguyễn Văn A"
						/>
					</div>
					<div className="form-group">
						<label className="form-label">Email</label>
						<input value={user?.email || ""} disabled />
					</div>
				</div>

				<div className="form-grid">
					<div className="form-group">
						<label className="form-label">Vai trò</label>
						<select
							value={roleDraft}
							onChange={(e) => {
								setRoleDraft(e.target.value);
								if (successMsg) setSuccessMsg("");
							}}
							disabled={!user || saving}
						>
							{roleDraft && !roleOptions.includes(String(roleDraft).toUpperCase()) && (
								<option value={roleDraft}>{String(roleDraft).toUpperCase()} (hiện tại)</option>
							)}
							{roleOptions.map((r) => (
								<option key={r} value={r}>
									{r}
								</option>
							))}
						</select>
					</div>
					<div className="form-group">
						<label className="form-label">Trạng thái</label>
						<select
							value={statusDraft}
							onChange={(e) => {
								setStatusDraft(e.target.value);
								if (successMsg) setSuccessMsg("");
							}}
							disabled={!user || saving}
						>
							<option value="Active">Hoạt động</option>
							<option value="Disabled">Tạm khóa</option>
						</select>
					</div>
				</div>

				<div className="form-actions">
					<button type="button" className="btn-secondary" onClick={handleSave} disabled={!user || saving}>
						{saving ? "Đang cập nhật..." : "Lưu thay đổi"}
					</button>
					<button type="button" className="btn-secondary" onClick={() => navigate("/admin/users")}>
						Quay lại danh sách
					</button>
				</div>
			</div>
		</AdminLayout>
	);
};

export default AdminUserEdit;
