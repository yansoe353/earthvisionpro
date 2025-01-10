import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Groq } from 'groq-sdk';
import axios from 'axios';

interface VirtualTourProps {
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  onClose: () => void;
  language: 'en' | 'my' | 'th';
  onTranslate: (text: string, targetLanguage: 'en' | 'my' | 'th') => Promise<string>;
}

const VirtualTour = ({ location, onClose, language, onTranslate }: VirtualTourProps) => {
  const [description, setDescription] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isRewriting, setIsRewriting] = useState<boolean>(false);

  const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
  });

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
      setImageUrl('');
    }
  };

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

  const handleTranslate = async (targetLanguage: 'en' | 'my' | 'th') => {
    const translatedText = await onTranslate(description, targetLanguage);
    setDescription(translatedText);
  };

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

export default VirtualTour;
