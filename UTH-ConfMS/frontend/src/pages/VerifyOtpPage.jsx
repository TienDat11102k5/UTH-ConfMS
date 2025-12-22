// src/pages/VerifyOtpPage.jsx
import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import apiClient from "../apiClient";

const VerifyOtpPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || "";

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Redirect nếu không có email
    React.useEffect(() => {
        if (!email) {
            navigate("/forgot-password", { replace: true });
        }
    }, [email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (otp.length !== 6) {
            setError("OTP phải có 6 chữ số");
            return;
        }

        setLoading(true);

        try {
            const response = await apiClient.post("/auth/verify-otp", { email, otp });
            const { verifiedToken } = response.data;

            // Chuyển sang trang reset password với verified token
            navigate("/reset-password", {
                state: { verifiedToken, email },
                replace: true,
            });
        } catch (err) {
            const message =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "OTP không đúng. Vui lòng thử lại.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1 className="auth-title">Xác thực OTP</h1>
                <p className="auth-subtitle">
                    Mã OTP đã được gửi đến: <strong>{email}</strong>
                </p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="otp">Mã OTP (6 số) *</label>
                        <input
                            id="otp"
                            type="text"
                            maxLength="6"
                            pattern="\d{6}"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                            placeholder="123456"
                            autoComplete="off"
                            autoFocus
                            required
                        />
                        <div className="field-hint">
                            Mã OTP có hiệu lực trong 5 phút
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? "Đang xác thực..." : "Xác nhận"}
                    </button>
                </form>

                <div className="auth-footer">
                    <Link to="/forgot-password" className="link-inline">
                        Gửi lại mã OTP
                    </Link>
                    {" • "}
                    <Link to="/login" className="link-inline">
                        Quay lại đăng nhập
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default VerifyOtpPage;
