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

// Language mapping
const languageMapping: { [key: string]: string } = {
  en: 'English',
  my: 'Myanmar (Burmese)',
  th: 'Thai'
};

// Translation cache
const translationCache = new Map<string, string>();

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

interface DisasterType {
  id: string;
  type: string;
  year: number;
  severity: string;
  description?: string;
}

interface DisasterData {
  overallRisk: number;
  summary: string;
  types: {
    name: string;
    risk: number;
    description: string;
    recommendations: string[];
  }[];
}

interface DisasterWidgetProps {
  data: DisasterData | null;
  loading: boolean;
  history: DisasterType[];
  onClose: () => void;
  language: 'en' | 'my' | 'th';
  onTranslate: (text: string, targetLanguage: 'en' | 'my' | 'th') => Promise<string>;
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
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

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

// Disaster Widget Component
const DisasterWidget: React.FC<DisasterWidgetProps> = ({
  data,
  loading,
  history,
  onClose,
  language,
  onTranslate
}) => {
  const [translatedData, setTranslatedData] = useState<DisasterData | null>(null);
  const [translating, setTranslating] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'types' | 'history'>('summary');

  useEffect(() => {
    if (language !== 'en' && data) {
      const translateDisasterData = async () => {
        setTranslating(true);
        try {
          const translatedSummary = await onTranslate(data.summary, language);
          const translatedTypes = await Promise.all(
            data.types.map(async (type) => ({
              ...type,
              name: await onTranslate(type.name, language),
              description: await onTranslate(type.description, language),
              recommendations: await Promise.all(
                type.recommendations.map((rec) => onTranslate(rec, language))
              )
            }))
          );
          setTranslatedData({
            ...data,
            summary: translatedSummary,
            types: translatedTypes
          });
        } catch (error) {
          console.error('Translation error:', error);
        } finally {
          setTranslating(false);
        }
      };
      translateDisasterData();
    } else {
      setTranslatedData(data);
    }
  }, [data, language, onTranslate]);

  const getRiskColor = (risk: number): string => {
    if (risk <= 3) return '#4CAF50'; // Green
    if (risk <= 6) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  const getRiskLabel = (risk: number): string => {
    if (risk <= 3) return language === 'en' ? 'Low' : language === 'my' ? 'နိမ့်' : 'ต่ำ';
    if (risk <= 6) return language === 'en' ? 'Medium' : language === 'my' ? 'အလယ်အလတ်' : 'ปานกลาง';
    return language === 'en' ? 'High' : language === 'my' ? 'မြင့်' : 'สูง';
  };

  if (loading) return (
    <div className="disaster-widget loading">
      <div className="spinner"></div>
      {language === 'en' ? 'Analyzing disaster risks...' :
       language === 'my' ? 'သဘာဝဘေးအန္တရာယ်များကို ဆန်းစစ်နေသည်...' :
       'กำลังวิเคราะห์ความเสี่ยงภัยธรรมชาติ...'}
    </div>
  );

  if (!translatedData) return null;

  return (
    <div className="disaster-widget">
      <div className="widget-header">
        <h3>🌍 {language === 'en' ? 'Disaster Risk Assessment' :
            language === 'my' ? 'သဘာဝဘေးအန္တရာယ် အကဲဖြတ်ချက်' :
            'การประเมินความเสี่ยงภัยธรรมชาติ'}</h3>
        <button className="close-button" onClick={onClose} aria-label="Close">
          &times;
        </button>
      </div>

      <div className="risk-indicator">
        <div className="risk-level" style={{ backgroundColor: getRiskColor(translatedData.overallRisk) }}>
          <div className="risk-score">{translatedData.overallRisk}/10</div>
          <div className="risk-label">
            {language === 'en' ? 'Overall Risk' :
             language === 'my' ? 'စုစုပေါင်းအန္တရာယ်' :
             'ความเสี่ยงโดยรวม'} - {getRiskLabel(translatedData.overallRisk)}
          </div>
        </div>
      </div>

      <div className="widget-tabs">
        <button
          className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          {language === 'en' ? 'Summary' : language === 'my' ? 'အကျဉ်းချုပ်' : 'สรุป'}
        </button>
        <button
          className={`tab-button ${activeTab === 'types' ? 'active' : ''}`}
          onClick={() => setActiveTab('types')}
        >
          {language === 'en' ? 'Risk Types' : language === 'my' ? 'အန္တရာယ်အမျိုးအစားများ' : 'ประเภทความเสี่ยง'}
        </button>
        {history.length > 0 && (
          <button
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            {language === 'en' ? 'History' : language === 'my' ? 'မှတ်တမ်း' : 'ประวัติ'}
          </button>
        )}
      </div>

      <div className="widget-content">
        {activeTab === 'summary' && (
          <div className="risk-summary">
            <p>{translatedData.summary}</p>
          </div>
        )}

        {activeTab === 'types' && (
          <div className="disaster-types">
            {translatedData.types.map((type) => (
              <div key={type.name} className="disaster-type">
                <div className="type-header">
                  <h4>{type.name}</h4>
                  <div className="type-risk-indicator">
                    <span className="risk-score">{type.risk}/10</span>
                    <span className="risk-label">{getRiskLabel(type.risk)}</span>
                  </div>
                </div>
                <div className="risk-meter">
                  <div
                    className="risk-fill"
                    style={{
                      width: `${type.risk * 10}%`,
                      backgroundColor: getRiskColor(type.risk)
                    }}
                  />
                </div>
                <div className="type-description">
                  <p>{type.description}</p>
                </div>
                {type.recommendations.length > 0 && (
                  <div className="recommendations">
                    <h5>{language === 'en' ? 'Recommendations' :
                         language === 'my' ? 'အကြံပြုချက်များ' :
                         'คำแนะนำ'}:</h5>
                    <ul>
                      {type.recommendations.map((rec, i) => (
                        <li key={i}>
                          <span className="recommendation-bullet">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && history.length > 0 && (
          <div className="historical-data">
            <div className="history-scroll">
              {history.map((event) => (
                <div key={event.id} className="history-event">
                  <div className="event-year">{event.year}</div>
                  <div className="event-details">
                    <div className="event-type-severity">
                      <strong>{event.type}</strong> - {event.severity}
                    </div>
                    {event.description && <p className="event-description">{event.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {translating && (
        <div className="translating-overlay">
          <div className="translating-message">
            {language === 'en' ? 'Translating...' :
             language === 'my' ? 'ဘာသာပြန်နေသည်...' :
             'กำลังแปล...'}
          </div>
        </div>
      )}
    </div>
  );
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
  const [disasterData, setDisasterData] = useState<DisasterData | null>(null);
  const [disasterLoading, setDisasterLoading] = useState(false);
  const [disasterHistory, setDisasterHistory] = useState<DisasterType[]>([]);
  const [showDisasterWidget, setShowDisasterWidget] = useState(false);

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
        model: 'deepseek-r1-distill-llama-70b',
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
        model: 'deepseek-r1-distill-llama-70b',
        temperature: 0.7,
        max_tokens: 1000,
      });
      return completion.choices?.[0]?.message?.content?.trim() || 'No news available.';
    } catch (error) {
      console.error('Error generating news:', error);
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

  const fetchHistoricalDisasters = async (lat: number, lng: number): Promise<DisasterType[]> => {
    try {
      const response = await fetch(
        `https://api.reliefweb.int/v1/disasters?appname=globe-app&filter[field]=location&filter[coordinates]=${lat},${lng}&filter[operator]=WITHIN&filter[distance]=100`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch historical disasters: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.data) {
        throw new Error('Unexpected response format');
      }

      return data.data.map((disaster: any) => ({
        id: disaster.id,
        type: disaster.fields.type[0],
        year: new Date(disaster.fields.date.created).getFullYear(),
        severity: disaster.fields.severity,
        description: disaster.fields.description,
      }));
    } catch (error) {
      console.error('Error fetching historical disasters:', error);
      return [];
    }
  };

  const fetchCurrentDisasters = async (location: string): Promise<DisasterType[]> => {
    try {
      const response = await fetch(
        `https://api.reliefweb.int/v1/disasters?appname=globe-app&filter[field]=location&filter[value]=${encodeURIComponent(location)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch current disasters: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.data) {
        throw new Error('Unexpected response format');
      }

      return data.data.map((disaster: any) => ({
        id: disaster.id,
        type: disaster.fields.type[0],
        year: new Date(disaster.fields.date.created).getFullYear(),
        severity: disaster.fields.severity,
        description: disaster.fields.description,
      }));
    } catch (error) {
      console.error('Error fetching current disasters:', error);
      return [];
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
        return JSON.parse(completion.choices[0].message.content);
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
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        temperature: 0.95,
        max_tokens: 8000,
      });
      return completion.choices?.[0]?.message?.content || 'No analysis available.';
    } catch (error) {
      console.error('Error analyzing with Groq:', error);
      return 'Error analyzing the image.';
    }
  };

  const analyzeDisasters = async (location: string, lat: number, lng: number) => {
    setDisasterLoading(true);
    setShowDisasterWidget(true);
    try {
      const currentDisasters = await fetchCurrentDisasters(location);
      const history = await fetchHistoricalDisasters(lat, lng);
      setDisasterHistory(history);
      const groq = new Groq({
        apiKey: import.meta.env.VITE_GROQ_API_KEY,
        dangerouslyAllowBrowser: true,
      });
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: `Analyze disaster risks for ${location} at coordinates ${lat},${lng}.
            Current alerts: ${JSON.stringify(currentDisasters)}.
            Historical data: ${JSON.stringify(history)}.
            Provide a detailed risk assessment with:
            1. Overall risk score (1-10)
            2. Risk breakdown by disaster type
            3. Summary of findings
            4. Recommendations
            Format as JSON with this structure:
            {
              "overallRisk": number,
              "summary": string,
              "types": [{
                "name": string,
                "risk": number,
                "description": string,
                "recommendations": string[]
              }]
            }`,
          },
        ],
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        temperature: 0.7,
        max_tokens: 2000,
      });
      if (completion.choices?.[0]?.message?.content) {
        const analysis = JSON.parse(completion.choices[0].message.content);
        setDisasterData(analysis);
        setFacts((prev) => `${prev}\n\n## Disaster Risk Assessment\n${analysis.summary}`);
      }
    } catch (error) {
      console.error('Disaster analysis error:', error);
    } finally {
      setDisasterLoading(false);
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
      const analysis = await analyzeWithGroq(dataUrl, locationName);
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
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 5000,
      });
      if (completion.choices?.[0]?.message?.content) {
        const newAnalysis = completion.choices[0].message.content;
        setFacts((prev) => `${prev}\n\n## ${perspective} Analysis\n${newAnalysis}`);
        if (currentLang !== 'en') {
          const translatedText = await rateLimitedTranslateText(newAnalysis, currentLang);
          setTranslatedFacts((prev) => `${prev}\n\n## ${perspective} Analysis\n${translatedText}`);
        } else {
          setTranslatedFacts((prev) => `${prev}\n\n## ${perspective} Analysis\n${newAnalysis}`);
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
      if (disasterData) {
        const translatedSummary = await rateLimitedTranslateText(disasterData.summary, newLanguage);
        const translatedTypes = await Promise.all(
          disasterData.types.map(async (type) => ({
            ...type,
            name: await rateLimitedTranslateText(type.name, newLanguage),
            description: await rateLimitedTranslateText(type.description, newLanguage),
            recommendations: await Promise.all(
              type.recommendations.map((rec) => rateLimitedTranslateText(rec, newLanguage))
            )
          }))
        );
        setDisasterData({
          ...disasterData,
          summary: translatedSummary,
          types: translatedTypes
        });
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

      {showDisasterWidget && (
        <DisasterWidget
          data={disasterData}
          loading={disasterLoading}
          history={disasterHistory}
          onClose={() => setShowDisasterWidget(false)}
          language={language}
          onTranslate={rateLimitedTranslateText}
        />
      )}

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

          <button
            onClick={async () => {
              const center = earthRef.current?.getMap()?.getCenter();
              if (center && currentLocation) {
                await analyzeDisasters(currentLocation, center.lat, center.lng);
              }
            }}
            className="disaster-button"
            disabled={!currentLocation || loading}
          >
            🌋 Analyze Disaster Risks
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
