import { useCallback, useRef, forwardRef, useState, useImperativeHandle, useEffect } from 'react';
import Map, { MapRef, Layer, Source, Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_STYLE = 'mapbox://styles/htetnay/cm52c39vv00bz01sa0qzx4ro7'; // Original map style

interface EarthProps {
  onCaptureView: () => void; // Function to capture the current view
  weatherData: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    weatherIcon: string;
  } | null; // Weather data for the selected location
}

interface EarthRef {
  handleSearch: (lng: number, lat: number) => void; // Expose handleSearch to parent
}

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

const Earth = forwardRef<EarthRef, EarthProps>(
  ({ onCaptureView, weatherData }, ref) => {
    const mapRef = useRef<MapRef>(null); // Reference to the Mapbox map
    const [clickedLocation, setClickedLocation] = useState<{ lng: number; lat: number } | null>(null); // Store clicked location
    const [showWeatherWidget, setShowWeatherWidget] = useState(true); // Control visibility of weather widget
    const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]); // Store earthquake data
    const [selectedEarthquake, setSelectedEarthquake] = useState<Earthquake | null>(null); // Store selected earthquake for popup
    const [showFeaturePanel, setShowFeaturePanel] = useState(false); // Control visibility of feature panel
    const [showDisasterAlerts, setShowDisasterAlerts] = useState(true); // Control visibility of disaster alerts
    const [isDarkTheme, setIsDarkTheme] = useState(false); // Control dark theme

    // Fetch earthquake data from USGS API
    useEffect(() => {
      if (!showDisasterAlerts) return; // Skip fetching if disaster alerts are disabled

      const fetchEarthquakes = async () => {
        try {
          const response = await fetch(
            'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson'
          );
          const data = await response.json();
          setEarthquakes(data.features);
        } catch (error) {
          console.error('Error fetching earthquake data:', error);
        }
      };

      fetchEarthquakes();
      const interval = setInterval(fetchEarthquakes, 60000); // Refresh data every minute
      return () => clearInterval(interval);
    }, [showDisasterAlerts]);

    // Handle click on the map
    const handleClick = useCallback(
      (event: any) => {
        const { lngLat } = event;
        setClickedLocation(lngLat); // Store the clicked location
        setShowWeatherWidget(true); // Show the weather widget
        onCaptureView(); // Trigger the capture view function
      },
      [onCaptureView]
    );

    // Handle search for a location
    const handleSearch = useCallback((lng: number, lat: number) => {
      mapRef.current?.flyTo({
        center: [lng, lat],
        zoom: 10, // Zoom closer for better 3D view
        duration: 2000,
      });
      setClickedLocation({ lng, lat }); // Update the clicked location
      setShowWeatherWidget(true); // Show the weather widget
    }, []);

    // Expose handleSearch to the parent component
    useImperativeHandle(ref, () => ({
      handleSearch,
    }));

    // Handle close button click
    const handleClose = useCallback(() => {
      setShowWeatherWidget(false); // Hide the weather widget
    }, []);

    // Toggle feature panel visibility
    const toggleFeaturePanel = useCallback(() => {
      setShowFeaturePanel((prev) => !prev);
    }, []);

    // Toggle Natural Disaster Alerts
    const toggleDisasterAlerts = useCallback(() => {
      setShowDisasterAlerts((prev) => !prev);
    }, []);

    // Toggle dark theme
    const toggleDarkTheme = useCallback(() => {
      setIsDarkTheme((prev) => !prev);
    }, []);

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* Feature Panel Button */}
        <button
          onClick={toggleFeaturePanel}
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            zIndex: 1,
            padding: '8px 16px',
            backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            color: isDarkTheme ? '#fff' : '#000',
          }}
        >
          {showFeaturePanel ? 'Hide Features' : 'Show Features'}
        </button>

        {/* Feature Panel */}
        {showFeaturePanel && (
          <div
            style={{
              position: 'absolute',
              bottom: 60,
              right: 20,
              zIndex: 1,
              backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              maxHeight: '60vh',
              overflowY: 'auto',
              width: '250px',
              color: isDarkTheme ? '#fff' : '#000',
            }}
          >
            <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Features</h3>
            <div style={{ marginBottom: '16px' }}>
              <button
                onClick={toggleDisasterAlerts}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px',
                  marginBottom: '8px',
                  backgroundColor: showDisasterAlerts ? '#ff4444' : '#ccc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                {showDisasterAlerts ? 'Disable Alerts' : 'Enable Alerts'}
              </button>
              <button
                onClick={toggleDarkTheme}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px',
                  marginBottom: '8px',
                  backgroundColor: isDarkTheme ? '#333' : '#ccc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                {isDarkTheme ? 'Light Theme' : 'Dark Theme'}
              </button>
            </div>
            {/* Add more feature toggles here */}
          </div>
        )}

        {/* Mapbox Map */}
        <Map
          ref={mapRef}
          mapStyle={isDarkTheme ? 'mapbox://styles/mapbox/dark-v11' : MAPBOX_STYLE} // Dynamic map style
          initialViewState={{
            longitude: 0,
            latitude: 20,
            zoom: 1,
            bearing: 0,
            pitch: 0,
          }}
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          onClick={handleClick}
          style={{ width: '100%', height: '100%' }}
          maxZoom={20}
          minZoom={1}
          projection={{ name: 'globe' }}
          terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }} // Enable 3D terrain
          fog={{
            range: [1, 10],
            color: isDarkTheme ? '#000' : '#242B4B',
            'horizon-blend': 0.2,
          }}
          attributionControl={false}
        >
          {/* 3D Buildings Layer */}
          <Source
            id="composite"
            source="composite"
            url="mapbox://mapbox.mapbox-streets-v8"
            type="vector"
          >
            <Layer
              id="3d-buildings"
              source="composite"
              source-layer="building"
              filter={['==', 'extrude', 'true']}
              type="fill-extrusion"
              minzoom={15} // Correct property name (all lowercase)
              paint={{
                'fill-extrusion-color': isDarkTheme ? '#555' : '#ddd', // Building color
                'fill-extrusion-height': ['get', 'height'], // Use building height
                'fill-extrusion-base': ['get', 'min_height'], // Base height
                'fill-extrusion-opacity': 0.6, // Slightly transparent
              }}
            />
          </Source>

          {/* Earthquake Markers */}
          {showDisasterAlerts &&
            earthquakes.map((earthquake) => (
              <Marker
                key={earthquake.id}
                longitude={earthquake.geometry.coordinates[0]}
                latitude={earthquake.geometry.coordinates[1]}
                onClick={() => setSelectedEarthquake(earthquake)}
              >
                <div style={{ color: 'red', fontSize: '24px' }}>⚠️</div>
              </Marker>
            ))}

          {/* Earthquake Popup */}
          {selectedEarthquake && (
            <Popup
              longitude={selectedEarthquake.geometry.coordinates[0]}
              latitude={selectedEarthquake.geometry.coordinates[1]}
              onClose={() => setSelectedEarthquake(null)}
            >
              <div style={{ color: isDarkTheme ? '#fff' : '#000' }}>
                <h3>Earthquake Info</h3>
                <p><strong>Magnitude:</strong> {selectedEarthquake.properties.mag}</p>
                <p><strong>Location:</strong> {selectedEarthquake.properties.place}</p>
                <p><strong>Title:</strong> {selectedEarthquake.properties.title}</p>
              </div>
            </Popup>
          )}

          {/* Marker for Clicked Location */}
          {clickedLocation && (
            <Marker longitude={clickedLocation.lng} latitude={clickedLocation.lat}>
              <div style={{ color: 'red', fontSize: '24px' }}>📍</div>
            </Marker>
          )}
        </Map>

        {/* Weather Widget */}
        {clickedLocation && showWeatherWidget && (
          <div
            className="weather-widget"
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              color: isDarkTheme ? '#fff' : '#000',
            }}
          >
            <button
              className="close-button"
              onClick={handleClose}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'none',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                color: isDarkTheme ? '#fff' : '#000',
              }}
            >
              &times; {/* Close icon (×) */}
            </button>
            <h3>
              Weather at ({clickedLocation.lat.toFixed(2)}, {clickedLocation.lng.toFixed(2)})
            </h3>
            {weatherData ? (
              <>
                <img src={weatherData.weatherIcon} alt="Weather Icon" />
                <p>Temperature: {weatherData.temperature}°C</p>
                <p>Humidity: {weatherData.humidity}%</p>
                <p>Wind Speed: {weatherData.windSpeed} m/s</p>
              </>
            ) : (
              <p>Loading weather data...</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

export default Earth;
