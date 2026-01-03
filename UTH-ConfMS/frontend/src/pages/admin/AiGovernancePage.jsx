import React, { useEffect, useState, useCallback } from "react";
import AdminLayout from "../../components/Layout/AdminLayout";
import apiClient from "../../apiClient";
import {
  getFeatureFlags,
  enableFeature,
  disableFeature,
  getAuditLogs,
} from "../../api/ai/governanceAI";
import { useAuth } from "../../auth";
import { ToastContainer } from "../../components/Toast";
import "../../styles/AiGovernancePage.css";

// Mapping tên features sang tiếng Việt với mô tả chi tiết
const FEATURE_LABELS = {
  grammar_check: {
    name: "Kiểm tra ngữ pháp",
    description: "Kiểm tra lỗi chính tả và ngữ pháp trong tiêu đề, tóm tắt",
    role: "Tác giả"
  },
  polish_content: {
    name: "Đánh bóng nội dung",
    description: "Cải thiện văn phong học thuật cho tóm tắt và tiêu đề",
    role: "Tác giả"
  },
  keyword_suggestion: {
    name: "Gợi ý từ khóa",
    description: "Đề xuất từ khóa phù hợp dựa trên nội dung bài báo",
    role: "Tác giả"
  },
  paper_synopsis: {
    name: "Tóm tắt bài báo",
    description: "Tạo bản tóm tắt chi tiết về nội dung nghiên cứu",
    role: "Phản biện"
  },
  reviewer_similarity: {
    name: "Độ tương đồng phản biện",
    description: "Tính toán mức độ phù hợp giữa phản biện và bài báo",
    role: "Chủ tịch"
  },
  assignment_suggestion: {
    name: "Gợi ý phân công",
    description: "Đề xuất phân công phản biện phù hợp cho từng bài báo",
    role: "Chủ tịch"
  },
  decision_recommendation: {
    name: "Gợi ý quyết định",
    description: "Phân tích đánh giá và đề xuất quyết định chấp nhận/từ chối",
    role: "Chủ tịch"
  },
  review_summary: {
    name: "Tóm tắt đánh giá",
    description: "Tổng hợp các ý kiến phản biện thành bản tóm tắt",
    role: "Chủ tịch"
  },
  email_draft: {
    name: "Soạn thảo email",
    description: "Tự động soạn email thông báo quyết định cho tác giả",
    role: "Chủ tịch"
  }
};

