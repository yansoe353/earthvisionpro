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
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Language mapping to understand the nuances of the translation
const languageMapping: { [key: string]: string } = {
  en: 'English',
  my: 'Myanmar (Burmese)',
  th: 'Thai',
};

// Translation cache
const translationCache = new Map<string, string>();

// Rate limit delay
const RATE_LIMIT_DELAY = 1000; // 1 second delay between requests
let lastRequestTime = 0;

// Translation function using the Gemini API with rate limiting and caching
const rateLimitedTranslateText = async (text: string, targetLanguage: 'en' | 'my' | 'th') => {
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
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Handle the Gemini API response
    if (responseText.includes('Here are a few options')) {
      // Extract the first translation option
      const options = responseText.split('Here are a few options')[1].trim().split('\n');
      const translatedText = options[0].trim();
      translationCache.set(cacheKey, translatedText);
      return translatedText;
    }

    translationCache.set(cacheKey, responseText);
    return responseText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text if translation fails
  }
};

// Fetch image using Pexels API
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

    if (response.data.photos && response.data.photos.length > 0) {
      return response.data.photos[0].src.large;
    } else {
      console.warn('No images found for the query:', query);
      return null;
    }
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
};

// Generate Earth image using Pexels API as a fallback
const generateEarthImage = async (location: string): Promise<string | null> => {
  try {
    // Fetch an image from Pexels API
    const imageUrl = await fetchImage(location);
    if (imageUrl) {
      console.log('Image fetched from Pexels:', imageUrl);
      return imageUrl;
    } else {
      console.warn('No image found for the location. Using a placeholder.');
      return 'https://via.placeholder.com/600x400'; // Placeholder image
    }
  } catch (error) {
    console.error('Error generating Earth image:', error);
    return null;
  }
};

