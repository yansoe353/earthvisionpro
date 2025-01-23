import { useState, useRef } from 'react';
import Earth from './components/Earth';
import { Groq } from 'groq-sdk';
import NewsPanel from './components/NewsPanel';
import SearchBar from './components/SearchBar';
import MarkdownContent from './components/MarkdownContent';
import VirtualTour from './components/VirtualTour';
import { Chrono } from 'react-chrono';
import axios from 'axios'; // For making API requests
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
    return text; // Fallback to original text if translation fails
  }
};

// Fetch image using Pexels API
const fetchImage = async (query: string): Promise<string | null> => {
  try {
    const response = await axios.get('https://api.pexels.com/v1/search', {
      headers: {
        Authorization: import.meta.env.VITE_PIXEL_API_KEY, // Replace with your Pexels API key
      },
      params: {
        query: query, // Use the query (e.g., location name or event title)
        per_page: 1, // Fetch only one image
      },
    });

    if (response.data.photos && response.data.photos.length > 0) {
      return response.data.photos[0].src.large; // Return the URL of the large-sized image
    } else {
      console.warn('No images found for the query:', query);
      return null;
    }
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
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

// Generate Earth image using Fusion Brain API
const generateImageWithFusionBrain = async (prompt: string) => {
  const apiKey = import.meta.env.VITE_FUSION_BRAIN_API_KEY;
  const secretKey = import.meta.env.VITE_FUSION_BRAIN_SECRET_KEY;

  const headers = {
    'X-Key': `Key ${apiKey}`,
    'X-Secret': `Secret ${secretKey}`,
  };

  try {
    // Step 1: Get the model ID
    const modelResponse = await fetch('https://api-key.fusionbrain.ai/key/api/v1/models', {
      headers,
    });
    const modelData = await modelResponse.json();
    const modelId = modelData[0].id;

    // Step 2: Generate the image
    const generateResponse = await fetch('https://api-key.fusionbrain.ai/key/api/v1/text2image/run', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model_id: modelId,
        params: {
          type: 'GENERATE',
          numImages: 1,
          width: 1024,
          height: 1024,
          generateParams: {
            query: prompt,
          },
        },
      }),
    });

    const generateData = await generateResponse.json();
    const requestId = generateData.uuid;

    // Step 3: Check the status of the image generation
    let imageUrl = null;
    let attempts = 10;
    while (attempts > 0) {
      const statusResponse = await fetch(`https://api-key.fusionbrain.ai/key/api/v1/text2image/status/${requestId}`, {
        headers,
      });
      const statusData = await statusResponse.json();

      if (statusData.status === 'DONE') {
        imageUrl = statusData.images[0];
        break;
      } else if (statusData.status === 'FAIL') {
        throw new Error('Image generation failed.');
      }

      attempts -= 1;
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
    }

    if (!imageUrl) {
      throw new Error('Image generation timed out.');
    }

    return imageUrl;
  } catch (error) {
    console.error('Error generating image with Fusion Brain:', error);
    return null;
  }
};

