import { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import Earth from './components/Earth';
import { Groq } from 'groq-sdk';
import ReactMarkdown from 'react-markdown';

const translateText = async (text: string, targetLanguage: 'en' | 'my' | 'th') => {
  const sentences = text.split(/(?<=[.!?])\s+/);
  try {
    const translatedSentences = await Promise.all(
      sentences.map(async (sentence) => {
        const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(sentence)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        return data[0][0][0];
      })
    );
    return translatedSentences.join(' ');
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
};

const SearchBar = ({ onSearch }: { onSearch: (lng: number, lat: number) => void }) => {
  const [searchText, setSearchText] = useState('');
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchText)}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
    );
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      onSearch(lng, lat);
      setSearchText('');
    }
  };
  return (
    <form onSubmit={handleSearch} className="search-form">
      <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search for a place..." className="search-input" />
    </form>
  );
};

function App() {
  const [facts, setFacts] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [dynamicThemes, setDynamicThemes] = useState<Array<{ name: string, prompt: string }>>([]);
  const [language, setLanguage] = useState<'en' | 'my' | 'th'>('en');
  const [translatedFacts, setTranslatedFacts] = useState<string>('');
  const [translating, setTranslating] = useState(false);

  const earthContainerRef = useRef<HTMLDivElement>(null);
  const earthRef = useRef<any>(null);
  const factsContainerRef = useRef<HTMLDivElement>(null);
  const lastAnalysisRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lastAnalysisRef.current) {
      lastAnalysisRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [facts]);

  const handleLanguageChange = async (newLanguage: 'en' | 'my' | 'th') => {
    setTranslating(true);
    setLanguage(newLanguage);
    if (newLanguage === 'en') {
      setTranslatedFacts(facts);
    } else {
      const translatedText = await translateText(facts, newLanguage);
      setTranslatedFacts(translatedText);
    }
    setTranslating(false);
  };

  const generateDynamicThemes = async (location: string) => {
    try {
      const groq = new Groq({ apiKey: import.meta.env.VITE_GROQ_API_KEY, dangerouslyAllowBrowser: true });
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: `Based on the location "${location}", suggest 3 unique and specific analysis themes...` }],
        model: 'llama-3.2-90b-vision-preview',
        temperature: 0.95,
        max_tokens: 5000,
      });
      if (completion.choices && completion.choices[0]?.message?.content) {
        const themes = JSON.parse(completion.choices[0].message.content);
        setDynamicThemes(themes);
      }
    } catch (error) {
      console.error('Error generating dynamic themes:', error);
      setDynamicThemes([]);
    }
  };

  const captureView = async () => {
    if (!earthContainerRef.current) return;
    setLoading(true);
    setDynamicThemes([]);
    try {
      const dataUrl = await toPng(earthContainerRef.current, { cacheBust: true, pixelRatio: 2, quality: 1 });
      setCapturedImage(dataUrl);
      const groq = new Groq({ apiKey: import.meta.env.VITE_GROQ_API_KEY, dangerouslyAllowBrowser: true });
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: [{ type: 'text', text: 'Examine the image and identify the location visible. Provide a detailed analysis of the region.' }, { type: 'image_url', image_url: { url: dataUrl } }] }],
        model: 'llama-3.2-90b-vision-preview',
        temperature: 0.95,
        max_tokens: 8000,
      });
      if (completion.choices && completion.choices[0]?.message?.content) {
        const content = completion.choices[0].message.content;
        const locationMatch = content.match(/^[^•\n]+/);
        if (locationMatch) {
          const location = locationMatch[0].trim();
          setCurrentLocation(location);
          await generateDynamicThemes(location);
        }
        setFacts(content);
        if (language !== 'en') {
          const translatedText = await translateText(content, language);
          setTranslatedFacts(translatedText);
        } else {
          setTranslatedFacts(content);
        }
      }
    } catch (error) {
      console.error('Detailed error:', error);
      setFacts('Error getting facts about this region. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (lng: number, lat: number) => {
    earthRef.current?.handleSearch(lng, lat);
  };

  const saveAnalysis = () => {
    const content = `=== Analysis Report ===\n\n` +
      `Location: ${currentLocation}\n\n` +
      `=== English Analysis ===\n${facts}\n\n` +
      `=== Translated Analysis (${language}) ===\n${translatedFacts}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis_report_${new Date().toISOString()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <div className="earth-container" ref={earthContainerRef}>
        <Earth ref={earthRef} onCaptureView={captureView} />
      </div>
      <div className="info-panel">
        <SearchBar onSearch={handleSearch} />
        <div className="language-buttons">
          <button onClick={() => handleLanguageChange('en')} disabled={language === 'en' || translating}>English</button>
          <button onClick={() => handleLanguageChange('my')} disabled={language === 'my' || translating}>Myanmar</button>
          <button onClick={() => handleLanguageChange('th')} disabled={language === 'th' || translating}>Thai</button>
          {translating && <p>Translating...</p>}
        </div>
        {loading ? <p className="loading-text">Analyzing view...</p> : (
          <div className="facts" ref={factsContainerRef}>
            {capturedImage && <div className="captured-image-container"><img src={capturedImage} alt="Captured view" className="captured-image" /></div>}
            <MarkdownContent content={language === 'en' ? facts : translatedFacts} />
            {analysisLoading && <p className="loading-text analysis-loading">Generating additional analysis...</p>}
            {dynamicThemes.length > 0 && (
              <div className="dynamic-themes">
                {dynamicThemes.map((theme, index) => (
                  <div key={index} className="dynamic-theme">
                    <h4>{theme.name}</h4>
                    <p>{theme.prompt}</p>
                  </div>
                ))}
              </div>
            )}
            <div ref={lastAnalysisRef}></div>
          </div>
        )}
        <button onClick={saveAnalysis} className="save-button">Save Analysis</button>
      </div>
    </div>
  );
}

export default App;
