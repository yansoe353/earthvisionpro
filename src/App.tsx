import { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import Earth from './components/Earth';
import { Groq } from 'groq-sdk';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
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

// MarkdownContent component with "Rewrite with AI" feature
interface MarkdownContentProps {
  content: string;
  language: 'en' | 'my' | 'th';
  onRewrite: (content: string) => void; // Callback for rewritten content
}

const MarkdownContent = ({ content, language, onRewrite }: MarkdownContentProps) => {
  const [isRewriting, setIsRewriting] = useState(false);

  const handleRewrite = async () => {
    setIsRewriting(true);
    const rewrittenContent = await rewriteContentWithAI(content);
    onRewrite(rewrittenContent); // Pass rewritten content back to parent
    setIsRewriting(false);
  };

  return (
    <div className={`translated-content ${language}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
      <button
        onClick={handleRewrite}
        className="rewrite-button"
        disabled={isRewriting}
      >
        {isRewriting ? 'Rewriting...' : 'Rewrite with AI'}
      </button>
    </div>
  );
};

// Function to rewrite content with Groq API
const rewriteContentWithAI = async (content: string): Promise<string> => {
  try {
    const groq = new Groq({
      apiKey: import.meta.env.VITE_GROQ_API_KEY,
      dangerouslyAllowBrowser: true,
    });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `Rewrite the following text to make it more polished, concise, and user-friendly:\n\n${content}`,
        },
      ],
      model: 'llama-3.2-90b-vision-preview',
      temperature: 0.95,
      max_tokens: 7000,
    });

    if (completion.choices && completion.choices[0]?.message?.content) {
      return completion.choices[0].message.content.trim(); // Return rewritten content
    }
    return content; // Fallback to original content
  } catch (error) {
    console.error('Error rewriting content with AI:', error);
    return 'Error rewriting content. Please try again.'; // Return error message
  }
};

// VirtualTour Component
interface VirtualTourProps {
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  onClose: () => void; // Callback to close the panel
  language: 'en' | 'my' | 'th'; // Current language
  onTranslate: (text: string, targetLanguage: 'en' | 'my' | 'th') => Promise<string>; // Translation function
}

const VirtualTour: React.FC<VirtualTourProps> = ({ location, onClose, language, onTranslate }) => {
  const [description, setDescription] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isRewriting, setIsRewriting] = useState<boolean>(false);

  // Initialize Groq client
  const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  // Fetch location description using Groq API
  const fetchDescription = async () => {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: `Provide a detailed description of ${location.name} as a travel destination. Include historical facts, popular attractions, and travel tips.`,
          },
        ],
        model: 'llama-3.2-90b-vision-preview',
        temperature: 0.7,
        max_tokens: 500,
      });

      if (completion.choices && completion.choices[0]?.message?.content) {
        setDescription(completion.choices[0].message.content.trim());
      }
    } catch (error) {
      console.error('Error fetching description:', error);
      setDescription('Unable to fetch description. Please try again.');
    }
  };

  // Fetch location image using Pixel API (e.g., Pexels)
  const fetchImage = async () => {
    try {
      const response = await axios.get('https://api.pexels.com/v1/search', {
        headers: {
          Authorization: import.meta.env.VITE_PIXEL_API_KEY,
        },
        params: {
          query: location.name,
          per_page: 1,
        },
      });

      if (response.data.photos && response.data.photos.length > 0) {
        setImageUrl(response.data.photos[0].src.large);
      }
    } catch (error) {
      console.error('Error fetching image:', error);
      setImageUrl(''); // Fallback to no image
    }
  };

  // Rewrite content with AI
  const handleRewrite = async () => {
    setIsRewriting(true);
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: `Rewrite the following text to make it more polished, concise, and user-friendly:\n\n${description}`,
          },
        ],
        model: 'llama-3.2-90b-vision-preview',
        temperature: 0.7,
        max_tokens: 500,
      });

      if (completion.choices && completion.choices[0]?.message?.content) {
        setDescription(completion.choices[0].message.content.trim());
      }
    } catch (error) {
      console.error('Error rewriting content:', error);
    } finally {
      setIsRewriting(false);
    }
  };

  // Translate content
  const handleTranslate = async (targetLanguage: 'en' | 'my' | 'th') => {
    const translatedText = await onTranslate(description, targetLanguage);
    setDescription(translatedText);
  };

  // Fetch data when the component mounts or location changes
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchDescription(), fetchImage()]).finally(() => {
      setLoading(false);
    });
  }, [location]);

  return (
    <div className="virtual-tour-backdrop">
      <div className="virtual-tour-panel">
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        {loading ? (
          <p>Loading virtual tour...</p>
        ) : (
          <>
            <div className="image-container">
              {imageUrl && <img src={imageUrl} alt={location.name} className="location-image" />}
            </div>
            <div className="description-container">
              <h2>{location.name}</h2>
              <ReactMarkdown>{description}</ReactMarkdown>
              <div className="action-buttons">
                <button onClick={handleRewrite} disabled={isRewriting}>
                  {isRewriting ? 'Rewriting...' : 'Rewrite with AI'}
                </button>
                <button onClick={() => handleTranslate('en')}>Translate to English</button>
                <button onClick={() => handleTranslate('my')}>Translate to Myanmar</button>
                <button onClick={() => handleTranslate('th')}>Translate to Thai</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// SearchBar Component
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
    </form>
  );
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
  const [weatherData, setWeatherData] = useState<{
    temperature: number;
    humidity: number;
    windSpeed: number;
    weatherIcon: string;
  } | null>(null);
  const [voiceCommandFeedback, setVoiceCommandFeedback] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [youtubeVideos, setYoutubeVideos] = useState<Array<{ id: string, title: string }>>([]);
  const [isVirtualTourActive, setIsVirtualTourActive] = useState(false);
  const [virtualTourLocation, setVirtualTourLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [newsArticles, setNewsArticles] = useState<Array<{ title: string, url: string, description: string }>>([]); // News state

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
        setYoutubeVideos(videos);
      }
    } catch (error) {
      console.error('Error fetching YouTube videos:', error);
      setYoutubeVideos([]);
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

  // Handle rewritten content from MarkdownContent
  const handleRewrittenContent = (content: string) => {
    if (language === 'en') {
      setFacts(content); // Update facts if language is English
    } else {
      translateText(content, language).then((translated) => setTranslatedFacts(translated)); // Translate if needed
    }
  };

  // Fetch news articles based on location
  const fetchNews = async (location: string) => {
    try {
      const apiKey = import.meta.env.VITE_NEWS_API_KEY; // Add your NewsAPI key to .env
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(location)}&apiKey=${apiKey}`
      );
      const data = await response.json();
      if (data.articles) {
        setNewsArticles(data.articles.slice(0, 5)); // Show top 5 articles
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      setNewsArticles([]);
    }
  };

  // Handle search for a location
  const handleSearch = async (lng: number, lat: number) => {
    earthRef.current?.handleSearch(lng, lat);
    await fetchWeatherData(lat, lng);

    // Fetch location name, YouTube videos, and news
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
    );
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const locationName = data.features[0].place_name;
      setCurrentLocation(locationName);
      setVirtualTourLocation({ lat, lng, name: locationName }); // Set virtual tour location
      await fetchYouTubeVideos(locationName);
      await fetchNews(locationName); // Fetch news for the location
    }
  };

  // Fetch weather data
  const fetchWeatherData = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${import.meta.env.VITE_OPENWEATHERMAP_API_KEY}&units=metric`
      );
      const data = await response.json();
      if (data) {
        setWeatherData({
          temperature: data.main.temp,
          humidity: data.main.humidity,
          windSpeed: data.wind.speed,
          weatherIcon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
        });
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setWeatherData(null);
    }
  };

  // Capture the current view of the globe
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
          await fetchYouTubeVideos(location); // Fetch YouTube videos
          await fetchNews(location); // Fetch news for the location
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

    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript.toLowerCase();
      handleVoiceCommand(command);
    };

    recognition.onerror = (event: any) => {
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
      handleSearchByName(location); // Use handleSearchByName for location search
      setVoiceCommandFeedback(`Searching for ${location}.`);
    } else if (command.includes('tell me about')) {
      const location = command.split('tell me about ')[1];
      handleSearchByName(location); // Use handleSearchByName for location search
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
      handleSearch(lng, lat); // Call the updated handleSearch function
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
          weatherData={weatherData}
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
              onRewrite={handleRewrittenContent} // Pass the rewrite handler
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
            {/* YouTube Videos Section */}
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
            {/* News Section */}
            {newsArticles.length > 0 && (
              <div className="news-section">
                <h2>Latest News for {currentLocation}</h2>
                <div className="news-grid">
                  {newsArticles.map((article, index) => (
                    <div key={index} className="news-item">
                      <h3>{article.title}</h3>
                      <p>{article.description}</p>
                      <a href={article.url} target="_blank" rel="noopener noreferrer">
                        Read more
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
    </div>
  );
}

export default App;
