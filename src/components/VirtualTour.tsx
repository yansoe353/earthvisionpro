import React, { useState, useEffect } from 'react';
import { fetchMapillaryImage } from '../services/VirtualTourService';

interface Location {
  lat: number;
  lng: number;
  name: string;
}

interface VirtualTourProps {
  location: Location;
}

const VirtualTour = ({ location }: VirtualTourProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) return;

    const abortController = new AbortController();

    const fetchVirtualTour = async () => {
      setLoading(true);
      setError(null);

      try {
        const mapillaryUrl = await fetchMapillaryImage(location.lat, location.lng, abortController.signal);
        setImageUrl(mapillaryUrl);
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error fetching virtual tour:', error);
          setError('Failed to fetch virtual tour. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVirtualTour();

    return () => {
      abortController.abort();
    };
  }, [location]);

  if (!location) {
    return <p>No location provided. Please select a location to view the virtual tour.</p>;
  }

  return (
    <div className="virtual-tour">
      <h2>360 Virtual Tour for {location.name}</h2>
      {loading && <p>Loading virtual tour...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {imageUrl ? (
        <div className="panorama-container">
          <img src={imageUrl} alt={`360 Virtual Tour for ${location.name}`} className="panorama-image" />
        </div>
      ) : (
        <p>No 360 image available for this location.</p>
      )}
    </div>
  );
};

export default VirtualTour;
