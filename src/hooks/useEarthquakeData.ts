// useEarthquakeData.ts
import { useEffect, useState } from 'react';

interface Earthquake {
  id: string;
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    title: string;
    mag: number;
    place: string;
  };
}

export const useEarthquakeData = (showDisasterAlerts: boolean) => {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);

  useEffect(() => {
    if (!showDisasterAlerts) return;

    const fetchEarthquakes = async () => {
      try {
        const response = await fetch(
          'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson'
        );
        if (!response.ok) throw new Error('Failed to fetch earthquake data');
        const data = await response.json();
        setEarthquakes(data.features);
      } catch (error) {
        console.error('Error fetching earthquake data:', error);
      }
    };

    fetchEarthquakes();
    const interval = setInterval(fetchEarthquakes, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [showDisasterAlerts]);

  return earthquakes;
};
