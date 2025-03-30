// components/EarthquakeList.tsx
import React from 'react';
import useEarthquakes from '../hooks/useEarthquakes';
import { getEarthquakeColor } from '../utils/getEarthquakeColor';

const EarthquakeList: React.FC<{ showDisasterAlerts: boolean }> = ({ showDisasterAlerts }) => {
  const { earthquakes, loading, error } = useEarthquakes(showDisasterAlerts);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      {earthquakes.map((eq, index) => {
        const magnitude = eq.properties.mag;
        const color = getEarthquakeColor(magnitude);
        const isNewest = index === 0;

        return (
          <div
            key={eq.id}
            style={{
              backgroundColor: isNewest ? 'red' : color,
              color: 'white',
              padding: '10px',
              margin: '5px 0',
              borderRadius: '5px'
            }}
          >
            <strong>Magnitude:</strong> {magnitude}
            <br />
            <strong>Location:</strong> {eq.properties.place}
            <br />
            <strong>Time:</strong> {new Date(eq.properties.time).toLocaleString()}
          </div>
        );
      })}
    </div>
  );
};

export default EarthquakeList;
