// LanguageSelector.js
import React from 'react';

const LanguageSelector = ({ language, onLanguageChange, translating }) => {
  return (
    <div className="language-buttons">
      <button onClick={() => onLanguageChange('en')} disabled={language === 'en' || translating}>
        English
      </button>
      <button onClick={() => onLanguageChange('my')} disabled={language === 'my' || translating}>
        Myanmar
      </button>
      <button onClick={() => onLanguageChange('th')} disabled={language === 'th' || translating}>
        Thai
      </button>
      {translating && <p>Translating...</p>}
    </div>
  );
};

export default LanguageSelector;