// App Component
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

  // Debounce the handleSearch function
  const debouncedHandleSearch = useCallback(
    debounce((lng: number, lat: number) => {
      handleSearch(lng, lat);
    }, 300),
    []
  );

  // Handle rewritten content from MarkdownContent
  const handleRewrittenContent = async (newContent: string) => {
    setFacts(newContent);
    if (language !== 'en') {
      const translatedText = await rateLimitedTranslateText(newContent, language);
      setTranslatedFacts(translatedText);
    } else {
      setTranslatedFacts(newContent);
    }
  };

  // Fetch historical insights and events using Groq API
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
            content: `Provide a detailed historical summary of ${currentLocation}. Include key events, cultural developments, and environmental changes. Also, provide a list of historical events in JSON format like this:
            [
              {
                "title": "Event Year",
                "cardTitle": "Event Title",
                "cardSubtitle": "Event Subtitle",
                "cardDetailedText": "Detailed description of the event."
              }
            ]
            Keep the response concise and engaging.`,
          },
        ],
        model: 'llama-3.2-90b-vision-preview',
        temperature: 0.7,
        max_tokens: 1000,
      });

      if (completion.choices && completion.choices[0]?.message?.content) {
        const response = completion.choices[0].message.content;

        // Extract historical insights
        const insights = response.split('JSON format like this:')[0].trim();
        setHistoricalInsights(insights);

        // Extract historical events from JSON
        const eventsJson = response.match(/\[.*\]/s)?.[0]; // Match JSON array
        if (eventsJson) {
          const events = JSON.parse(eventsJson) as HistoricalEvent[];

          // Fetch images for each event using Pexels API
          const eventsWithImages = await Promise.all(
            events.map(async (event) => {
              const imageUrl = await fetchImage(event.cardTitle); // Use event title as the search query
              return { ...event, image: imageUrl || 'https://via.placeholder.com/300x200' }; // Fallback to placeholder
            })
          );

          setHistoricalEvents(eventsWithImages);

          // Translate content if the current language is not English
          if (language !== 'en') {
            const translatedInsights = await rateLimitedTranslateText(insights, language);
            setHistoricalInsights(translatedInsights);

            const translatedEvents = await Promise.all(
              eventsWithImages.map(async (event) => ({
                ...event,
                cardTitle: await rateLimitedTranslateText(event.cardTitle, language),
                cardSubtitle: await rateLimitedTranslateText(event.cardSubtitle, language),
                cardDetailedText: await rateLimitedTranslateText(event.cardDetailedText, language),
              }))
            );
            setHistoricalEvents(translatedEvents);
          }
        } else {
          console.error('No historical events found in the response.');
          setHistoricalEvents([]);
        }
      }
    } catch (error) {
      console.error('Error fetching historical insights:', error);
      setHistoricalInsights('Failed to fetch historical insights. Please try again.');
      setHistoricalEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search for a location
  const handleSearch = async (lng: number, lat: number) => {
    earthRef.current?.handleSearch(lng, lat);

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
    );
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const locationName = data.features[0].place_name;
      setCurrentLocation(locationName);
      const videos = await fetchYouTubeVideos(locationName);
      setYoutubeVideos(videos);
    }
  };

  // Fetch location name from Mapbox Geocoding API
  const fetchLocationName = async (lng: number, lat: number): Promise<string> => {
    const accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        return data.features[0].place_name;
      }
      return 'Unknown Location';
    } catch (error) {
      console.error('Error fetching location name:', error);
      return 'Unknown Location';
    }
  };

  // Analyze image and location with Groq API
  const analyzeWithGroq = async (imageUrl: string, locationName: string): Promise<string> => {
    const groq = new Groq({
      apiKey: import.meta.env.VITE_GROQ_API_KEY,
      dangerouslyAllowBrowser: true,
    });

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Examine the image and provide a detailed analysis of the region. The location is ${locationName}. Include geographical, cultural, and environmental insights.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        model: 'llama-3.2-11b-vision-preview',
        temperature: 0.95,
        max_tokens: 8000,
      });

      if (completion.choices && completion.choices[0]?.message?.content) {
        return completion.choices[0].message.content;
      }
      return 'No analysis available.';
    } catch (error) {
      console.error('Error analyzing with Groq:', error);
      return 'Error analyzing the image. Please try again.';
    }
  };

  // Capture the current view of the globe
  const captureView = async () => {
    if (!earthContainerRef.current || !earthRef.current) {
      console.error('Earth container or reference is not available.');
      return;
    }

    console.log('Capturing view...');

    // Reset historical insights and events
    setHistoricalInsights('');
    setHistoricalEvents([]);

    setShowWeatherWidget(false);
    setLoading(true);
    setDynamicThemes([]);

    const timeout = setTimeout(() => {
      console.error('Analyzing view is taking too long. Please check your internet connection or try again later.');
      setFacts('Error: Analyzing view is taking too long. Please check your internet connection or try again later.');
      setLoading(false);
    }, 60000); // 30 seconds timeout

    try {
      const map = earthRef.current.getMap();
      if (!map) {
        throw new Error('Map instance not found.');
      }

      console.log('Map instance found.');

      await new Promise((resolve) => {
        map.once('idle', resolve);
      });

      const canvas = map.getCanvas();
      if (!canvas) {
        throw new Error('Canvas not found.');
      }

      console.log('Canvas found.');

      // Reduce the resolution of the captured image for better performance on mobile
      const dataUrl = canvas.toDataURL('image/png', 0.5); // Reduce quality
      setCapturedImage(dataUrl);

      const center = map.getCenter();
      const lng = center.lng;
      const lat = center.lat;

      console.log('Captured view center:', lng, lat);

      const locationName = await fetchLocationName(lng, lat);
      setCurrentLocation(locationName);

      const analysis = await analyzeWithGroq(dataUrl, locationName);
      setFacts(analysis);

      // Translate the analysis if the current language is not English
      if (language !== 'en') {
        const translatedAnalysis = await rateLimitedTranslateText(analysis, language);
        setTranslatedFacts(translatedAnalysis);
      } else {
        setTranslatedFacts(analysis);
      }

      await generateDynamicThemes(locationName);
      await fetchYouTubeVideos(locationName);

      // Generate Earth image using Pexels API
      const earthImage = await generateEarthImage(locationName);
      setEarthImage(earthImage);
    } catch (error) {
      console.error('Error capturing view:', error);
      setFacts('Error getting facts about this region. Please try again.');
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  // Generate dynamic themes for analysis
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
            content: `Based on the location "${location}", suggest 3 unique and specific analysis themes. Return the response as a JSON array of objects with "name" and "prompt" properties.`,
          },
        ],
        model: 'llama-3.2-90b-vision-preview',
        temperature: 0.95,
        max_tokens: 5000,
      });

      if (completion.choices && completion.choices[0]?.message?.content) {
        const themes = JSON.parse(completion.choices[0].message.content) as DynamicTheme[];
        setDynamicThemes(themes);
      }
    } catch (error) {
      console.error('Error generating dynamic themes:', error);
      setDynamicThemes([]);
    }
  };

  // Analyze with a specific perspective
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
        'Environmental Factors': `Based on the location "${currentLocation}", provide additional analysis about its environmental aspects, biodiversity, and climate.`,
        'Economic Areas': `Based on the location "${currentLocation}", provide additional analysis about its economic significance, industries, and market strengths.`,
        'Travel Destinations': `Based on the location "${currentLocation}", provide additional analysis about its travel destinations, landmarks, and cultural attractions.`,
      };

      const prompt = customPrompt || defaultPromptMap[perspective];

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
        setFacts((prevFacts) => `${prevFacts}\n\n## ${perspective} Analysis\n${newAnalysis}`);

        if (currentLang !== 'en') {
          const translatedText = await rateLimitedTranslateText(newAnalysis, currentLang);
          setTranslatedFacts((prevTranslatedFacts) => `${prevTranslatedFacts}\n\n## ${perspective} Analysis\n${translatedText}`);
        } else {
          setTranslatedFacts((prevTranslatedFacts) => `${prevTranslatedFacts}\n\n## ${perspective} Analysis\n${newAnalysis}`);
        }
      }
    } catch (error) {
      console.error('Error during analysis:', error);
      setFacts((prevFacts) => `${prevFacts}\n\nError analyzing ${perspective} perspective. Please try again.`);
    } finally {
      setLanguage(currentLang);
      setAnalysisLoading(false);
    }
  };

  // Save analysis to a file
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

  // Handle language change for all insights and content
  const handleLanguageChange = async (newLanguage: 'en' | 'my' | 'th') => {
    setTranslating(true);
    setLanguage(newLanguage);

    // Translate all content
    const translateAllContent = async () => {
      if (facts) {
        const translatedFactsText = await rateLimitedTranslateText(facts, newLanguage);
        setTranslatedFacts(translatedFactsText);
      }

      if (historicalInsights) {
        const translatedHistoricalInsights = await rateLimitedTranslateText(historicalInsights, newLanguage);
        setHistoricalInsights(translatedHistoricalInsights);
      }

      if (historicalEvents.length > 0) {
        const translatedEvents = await Promise.all(
          historicalEvents.map(async (event) => ({
            ...event,
            cardTitle: await rateLimitedTranslateText(event.cardTitle, newLanguage),
            cardSubtitle: await rateLimitedTranslateText(event.cardSubtitle, newLanguage),
            cardDetailedText: await rateLimitedTranslateText(event.cardDetailedText, newLanguage),
          }))
        );
        setHistoricalEvents(translatedEvents);
      }

      if (newsArticles.length > 0) {
        const translatedNewsArticles = await Promise.all(
          newsArticles.map(async (article) => ({
            ...article,
            title: await rateLimitedTranslateText(article.title, newLanguage),
            description: await rateLimitedTranslateText(article.description, newLanguage),
          }))
        );
        setNewsArticles(translatedNewsArticles);
      }

      if (dynamicThemes.length > 0) {
        const translatedThemes = await Promise.all(
          dynamicThemes.map(async (theme) => ({
            ...theme,
            name: await rateLimitedTranslateText(theme.name, newLanguage),
            prompt: await rateLimitedTranslateText(theme.prompt, newLanguage),
          }))
        );
        setDynamicThemes(translatedThemes);
      }
    };

    await translateAllContent();
    setTranslating(false);
  };

  // Memoize dynamic themes
  const memoizedDynamicThemes = useMemo(() => dynamicThemes, [dynamicThemes]);

  // Add touch event listeners if needed
  useEffect(() => {
    const handleTouchMove = (event: TouchEvent) => {
      // Handle touch move event
    };

    const handleTouchEnd = (event: TouchEvent) => {
      // Handle touch end event
    };

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
            🌄 Generate Earth Landscaping Photography
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
                {memoizedDynamicThemes.length > 0 && (
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
                      <p>{video.description}</p>
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
