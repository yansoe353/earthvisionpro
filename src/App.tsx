import { useState, useRef, useCallback, useMemo, lazy, Suspense, useEffect } from 'react';
import Earth from './components/Earth';
import { Groq } from 'groq-sdk';
import NewsPanel from './components/NewsPanel';
import SearchBar from './components/SearchBar';
import MarkdownContent from './components/MarkdownContent';
import { Chrono } from 'react-chrono';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { debounce } from 'lodash';
import './index.css';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// Language mapping
const languageMapping = {
  en: 'English',
  my: 'Myanmar (Burmese)',
  th: 'Thai'
};

// Translation cache
const translationCache = new Map();

// Rate limit delay
const RATE_LIMIT_DELAY = 1000;
let lastRequestTime = 0;

// Interfaces
interface DynamicTheme {
  name: string;
  prompt: string;
}

interface HistoricalEvent {
  title: string;
  cardTitle: string;
  cardSubtitle: string;
  cardDetailedText: string;
  image?: string;
}

interface NewsArticle {
  title: string;
  description: string;
  url: string;
}

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
}

// Rate-limited translation function
const rateLimitedTranslateText = async (text: string, targetLanguage: 'en' | 'my' | 'th'): Promise<string> => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();

  const cacheKey = `${text}-${targetLanguage}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  const prompt = `Translate the following text to ${languageMapping[targetLanguage]}: "${text}"`;

  try {
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    });
    const responseText = (await result.response).text();

    if (responseText.includes('Here are a few options')) {
      const options = responseText.split('Here are a few options')[1].trim().split('\n');
      const translatedText = options[0].trim();
      translationCache.set(cacheKey, translatedText);
      return translatedText;
    }

    translationCache.set(cacheKey, responseText);
    return responseText;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
};

// Main App Component
function App() {
  const [facts, setFacts] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [dynamicThemes, setDynamicThemes] = useState<DynamicTheme[]>([]);
  const [language, setLanguage] = useState<'en' | 'my' | 'th'>('en');
  const [translatedFacts, setTranslatedFacts] = useState<string>('');
  const [translating, setTranslating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [isNewsPanelActive, setIsNewsPanelActive] = useState(false);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [showWeatherWidget, setShowWeatherWidget] = useState(false);
  const [historicalInsights, setHistoricalInsights] = useState<string>('');
  const [historicalEvents, setHistoricalEvents] = useState<HistoricalEvent[]>([]);
  const [earthImage, setEarthImage] = useState<string | null>(null);

  const earthContainerRef = useRef<HTMLDivElement>(null);
  const earthRef = useRef<any>(null);
  const factsContainerRef = useRef<HTMLDivElement>(null);
  const lastAnalysisRef = useRef<HTMLDivElement>(null);
  const buttonPanelRef = useRef<HTMLDivElement>(null);

  // Utility functions
  const fetchImage = async (query: string): Promise<string | null> => {
    try {
      const response = await axios.get('https://api.pexels.com/v1/search', {
        headers: {
          Authorization: import.meta.env.VITE_PIXEL_API_KEY,
        },
        params: {
          query,
          per_page: 1,
        },
      });
      return response.data.photos?.[0]?.src.large || null;
    } catch (error) {
      console.error('Error fetching image:', error);
      return null;
    }
  };

  const fetchYouTubeVideos = async (location: string): Promise<YouTubeVideo[]> => {
    const searchPrompt = await generateYouTubeSearchPrompt(location);
    if (!searchPrompt) return [];

    for (const apiKey of [
      import.meta.env.VITE_YOUTUBE_API_KEY_1,
      import.meta.env.VITE_YOUTUBE_API_KEY_2,
      import.meta.env.VITE_YOUTUBE_API_KEY_3
    ]) {
      if (!apiKey) continue;
      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
            searchPrompt
          )}&type=video&maxResults=5&key=${apiKey}`
        );
        if (!response.ok) continue;
        const data = await response.json();
        if (data.items?.length > 0) {
          return data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium.url,
          }));
        }
      } catch (error) {
        console.error(`Error fetching YouTube videos:`, error);
      }
    }
    return [];
  };

  const generateYouTubeSearchPrompt = async (location: string): Promise<string | null> => {
    try {
      const groq = new Groq({
        apiKey: import.meta.env.VITE_GROQ_API_KEY,
        dangerouslyAllowBrowser: true,
      });
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: `Generate a YouTube search prompt for travel videos about ${location}.`,
          },
        ],
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        temperature: 0.7,
        max_tokens: 5000,
      });
      return completion.choices?.[0]?.message?.content?.trim() || null;
    } catch (error) {
      console.error('Error generating YouTube search prompt:', error);
      return null;
    }
  };

  const generateNewsWithAI = async (location: string): Promise<string> => {
    try {
      const groq = new Groq({
        apiKey: import.meta.env.VITE_GROQ_API_KEY,
        dangerouslyAllowBrowser: true,
      });
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: `Generate a brief news summary about ${location}.`,
          },
        ],
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        temperature: 0.7,
        max_tokens: 1000,
      });
      return completion.choices?.[0]?.message?.content?.trim() || 'No news available.';
    } catch (error) {
      console.error('Error generating news with Groq:', error);
      // Fallback to Gemini API
      return generateNewsWithGemini(location);
    }
  };

  const generateNewsWithGemini = async (location: string): Promise<string> => {
    try {
      const prompt = `Generate a brief news summary about ${location}.`;
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }]
      });
      return (await result.response).text() || 'No news available.';
    } catch (error) {
      console.error('Error generating news with Gemini:', error);
      return 'Failed to generate news.';
    }
  };

  const generateEarthImage = async (location: string): Promise<string | null> => {
    try {
      const imageUrl = await fetchImage(location);
      return imageUrl || 'https://via.placeholder.com/600x400';
    } catch (error) {
      console.error('Error generating Earth image:', error);
      return null;
    }
  };

  const generateDynamicThemes = async (location: string): Promise<DynamicTheme[]> => {
    try {
      const groq = new Groq({
        apiKey: import.meta.env.VITE_GROQ_API_KEY,
        dangerouslyAllowBrowser: true,
      });
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: `Based on the location "${location}", suggest 3 unique analysis themes. Return as JSON array of objects with "name" and "prompt" properties.`,
          },
        ],
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        temperature: 0.95,
        max_tokens: 5000,
      });
      if (completion.choices?.[0]?.message?.content) {
        try {
          return JSON.parse(completion.choices[0].message.content);
        } catch (error) {
          console.error('Error parsing dynamic themes:', error);
          return [];
        }
      }
      return [];
    } catch (error) {
      console.error('Error generating dynamic themes:', error);
      return [];
    }
  };

  const debouncedHandleSearch = useCallback(
    debounce((lng: number, lat: number) => {
      handleSearch(lng, lat);
    }, 300),
    []
  );

  const handleRewrittenContent = async (newContent: string) => {
    setFacts(newContent);
    if (language !== 'en') {
      const translatedText = await rateLimitedTranslateText(newContent, language);
      setTranslatedFacts(translatedText);
    } else {
      setTranslatedFacts(newContent);
    }
  };

  const fetchHistoricalInsights = async () => {
    if (!currentLocation) return;
    setLoading(true);
    try {
      const groq = new Groq({
        apiKey: import.meta.env.VITE_GROQ_API_KEY,
        dangerouslyAllowBrowser: true,
      });
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: `Provide a detailed historical summary of ${currentLocation}. Include key events, cultural developments, and environmental changes. Also provide a list of historical events in JSON format.`,
          },
        ],
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        temperature: 0.7,
        max_tokens: 1000,
      });
      if (completion.choices?.[0]?.message?.content) {
        const response = completion.choices[0].message.content;
        const insights = response.split('JSON format like this:')[0].trim();
        setHistoricalInsights(insights);
        const eventsJson = response.match(/\[.*\]/s)?.[0];
        if (eventsJson) {
          const events = JSON.parse(eventsJson) as HistoricalEvent[];
          const eventsWithImages = await Promise.all(
            events.map(async (event) => ({
              ...event,
              image: await fetchImage(event.cardTitle) || 'https://via.placeholder.com/300x200',
            }))
          );
          setHistoricalEvents(eventsWithImages);
          if (language !== 'en') {
            const translatedInsights = await rateLimitedTranslateText(insights, language);
            setHistoricalInsights(translatedInsights);
            const translatedEvents = await Promise.all(
              historicalEvents.map(async (event) => ({
                ...event,
                cardTitle: await rateLimitedTranslateText(event.cardTitle, language),
                cardSubtitle: await rateLimitedTranslateText(event.cardSubtitle, language),
                cardDetailedText: await rateLimitedTranslateText(event.cardDetailedText, language),
              }))
            );
            setHistoricalEvents(translatedEvents);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching historical insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (lng: number, lat: number) => {
    earthRef.current?.handleSearch(lng, lat);
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
    );
    const data = await response.json();
    if (data.features?.length > 0) {
      const locationName = data.features[0].place_name;
      setCurrentLocation(locationName);
      setYoutubeVideos(await fetchYouTubeVideos(locationName));
    }
  };

  const fetchLocationName = async (lng: number, lat: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
      );
      const data = await response.json();
      return data.features?.[0]?.place_name || 'Unknown Location';
    } catch (error) {
      console.error('Error fetching location name:', error);
      return 'Unknown Location';
    }
  };

  const analyzeWithGroqOrGemini = async (imageUrl: string, locationName: string) => {
    try {
      const groq = new Groq({
        apiKey: import.meta.env.VITE_GROQ_API_KEY,
        dangerouslyAllowBrowser: true,
      });
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: `Examine the image and provide a detailed analysis of the region. The location is ${locationName}. Include geographical, cultural, and environmental insights.`,
          },
        ],
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        temperature: 0.95,
        max_tokens: 8000,
      });
      return completion.choices?.[0]?.message?.content || 'No analysis available.';
    } catch (error) {
      console.error('Error analyzing with Groq:', error);
      // Fallback to Gemini API
      return analyzeWithGemini(imageUrl, locationName);
    }
  };

  const analyzeWithGemini = async (imageUrl: string, locationName: string) => {
    try {
      const prompt = `Examine the image and provide a detailed analysis of the region. The location is ${locationName}. Include geographical, cultural, and environmental insights.`;
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/png',
                data: imageUrl.split(',')[1] // Remove the data URL prefix
              }
            }
          ]
        }]
      });
      return (await result.response).text() || 'No analysis available.';
    } catch (error) {
      console.error('Error analyzing with Gemini:', error);
      return 'Error analyzing the image.';
    }
  };

  const captureView = async () => {
    if (!earthContainerRef.current || !earthRef.current) return;
    setShowWeatherWidget(false);
    setLoading(true);
    setDynamicThemes([]);
    setHistoricalInsights('');
    setHistoricalEvents([]);
    const timeout = setTimeout(() => {
      setFacts('Error: Analyzing view is taking too long.');
      setLoading(false);
    }, 60000);
    try {
      const map = earthRef.current.getMap();
      if (!map) throw new Error('Map instance not found.');
      await new Promise((resolve) => {
        map.once('idle', resolve);
      });
      const canvas = map.getCanvas();
      if (!canvas) throw new Error('Canvas not found.');
      const dataUrl = canvas.toDataURL('image/png', 0.5);
      setCapturedImage(dataUrl);
      const center = map.getCenter();
      const lng = center.lng;
      const lat = center.lat;
      const locationName = await fetchLocationName(lng, lat);
      setCurrentLocation(locationName);
      const analysis = await analyzeWithGroqOrGemini(dataUrl, locationName);
      setFacts(analysis);
      if (language !== 'en') {
        const translatedAnalysis = await rateLimitedTranslateText(analysis, language);
        setTranslatedFacts(translatedAnalysis);
      } else {
        setTranslatedFacts(analysis);
      }
      const themes = await generateDynamicThemes(locationName);
      setDynamicThemes(themes);
      setYoutubeVideos(await fetchYouTubeVideos(locationName));
      setEarthImage(await generateEarthImage(locationName));
    } catch (error) {
      console.error('Error capturing view:', error);
      setFacts('Error getting facts about this region.');
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const analyzeWithPerspective = async (perspective: string, customPrompt?: string) => {
    if (!currentLocation || !facts) return;
    setAnalysisLoading(true);
    const currentLang = language;
    setLanguage('en');
    setTranslatedFacts('');
    try {
      const groq = new Groq({
        apiKey: import.meta.env.VITE_GROQ_API_KEY,
        dangerouslyAllowBrowser: true,
      });
      const defaultPromptMap: { [key: string]: string } = {
        'Environmental Factors': `Analyze environmental aspects of ${currentLocation}.`,
        'Economic Areas': `Analyze economic significance of ${currentLocation}.`,
        'Travel Destinations': `Analyze travel destinations in ${currentLocation}.`,
      };
      const prompt = customPrompt || defaultPromptMap[perspective];
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        temperature: 0.7,
        max_tokens: 5000,
      });
      if (completion.choices?.[0]?.message?.content) {
        const newAnalysis = completion.choices[0].message.content;
        setFacts(prev => `${prev}\n\n## ${perspective} Analysis\n${newAnalysis}`);
        if (currentLang !== 'en') {
          const translatedText = await rateLimitedTranslateText(newAnalysis, currentLang);
          setTranslatedFacts(prev => `${prev}\n\n## ${perspective} Analysis\n${translatedText}`);
        } else {
          setTranslatedFacts(prev => `${prev}\n\n## ${perspective} Analysis\n${newAnalysis}`);
        }
      }
    } catch (error) {
      console.error('Error during analysis:', error);
    } finally {
      setLanguage(currentLang);
      setAnalysisLoading(false);
    }
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

  const handleLanguageChange = async (newLanguage: 'en' | 'my' | 'th') => {
    setTranslating(true);
    setLanguage(newLanguage);
    const translateAllContent = async () => {
      if (facts) {
        setTranslatedFacts(await rateLimitedTranslateText(facts, newLanguage));
      }
      if (historicalInsights) {
        setHistoricalInsights(await rateLimitedTranslateText(historicalInsights, newLanguage));
      }
      if (historicalEvents.length > 0) {
        setHistoricalEvents(await Promise.all(
          historicalEvents.map(async (event) => ({
            ...event,
            cardTitle: await rateLimitedTranslateText(event.cardTitle, newLanguage),
            cardSubtitle: await rateLimitedTranslateText(event.cardSubtitle, newLanguage),
            cardDetailedText: await rateLimitedTranslateText(event.cardDetailedText, newLanguage),
          }))
        ));
      }
      if (newsArticles.length > 0) {
        setNewsArticles(await Promise.all(
          newsArticles.map(async (article) => ({
            ...article,
            title: await rateLimitedTranslateText(article.title, newLanguage),
            description: await rateLimitedTranslateText(article.description, newLanguage),
          }))
        ));
      }
      if (dynamicThemes.length > 0) {
        setDynamicThemes(await Promise.all(
          dynamicThemes.map(async (theme) => ({
            ...theme,
            name: await rateLimitedTranslateText(theme.name, newLanguage),
            prompt: await rateLimitedTranslateText(theme.prompt, newLanguage),
          }))
        ));
      }
    };
    await translateAllContent();
    setTranslating(false);
  };

  const memoizedDynamicThemes = useMemo(() => dynamicThemes, [dynamicThemes]);

  useEffect(() => {
    const handleTouchMove = (event: TouchEvent) => {};
    const handleTouchEnd = (event: TouchEvent) => {};
    if (earthContainerRef.current) {
      earthContainerRef.current.addEventListener('touchmove', handleTouchMove);
      earthContainerRef.current.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      if (earthContainerRef.current) {
        earthContainerRef.current.removeEventListener('touchmove', handleTouchMove);
        earthContainerRef.current.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, []);

  return (
    <div className="app">
      <div className="earth-container" ref={earthContainerRef}>
        <Suspense fallback={<div>Loading Earth...</div>}>
          <Earth
            ref={earthRef}
            onCaptureView={captureView}
            showWeatherWidget={showWeatherWidget}
            setShowWeatherWidget={setShowWeatherWidget}
          />
        </Suspense>
      </div>

      <div className="info-panel">
        <SearchBar onSearch={debouncedHandleSearch} />
        <button className="menu-button" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          ☰ Menu
        </button>

        <div className={`button-panel ${isMenuOpen ? 'active' : ''}`} ref={buttonPanelRef}>
          <button className="close-panel-button" onClick={() => setIsMenuOpen(false)}>
            &times;
          </button>

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

          <button
            onClick={async () => {
              setIsNewsPanelActive(!isNewsPanelActive);
              setIsNewsLoading(true);
              const newsContent = await generateNewsWithAI(currentLocation);
              setNewsArticles([{ title: 'Latest News', description: newsContent, url: '' }]);
              setIsNewsLoading(false);
            }}
            className="news-button"
            disabled={!currentLocation}
          >
            📰 Read News
          </button>

          <button
            onClick={fetchHistoricalInsights}
            className="historical-insights-button"
            disabled={!currentLocation || loading}
          >
            🕰️ View Historical Insights
          </button>

          <button
            onClick={async () => {
              const earthImage = await generateEarthImage(currentLocation);
              setEarthImage(earthImage);
            }}
            className="generate-image-button"
            disabled={!currentLocation || loading}
          >
            🌄 Generate Earth Image
          </button>
        </div>

        {loading ? (
          <p className="loading-text">Analyzing view...</p>
        ) : (
          <div className="facts analysis-data" ref={factsContainerRef}>
            {capturedImage && (
              <div className="captured-image-container">
                <img src={capturedImage} alt="Captured view" className="captured-image" loading="lazy" />
              </div>
            )}

            {earthImage && (
              <div className="earth-image-container">
                <img src={earthImage} alt="Generated Earth view" className="earth-image" loading="lazy" />
              </div>
            )}

            <MarkdownContent
              content={language === 'en' ? facts : translatedFacts}
              language={language}
              onRewrite={handleRewrittenContent}
            />

            {analysisLoading && <p className="loading-text analysis-loading">Generating additional analysis...</p>}

            {facts && !loading && (
              <div>
                <div className="analysis-buttons">
                  <button
                    onClick={() => analyzeWithPerspective('Environmental Factors')}
                    className="analysis-button environmental"
                    disabled={analysisLoading}
                  >
                    Environmental Factors
                  </button>
                  <button
                    onClick={() => analyzeWithPerspective('Economic Areas')}
                    className="analysis-button economic"
                    disabled={analysisLoading}
                  >
                    Economic Areas
                  </button>
                  <button
                    onClick={() => analyzeWithPerspective('Travel Destinations')}
                    className="analysis-button cultural"
                    disabled={analysisLoading}
                  >
                    Travel Destinations
                  </button>
                </div>

                {memoizedDynamicThemes.length > 0 && (
                  <div className="analysis-buttons dynamic-buttons">
                    <button
                      className="analysis-button refresh-button"
                      onClick={async () => {
                        const themes = await generateDynamicThemes(currentLocation);
                        setDynamicThemes(themes);
                      }}
                      disabled={translating || !currentLocation}
                    >
                      {language === 'en' ? 'Refresh Themes' :
                       language === 'my' ? 'အကြောင်းအရာအသစ်များရယူရန်' :
                       'รีเฟรชธีม'}
                    </button>
                    {memoizedDynamicThemes.map((theme, index) => (
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

                <button
                  onClick={saveAnalysis}
                  className="save-analysis-button"
                  disabled={!facts || translating || analysisLoading}
                >
                  Save Analysis
                </button>
              </div>
            )}

            {historicalInsights && (
              <div className="historical-insights">
                <h2>Historical Insights for {currentLocation}</h2>
                {translating ? (
                  <p>Translating historical insights...</p>
                ) : (
                  <MarkdownContent
                    content={historicalInsights}
                    language={language}
                    onRewrite={handleRewrittenContent}
                  />
                )}
                {historicalEvents.length > 0 && (
                  <div className="timeline-container">
                    <Chrono
                      items={historicalEvents.map((event) => ({
                        title: event.title,
                        cardTitle: event.cardTitle,
                        cardSubtitle: event.cardSubtitle,
                        cardDetailedText: event.cardDetailedText,
                        media: {
                          type: 'IMAGE',
                          source: {
                            url: event.image || 'https://via.placeholder.com/300x200',
                          },
                        },
                      }))}
                      mode="HORIZONTAL"
                      theme={{ primary: '#4CAF50', secondary: '#FFC107' }}
                    />
                  </div>
                )}
              </div>
            )}

            {youtubeVideos.length > 0 && (
              <div className="youtube-videos">
                <h2>Travel Videos for {currentLocation}</h2>
                <div className="video-grid">
                  {youtubeVideos.map((video) => (
                    <div key={video.id} className="video-item">
                      <img src={video.thumbnail} alt={video.title} className="video-thumbnail" />
                      <iframe
                        width="100%"
                        height="200"
                        src={`https://www.youtube.com/embed/${video.id}`}
                        title={video.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                      <p>{video.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isNewsPanelActive && newsArticles.length > 0 && (
        <Suspense fallback={<div>Loading News Panel...</div>}>
          <NewsPanel
            newsArticles={newsArticles}
            language={language}
            onTranslate={rateLimitedTranslateText}
            onClose={() => setIsNewsPanelActive(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;
