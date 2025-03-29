// hooks/useEarthquakes.ts
import { useEffect, useState } from 'react';
import { Earthquake } from '../types';

const USGS_API_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson';

const useEarthquakes = (showDisasterAlerts: boolean) => {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);

  useEffect(() => {
    if (showDisasterAlerts) {
      fetch(USGS_API_URL)
        .then((response) => response.json())
        .then((data) => {
          setEarthquakes(data.features);
        })
        .catch((error) => {
          console.error('Error fetching earthquake data:', error);
        });
    } else {
      setEarthquakes([]);
    }
  }, [showDisasterAlerts]);

  return { earthquakes };
};

export default useEarthquakes;
