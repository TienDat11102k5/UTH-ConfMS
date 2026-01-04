// src/components/LoadingSkeleton.jsx
import React from "react";
import "../styles/LoadingSkeleton.css";

export const CardSkeleton = ({ count = 3 }) => {
  return (
    <div className="skeleton-grid">
      {[...Array(count)].map((_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton-header">
            <div className="skeleton-icon"></div>
            <div className="skeleton-title"></div>
          </div>
          <div className="skeleton-text"></div>
          <div className="skeleton-text short"></div>
          <div className="skeleton-button"></div>
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, columns = 6 }) => {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {[...Array(columns)].map((_, index) => (
          <div key={index} className="skeleton-cell"></div>
        ))}
      </div>
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {[...Array(columns)].map((_, colIndex) => (
            <div key={colIndex} className="skeleton-cell"></div>
          ))}
        </div>
      ))}
    </div>
  );
};

export const StatsSkeleton = ({ count = 4 }) => {
  return (
    <div className="skeleton-stats-grid">
      {[...Array(count)].map((_, index) => (
        <div key={index} className="skeleton-stat-card">
          <div className="skeleton-stat-label"></div>
          <div className="skeleton-stat-value"></div>
        </div>
      ))}
    </div>
  );
};

export const ListSkeleton = ({ items = 3 }) => {
  return (
    <div className="skeleton-list">
      {[...Array(items)].map((_, index) => (
        <div key={index} className="skeleton-list-item">
          <div className="skeleton-avatar"></div>
          <div className="skeleton-list-content">
            <div className="skeleton-list-title"></div>
            <div className="skeleton-list-subtitle"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

const LoadingSkeleton = ({ type = "card", ...props }) => {
  switch (type) {
    case "card":
      return <CardSkeleton {...props} />;
    case "table":
      return <TableSkeleton {...props} />;
    case "stats":
      return <StatsSkeleton {...props} />;
    case "list":
      return <ListSkeleton {...props} />;
    default:
      return <CardSkeleton {...props} />;
  }
};

export default LoadingSkeleton;
