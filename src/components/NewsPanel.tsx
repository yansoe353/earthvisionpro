import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface NewsPanelProps {
  newsArticles: Array<{ title: string; description: string; url: string }>;
  language: 'en' | 'my' | 'th';
  onTranslate: (text: string, targetLanguage: 'en' | 'my' | 'th') => Promise<string>;
  onClose: () => void;
}

const NewsPanel = ({ newsArticles, language, onTranslate, onClose }: NewsPanelProps) => {
  const [translatedArticles, setTranslatedArticles] = useState<
    Array<{ title: string; description: string; url: string }>
  >([]);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = async (targetLanguage: 'en' | 'my' | 'th') => {
    setIsTranslating(true);
    const translated = await Promise.all(
      newsArticles.map(async (article) => {
        const translatedTitle = await onTranslate(article.title, targetLanguage);
        const translatedDescription = await onTranslate(article.description, targetLanguage);
        return {
          ...article,
          title: translatedTitle,
          description: translatedDescription,
        };
      })
    );
    setTranslatedArticles(translated);
    setIsTranslating(false);
  };

  return (
    <div className="news-panel-backdrop">
      <div className="news-panel">
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Latest News</h2>
        <div className="language-buttons">
          <button onClick={() => handleTranslate('en')} disabled={isTranslating || language === 'en'}>
            English
          </button>
          <button onClick={() => handleTranslate('my')} disabled={isTranslating || language === 'my'}>
            Myanmar
          </button>
          <button onClick={() => handleTranslate('th')} disabled={isTranslating || language === 'th'}>
            Thai
          </button>
        </div>
        {isTranslating && <p>Translating news...</p>}
        <div className="news-articles">
          {(translatedArticles.length > 0 ? translatedArticles : newsArticles).map((article, index) => (
            <div key={index} className="news-article">
              <h3>{article.title}</h3>
              <ReactMarkdown>{article.description}</ReactMarkdown>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsPanel;
