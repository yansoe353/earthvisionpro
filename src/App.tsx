import { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import Earth from './components/Earth';
import { Groq } from 'groq-sdk';
import ReactMarkdown from 'react-markdown';

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
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const earthContainerRef = useRef<HTMLDivElement>(null);
  const earthRef = useRef<any>(null);

  const captureView = async () => {
    if (!earthContainerRef.current) return;
    setLoading(true);

    try {
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      const dataUrl = await toPng(earthContainerRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        quality: 1,
      });

      setCapturedImage(dataUrl);

      const groq = new Groq({
        apiKey: import.meta.env.VITE_GROQ_API_KEY,
        dangerouslyAllowBrowser: true
      });

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Look for any visible text labels, place names, or geographical markers in the image to help identify the exact location. Then tell me interesting geographical, historical, or cultural facts about this specific region. Format your response using markdown with appropriate emphasis (**bold** for important terms, *italics* for descriptive phrases). Use bullet points for distinct facts. Be concise and focus on the most interesting aspects.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl
                }
              }
            ]
          }
        ],
        model: 'llama-3.2-90b-vision-preview',
        temperature: 0.7,
        max_tokens: 1000,
      });

      if (completion.choices && completion.choices[0]?.message?.content) {
        setFacts(completion.choices[0].message.content);
      } else {
        setFacts('No facts available for this region.');
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

  return (
    <div className="app">
      <div className="earth-container" ref={earthContainerRef}>
        <Earth ref={earthRef} onCaptureView={captureView} />
      </div>
      <div className="info-panel">
        <SearchBar onSearch={handleSearch} />
        {loading ? (
          <p className="loading-text">Analyzing view...</p>
        ) : (
          <div className="facts">
            {capturedImage && (
              <div className="captured-image-container">
                <img 
                  src={capturedImage} 
                  alt="Captured view" 
                  className="captured-image"
                />
              </div>
            )}
            <ReactMarkdown className="markdown-content">
              {facts || 'Click anywhere on the Earth to learn about that region!'}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
