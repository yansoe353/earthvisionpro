import { useState, useEffect } from 'react';
import { Earthquake } from '../types'; // Import the Earthquake type

const useEarthquakes = (showDisasterAlerts: boolean) => {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!showDisasterAlerts) {
      setEarthquakes([]); // Clear earthquake data when alerts are disabled
      return;
    }

    const fetchEarthquakes = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson'
        );
        if (!response.ok) throw new Error('Failed to fetch earthquake data');
        const data = await response.json();
        setEarthquakes(data.features);
      } catch (error) {
        console.error('Error fetching earthquake data:', error);
        setError('Failed to fetch earthquake data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEarthquakes();
    const interval = setInterval(fetchEarthquakes, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [showDisasterAlerts]);

  return { earthquakes, loading, error };
};

export default useEarthquakes;
