import { useState, useRef, useEffect } from 'react';
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
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [dynamicThemes, setDynamicThemes] = useState<Array<{ name: string, prompt: string }>>([]);
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

  const MarkdownContent = ({ content }: { content: string }) => {
    const sections = content.split('\n\n## ');
    
    return (
      <>
        <ReactMarkdown>
          {sections[0]}
        </ReactMarkdown>
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
        dangerouslyAllowBrowser: true
      });

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: `Based on the location "${location}", generate 5 highly specific analysis themes. Focus on unique, distinctive aspects that make this location special. Consider these categories:

1. Scientific & Research Value
   - Unique geological formations
   - Endemic species habitats
   - Archaeological discoveries
   - Climate research stations
   - Astronomical observation points

2. Indigenous & Traditional Knowledge
   - Ancient farming techniques
   - Traditional navigation methods
   - Sacred sites and rituals
   - Local medicinal practices
   - Traditional resource management

3. Modern Development & Innovation
   - Smart city initiatives
   - Renewable energy projects
   - Urban planning solutions
   - Technology hubs
   - Sustainable architecture

4. Strategic & Geopolitical Aspects
   - Trade route significance
   - Border dynamics
   - Resource disputes
   - Military importance
   - International agreements

5. Social & Future Trends
   - Population movement patterns
   - Educational institutions
   - Tourism development
   - Cultural preservation efforts
   - Climate adaptation strategies

Format your response as a JSON array with 'name' and 'prompt' for each theme:
[
  {
    "name": "Very Specific Theme Name (3-5 words)",
    "prompt": "Detailed analysis prompt focusing on unique aspects of this specific location"
  }
]

Requirements:
- Make each theme HIGHLY specific to this exact location
- Avoid generic topics that could apply anywhere
- Include precise geographical or historical references
- Focus on unique features or phenomena
- Consider current events or ongoing developments
- Reference specific projects or initiatives if relevant`
          }
        ],
        model: 'llama-3.2-90b-vision-preview',
        temperature: 0.8,
        max_tokens: 1000,
      });

      if (completion.choices && completion.choices[0]?.message?.content) {
        try {
          const themes = JSON.parse(completion.choices[0].message.content);
          setDynamicThemes(themes);
        } catch (e) {
          console.error('Error parsing dynamic themes:', e);
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

    try {
      const groq = new Groq({
        apiKey: import.meta.env.VITE_GROQ_API_KEY,
        dangerouslyAllowBrowser: true
      });

      const defaultPromptMap = {
        'Environmental Factors': `Based on the location "${currentLocation}", provide additional analysis about its environmental aspects, including climate patterns, ecosystems, biodiversity, and conservation challenges.`,
        'Economic Areas': `Based on the location "${currentLocation}", provide additional analysis about its economic significance, including key industries, market strengths, trade advantages, and resource management.`,
        'Cultural Notions': `Based on the location "${currentLocation}", provide additional analysis about its cultural heritage, including historical aspects, traditions, architectural significance, and social evolution through time.`
      };

      const prompt = customPrompt || defaultPromptMap[perspective as keyof typeof defaultPromptMap];

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.2-90b-vision-preview',
        temperature: 0.7,
        max_tokens: 1000,
      });

      if (completion.choices && completion.choices[0]?.message?.content) {
        const newAnalysis = completion.choices[0].message.content;
        setFacts(prevFacts => `${prevFacts}\n\n## ${perspective} Analysis\n${newAnalysis}`);
      }
    } catch (error) {
      console.error('Error during analysis:', error);
      setFacts(prevFacts => `${prevFacts}\n\nError analyzing ${perspective} perspective. Please try again.`);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const captureView = async () => {
    if (!earthContainerRef.current) return;
    setLoading(true);
    setDynamicThemes([]); // Reset dynamic themes when capturing new view

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
                text: `Examine the image and identify the location visible. Then provide a rich, engaging analysis of this region. Your response should:

First line: Clearly state the location name.

Then provide fascinating insights about this region, including:
• Remarkable geographical features and natural phenomena
• Rich historical significance and cultural heritage
• Notable landmarks and architectural wonders
• Unique ecological characteristics
• Important economic or strategic significance
• Fascinating local traditions or customs
• Current challenges or transformations

Format your response using:
• **Bold** for key terms, places, and significant concepts
• *Italics* for descriptive phrases and cultural terms
• Well-spaced bullet points for clear organization
• Natural flow between related topics

Make each point engaging and insightful, focusing on what makes this location truly special.`
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
        const content = completion.choices[0].message.content;
        // Try to extract location from the first line
        const locationMatch = content.match(/^[^•\n]+/);
        if (locationMatch) {
          const location = locationMatch[0].trim();
          setCurrentLocation(location);
          // Generate dynamic themes based on the location
          await generateDynamicThemes(location);
        }
        setFacts(content);
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
          <div className="facts" ref={factsContainerRef}>
            {capturedImage && (
              <div className="captured-image-container">
                <img 
                  src={capturedImage} 
                  alt="Captured view" 
                  className="captured-image"
                />
              </div>
            )}
            <MarkdownContent content={facts || 'Click anywhere on the Earth to learn about that region!'} />
            {analysisLoading && (
              <p className="loading-text analysis-loading">Generating additional analysis...</p>
            )}
            {facts && !loading && (
              <>
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
                    onClick={() => analyzeWithPerspective('Cultural Notions')}
                    className="analysis-button cultural"
                    disabled={analysisLoading}
                  >
                    Cultural Notions and Historical Aspects
                  </button>
                </div>
                {dynamicThemes.length > 0 && (
                  <div className="analysis-buttons dynamic-buttons">
                    {dynamicThemes.map((theme, index) => (
                      <button
                        key={index}
                        onClick={() => analyzeWithPerspective(theme.name, theme.prompt)}
                        className={`analysis-button dynamic-${index}`}
                        disabled={analysisLoading}
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
