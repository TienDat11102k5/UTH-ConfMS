// src/components/HistoryItem.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './HistoryItem.css';

/**
 * Component hiển thị một item trong lịch sử hoạt động
 */
const HistoryItem = ({ activity }) => {
    // Helper function to get icon and color based on activity type
    const getActivityIcon = (activityType) => {
        const type = activityType?.toUpperCase();

        if (type?.includes('PAPER') || type?.includes('CAMERA')) {
            return { icon: '📄', color: '#3b82f6', bgColor: '#eff6ff' }; // Blue
        } else if (type?.includes('REVIEW')) {
            return { icon: '📝', color: '#f97316', bgColor: '#fff7ed' }; // Orange
        } else if (type?.includes('LOGIN') || type?.includes('LOGOUT') || type?.includes('PROFILE') || type?.includes('PASSWORD')) {
            return { icon: '🔐', color: '#6b7280', bgColor: '#f9fafb' }; // Gray
        } else {
            return { icon: '📋', color: '#8b5cf6', bgColor: '#faf5ff' }; // Purple
        }
    };

    // Helper function to format relative time
    const getRelativeTime = (timestamp) => {
        const now = new Date();
        const activityTime = new Date(timestamp);
        const diffMs = now - activityTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
        return `${Math.floor(diffDays / 365)} năm trước`;
    };

    // Parse metadata if it's a JSON string
    const getMetadata = () => {
        if (!activity.metadata) return {};
        if (typeof activity.metadata === 'string') {
            try {
                return JSON.parse(activity.metadata);
            } catch {
                return {};
            }
        }
        return activity.metadata;
    };

    // Get link to entity if applicable
    const getEntityLink = () => {
        const type = activity.activityType?.toUpperCase();
        if ((type?.includes('PAPER') || type?.includes('CAMERA')) && activity.entityId) {
            return `/author/submissions/${activity.entityId}`;
        }
        return null;
    };

    const { icon, color, bgColor } = getActivityIcon(activity.activityType);
    const metadata = getMetadata();
    const entityLink = getEntityLink();
    const relativeTime = getRelativeTime(activity.timestamp);

    return (
        <div className="history-item">
            <div className="history-item-icon" style={{ backgroundColor: bgColor }}>
                <span style={{ color }}>{icon}</span>
            </div>

            <div className="history-item-content">
                <div className="history-item-header">
                    <div className="history-item-title">
                        <span className="activity-type-name">{activity.activityTypeName}</span>
                        {activity.status === 'SUCCESS' ? (
                            <span className="status-badge success">✓</span>
                        ) : (
                            <span className="status-badge failed">✗</span>
                        )}
                    </div>
                    <span className="history-item-time">{relativeTime}</span>
                </div>

                <p className="history-item-description">{activity.description}</p>

                {metadata && Object.keys(metadata).length > 0 && (
                    <div className="history-item-metadata">
                        {metadata.conferenceName && (
                            <span className="metadata-tag">
                                <strong>Hội nghị:</strong> {metadata.conferenceName}
                            </span>
                        )}
                        {metadata.paperTitle && (
                            <span className="metadata-tag">
                                <strong>Bài viết:</strong> {metadata.paperTitle}
                            </span>
                        )}
                        {activity.ipAddress && (
                            <span className="metadata-tag">
                                <strong>IP:</strong> {activity.ipAddress}
                            </span>
                        )}
                    </div>
                )}

                {entityLink && (
                    <Link to={entityLink} className="history-item-link">
                        Xem chi tiết →
                    </Link>
                )}
            </div>
        </div>
    );
};

export default HistoryItem;