const AiGovernancePage = () => {
  const { user } = useAuth();

  const [conferences, setConferences] = useState([]);
  const [selectedConferenceId, setSelectedConferenceId] = useState(1);

  const userId = user?.id || user?.userId || null;

  const [loadingFlags, setLoadingFlags] = useState(false);
  const [flagsError, setFlagsError] = useState("");
  const [flags, setFlags] = useState([]);

  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState("");

  const [selectedFeature, setSelectedFeature] = useState("");

  // Toast notifications
  const [toasts, setToasts] = useState([]);
  
  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    flag: null,
    isEnabling: false
  });

  // Add toast helper
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  // Remove toast helper
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load conferences
  useEffect(() => {
    const loadConferences = async () => {
      try {
        const res = await apiClient.get("/conferences");
        const data = res.data || [];
        setConferences(data);
        if (data.length > 0) {
          setSelectedConferenceId(data[0].id);
        }
      } catch (err) {
        console.error("Load conferences error:", err);
      }
    };
    loadConferences();
  }, []);

  useEffect(() => {
    const fetchFlags = async () => {
      if (!selectedConferenceId) return;
      
      setLoadingFlags(true);
      setFlagsError("");
      try {
        const data = await getFeatureFlags(String(selectedConferenceId));
        const features = data.features || {};

        // Map sang dạng dùng được cho UI với thông tin tiếng Việt
        const mapped = Object.entries(features).map(([key, enabled]) => ({
          key,
          label: FEATURE_LABELS[key]?.name || key,
          description: FEATURE_LABELS[key]?.description || `Tính năng AI: ${key}`,
          role: FEATURE_LABELS[key]?.role || "Hệ thống",
          enabled,
        }));

        setFlags(mapped);
      } catch (err) {
        console.error("Load flags error:", err);
        const errorMsg = err.message || err.toString() || "Không thể tải cấu hình AI.";
        setFlagsError(errorMsg);
      } finally {
        setLoadingFlags(false);
      }
    };

    fetchFlags();
  }, [selectedConferenceId]);

  // Open confirmation modal when clicking toggle button
  const handleToggleClick = (flag) => {
    setConfirmModal({
      isOpen: true,
      flag: flag,
      isEnabling: !flag.enabled
    });
  };

  // Close confirmation modal
  const handleCloseModal = () => {
    setConfirmModal({
      isOpen: false,
      flag: null,
      isEnabling: false
    });
  };

  // Confirm and perform the toggle action
  const handleConfirmToggle = async () => {
    const flag = confirmModal.flag;
    if (!flag) return;

    const featureName = flag.key;
    const featureLabel = flag.label;
    const isEnabling = confirmModal.isEnabling;
    
    // Close modal first
    handleCloseModal();

    // Optimistic update
    setFlags((prev) =>
      prev.map((f) =>
        f.key === featureName ? { ...f, enabled: isEnabling } : f
      )
    );

    try {
      const conferenceIdStr = String(selectedConferenceId);
      const userIdStr = userId ? String(userId) : null;
      
      if (isEnabling) {
        await enableFeature(conferenceIdStr, featureName, userIdStr);
        addToast(`Bạn đã bật thành công tính năng "${featureLabel}"`, "success");
      } else {
        await disableFeature(conferenceIdStr, featureName, userIdStr);
        addToast(`Bạn đã tắt thành công tính năng "${featureLabel}"`, "success");
      }
    } catch (err) {
      console.error("Toggle flag error:", err);
      // Rollback nếu lỗi
      setFlags((prev) =>
        prev.map((f) =>
          f.key === featureName ? { ...f, enabled: flag.enabled } : f
        )
      );
      const errorMsg = err.message || err.toString() || "Không thể cập nhật trạng thái tính năng AI.";
      addToast(errorMsg, "error");
    }
  };

  const handleLoadLogs = async () => {
    setLoadingLogs(true);
    setLogsError("");
    try {
      const data = await getAuditLogs({
        conferenceId: String(selectedConferenceId),
        feature: selectedFeature || undefined,
        limit: 20,
        offset: 0,
      });
      setLogs(data.logs || []);
    } catch (err) {
      setLogsError(err.message || "Không thể tải nhật ký AI.");
    } finally {
      setLoadingLogs(false);
    }
  };

  // Nhóm features theo role
  const groupedFlags = flags.reduce((acc, flag) => {
    const role = flag.role;
    if (!acc[role]) acc[role] = [];
    acc[role].push(flag);
    return acc;
  }, {});

  return (
    <AdminLayout
      title="QUẢN TRỊ AI"
    >
      <div className="ai-governance-page">
        {flagsError && (
          <div className="alert alert-error">
            {flagsError}
          </div>
        )}

        {/* Conference Selector */}
        {conferences.length > 0 && (
          <div className="governance-card">
            <div className="card-header">
              <h3>Chọn hội nghị</h3>
            </div>
            <select
              value={selectedConferenceId}
              onChange={(e) => setSelectedConferenceId(parseInt(e.target.value))}
              className="conference-selector"
            >
              {conferences.map((conf) => (
                <option key={conf.id} value={conf.id}>
                  {conf.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Feature Flags */}
        <div className="governance-card">
          <div className="card-header">
            <h3>Cấu hình tính năng AI</h3>
          </div>
          {loadingFlags ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Đang tải cấu hình...</p>
            </div>
          ) : flags.length === 0 ? (
            <div className="empty-state">
              <p>Chưa có tính năng AI nào được cấu hình.</p>
            </div>
          ) : (
            <div className="features-grid">
              {Object.entries(groupedFlags).map(([role, roleFlags]) => (
                <div key={role} className="role-section">
                  <h4 className="role-title">{role}</h4>
                  <div className="features-list">
                    {roleFlags.map((flag) => (
                      <div key={flag.key} className={`feature-card ${flag.enabled ? 'enabled' : 'disabled'}`}>
                        <div className="feature-info">
                          <div className="feature-name">{flag.label}</div>
                          <div className="feature-description">{flag.description}</div>
                        </div>
                        <div className="feature-actions">
                          <div className={`status-badge ${flag.enabled ? 'active' : 'inactive'}`}>
                            {flag.enabled ? "Đang bật" : "Đang tắt"}
                          </div>
                          <button
                            className={`toggle-btn ${flag.enabled ? 'btn-disable' : 'btn-enable'}`}
                            type="button"
                            onClick={() => handleToggleClick(flag)}
                          >
                            {flag.enabled ? "Tắt" : "Bật"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Logs */}
        <div className="governance-card">
          <div className="card-header">
            <h3>Nhật ký sử dụng AI</h3>
          </div>

          <div className="logs-controls">
            <select
              value={selectedFeature}
              onChange={(e) => setSelectedFeature(e.target.value)}
              className="feature-filter"
            >
              <option value="">Tất cả tính năng</option>
              {flags.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
            <button
              className="btn-load-logs"
              type="button"
              onClick={handleLoadLogs}
              disabled={loadingLogs}
            >
              {loadingLogs ? "Đang tải..." : "Tải nhật ký"}
            </button>
          </div>

          {logsError && (
            <div className="alert alert-error">
              {logsError}
            </div>
          )}

          {logs.length === 0 && !loadingLogs ? (
            <div className="empty-state">
              <p>Chưa có bản ghi nào hoặc chưa tải nhật ký.</p>
            </div>
          ) : (
            <div className="logs-list">
              {logs.map((log, idx) => (
                <div key={idx} className="log-item">
                  <div className="log-feature">{FEATURE_LABELS[log.feature]?.name || log.feature}</div>
                  <div className="log-action">{log.action}</div>
                  <div className="log-time">{log.timestamp}</div>
                  {log.user_id && <div className="log-user">User: {log.user_id}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <div className="confirm-modal-header">
              <h3>Xác nhận</h3>
            </div>
            <div className="confirm-modal-body">
              <p>
                Bạn có muốn {confirmModal.isEnabling ? "bật" : "tắt"} tính năng{" "}
                <strong>"{confirmModal.flag?.label}"</strong> không?
              </p>
            </div>
            <div className="confirm-modal-footer">
              <button
                className="btn-cancel"
                type="button"
                onClick={handleCloseModal}
              >
                Hủy
              </button>
              <button
                className={`btn-confirm ${confirmModal.isEnabling ? 'btn-enable' : 'btn-disable'}`}
                type="button"
                onClick={handleConfirmToggle}
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AdminLayout>
  );
};

export default AiGovernancePage;



