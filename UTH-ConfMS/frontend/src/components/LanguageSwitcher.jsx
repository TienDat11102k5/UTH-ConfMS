// src/components/LanguageSwitcher.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const toggleLanguage = () => {
    const newLang = currentLang === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
  };

  return (
    <button 
      className="language-switcher nav-link"
      onClick={toggleLanguage}
      title={currentLang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
    >
      <span className={currentLang === 'vi' ? 'lang-active' : 'lang-inactive'}>VI</span>
      <span className="lang-separator">|</span>
      <span className={currentLang === 'en' ? 'lang-active' : 'lang-inactive'}>EN</span>
    </button>
  );
};

export default LanguageSwitcher;
