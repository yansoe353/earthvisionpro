import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './EarthImageGenerationPanel.css';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI('AIzaSyBAJJLHI8kwwmNJwfuTInH2KYIGs9Nnhbc');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

interface EarthImageGenerationPanelProps {
  onClose: () => void;
}

const EarthImageGenerationPanel: React.FC<EarthImageGenerationPanelProps> = ({ onClose }) => {
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateImage = async () => {
    if (!location) return;
    setLoading(true);

    try {
      const prompt = `Generate a beautiful image of ${location}.`;
      const result = await model.generateContent([
        {
          role: 'user',
          content: prompt,
        },
      ]);

      if (result.response.content && result.response.content.parts && result.response.content.parts[0]) {
        const imageData = result.response.content.parts[0];
        setImageUrl(imageData.image);
      } else {
        console.error('No image generated.');
      }
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="earth-image-generation-panel">
      <button className="close-button" onClick={onClose}>
        &times;
      </button>
      <h2>Earth Image Generation</h2>
      <input
        type="text"
        placeholder="Enter location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <button onClick={handleGenerateImage} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Image'}
      </button>
      {imageUrl && (
        <div className="image-container">
          <img src={imageUrl} alt="Generated Earth Image" />
        </div>
      )}
    </div>
  );
};

export default EarthImageGenerationPanel;
