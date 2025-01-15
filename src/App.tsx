import { useState, useRef } from 'react';
import Earth from './components/Earth';
import { Groq } from 'groq-sdk';
import NewsPanel from './components/NewsPanel';
import SearchBar from './components/SearchBar';
import MarkdownContent from './components/MarkdownContent';
import VirtualTour from './components/VirtualTour';
import { Chrono } from 'react-chrono';
import './index.css';

// Translation function using the free Google Translate endpoint
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

// List of YouTube API keys
const YOUTUBE_API_KEYS = [
  import.meta.env.VITE_YOUTUBE_API_KEY_1,
  import.meta.env.VITE_YOUTUBE_API_KEY_2,
  import.meta.env.VITE_YOUTUBE_API_KEY_3,
];

// Fetch YouTube videos using the generated prompt
const fetchYouTubeVideos = async (location: string) => {
  const searchPrompt = await generateYouTubeSearchPrompt(location);
  if (!searchPrompt) {
    console.error('Failed to generate YouTube search prompt.');
    return [];
  }

  // Try each API key until one succeeds
  for (let i = 0; i < YOUTUBE_API_KEYS.length; i++) {
    const apiKey = YOUTUBE_API_KEYS[i];
    if (!apiKey) {
      console.error(`YouTube API key ${i + 1} is missing.`);
      continue;
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          searchPrompt
        )}&type=video&maxResults=5&key=${apiKey}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`YouTube API request failed with key ${i + 1}:`, response.status, response.statusText, errorData);
        continue; // Try the next key
      }

      const data = await response.json();
      if (data.items && data.items.length > 0) {
        return data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
        }));
      } else {
        console.warn('No YouTube videos found for the location:', location);
        return [];
      }
    } catch (error) {
      console.error(`Error fetching YouTube videos with key ${i + 1}:`, error);
      continue; // Try the next key
    }
  }

  console.error('All YouTube API keys failed.');
  return [];
};

// Generate YouTube search prompt using Groq API
const generateYouTubeSearchPrompt = async (location: string) => {
  try {
    const groq = new Groq({
      apiKey: import.meta.env.VITE_GROQ_API_KEY,
      dangerouslyAllowBrowser: true,
    });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `Generate a YouTube search prompt for travel videos about ${location}. The prompt should be concise and optimized for finding relevant travel content.`,
        },
      ],
      model: 'llama-3.2-90b-vision-preview',
      temperature: 0.7,
      max_tokens: 5000,
    });

    if (completion.choices && completion.choices[0]?.message?.content) {
      return completion.choices[0].message.content.trim();
    }
  } catch (error) {
    console.error('Error generating YouTube search prompt:', error);
  }
  return null;
};

// Generate news content using Groq API
const generateNewsWithAI = async (location: string) => {
  try {
    const groq = new Groq({
      apiKey: import.meta.env.VITE_GROQ_API_KEY,
      dangerouslyAllowBrowser: true,
    });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `Generate a brief news summary about ${location}. Focus on recent events, cultural highlights, or significant developments.`,
        },
      ],
      model: 'llama-3.2-90b-vision-preview',
      temperature: 0.7,
      max_tokens: 1000,
    });

    if (completion.choices && completion.choices[0]?.message?.content) {
      return completion.choices[0].message.content.trim();
    }
    return 'No news available for this location.';
  } catch (error) {
    console.error('Error generating news:', error);
    return 'Failed to generate news. Please try again.';
  }
};

// Fetch historical insights and events using Groq API
const fetchHistoricalInsightsWithGroq = async (location: string) => {
  try {
    const groq = new Groq({
      apiKey: import.meta.env.VITE_GROQ_API_KEY,
      dangerouslyAllowBrowser: true,
    });

    // Fetch historical summary
    const summaryCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `Provide a detailed historical summary of ${location}. Include key events, cultural developments, and environmental changes. Keep the response concise and engaging.`,
        },
      ],
      model: 'llama-3.2-90b-vision-preview',
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Fetch historical events
    const eventsCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `Generate a list of 5 key historical events for ${location}. For each event, provide a title, a brief description, and the year it occurred. Format the response as a JSON array: [{ "title": "Event Title", "cardTitle": "Event Title", "cardSubtitle": "Year", "cardDetailedText": "Event Description" }]`,
        },
      ],
      model: 'llama-3.2-90b-vision-preview',
      temperature: 0.7,
      max_tokens: 1000,
    });

    const historicalSummary = summaryCompletion.choices[0]?.message?.content || 'No historical summary available.';
    const historicalEvents = JSON.parse(eventsCompletion.choices[0]?.message?.content || '[]');

    return { historicalSummary, historicalEvents };
  } catch (error) {
    console.error('Error fetching historical insights:', error);
    return { historicalSummary: 'Failed to fetch historical insights. Please try again.', historicalEvents: [] };
  }
};

