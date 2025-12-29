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
			subtitle="Cập nhật thông tin tài khoản."
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
					<h2 className="data-page-title" style={{ marginBottom: '0.25rem' }}>Cập nhật tài khoản</h2>
					<p className="data-page-subtitle" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
						Bạn có thể cập nhật vai trò và trạng thái tài khoản tại đây; chỉnh sửa họ tên cần backend endpoint riêng.
					</p>
				</div>
			</div>

			<div className="form-card" style={{ padding: '1.25rem' }}>
				<h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Thông tin tài khoản</h3>

				{successMsg && (
					<div className="auth-success" style={{ marginBottom: "0.6rem", padding: '0.6rem', fontSize: '0.85rem' }}>
						{successMsg}
					</div>
				)}

				{error && (
					<div className="auth-error" style={{ marginBottom: "0.6rem", padding: '0.6rem', fontSize: '0.85rem' }}>
						{error}
					</div>
				)}

				<div className="form-grid" style={{ gap: '0.75rem' }}>
					<div className="form-group">
						<label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>Họ tên</label>
						<input
							value={nameDraft}
							onChange={(e) => {
								setNameDraft(e.target.value);
								if (successMsg) setSuccessMsg("");
							}}
							disabled={!user || saving}
							placeholder="Nguyễn Văn A"
							style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
						/>
					</div>
					<div className="form-group">
						<label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>Email</label>
						<input value={user?.email || ""} disabled style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }} />
					</div>
				</div>

				<div className="form-grid" style={{ gap: '0.75rem', marginTop: '0.75rem' }}>
					<div className="form-group">
						<label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>Vai trò</label>
						<select
							value={roleDraft}
							onChange={(e) => {
								setRoleDraft(e.target.value);
								if (successMsg) setSuccessMsg("");
							}}
							disabled={!user || saving}
							style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
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
						<label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>Trạng thái</label>
						<select
							value={statusDraft}
							onChange={(e) => {
								setStatusDraft(e.target.value);
								if (successMsg) setSuccessMsg("");
							}}
							disabled={!user || saving}
							style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
						>
							<option value="Active">Hoạt động</option>
							<option value="Disabled">Tạm khóa</option>
						</select>
					</div>
				</div>

				<div className="form-actions" style={{ marginTop: '1rem', gap: '0.5rem' }}>
					<button type="button" className="btn-secondary" onClick={handleSave} disabled={!user || saving} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
						{saving ? "Đang cập nhật..." : "Lưu thay đổi"}
					</button>
					<button type="button" className="btn-secondary" onClick={() => navigate("/admin/users")} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
						Quay lại danh sách
					</button>
				</div>
			</div>
		</AdminLayout>
	);
};

export default AdminUserEdit;
