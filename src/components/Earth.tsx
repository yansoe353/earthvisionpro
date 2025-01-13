import React, { useCallback, useRef, forwardRef, useState, useImperativeHandle, useEffect } from 'react';
import Map, { MapRef, Marker, Popup, MapLayerMouseEvent } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Earth.css';
import FeaturePanel from './FeaturePanel';
import WeatherWidget from './WeatherWidget';
import MarkerPopup from './MarkerPopup';
import MapControls from './MapControls';
import { Earthquake, VolcanicEruption, Wildfire, UserMarker, WeatherData, EarthProps, EarthRef } from './types';

const MAPBOX_STYLE = 'mapbox://styles/htetnay/cm52c39vv00bz01sa0qzx4ro7';

const Earth = forwardRef<EarthRef, EarthProps>(({ onCaptureView, showWeatherWidget, setShowWeatherWidget }, ref) => {
  const mapRef = useRef<MapRef>(null);
  const [clickedLocation, setClickedLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [volcanicEruptions, setVolcanicEruptions] = useState<VolcanicEruption[]>([]);
  const [wildfires, setWildfires] = useState<Wildfire[]>([]);
  const [selectedEarthquake, setSelectedEarthquake] = useState<Earthquake | null>(null);
  const [selectedVolcanicEruption, setSelectedVolcanicEruption] = useState<VolcanicEruption | null>(null);
  const [selectedWildfire, setSelectedWildfire] = useState<Wildfire | null>(null);
  const [showFeaturePanel, setShowFeaturePanel] = useState(false);
  const [showDisasterAlerts, setShowDisasterAlerts] = useState(true);
  const [showVolcanicEruptions, setShowVolcanicEruptions] = useState(true);
  const [showWildfires, setShowWildfires] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [userMarkers, setUserMarkers] = useState<UserMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<UserMarker | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isCaptureEnabled, setIsCaptureEnabled] = useState(true);

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
    if (!showDisasterAlerts) return;

    const fetchEarthquakes = async () => {
      try {
        const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson');
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

  // Fetch volcanic eruption data from USGS API
  useEffect(() => {
    if (!showVolcanicEruptions) return;

    const fetchVolcanicEruptions = async () => {
      try {
        const response = await fetch('https://volcanoes.usgs.gov/hans-public/api/volcano/getElevatedVolcanoes');
        if (!response.ok) throw new Error('Failed to fetch volcanic eruption data');
        const data = await response.json();
        console.log('Volcanic Eruption Data:', data); // Log the API response

        // Validate and filter data to ensure it has the correct structure
        const validEruptions = data.filter(
          (eruption: VolcanicEruption) =>
            eruption.location &&
            typeof eruption.location.lng === 'number' &&
            typeof eruption.location.lat === 'number'
        );
        console.log('Valid Volcanic Eruptions:', validEruptions); // Log filtered data
        setVolcanicEruptions(validEruptions);
      } catch (error) {
        console.error('Error fetching volcanic eruption data:', error);
      }
    };

    fetchVolcanicEruptions();
    const interval = setInterval(fetchVolcanicEruptions, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [showVolcanicEruptions]);

  // Fetch wildfire data
  useEffect(() => {
    if (!showWildfires) return;

    const fetchWildfires = async () => {
      try {
        const response = await fetch('https://firms.modaps.eosdis.nasa.gov/api/wildfires');
        if (!response.ok) throw new Error('Failed to fetch wildfire data');
        const data = await response.json();

        // Validate and filter data to ensure it has the correct structure
        const validWildfires = data.wildfires.filter(
          (wildfire: Wildfire) =>
            wildfire.location &&
            typeof wildfire.location.lng === 'number' &&
            typeof wildfire.location.lat === 'number'
        );
        setWildfires(validWildfires);
      } catch (error) {
        console.error('Error fetching wildfire data:', error);
      }
    };

    fetchWildfires();
    const interval = setInterval(fetchWildfires, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [showWildfires]);

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
        setShowWeatherWidget(true); // Show the weather widget
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

  // Toggle Volcanic Eruptions
  const toggleVolcanicEruptions = useCallback(() => {
    setShowVolcanicEruptions((prev) => !prev);
  }, []);

  // Toggle Wildfires
  const toggleWildfires = useCallback(() => {
    setShowWildfires((prev) => !prev);
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

  // Close weather widget
  const closeWeatherWidget = useCallback(() => {
    setShowWeatherWidget(false); // Hide the weather widget
  }, [setShowWeatherWidget]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Map Controls */}
      <MapControls toggleFeaturePanel={toggleFeaturePanel} isDarkTheme={isDarkTheme} />

      {/* Feature Panel */}
      {showFeaturePanel && (
        <FeaturePanel
          isDarkTheme={isDarkTheme}
          showDisasterAlerts={showDisasterAlerts}
          showVolcanicEruptions={showVolcanicEruptions}
          showWildfires={showWildfires}
          isCaptureEnabled={isCaptureEnabled}
          clickedLocation={clickedLocation}
          toggleDisasterAlerts={toggleDisasterAlerts}
          toggleVolcanicEruptions={toggleVolcanicEruptions}
          toggleWildfires={toggleWildfires}
          toggleDarkTheme={toggleDarkTheme}
          toggleCaptureFeature={toggleCaptureFeature}
          addUserMarker={addUserMarker}
          removeAllMarkers={removeAllMarkers}
          onClose={toggleFeaturePanel}
        />
      )}

      {/* Weather Widget */}
      {showWeatherWidget && weatherData && (
        <WeatherWidget weatherData={weatherData} closeWeatherWidget={closeWeatherWidget} />
      )}

      {/* Mapbox Map */}
      <Map
        ref={mapRef}
        mapStyle={isDarkTheme ? 'mapbox://styles/mapbox/dark-v11' : MAPBOX_STYLE}
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

        {/* Volcanic Eruption Markers */}
        {showVolcanicEruptions &&
          volcanicEruptions.map((eruption) => {
            console.log('Rendering Volcanic Eruption:', eruption); // Log each eruption
            return (
              <Marker
                key={eruption.id}
                longitude={eruption.location?.lng || 0}
                latitude={eruption.location?.lat || 0}
                onClick={(e) => {
                  e.originalEvent.stopPropagation(); // Prevent map click event
                  setSelectedVolcanicEruption(eruption);
                }}
              >
                <div className="volcano-marker">
                  <span>🌋</span>
                </div>
              </Marker>
            );
          })}

        {/* Wildfire Markers */}
        {showWildfires &&
          wildfires.map((wildfire) => (
            <Marker
              key={wildfire.id}
              longitude={wildfire.location?.lng || 0}
              latitude={wildfire.location?.lat || 0}
              onClick={(e) => {
                e.originalEvent.stopPropagation(); // Prevent map click event
                setSelectedWildfire(wildfire);
              }}
            >
              <div className="wildfire-marker">
                <span>🔥</span>
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
            <MarkerPopup
              marker={selectedEarthquake}
              onClose={() => setSelectedEarthquake(null)}
            />
          </Popup>
        )}

        {selectedVolcanicEruption && (
          <Popup
            longitude={selectedVolcanicEruption.location?.lng || 0}
            latitude={selectedVolcanicEruption.location?.lat || 0}
            onClose={() => setSelectedVolcanicEruption(null)}
          >
            <MarkerPopup
              marker={selectedVolcanicEruption}
              onClose={() => setSelectedVolcanicEruption(null)}
            />
          </Popup>
        )}

        {selectedWildfire && (
          <Popup
            longitude={selectedWildfire.location?.lng || 0}
            latitude={selectedWildfire.location?.lat || 0}
            onClose={() => setSelectedWildfire(null)}
          >
            <MarkerPopup
              marker={selectedWildfire}
              onClose={() => setSelectedWildfire(null)}
            />
          </Popup>
        )}

        {selectedMarker && (
          <Popup
            longitude={selectedMarker.lng}
            latitude={selectedMarker.lat}
            onClose={() => setSelectedMarker(null)}
          >
            <MarkerPopup
              marker={selectedMarker}
              onClose={() => setSelectedMarker(null)}
              onDelete={deleteUserMarker}
            />
          </Popup>
        )}
      </Map>
    </div>
  );
});

export default Earth;
