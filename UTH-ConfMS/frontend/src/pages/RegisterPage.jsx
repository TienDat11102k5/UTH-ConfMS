// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../apiClient";

/**
 * Trang đăng ký tài khoản LOCAL (email/password).
 * 
 * FLOW:
 * 1. User điền form: fullName, affiliation, email, password, passwordConfirm
 * 2. Validate client-side: password matching, email format, required fields
 * 3. Gửi POST /api/auth/register
 * 4. Backend tạo user trong database (và tùy chọn tạo Firebase user)
 * 5. Backend trả về JWT token + user info
 * 6. Redirect đến trang login hoặc tự động login
 * 
 * LƯU Ý:
 * - Sau khi đăng ký thành công, tài khoản được lưu vào DATABASE
 * - Tùy chọn backend config: có thể tự động tạo Firebase Authentication user
 * - User có thể đăng nhập bằng email/password hoặc Google sau đó
 */
const RegisterPage = () => {
  const navigate = useNavigate();

  // Form state
  const [fullName, setFullName] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  /**
   * Validate form phía client trước khi gửi lên server.
   * Giúp giảm tải server và cải thiện UX.
   */
  const validateForm = () => {
    const errors = {};

    // Validate fullName
    if (!fullName || fullName.trim().length === 0) {
      errors.fullName = "Họ và tên không được để trống";
    } else if (fullName.trim().length < 2) {
      errors.fullName = "Họ và tên phải có ít nhất 2 ký tự";
    }

    // Validate email
    if (!email || email.trim().length === 0) {
      errors.email = "Email không được để trống";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Email không hợp lệ";
    }

    // Validate password
    if (!password || password.length === 0) {
      errors.password = "Mật khẩu không được để trống";
    } else if (password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    // Validate password confirm
    if (!passwordConfirm || passwordConfirm.length === 0) {
      errors.passwordConfirm = "Vui lòng xác nhận mật khẩu";
    } else if (password !== passwordConfirm) {
      errors.passwordConfirm = "Mật khẩu xác nhận không khớp";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setFieldErrors({});

    // Validate client-side trước
    if (!validateForm()) {
      setError("Vui lòng kiểm tra lại thông tin đăng ký");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        affiliation: affiliation.trim() || undefined,
        email: email.trim().toLowerCase(),
        password: password,
      };

      // Gọi API đăng ký
      const response = await apiClient.post("/auth/register", payload);

      // Đăng ký thành công
      setSuccessMsg(
        "🎉 Đăng ký thành công! Đang chuyển đến trang đăng nhập..."
      );

      // Tùy chọn: Có thể tự động login luôn bằng token từ response
      // const { accessToken, user } = response.data;
      // localStorage.setItem("token", accessToken);
      // localStorage.setItem("user", JSON.stringify(user));
      // navigate(`/${user.role.toLowerCase()}`);

      // Hoặc redirect đến login page
      setTimeout(() => {
        navigate("/login", { 
          state: { 
            message: "Đăng ký thành công! Vui lòng đăng nhập.",
            email: email.trim().toLowerCase() 
          } 
        });
      }, 1500);

    } catch (err) {
      console.error("Register error:", err);
      
      // Xử lý các loại lỗi khác nhau
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        if (status === 400) {
          // Bad request - validation errors
          const message = data.message || data.error || "Thông tin đăng ký không hợp lệ";
          setError(message);

          // Parse field-specific errors nếu backend trả về
          if (data.errors && typeof data.errors === "object") {
            setFieldErrors(data.errors);
          }
        } else if (status === 409) {
          // Conflict - email already exists
          setError("Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.");
          setFieldErrors({ email: "Email đã tồn tại" });
        } else if (status === 500) {
          setError("Lỗi server. Vui lòng thử lại sau hoặc liên hệ quản trị viên.");
        } else {
          setError(data.message || "Đăng ký thất bại. Vui lòng thử lại.");
        }
      } else if (err.request) {
        // Network error
        setError("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.");
      } else {
        setError("Có lỗi xảy ra. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Đăng ký tài khoản UTH-ConfMS</h1>
        
        {/* Success message */}
        {successMsg && (
          <div className="auth-success">
            {successMsg}
          </div>
        )}

        {/* General error message */}
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="fullName">
              Họ và tên <span className="required">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fieldErrors.fullName) {
                  setFieldErrors({ ...fieldErrors, fullName: undefined });
                }
              }}
              placeholder="Nguyễn Văn A"
              className={fieldErrors.fullName ? "error" : ""}
              disabled={loading}
              required
            />
            {fieldErrors.fullName && (
              <span className="field-error">{fieldErrors.fullName}</span>
            )}
          </div>

          {/* Affiliation */}
          <div className="form-group">
            <label htmlFor="affiliation">Đơn vị / Trường / Khoa</label>
            <input
              id="affiliation"
              type="text"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              placeholder="Khoa CNTT, Trường ĐH UTH"
              disabled={loading}
            />
            <small className="form-hint">Tùy chọn, nhưng nên điền để dễ quản lý</small>
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">
              Email <span className="required">*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors({ ...fieldErrors, email: undefined });
                }
              }}
              placeholder="you@example.com"
              className={fieldErrors.email ? "error" : ""}
              disabled={loading}
              required
            />
            {fieldErrors.email && (
              <span className="field-error">{fieldErrors.email}</span>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">
              Mật khẩu <span className="required">*</span>
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors({ ...fieldErrors, password: undefined });
                }
              }}
              placeholder="••••••••"
              className={fieldErrors.password ? "error" : ""}
              disabled={loading}
              required
            />
            {fieldErrors.password && (
              <span className="field-error">{fieldErrors.password}</span>
            )}
            <small className="form-hint">Tối thiểu 6 ký tự</small>
          </div>

          {/* Password Confirm */}
          <div className="form-group">
            <label htmlFor="passwordConfirm">
              Xác nhận mật khẩu <span className="required">*</span>
            </label>
            <input
              id="passwordConfirm"
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => {
                setPasswordConfirm(e.target.value);
                if (fieldErrors.passwordConfirm) {
                  setFieldErrors({ ...fieldErrors, passwordConfirm: undefined });
                }
              }}
              placeholder="••••••••"
              className={fieldErrors.passwordConfirm ? "error" : ""}
              disabled={loading}
              required
            />
            {fieldErrors.passwordConfirm && (
              <span className="field-error">{fieldErrors.passwordConfirm}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>

        {/* Footer Links */}
        <div className="auth-footer">
          <span>Đã có tài khoản?</span>{" "}
          <Link to="/login" className="link-inline">
            Đăng nhập
          </Link>
        </div>

        <div className="auth-footer">
          <span>Hoặc quay lại </span>
          <Link to="/" className="link-inline">
            Cổng thông tin hội nghị (CFP)
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
