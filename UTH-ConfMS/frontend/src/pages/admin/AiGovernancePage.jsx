import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import {
  getFeatureFlags,
  enableFeature,
  disableFeature,
  getAuditLogs,
} from "../../api/ai/governanceAI";
import { useAuth } from "../../auth";

const AiGovernancePage = () => {
  const { user } = useAuth();

  // Tạm thời lấy conferenceId từ localStorage (hoặc context nếu có sẵn)
  const storedConferenceId =
    window.localStorage.getItem("currentConferenceId") || "1";

  const userId = user?.id || user?.userId || null;

  const [loadingFlags, setLoadingFlags] = useState(false);
  const [flagsError, setFlagsError] = useState("");
  const [flags, setFlags] = useState([]);

  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState("");

  const [selectedFeature, setSelectedFeature] = useState("");

  useEffect(() => {
    const fetchFlags = async () => {
      setLoadingFlags(true);
      setFlagsError("");
      try {
        const data = await getFeatureFlags(storedConferenceId);
        const features = data.features || {};

        // Map sang dạng dùng được cho UI
        const mapped = Object.entries(features).map(([key, enabled]) => ({
          key,
          label: key,
          description: `Tính năng AI: ${key}`,
          enabled,
        }));

        setFlags(mapped);
      } catch (err) {
        setFlagsError(err.message || "Không thể tải cấu hình AI.");
      } finally {
        setLoadingFlags(false);
      }
    };

    fetchFlags();
  }, [storedConferenceId]);

  const handleToggleFlag = async (flag) => {
    const featureName = flag.key;
    // Optimistic update
    setFlags((prev) =>
      prev.map((f) =>
        f.key === featureName ? { ...f, enabled: !f.enabled } : f
      )
    );

    try {
      if (flag.enabled) {
        await disableFeature(storedConferenceId, featureName, userId);
      } else {
        await enableFeature(storedConferenceId, featureName, userId);
      }
    } catch (err) {
      // Rollback nếu lỗi
      setFlags((prev) =>
        prev.map((f) =>
          f.key === featureName ? { ...f, enabled: flag.enabled } : f
        )
      );
      alert(err.message || "Không thể cập nhật trạng thái tính năng AI.");
    }
  };

  const handleLoadLogs = async () => {
    setLoadingLogs(true);
    setLogsError("");
    try {
      const data = await getAuditLogs({
        conferenceId: storedConferenceId,
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
            Bật/tắt tính năng AI theo từng hội nghị và xem nhật ký sử dụng từ AI
            Service.
          </p>
        </div>
      </div>

      {flagsError && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
          {flagsError}
        </div>
      )}

      <div className="dash-grid">
        <div className="dash-card">
          <h3>Cấu hình Feature Flags</h3>
          <p>Danh sách các tính năng AI hiện có cho hội nghị ID {storedConferenceId}.</p>
          {loadingFlags ? (
            <p>Đang tải cấu hình...</p>
          ) : flags.length === 0 ? (
            <p>Chưa có tính năng AI nào được cấu hình.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên tính năng</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {flags.map((flag) => (
                  <tr key={flag.key}>
                    <td>{flag.label}</td>
                    <td>{flag.enabled ? "Đang bật" : "Đang tắt"}</td>
                    <td>
                      <button
                        className="btn-primary"
                        type="button"
                        onClick={() => handleToggleFlag(flag)}
                      >
                        {flag.enabled ? "Tắt" : "Bật"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="dash-card">
          <h3>Nhật ký AI (Audit Logs)</h3>
          <p>
            Xem lại các lần sử dụng AI (theo hội nghị và tính năng) để phục vụ
            kiểm toán.
          </p>
          <div className="inline-actions" style={{ marginBottom: "0.75rem" }}>
            <select
              value={selectedFeature}
              onChange={(e) => setSelectedFeature(e.target.value)}
            >
              <option value="">Tất cả tính năng</option>
              {flags.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.key}
                </option>
              ))}
            </select>
            <button
              className="btn-secondary"
              type="button"
              onClick={handleLoadLogs}
              disabled={loadingLogs}
            >
              {loadingLogs ? "Đang tải..." : "Tải nhật ký"}
            </button>
          </div>

          {logsError && (
            <p className="text-error" style={{ marginBottom: "0.5rem" }}>
              {logsError}
            </p>
          )}

          {logs.length === 0 && !loadingLogs ? (
            <p>Chưa có bản ghi nào hoặc chưa tải nhật ký.</p>
          ) : (
            <div className="audit-log-list">
              <ul>
                {logs.map((log) => (
                  <li key={log.id || log.timestamp + log.feature}>
                    <strong>{log.feature}</strong> –{" "}
                    <span>{log.action}</span> –{" "}
                    <span>{log.timestamp}</span>
                    {log.user_id && (
                      <span> (user: {log.user_id})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AiGovernancePage;



