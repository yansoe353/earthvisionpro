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
  const [virtualTourContent, setVirtualTourContent] = useState<string>('');
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const earthContainerRef = useRef<HTMLDivElement>(null);
  const earthRef = useRef<any>(null);
  const factsContainerRef = useRef<HTMLDivElement>(null);
  const lastAnalysisRef = useRef<HTMLDivElement>(null);
  const buttonPanelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonPanelRef.current && !buttonPanelRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      setTranslatedFacts(facts);
    } else {
      const translatedText = await translateText(facts, newLanguage);
      setTranslatedFacts(translatedText);
    }
    setTranslating(false);
  };

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

  // Handle search for a location
  const handleSearch = async (lng: number, lat: number) => {
    earthRef.current?.handleSearch(lng, lat);
    await fetchWeatherData(lat, lng); // Fetch weather data for the selected region
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

  // Generate virtual tour
  const generateVirtualTour = async (location: string) => {
    try {
      const groq = new Groq({
        apiKey: import.meta.env.VITE_GROQ_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: `Generate a virtual tour for ${location}. Include historical facts, interesting trivia, and a step-by-step guide for visitors.`,
          },
        ],
        model: 'llama-3.2-90b-vision-preview',
        temperature: 0.7,
        max_tokens: 2000,
      });

      if (completion.choices && completion.choices[0]?.message?.content) {
        setVirtualTourContent(completion.choices[0].message.content);
        setIsTourActive(true); // Activate the virtual tour
      }
    } catch (error) {
      console.error('Error generating virtual tour:', error);
      setVirtualTourContent('Error generating virtual tour. Please try again.');
    }
  };

  return (
    <div className="app">
      <div className="earth-container" ref={earthContainerRef}>
        <Earth ref={earthRef} onCaptureView={captureView} weatherData={weatherData} />
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
            onClick={() => generateVirtualTour(currentLocation)}
            className="virtual-tour-button"
            disabled={!currentLocation}
          >
            🚀 Start Virtual Tour
          </button>
          {isTourActive && (
            <div className="virtual-tour-panel">
              <button className="close-button" onClick={() => setIsTourActive(false)}>
                &times;
              </button>
              <ReactMarkdown>{virtualTourContent}</ReactMarkdown>
            </div>
          )}
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
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
