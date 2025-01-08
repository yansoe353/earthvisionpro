import { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import Earth from './components/Earth';
import { Groq } from 'groq-sdk';
import ReactMarkdown from 'react-markdown';

// Translation function using the free Google Translate endpoint
const translateText = async (text: string, targetLanguage: 'en' | 'my' | 'th') => {
  const sentences = text.split(/(?<=[.!?])\s+/);
  try {
    const translatedSentences = await Promise.all(
      sentences.map(async (sentence) => {
        const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(sentence)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        return data[0][0][0]; // Return translated sentence
      })
    );
    return translatedSentences.join(' ');
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
};

// Fetch real-time data (weather, traffic, news)
const fetchRealTimeData = async (location: string, lat: number, lng: number) => {
  try {
    const [weatherResponse, trafficResponse, newsResponse] = await Promise.all([
      // Fetch weather data
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${import.meta.env.VITE_OPENWEATHERMAP_API_KEY}&units=metric`
      ),
      // Fetch traffic data (using TomTom Traffic API)
      fetch(
        `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${lat},${lng}&key=${import.meta.env.VITE_TOMTOM_API_KEY}`
      ),
      // Fetch news data
      fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(location)}&apiKey=${import.meta.env.VITE_NEWSAPI_API_KEY}`
      ),
    ]);

    const weatherData = await weatherResponse.json();
    const trafficData = await trafficResponse.json();
    const newsData = await newsResponse.json();

    return {
      weather: weatherData,
      traffic: trafficData,
      news: newsData.articles.slice(0, 5), // Limit to 5 news articles
    };
  } catch (error) {
    console.error('Error fetching real-time data:', error);
    return null;
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
      <input
        type="text"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search for a place..."
        className="search-input"
      />
      <button type="submit" className="search-button">
        Search
      </button>
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
  const [realTimeData, setRealTimeData] = useState<{
    weather: any;
    traffic: any;
    news: any[];
  } | null>(null);
  const [realTimeLoading, setRealTimeLoading] = useState(false);

  const earthContainerRef = useRef<HTMLDivElement>(null);
  const earthRef = useRef<any>(null);
  const factsContainerRef = useRef<HTMLDivElement>(null);
  const lastAnalysisRef = useRef<HTMLDivElement>(null);

  // Scroll to the new analysis section when it's added
  useEffect(() => {
    if (lastAnalysisRef.current) {
      lastAnalysisRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [facts]);

  // Handle language change
  const handleLanguageChange = async (newLanguage: 'en' | 'my' | 'th') => {
    setTranslating(true);
    setLanguage(newLanguage);
    if (newLanguage === 'en') {
      setTranslatedFacts(facts); // Show original English text
    } else {
      const translatedText = await translateText(facts, newLanguage);
      setTranslatedFacts(translatedText);
    }
    setTranslating(false);
  };

  // Fetch real-time data when the location changes
  useEffect(() => {
    if (currentLocation && earthRef.current) {
      const { lat, lng } = earthRef.current.getCenter();
      setRealTimeLoading(true);
      fetchRealTimeData(currentLocation, lat, lng)
        .then((data) => {
          setRealTimeData(data);
        })
        .catch((error) => {
          console.error('Error fetching real-time data:', error);
        })
        .finally(() => {
          setRealTimeLoading(false);
        });
    }
  }, [currentLocation]);

  const MarkdownContent = ({ content }: { content: string }) => {
    const sections = content.split('\n\n## ');
    return (
      <>
        <ReactMarkdown>{sections[0]}</ReactMarkdown>
        {sections.slice(1).map((section, index) => (
          <div
            key={index}
            ref={index === sections.length - 2 ? lastAnalysisRef : undefined}
            className="analysis-section"
          >
            <ReactMarkdown>{`## ${section}`}</ReactMarkdown>
          </div>
        ))}
      </>
    );
  };

  const generateDynamicThemes = async (location: string) => {
    try {
      const groq = new Groq({
        apiKey: import.meta.env.VITE_GROQ_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: `Based on the location "${location}", suggest 3 unique and specific analysis themes...`,
          },
        ],
        model: 'llama-3.2-90b-vision-preview',
        temperature: 0.95,
        max_tokens: 5000,
      });

      if (completion.choices && completion.choices[0]?.message?.content) {
        try {
          const themes = JSON.parse(completion.choices[0].message.content);
          setDynamicThemes(themes);
        } catch (error) {
          console.error('Error parsing themes:', error);
          setDynamicThemes([]);
        }
      }
    } catch (error) {
      console.error('Error generating dynamic themes:', error);
      setDynamicThemes([]);
    }
  };

  const analyzeWithPerspective = async (perspective: string, customPrompt?: string) => {
    if (!currentLocation || !facts) return;
    setAnalysisLoading(true);

    // Save the current language
    const currentLang = language;

    try {
      // Force language to English before analysis
      setLanguage('en');

      // Clear previous translated content
      setTranslatedFacts('');

      const groq = new Groq({
        apiKey: import.meta.env.VITE_GROQ_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      const defaultPromptMap = {
        'Environmental Factors': `Based on the location "${currentLocation}", provide additional analysis about its environmental aspects...`,
        'Economic Areas': `Based on the location "${currentLocation}", provide additional analysis about its economic significance...`,
        'Travel Destinations': `Based on the location "${currentLocation}", provide additional analysis about its travel destinations, landmarks,...`,
      };

      const prompt = customPrompt || defaultPromptMap[perspective as keyof typeof defaultPromptMap];

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 5000,
      });

      if (completion.choices && completion.choices[0]?.message?.content) {
        const newAnalysis = completion.choices[0].message.content;

        // Update the facts state with the new analysis
        setFacts((prevFacts) => `${prevFacts}\n\n## ${perspective} Analysis\n${newAnalysis}`);

        // Translate the analysis if the current language is not English
        if (currentLang !== 'en') {
          const translatedText = await translateText(newAnalysis, currentLang);
          setTranslatedFacts((prevTranslatedFacts) => `${prevTranslatedFacts}\n\n## ${perspective} Analysis\n${translatedText}`);
        } else {
          // If the language is English, set the translatedFacts to the new analysis
          setTranslatedFacts((prevTranslatedFacts) => `${prevTranslatedFacts}\n\n## ${perspective} Analysis\n${newAnalysis}`);
        }
      }
    } catch (error) {
      console.error('Error during analysis:', error);
      setFacts((prevFacts) => `${prevFacts}\n\nError analyzing ${perspective} perspective. Please try again.`);
    } finally {
      // Restore the original language
      setLanguage(currentLang);
      setAnalysisLoading(false);
    }
  };

  const captureView = async () => {
    if (!earthContainerRef.current) return;
    setLoading(true);
    setDynamicThemes([]);

    try {
      // Capture the Earth view as a data URL
      const dataUrl = await toPng(earthContainerRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        quality: 1,
      });

      // Set the captured image for display
      setCapturedImage(dataUrl);

      // Initialize Groq client
      const groq = new Groq({
        apiKey: import.meta.env.VITE_GROQ_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      // Send the image URL directly to Groq's vision API
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Examine the image and identify the location visible. Provide a detailed analysis of the region.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl, // Directly use the data URL
                },
              },
            ],
          },
        ],
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

        // Translate the facts if the current language is not English
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
    earthRef.current?.setCenter([lng, lat]);
  };

  // Save analysis to a file
  const saveAnalysis = () => {
    const content = `=== Analysis Report ===\n\n` +
      `Location: ${currentLocation}\n\n` +
      `=== English Analysis ===\n${facts}\n\n` +
      `=== Translated Analysis (${language}) ===\n${translatedFacts}\n\n` +
      `=== Real-Time Data ===\n` +
      `Weather: ${JSON.stringify(realTimeData?.weather, null, 2)}\n\n` +
      `Traffic: ${JSON.stringify(realTimeData?.traffic, null, 2)}\n\n` +
      `News: ${JSON.stringify(realTimeData?.news, null, 2)}`;

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
          <button onClick={() => handleLanguageChange('en')} disabled={language === 'en' || translating}>
            English
          </button>
          <button onClick={() => handleLanguageChange('my')} disabled={language === 'my' || translating}>
            Myanmar
          </button>
          <button onClick={() => handleLanguageChange('th')} disabled={language === 'th' || translating}>
            Thai
          </button>
          {translating && <p>Translating...</p>}
        </div>
        {loading ? (
          <p className="loading-text">Analyzing view...</p>
        ) : (
          <div className="facts" ref={factsContainerRef}>
            {capturedImage && (
              <div className="captured-image-container">
                <img src={capturedImage} alt="Captured view" className="captured-image" />
              </div>
            )}
            <MarkdownContent content={language === 'en' ? facts : translatedFacts} />
            {realTimeLoading && <p className="loading-text">Fetching real-time data...</p>}
            {realTimeData && (
              <div className="real-time-data">
                <h3>Real-Time Data</h3>
                <div>
                  <h4>Weather</h4>
                  <pre>{JSON.stringify(realTimeData.weather, null, 2)}</pre>
                </div>
                <div>
                  <h4>Traffic</h4>
                  <pre>{JSON.stringify(realTimeData.traffic, null, 2)}</pre>
                </div>
                <div>
                  <h4>News</h4>
                  <ul>
                    {realTimeData.news.map((article, index) => (
                      <li key={index}>
                        <a href={article.url} target="_blank" rel="noopener noreferrer">
                          {article.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {analysisLoading && <p className="loading-text analysis-loading">Generating additional analysis...</p>}
            {facts && !loading && (
              <div>
                <div className="analysis-buttons">
                  <button
                    onClick={() => analyzeWithPerspective('Environmental Factors')}
                    className="analysis-button environmental"
                    disabled={analysisLoading}
                  >
                    Environmental Factors and Biodiversity
                  </button>
                  <button
                    onClick={() => analyzeWithPerspective('Economic Areas')}
                    className="analysis-button economic"
                    disabled={analysisLoading}
                  >
                    Economic Areas and Market Strengths
                  </button>
                  <button
                    onClick={() => analyzeWithPerspective('Travel Destinations')}
                    className="analysis-button cultural"
                    disabled={analysisLoading}
                  >
                    Analysis of Travel locations
                  </button>
                </div>
                {dynamicThemes.length > 0 && (
                  <div className="analysis-buttons dynamic-buttons">
                    {currentLocation && (
                      <button
                        className="analysis-button refresh-button"
                        onClick={() => generateDynamicThemes(currentLocation)}
                        disabled={translating}
                      >
                        Refresh Themes
                      </button>
                    )}
                    {dynamicThemes.map((theme, index) => (
                      <button
                        key={theme.name}
                        className={`analysis-button dynamic-${index}`}
                        onClick={() => analyzeWithPerspective(theme.name, theme.prompt)}
                        disabled={analysisLoading || translating}
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>
                )}
                {/* Save Analysis Button */}
                <button
                  onClick={saveAnalysis}
                  className="save-analysis-button"
                  disabled={!facts || translating || analysisLoading}
                >
                  Save Analysis
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
