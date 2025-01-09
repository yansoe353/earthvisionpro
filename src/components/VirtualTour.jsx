import React, { useState, useEffect } from 'react';
import { getGoogleStreetView, getMapillaryImage } from '../services/VirtualTourService';

const VirtualTour = ({ location }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!location) return;

    const fetchVirtualTour = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch Google Street View image
        const streetViewUrl = getGoogleStreetView(location.lat, location.lng);
        setImageUrl(streetViewUrl);

        // Alternatively, fetch Mapillary image
        // const mapillaryUrl = await getMapillaryImage(location.lat, location.lng);
        // setImageUrl(mapillaryUrl);
      } catch (error) {
        console.error('Error fetching virtual tour:', error);
        setError('Failed to fetch virtual tour. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchVirtualTour();
  }, [location]);

  return (
    <div className="virtual-tour">
      <h2>360 Virtual Tour for {location.name}</h2>
      {loading && <p>Loading virtual tour...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {imageUrl && (
        <div className="panorama-container">
          <img src={imageUrl} alt="360 Virtual Tour" className="panorama-image" />
        </div>
      )}
    </div>
  );
};

export default VirtualTour;
