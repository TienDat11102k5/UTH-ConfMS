// src/components/Breadcrumb.jsx
import React from "react";
import { Link } from "react-router-dom";
import { FiHome, FiChevronRight } from "react-icons/fi";
import "../styles/Breadcrumb.css";

/**
 * Breadcrumb component for navigation
 * @param {Array} items - Array of breadcrumb items [{ label, path }]
 * @param {Boolean} showHome - Show home icon as first item (default: true)
 * @param {String} homeUrl - URL for home icon (default: "/")
 */
const Breadcrumb = ({ items = [], showHome = true, homeUrl = "/" }) => {
  return (
    <nav className="breadcrumb-nav" aria-label="breadcrumb">
      <ol className="breadcrumb-list">
        {showHome && (
          <>
            <li className="breadcrumb-item">
              <Link to={homeUrl} className="breadcrumb-link">
                <FiHome className="breadcrumb-home-icon" />
              </Link>
            </li>
            {items.length > 0 && (
              <li className="breadcrumb-separator">
                <FiChevronRight />
              </li>
            )}
          </>
        )}
        
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <React.Fragment key={index}>
              <li className={`breadcrumb-item ${isLast ? 'active' : ''}`}>
                {isLast ? (
                  <span className="breadcrumb-current">{item.label}</span>
                ) : (
                  <Link to={item.path} className="breadcrumb-link">
                    {item.label}
                  </Link>
                )}
              </li>
              
              {!isLast && (
                <li className="breadcrumb-separator">
                  <FiChevronRight />
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
