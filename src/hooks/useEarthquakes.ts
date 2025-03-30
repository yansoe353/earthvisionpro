// hooks/useEarthquakes.ts
import { useEffect, useState } from 'react';
import { Earthquake } from '../types';

const USGS_API_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson';

const useEarthquakes = (showDisasterAlerts: boolean) => {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchEarthquakes = async () => {
      if (!showDisasterAlerts) {
        if (isMounted) setEarthquakes([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(USGS_API_URL, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (isMounted) {
          const sortedEarthquakes = data.features.sort((a: Earthquake, b: Earthquake) =>
            new Date(b.properties.time).getTime() - new Date(a.properties.time).getTime()
          );
          setEarthquakes(sortedEarthquakes);
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError' && isMounted) {
          console.error('Error fetching earthquake data:', err);
          setError('Failed to load earthquake data');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchEarthquakes();
    const interval = setInterval(fetchEarthquakes, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => {
      isMounted = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [showDisasterAlerts]);

  return { earthquakes, loading, error };
};

export default useEarthquakes;
