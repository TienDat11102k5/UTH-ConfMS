// src/hooks/useKeyboardShortcut.js
import { useEffect } from 'react';

/**
 * Custom hook để handle keyboard shortcuts
 * @param {String} key - Key code (VD: 'Escape', 'Enter', 's')
 * @param {Function} callback - Function được gọi khi nhấn phím
 * @param {Object} options - Options: ctrl, shift, alt, enabled
 */
export const useKeyboardShortcut = (key, callback, options = {}) => {
  const { ctrl = false, shift = false, alt = false, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      // Check modifier keys
      if (ctrl && !event.ctrlKey) return;
      if (shift && !event.shiftKey) return;
      if (alt && !event.altKey) return;

      // Check if key matches
      const eventKey = event.key.toLowerCase();
      const targetKey = key.toLowerCase();

      if (eventKey === targetKey || event.code.toLowerCase() === targetKey) {
        event.preventDefault();
        callback(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, callback, ctrl, shift, alt, enabled]);
};

/**
 * Hook để handle ESC key cho modals
 */
export const useEscapeKey = (onEscape, enabled = true) => {
  useKeyboardShortcut('escape', onEscape, { enabled });
};

/**
 * Hook để handle Enter key
 */
export const useEnterKey = (onEnter, enabled = true) => {
  useKeyboardShortcut('enter', onEnter, { enabled });
};

export default useKeyboardShortcut;