// App Component
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
  const [voiceCommandFeedback, setVoiceCommandFeedback] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [youtubeVideos, setYoutubeVideos] = useState<Array<{ id: string, title: string }>>([]);
  const [isVirtualTourActive, setIsVirtualTourActive] = useState(false);
  const [virtualTourLocation, setVirtualTourLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [newsArticles, setNewsArticles] = useState<Array<{ title: string, description: string, url: string }>>([]);
  const [isNewsPanelActive, setIsNewsPanelActive] = useState(false);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [showWeatherWidget, setShowWeatherWidget] = useState(false);
  const [historicalInsights, setHistoricalInsights] = useState<string>('');
  const [historicalEvents, setHistoricalEvents] = useState<Array<{ title: string; cardTitle: string; cardSubtitle: string; cardDetailedText: string }>>([]);
  const [isHistoricalLoading, setIsHistoricalLoading] = useState(false);

  const earthContainerRef = useRef<HTMLDivElement>(null);
  const earthRef = useRef<any>(null);
  const factsContainerRef = useRef<HTMLDivElement>(null);
  const lastAnalysisRef = useRef<HTMLDivElement>(null);
  const buttonPanelRef = useRef<HTMLDivElement>(null);

  // Handle rewritten content from MarkdownContent
  const handleRewrittenContent = (newContent: string) => {
    setFacts(newContent);
    if (language !== 'en') {
      translateText(newContent, language).then((translatedText) => {
        setTranslatedFacts(translatedText);
      });
    } else {
      setTranslatedFacts(newContent);
    }
  };

  // Fetch historical insights and events
  const fetchHistoricalInsights = async () => {
    if (!currentLocation) return;

    setIsHistoricalLoading(true);
    try {
      const { historicalSummary, historicalEvents } = await fetchHistoricalInsightsWithGroq(currentLocation);
      setHistoricalInsights(historicalSummary);
      setHistoricalEvents(historicalEvents);

      // Translate historical insights if the language is not English
      if (language !== 'en') {
        const translatedSummary = await translateText(historicalSummary, language);
        setHistoricalInsights(translatedSummary);

        const translatedEvents = await Promise.all(
          historicalEvents.map(async (event) => ({
            ...event,
            cardDetailedText: await translateText(event.cardDetailedText, language),
          }))
        );
        setHistoricalEvents(translatedEvents);
      }
    } catch (error) {
      console.error('Error fetching historical insights:', error);
      setHistoricalInsights('Failed to fetch historical insights. Please try again.');
      setHistoricalEvents([]);
    } finally {
      setIsHistoricalLoading(false);
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
      setVirtualTourLocation({ lat, lng, name: locationName });
      const videos = await fetchYouTubeVideos(locationName);
      setYoutubeVideos(videos);
    }
  };

  // Fetch location name from Mapbox Geocoding API
  const fetchLocationName = async (lng: number, lat: number) => {
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
  const analyzeWithGroq = async (imageUrl: string, locationName: string) => {
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
        model: 'llama-3.2-90b-vision-preview',
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
    if (!earthContainerRef.current || !earthRef.current) return;

    setShowWeatherWidget(false);
    setLoading(true);
    setDynamicThemes([]);

    try {
      const map = earthRef.current.getMap();
      if (!map) {
        throw new Error('Map instance not found.');
      }

      await new Promise((resolve) => {
        map.once('idle', resolve);
      });

      const canvas = map.getCanvas();
      const dataUrl = canvas.toDataURL('image/png');
      setCapturedImage(dataUrl);

      const center = map.getCenter();
      const lng = center.lng;
      const lat = center.lat;

      const locationName = await fetchLocationName(lng, lat);
      setCurrentLocation(locationName);

      const analysis = await analyzeWithGroq(dataUrl, locationName);
      setFacts(analysis);

      await generateDynamicThemes(locationName);
      await fetchYouTubeVideos(locationName);
    } catch (error) {
      console.error('Error capturing view:', error);
      setFacts('Error getting facts about this region. Please try again.');
    } finally {
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
            content: `Based on the location "${location}", suggest 3 unique and specific analysis themes...`,
          },
        ],
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
        setFacts((prevFacts) => `${prevFacts}\n\n## ${perspective} Analysis\n${newAnalysis}`);

        if (currentLang !== 'en') {
          const translatedText = await translateText(newAnalysis, currentLang);
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

  // Voice command logic
  const enableVoiceCommands = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Your browser does not support voice commands. Please use Chrome or Edge.');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();
    setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const command = event.results[0][0].transcript.toLowerCase();
      handleVoiceCommand(command);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Voice recognition error:', event.error);
      setVoiceCommandFeedback('Error recognizing voice command. Please try again.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const handleVoiceCommand = (command: string) => {
    if (command.includes('zoom in')) {
      earthRef.current?.zoomIn();
      setVoiceCommandFeedback('Zooming in.');
    } else if (command.includes('zoom out')) {
      earthRef.current?.zoomOut();
      setVoiceCommandFeedback('Zooming out.');
    } else if (command.includes('rotate left')) {
      earthRef.current?.rotateLeft();
      setVoiceCommandFeedback('Rotating left.');
    } else if (command.includes('rotate right')) {
      earthRef.current?.rotateRight();
      setVoiceCommandFeedback('Rotating right.');
    } else if (command.includes('search for')) {
      const location = command.split('search for ')[1];
      handleSearchByName(location);
      setVoiceCommandFeedback(`Searching for ${location}.`);
    } else if (command.includes('tell me about')) {
      const location = command.split('tell me about ')[1];
      handleSearchByName(location);
      setVoiceCommandFeedback(`Fetching information about ${location}.`);
    } else {
      setVoiceCommandFeedback('Command not recognized.');
    }
  };

  // Function to handle search by location name (used for voice commands)
  const handleSearchByName = async (location: string) => {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
    );
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      handleSearch(lng, lat);
    }
  };

  // Handle language change
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

  return (
    <div className="app">
      <div className="earth-container" ref={earthContainerRef}>
        <Earth
          ref={earthRef}
          onCaptureView={captureView}
          showWeatherWidget={showWeatherWidget}
          setShowWeatherWidget={setShowWeatherWidget}
        />
      </div>
      <div className="info-panel">
        <SearchBar onSearch={handleSearch} />
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
          <button onClick={enableVoiceCommands} className="voice-button">
            {isListening ? 'Listening...' : '🎤 Use Voice Commands'}
          </button>
          {voiceCommandFeedback && (
            <div className="voice-feedback">
              <p>{voiceCommandFeedback}</p>
            </div>
          )}
          <button
            onClick={() => setIsVirtualTourActive(!isVirtualTourActive)}
            className="virtual-tour-button"
            disabled={!currentLocation}
          >
            {isVirtualTourActive ? 'Close Virtual Tour' : '🌍 Start Virtual Tour'}
          </button>
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
            disabled={!currentLocation || isHistoricalLoading}
          >
            {isHistoricalLoading ? 'Loading...' : '🕰️ View Historical Insights'}
          </button>
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
                <MarkdownContent
                  content={historicalInsights}
                  language={language}
                  onRewrite={handleRewrittenContent}
                />
                {historicalEvents.length > 0 && (
                  <div className="timeline-container">
                    <Chrono
                      items={historicalEvents}
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
      {isVirtualTourActive && virtualTourLocation && (
        <VirtualTour
          location={virtualTourLocation}
          onClose={() => setIsVirtualTourActive(false)}
          language={language}
          onTranslate={translateText}
        />
      )}
      {isNewsPanelActive && newsArticles.length > 0 && (
        <NewsPanel
          newsArticles={newsArticles}
          language={language}
          onTranslate={translateText}
          onClose={() => setIsNewsPanelActive(false)}
        />
      )}
    </div>
  );
}

export default App;
