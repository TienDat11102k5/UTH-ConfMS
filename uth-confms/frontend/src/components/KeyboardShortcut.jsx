// src/components/KeyboardShortcut.jsx
import React from "react";
import "../styles/KeyboardShortcut.css";

/**
 * KeyboardShortcut component - Hiển thị hint phím tắt
 * @param {String} keys - Phím tắt (VD: "ESC", "Ctrl + S")
 * @param {String} description - Mô tả hành động
 * @param {String} variant - Style variant: default, primary, secondary
 */
const KeyboardShortcut = ({ keys = "ESC", description = "", variant = "default" }) => {
  return (
    <div className={`keyboard-shortcut keyboard-shortcut-${variant}`}>
      <kbd className="keyboard-key">{keys}</kbd>
      {description && <span className="keyboard-description">{description}</span>}
    </div>
  );
};

/**
 * KeyboardHint - Hiển thị nhiều shortcuts cùng lúc
 */
export const KeyboardHint = ({ shortcuts = [] }) => {
  if (!shortcuts || shortcuts.length === 0) return null;

  return (
    <div className="keyboard-hint-container">
      {shortcuts.map((shortcut, index) => (
        <KeyboardShortcut key={index} {...shortcut} />
      ))}
    </div>
  );
};

export default KeyboardShortcut;
