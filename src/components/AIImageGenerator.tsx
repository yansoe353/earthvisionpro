import React, { useState } from 'react';
import { Marker, Popup } from 'react-map-gl';
import axios from 'axios';

const AIImageGenerator = ({ mapRef }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [style, setStyle] = useState('realistic');
  const [loading, setLoading] = useState(false);

  const handleMapClick = (event) => {
    const { lngLat } = event;
    setSelectedLocation({ lng: lngLat.lng, lat: lngLat.lat });
  };

  const generateImage = async () => {
    if (selectedLocation) {
      setLoading(true);
      try {
        const response = await axios.post(
          'https://api-inference.huggingface.co/models/CompVis/stable-diffusion-v1-4',
          {
            inputs: `Generate a ${style} image of the location at latitude ${selectedLocation.lat} and longitude ${selectedLocation.lng}`,
          },
          {
            headers: {
              Authorization: `Bearer YOUR_HUGGING_FACE_API_KEY`,
            },
          }
        );
        setGeneratedImage(response.data[0]);
      } catch (error) {
        console.error('Error generating image:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStyleChange = (event) => {
    setStyle(event.target.value);
  };

  return (
    <div>
      <div className="style-selector">
        <label>
          Style:
          <select value={style} onChange={handleStyleChange}>
            <option value="realistic">Realistic</option>
            <option value="impressionist">Impressionist</option>
            <option value="futuristic">Futuristic</option>
          </select>
        </label>
        <button onClick={generateImage} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Image'}
        </button>
      </div>
      {selectedLocation && (
        <Marker longitude={selectedLocation.lng} latitude={selectedLocation.lat}>
          <div className="location-marker" onClick={generateImage}>
            📸
          </div>
        </Marker>
      )}
      {generatedImage && (
        <Popup
          longitude={selectedLocation.lng}
          latitude={selectedLocation.lat}
          onClose={() => setGeneratedImage(null)}
        >
          <div>
            <img src={generatedImage} alt="Generated" />
            <a href={generatedImage} download="generated_image.png">Download</a>
          </div>
        </Popup>
      )}
    </div>
  );
};

export default AIImageGenerator;