// Generate image prompt using Groq API
const generateImagePrompt = async (location: string) => {
  try {
    const groq = new Groq({
      apiKey: import.meta.env.VITE_GROQ_API_KEY,
      dangerouslyAllowBrowser: true,
    });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `Generate a highly detailed and creative prompt for an AI-generated image of Earth, focusing on ${location}. 
          The prompt should describe the landscape, atmosphere, weather, and any unique geographical or cultural features. 
          Make it vivid and imaginative, suitable for generating a realistic and visually stunning image.`,
        },
      ],
      model: 'llama-3.2-90b-vision-preview',
      temperature: 0.7, // Adjust for creativity
      max_tokens: 1000,
    });

    if (completion.choices && completion.choices[0]?.message?.content) {
      return completion.choices[0].message.content.trim();
    }
    return null;
  } catch (error) {
    console.error('Error generating image prompt:', error);
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
  const [historicalEvents, setHistoricalEvents] = useState<Array<{ title: string; cardTitle: string; cardSubtitle: string; cardDetailedText: string; image?: string }>>([]);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

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
          const events = JSON.parse(eventsJson);

          // Fetch images for each event using Pexels API
          const eventsWithImages = await Promise.all(
            events.map(async (event: any) => {
              const imageUrl = await fetchImage(event.cardTitle); // Use event title as the search query
              return { ...event, image: imageUrl || 'https://via.placeholder.com/300x200' }; // Fallback to placeholder
            })
          );

          setHistoricalEvents(eventsWithImages);

          // Translate content if the current language is not English
          if (language !== 'en') {
            const translatedInsights = await translateText(insights, language);
            setHistoricalInsights(translatedInsights);

            const translatedEvents = await Promise.all(
              eventsWithImages.map(async (event: any) => ({
                ...event,
                cardTitle: await translateText(event.cardTitle, language),
                cardSubtitle: await translateText(event.cardSubtitle, language),
                cardDetailedText: await translateText(event.cardDetailedText, language),
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

    // Reset historical insights and events
    setHistoricalInsights('');
    setHistoricalEvents([]);

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

      // Translate the analysis if the current language is not English
      if (language !== 'en') {
        const translatedAnalysis = await translateText(analysis, language);
        setTranslatedFacts(translatedAnalysis);
      } else {
        setTranslatedFacts(analysis);
      }

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

  // Handle language change for all insights and content
  const handleLanguageChange = async (newLanguage: 'en' | 'my' | 'th') => {
    setTranslating(true);
    setLanguage(newLanguage);

    // Translate all content
    const translateAllContent = async () => {
      if (facts) {
        const translatedFactsText = await translateText(facts, newLanguage);
        setTranslatedFacts(translatedFactsText);
      }

      if (historicalInsights) {
        const translatedHistoricalInsights = await translateText(historicalInsights, newLanguage);
        setHistoricalInsights(translatedHistoricalInsights);
      }

      if (historicalEvents.length > 0) {
        const translatedEvents = await Promise.all(
          historicalEvents.map(async (event) => ({
            ...event,
            cardTitle: await translateText(event.cardTitle, newLanguage),
            cardSubtitle: await translateText(event.cardSubtitle, newLanguage),
            cardDetailedText: await translateText(event.cardDetailedText, newLanguage),
          }))
        );
        setHistoricalEvents(translatedEvents);
      }

      if (newsArticles.length > 0) {
        const translatedNewsArticles = await Promise.all(
          newsArticles.map(async (article) => ({
            ...article,
            title: await translateText(article.title, newLanguage),
            description: await translateText(article.description, newLanguage),
          }))
        );
        setNewsArticles(translatedNewsArticles);
      }

      if (dynamicThemes.length > 0) {
        const translatedThemes = await Promise.all(
          dynamicThemes.map(async (theme) => ({
            ...theme,
            name: await translateText(theme.name, newLanguage),
            prompt: await translateText(theme.prompt, newLanguage),
          }))
        );
        setDynamicThemes(translatedThemes);
      }
    };

    await translateAllContent();
    setTranslating(false);
  };

  // Generate Earth image using Groq and Fusion Brain APIs
  const generateEarthImage = async () => {
    setLoading(true);

    try {
      // Step 1: Generate Image Prompt Using Groq API
      const imagePrompt = await generateImagePrompt(currentLocation);

      if (!imagePrompt) {
        throw new Error('Failed to generate image prompt.');
      }

      // Step 2: Generate Image Using Fusion Brain API
      const imageUrl = await generateImageWithFusionBrain(imagePrompt);

      if (imageUrl) {
        // Step 3: Display the Generated Image
        setGeneratedImageUrl(imageUrl);
      } else {
        throw new Error('Failed to generate image.');
      }
    } catch (error) {
      console.error('Error generating Earth image:', error);
      alert('Failed to generate Earth image. Please try again.');
    } finally {
      setLoading(false);
    }
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
            disabled={!currentLocation || loading}
          >
            🕰️ View Historical Insights
          </button>
          <button
            onClick={generateEarthImage}
            className="earth-image-button"
            disabled={!currentLocation || loading || translating}
          >
            🖼️ Generate Earth Image
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
            {generatedImageUrl && (
              <div className="generated-image-container">
                <h2>Generated Earth Image</h2>
                <img src={generatedImageUrl} alt="Generated Earth Image" className="generated-image" />
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
