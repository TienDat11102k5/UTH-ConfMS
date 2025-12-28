// src/components/NavDropdown.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiChevronDown, FiSettings, FiUsers, FiFileText, FiTrendingUp, FiBook, FiShield } from "react-icons/fi";
import "../styles/NavDropdown.css";

const NavDropdown = ({ label, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const iconMap = {
    FiSettings: <FiSettings />,
    FiUsers: <FiUsers />,
    FiFileText: <FiFileText />,
    FiTrendingUp: <FiTrendingUp />,
    FiBook: <FiBook />,
    FiShield: <FiShield />
  };

  return (
    <div className="nav-dropdown" ref={dropdownRef}>
      <button
        className={`nav-dropdown-trigger ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {label}
        <FiChevronDown className={`dropdown-icon ${isOpen ? "rotate" : ""}`} />
      </button>

      {isOpen && (
        <div className="nav-dropdown-menu">
          {items.map((item, index) => (
            <Link
              key={index}
              to={item.link}
              className="nav-dropdown-item"
              onClick={() => setIsOpen(false)}
            >
              <span className="dropdown-item-icon">{iconMap[item.icon]}</span>
              <span className="dropdown-item-text">{item.text}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default NavDropdown;
