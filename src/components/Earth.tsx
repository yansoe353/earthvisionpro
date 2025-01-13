import { useCallback, useRef, forwardRef, useState, useImperativeHandle, useEffect } from 'react';
import Map, { MapRef, Layer, Source, Marker, Popup, MapLayerMouseEvent } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Earth.css'; // Ensure you have this CSS file for style

const MAPBOX_STYLE = 'mapbox://styles/htetnay/cm52c39vv00bz01sa0qzx4ro7'; // Default map style

interface EarthProps {
  onCaptureView: () => void; // Function to capture the current view
  showWeatherWidget: boolean; // Passed from parent
  setShowWeatherWidget: (value: boolean) => void; // Passed from parent
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

interface UserMarker {
  lng: number;
  lat: number;
  label: string;
  id: string; // Unique ID for each marker
}

interface WeatherData {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: {
    description: string;
    icon: string;
  }[];
  wind: {
    speed: number;
  };
}

const Earth = forwardRef<EarthRef, EarthProps>(({ onCaptureView, showWeatherWidget, setShowWeatherWidget }, ref) => {
  const mapRef = useRef<MapRef>(null); // Reference to the Mapbox map
  const [clickedLocation, setClickedLocation] = useState<{ lng: number; lat: number } | null>(null); // Store clicked location
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]); // Store earthquake data
  const [selectedEarthquake, setSelectedEarthquake] = useState<Earthquake | null>(null); // Store selected earthquake for popup
  const [showFeaturePanel, setShowFeaturePanel] = useState(false); // Control visibility of feature panel
  const [showDisasterAlerts, setShowDisasterAlerts] = useState(true); // Control visibility of disaster alerts
  const [isDarkTheme, setIsDarkTheme] = useState(false); // Control dark theme
  const [userMarkers, setUserMarkers] = useState<UserMarker[]>([]); // Store user-generated markers
  const [timeZoneInfo, setTimeZoneInfo] = useState<{ lng: number; lat: number; time: string } | null>(null); // Store time zone info
  const [isCaptureEnabled, setIsCaptureEnabled] = useState(true); // Control whether map capture is enabled
  const [selectedMarker, setSelectedMarker] = useState<UserMarker | null>(null); // Track selected user marker
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null); // Store weather data

  // Load markers from local storage on component mount
  useEffect(() => {
    const savedMarkers = localStorage.getItem('userMarkers');
    if (savedMarkers) {
      setUserMarkers(JSON.parse(savedMarkers));
    }
  }, []);

  // Save markers to local storage whenever userMarkers changes
  useEffect(() => {
    localStorage.setItem('userMarkers', JSON.stringify(userMarkers));
  }, [userMarkers]);

  // Fetch earthquake data from USGS API
  useEffect(() => {
    if (!showDisasterAlerts) return; // Skip fetching if disaster alerts are disabled

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
    const interval = setInterval(fetchEarthquakes, 60000); // Refresh data every minute
    return () => clearInterval(interval);
  }, [showDisasterAlerts]);

  // Handle click on the map
  const handleClick = useCallback(
    async (event: MapLayerMouseEvent) => {
      const { lngLat } = event;
      setClickedLocation(lngLat); // Store the clicked location
      if (isCaptureEnabled) {
        onCaptureView(); // Trigger the capture view function if enabled
      }

      // Fetch weather data for the clicked location
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lngLat.lat}&lon=${lngLat.lng}&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}&units=metric`
        );
        if (!response.ok) throw new Error('Failed to fetch weather data');
        const data = await response.json();
        setWeatherData(data);
        setShowWeatherWidget(true); // Use the prop to update state
      } catch (error) {
        console.error('Error fetching weather data:', error);
      }
    },
    [onCaptureView, isCaptureEnabled, setShowWeatherWidget]
  );

  // Handle search for a location
  const handleSearch = useCallback((lng: number, lat: number) => {
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: 10, // Zoom closer for better 3D view
      duration: 2000,
    });
    setClickedLocation({ lng, lat }); // Update the clicked location
  }, []);

  // Expose handleSearch to the parent component
  useImperativeHandle(ref, () => ({
    handleSearch,
  }));

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

  // Toggle capture feature
  const toggleCaptureFeature = useCallback(() => {
    setIsCaptureEnabled((prev) => !prev);
  }, []);

  // Add user-generated marker
  const addUserMarker = useCallback((lng: number, lat: number) => {
    const newMarker: UserMarker = {
      lng,
      lat,
      label: 'Marker', // Default label
      id: Math.random().toString(36).substring(7), // Generate a unique ID
    };
    setUserMarkers((prev) => [...prev, newMarker]);
    setSelectedMarker(newMarker); // Show popup for the new marker
  }, []);

  // Remove all user-generated markers
  const removeAllMarkers = useCallback(() => {
    setUserMarkers([]); // Clear all markers
    setSelectedMarker(null); // Close any open popup
  }, []);

  // Delete user-generated marker
  const deleteUserMarker = useCallback((id: string) => {
    setUserMarkers((prev) => prev.filter((marker) => marker.id !== id));
  }, []);

  // Fetch time zone info
  const fetchTimeZone = useCallback(async (lng: number, lat: number) => {
    try {
      const response = await fetch(
        `https://api.timezonedb.com/v2.1/get-time-zone?key=${import.meta.env.VITE_TIMEZONE_API_KEY}&format=json&by=position&lng=${lng}&lat=${lat}`
      );
      if (!response.ok) throw new Error('Failed to fetch time zone data');
      const data = await response.json();
      setTimeZoneInfo({ lng, lat, time: data.formatted });
    } catch (error) {
      console.error('Error fetching time zone data:', error);
    }
  }, []);

  // Close weather widget
  const closeWeatherWidget = useCallback(() => {
    setShowWeatherWidget(false); // Use the prop to update state
  }, [setShowWeatherWidget]);

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
          className={`feature-panel ${isDarkTheme ? 'dark' : ''}`}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 1,
            backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            width: '250px',
            maxHeight: '80vh', // Set a maximum height
            overflowY: 'auto', // Enable vertical scrolling
          }}
        >
          {/* Close Button */}
          <button
            onClick={toggleFeaturePanel}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'none',
              border: 'none',
              color: isDarkTheme ? '#fff' : '#000',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ×
          </button>

          {/* Feature Title */}
          <h3 style={{ marginBottom: '16px', fontSize: '16px', paddingRight: '20px' }}>
            Features
          </h3>

          {/* Feature Buttons */}
          <button
            onClick={toggleDisasterAlerts}
            style={{
              backgroundColor: showDisasterAlerts ? '#ff4444' : '#ccc',
              width: '100%',
              marginBottom: '8px',
              padding: '8px',
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
              backgroundColor: isDarkTheme ? '#333' : '#ccc',
              width: '100%',
              marginBottom: '8px',
              padding: '8px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {isDarkTheme ? 'Light Theme' : 'Dark Theme'}
          </button>
          <button
            onClick={toggleCaptureFeature}
            style={{
              backgroundColor: isCaptureEnabled ? '#4CAF50' : '#ccc',
              width: '100%',
              marginBottom: '8px',
              padding: '8px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {isCaptureEnabled ? 'Disable Capture' : 'Enable Capture'}
          </button>
          <button
            onClick={() => {
              if (clickedLocation) {
                addUserMarker(clickedLocation.lng, clickedLocation.lat);
              }
            }}
            style={{
              backgroundColor: '#4CAF50',
              width: '100%',
              marginBottom: '8px',
              padding: '8px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Add Marker
          </button>
          <button
            onClick={removeAllMarkers}
            style={{
              backgroundColor: '#ff4444',
              width: '100%',
              marginBottom: '8px',
              padding: '8px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Remove All Markers
          </button>
        </div>
      )}

      {/* Weather Widget */}
      {showWeatherWidget && weatherData && (
        <div className="weather-widget">
          <button
            onClick={closeWeatherWidget}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'none',
              border: 'none',
              color: '#000',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ×
          </button>
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Weather Info</h3>
          <p><strong>Location:</strong> {weatherData.name}</p>
          <p><strong>Temperature:</strong> {weatherData.main.temp}°C</p>
          <p><strong>Feels Like:</strong> {weatherData.main.feels_like}°C</p>
          <p><strong>Humidity:</strong> {weatherData.main.humidity}%</p>
          <p><strong>Wind Speed:</strong> {weatherData.wind.speed} m/s</p>
          <p><strong>Condition:</strong> {weatherData.weather[0].description}</p>
          <img
            src={`http://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`}
            alt="Weather Icon"
            style={{ width: '50px', height: '50px' }}
          />
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
        {/* Earthquake Markers */}
        {showDisasterAlerts &&
          earthquakes.map((earthquake) => (
            <Marker
              key={earthquake.id}
              longitude={earthquake.geometry.coordinates[0]}
              latitude={earthquake.geometry.coordinates[1]}
              onClick={(e) => {
                e.originalEvent.stopPropagation(); // Prevent map click event
                setSelectedEarthquake(earthquake);
              }}
            >
              <div className="earthquake-marker">
                <span>{earthquake.properties.mag}</span>
              </div>
            </Marker>
          ))}

        {/* User-Generated Markers */}
        {userMarkers.map((marker) => (
          <Marker
            key={marker.id}
            longitude={marker.lng}
            latitude={marker.lat}
            onClick={(e) => {
              e.originalEvent.stopPropagation(); // Prevent map click event
              setSelectedMarker(marker);
            }}
          >
            <div className="user-marker">
              <span>{marker.label}</span>
            </div>
          </Marker>
        ))}

        {/* Popups */}
        {selectedEarthquake && (
          <Popup
            longitude={selectedEarthquake.geometry.coordinates[0]}
            latitude={selectedEarthquake.geometry.coordinates[1]}
            onClose={() => setSelectedEarthquake(null)}
          >
            <div>
              <h3>{selectedEarthquake.properties.title}</h3>
              <p>Magnitude: {selectedEarthquake.properties.mag}</p>
              <p>Location: {selectedEarthquake.properties.place}</p>
            </div>
          </Popup>
        )}

        {selectedMarker && (
          <Popup
            longitude={selectedMarker.lng}
            latitude={selectedMarker.lat}
            onClose={() => setSelectedMarker(null)}
          >
            <div>
              <h3>{selectedMarker.label}</h3>
              <button onClick={() => deleteUserMarker(selectedMarker.id)}>
                Delete Marker
              </button>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
});

export default Earth;
