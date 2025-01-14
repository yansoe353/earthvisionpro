import { useState, useRef } from 'react';
import Earth from './components/Earth';
import { Groq } from 'groq-sdk';
import NewsPanel from './components/NewsPanel';
import SearchBar from './components/SearchBar';
import MarkdownContent from './components/MarkdownContent';
import VirtualTour from './components/VirtualTour';
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

  const earthContainerRef = useRef<HTMLDivElement>(null);
  const earthRef = useRef<any>(null);
  const factsContainerRef = useRef<HTMLDivElement>(null);
  const lastAnalysisRef = useRef<HTMLDivElement>(null);
  const buttonPanelRef = useRef<HTMLDivElement>(null);

  // Fetch YouTube videos using the generated prompt
  const fetchYouTubeVideos = async (location: string) => {
    try {
      const searchPrompt = await generateYouTubeSearchPrompt(location);
      if (!searchPrompt) {
        console.error('Failed to generate YouTube search prompt.');
        return;
      }

      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          searchPrompt
        )}&type=video&maxResults=5&key=${apiKey}`
      );
      const data = await response.json();
      if (data.items) {
        const videos = data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
        }));
        setYoutubeVideos(videos); // Update the state with fetched videos
      } else {
        console.error('No videos found in the YouTube API response.');
        setYoutubeVideos([]); // Clear the state if no videos are found
      }
    } catch (error) {
      console.error('Error fetching YouTube videos:', error);
      setYoutubeVideos([]); // Clear the state on error
    }
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

  // Handle search for a location
  const handleSearch = async (lng: number, lat: number) => {
    earthRef.current?.handleSearch(lng, lat);

    // Fetch location name and YouTube videos
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
    );
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const locationName = data.features[0].place_name;
      setCurrentLocation(locationName); // Set currentLocation
      setVirtualTourLocation({ lat, lng, name: locationName }); // Set virtual tour location
      await fetchYouTubeVideos(locationName); // Fetch YouTube videos for the location
    }
  };

  // Capture the current view of the globe
  const captureView = async () => {
    if (!earthContainerRef.current || !earthRef.current) return;

    // Close the weather widget before capturing
    setShowWeatherWidget(false);

    setLoading(true);
    setDynamicThemes([]);

    try {
      console.log('Capturing Earth view...');

      // Get the Mapbox map instance
      const map = earthRef.current.getMap();
      if (!map) {
        throw new Error('Map instance not found.');
      }

      // Wait for the map to be fully rendered
      await new Promise((resolve) => {
        map.once('idle', resolve); // Wait for the map to finish rendering
      });

      // Capture the map canvas
      const canvas = map.getCanvas();
      const dataUrl = canvas.toDataURL('image/png');

      console.log('Earth view captured:', dataUrl);

      // Set the captured image in the state
      setCapturedImage(dataUrl);

      // Get the current center of the map (latitude and longitude)
      const center = map.getCenter();
      const lng = center.lng;
      const lat = center.lat;

      // Fetch location name using Mapbox Geocoding API
      const geocodingResponse = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
      );
      const geocodingData = await geocodingResponse.json();

      let locationName = 'Unknown Location';
      if (geocodingData.features && geocodingData.features.length > 0) {
        locationName = geocodingData.features[0].place_name;
      }

      console.log('Location Name:', locationName);

      // Set the current location in the state
      setCurrentLocation(locationName);

      // Analyze the captured image and location with Groq
      console.log('Analyzing image and location with Groq...');
      const groq = new Groq({
        apiKey: import.meta.env.VITE_GROQ_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Examine the image and provide a detailed analysis of the region. The location is ${locationName}.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
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
        setFacts(content);
        await generateDynamicThemes(locationName);
        await fetchYouTubeVideos(locationName);
      }
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

  // Render YouTube videos section
  const renderYouTubeVideos = () => {
    if (youtubeVideos.length === 0) {
      return <p>No travel videos found for {currentLocation}.</p>;
    }

    return (
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
    );
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
        {/* Menu Button */}
        <button className="menu-button" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          ☰ Menu
        </button>
        {/* Button Panel (Hidden by Default) */}
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
          <button onClick={() => {}} className="voice-button">
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
          {/* Read News Button */}
          <button
            onClick={async () => {
              setIsNewsPanelActive(!isNewsPanelActive);
              setIsNewsLoading(true); // Show loading state
              const newsContent = await generateNewsWithAI(currentLocation);
              setNewsArticles([{ title: 'Latest News', description: newsContent, url: '' }]);
              setIsNewsLoading(false); // Hide loading state
            }}
            className="news-button"
            disabled={!currentLocation}
          >
            📰 Read News
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
              onRewrite={() => {}}
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
                  onClick={() => {}}
                  className="save-analysis-button"
                  disabled={!facts || translating || analysisLoading}
                >
                  Save Analysis
                </button>
              </div>
            )}
            {/* Render YouTube Videos Section */}
            {renderYouTubeVideos()}
          </div>
        )}
      </div>
      {/* Virtual Tour Panel */}
      {isVirtualTourActive && virtualTourLocation && (
        <VirtualTour
          location={virtualTourLocation}
          onClose={() => setIsVirtualTourActive(false)}
          language={language}
          onTranslate={translateText}
        />
      )}
      {/* News Panel */}
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

export default App; I
