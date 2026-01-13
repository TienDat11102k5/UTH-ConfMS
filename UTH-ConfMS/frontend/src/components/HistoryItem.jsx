// src/components/HistoryItem.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiFileText, FiMessageSquare, FiLock, FiActivity } from 'react-icons/fi';
import { formatRelativeTime } from '../utils/dateUtils';
import './HistoryItem.css';

/**
 * Component hiển thị một item trong lịch sử hoạt động
 */
const HistoryItem = ({ activity }) => {
    const { t } = useTranslation();
    
    // Helper function to get icon and color based on activity type
    const getActivityIcon = (activityType) => {
        const type = activityType?.toUpperCase();

        if (type?.includes('PAPER') || type?.includes('CAMERA')) {
            return { icon: FiFileText, color: '#3b82f6', bgColor: '#eff6ff' }; // Blue
        } else if (type?.includes('REVIEW')) {
            return { icon: FiMessageSquare, color: '#f97316', bgColor: '#fff7ed' }; // Orange
        } else if (type?.includes('LOGIN') || type?.includes('LOGOUT') || type?.includes('PROFILE') || type?.includes('PASSWORD')) {
            return { icon: FiLock, color: '#6b7280', bgColor: '#f9fafb' }; // Gray
        } else {
            return { icon: FiActivity, color: '#8b5cf6', bgColor: '#faf5ff' }; // Purple
        }
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

    const { icon: IconComponent, color, bgColor } = getActivityIcon(activity.activityType);
    const metadata = getMetadata();
    const entityLink = getEntityLink();
    const relativeTime = formatRelativeTime(activity.timestamp);

    return (
        <div className="history-item">
            <div className="history-item-icon" style={{ backgroundColor: bgColor }}>
                <IconComponent size={24} color={color} />
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
                                <strong>{t('components.historyItem.conference')}:</strong> {metadata.conferenceName}
                            </span>
                        )}
                        {metadata.paperTitle && (
                            <span className="metadata-tag">
                                <strong>{t('components.historyItem.paper')}:</strong> {metadata.paperTitle}
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
                        {t('components.historyItem.viewDetails')} →
                    </Link>
                )}
            </div>
        </div>
    );
};

export default HistoryItem;
