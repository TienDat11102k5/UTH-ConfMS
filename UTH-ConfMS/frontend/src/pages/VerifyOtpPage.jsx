// src/pages/VerifyOtpPage.jsx
import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../apiClient";
import LanguageSwitcher from "../components/LanguageSwitcher";

const VerifyOtpPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || "";

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Redirect if no email
    React.useEffect(() => {
        if (!email) {
            navigate("/forgot-password", { replace: true });
        }
    }, [email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (otp.length !== 6) {
            setError(t('auth.otpMustBe6Digits'));
            return;
        }

        setLoading(true);

        try {
            const response = await apiClient.post("/auth/verify-otp", { email, otp });
            const { verifiedToken } = response.data;

            // Navigate to reset password page with verified token
            navigate("/reset-password", {
                state: { verifiedToken, email },
                replace: true,
            });
        } catch (err) {
            const message =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                t('auth.otpInvalid');
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
                    <LanguageSwitcher />
                </div>
                <h1 className="auth-title">{t('auth.verifyOtpTitle')}</h1>
                <p className="auth-subtitle">
                    {t('auth.otpSentTo')}: <strong>{email}</strong>
                </p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="otp">{t('auth.otpCode')} *</label>
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
                            {t('auth.otpValidity')}
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? t('app.verifying') : t('common.confirm')}
                    </button>
                </form>

                <div className="auth-footer">
                    <Link to="/forgot-password" className="link-inline">
                        {t('auth.resendOtp')}
                    </Link>
                    {" • "}
                    <Link to="/login" className="link-inline">
                        {t('auth.backToLogin')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default VerifyOtpPage;

