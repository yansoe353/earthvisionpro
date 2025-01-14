import React, { useCallback, useRef, forwardRef, useState, useImperativeHandle } from 'react';
import Map, { MapRef, Marker, Popup, MapLayerMouseEvent, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Earth.css';
import FeaturePanel from './FeaturePanel';
import WeatherWidget from './WeatherWidget';
import MarkerPopup from './MarkerPopup';
import MapControls from './MapControls';
import { Earthquake, UserMarker, WeatherData, EarthProps, EarthRef, MapboxStyle } from './types';
import useEarthquakes from '../hooks/useEarthquakes'; // Import custom hook for earthquakes
import useWeatherData from '../hooks/useWeatherData'; // Import custom hook for weather data
import useUserMarkers from '../hooks/useUserMarkers'; // Import custom hook for user markers
import { MAPBOX_STYLES } from '../constants/mapboxStyles'; // Import from constants file

const Earth = forwardRef<EarthRef, EarthProps>(({ onCaptureView, showWeatherWidget, setShowWeatherWidget }, ref) => {
  const mapRef = useRef<MapRef>(null);
  const [clickedLocation, setClickedLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [selectedEarthquake, setSelectedEarthquake] = useState<Earthquake | null>(null);
  const [showFeaturePanel, setShowFeaturePanel] = useState(false);
  const [showDisasterAlerts, setShowDisasterAlerts] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<UserMarker | null>(null);
  const [isCaptureEnabled, setIsCaptureEnabled] = useState(true);
  const [mapStyle, setMapStyle] = useState<string>(MAPBOX_STYLES[0].value); // Default map style
  const [terrainExaggeration, setTerrainExaggeration] = useState<number>(1.5); // Default terrain exaggeration

  // Custom hooks
  const { earthquakes } = useEarthquakes(showDisasterAlerts); // Fetch earthquake data
  const { weatherData, fetchWeatherData } = useWeatherData(); // Fetch weather data
  const { userMarkers, addUserMarker, removeAllMarkers, deleteUserMarker } = useUserMarkers(); // Manage user markers

  // Handle click on the map
  const handleClick = useCallback(
    async (event: MapLayerMouseEvent) => {
      const { lngLat } = event;
      setClickedLocation(lngLat); // Store the clicked location
      if (isCaptureEnabled) {
        onCaptureView(); // Trigger the capture view function if enabled
      }

      // Fetch weather data for the clicked location
      await fetchWeatherData(lngLat.lat, lngLat.lng);
      setShowWeatherWidget(true); // Show the weather widget
    },
    [onCaptureView, isCaptureEnabled, fetchWeatherData, setShowWeatherWidget]
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
          isCaptureEnabled={isCaptureEnabled}
          clickedLocation={clickedLocation}
          toggleDisasterAlerts={toggleDisasterAlerts}
          toggleDarkTheme={toggleDarkTheme}
          toggleCaptureFeature={toggleCaptureFeature}
          addUserMarker={addUserMarker}
          removeAllMarkers={removeAllMarkers}
          onClose={toggleFeaturePanel}
          mapStyle={mapStyle}
          setMapStyle={setMapStyle}
          mapStyles={MAPBOX_STYLES}
          terrainExaggeration={terrainExaggeration}
          setTerrainExaggeration={setTerrainExaggeration}
        />
      )}

      {/* Weather Widget */}
      {showWeatherWidget && weatherData && (
        <WeatherWidget weatherData={weatherData} closeWeatherWidget={closeWeatherWidget} />
      )}

      {/* Mapbox Map */}
      <Map
        ref={mapRef}
        mapStyle={mapStyle} // Use the selected map style
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
        terrain={{ source: 'mapbox-dem', exaggeration: terrainExaggeration }} // Dynamic terrain exaggeration
        fog={{
          range: [1, 10],
          color: isDarkTheme ? '#000' : '#242B4B',
          'horizon-blend': 0.2,
        }}
        attributionControl={false}
      >
        {/* Add the mapbox-dem source */}
        <Source
          id="mapbox-dem"
          type="raster-dem"
          url="mapbox://mapbox.mapbox-terrain-dem-v1"
          tileSize={512}
          maxzoom={14}
        />

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
            <MarkerPopup
              marker={selectedEarthquake}
              onClose={() => setSelectedEarthquake(null)}
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
