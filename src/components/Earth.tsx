import React, { useCallback, useRef, forwardRef, useState, useMemo, useEffect, useImperativeHandle } from 'react';
import Map, { MapRef, Marker, Popup, MapLayerMouseEvent, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Earth.css';
import FeaturePanel from './FeaturePanel';
import WeatherWidget from './WeatherWidget';
import MarkerPopup from './MarkerPopup';
import MapControls from './MapControls';
import { Earthquake, UserMarker, WeatherData, EarthProps, EarthRef, MapboxStyle } from './types';
import useEarthquakes from '../hooks/useEarthquakes';
import useWeatherData from '../hooks/useWeatherData';
import useUserMarkers from '../hooks/useUserMarkers';
import { MAPBOX_STYLES } from '../constants/mapboxStyles';
import Supercluster from 'supercluster';
import { debounce } from 'lodash';
import { Feature, Point } from 'geojson';

type Cluster = Feature<Point, { cluster?: boolean; point_count?: number; id?: string; mag?: number }>;

// Debounce function for map clicks
const debouncedClick = debounce(async (event: MapLayerMouseEvent, callback: () => void) => {
  callback();
}, 300);

const Earth = forwardRef<EarthRef, EarthProps>(({ onCaptureView, showWeatherWidget, setShowWeatherWidget }, ref) => {
  const mapRef = useRef<MapRef>(null);
  const [clickedLocation, setClickedLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<Earthquake | UserMarker | null>(null);
  const [showFeaturePanel, setShowFeaturePanel] = useState(false);
  const [showDisasterAlerts, setShowDisasterAlerts] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isCaptureEnabled, setIsCaptureEnabled] = useState(true);
  const [mapStyle, setMapStyle] = useState<string>(MAPBOX_STYLES[0].value);
  const [terrainExaggeration, setTerrainExaggeration] = useState<number>(1.5);
  const [clusters, setClusters] = useState<Cluster[]>([]);

  // Custom hooks
  const { earthquakes } = useEarthquakes(showDisasterAlerts);
  const { weatherData, fetchWeatherData } = useWeatherData();
  const { userMarkers, addUserMarker, removeAllMarkers, deleteUserMarker } = useUserMarkers();

  // Initialize supercluster
  const supercluster = useMemo(() => {
    return new Supercluster({
      radius: 40,
      maxZoom: 16,
    });
  }, []);

  // Load earthquake data into supercluster
  useEffect(() => {
    if (earthquakes.length > 0) {
      const points = earthquakes.map((eq) => ({
        type: "Feature" as const,
        properties: { id: eq.id, mag: eq.properties.mag },
        geometry: {
          type: "Point" as const,
          coordinates: [eq.geometry.coordinates[0], eq.geometry.coordinates[1]],
        },
      }));
      supercluster.load(points);
      setClusters(supercluster.getClusters([-180, -90, 180, 90], 1));
    }
  }, [earthquakes, supercluster]);

  // Handle click on the map
  const handleClick = useCallback(
    async (event: MapLayerMouseEvent) => {
      const { lngLat } = event;
      setClickedLocation(lngLat);
      if (isCaptureEnabled) {
        onCaptureView();
      }
      await fetchWeatherData(lngLat.lat, lngLat.lng);
      setShowWeatherWidget(true);
    },
    [isCaptureEnabled, onCaptureView, fetchWeatherData, setShowWeatherWidget]
  );

  // Handle search for a location
  const handleSearch = useCallback((lng: number, lat: number) => {
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: 10,
      duration: 2000,
    });
    setClickedLocation({ lng, lat });
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
    setShowWeatherWidget(false);
  }, [setShowWeatherWidget]);

  // Render clusters
  const renderClusters = useMemo(() => {
    return clusters.map((cluster) => {
      const [longitude, latitude] = cluster.geometry.coordinates;
      if (cluster.properties.cluster) {
        return (
          <Marker key={cluster.id} longitude={longitude} latitude={latitude}>
            <div className="cluster-marker">
              {cluster.properties.point_count}
            </div>
          </Marker>
        );
      } else {
        return (
          <Marker key={cluster.properties.id} longitude={longitude} latitude={latitude}>
            <div className="earthquake-marker">
              {cluster.properties.mag}
            </div>
          </Marker>
        );
      }
    });
  }, [clusters]);

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
        mapStyle={mapStyle}
        initialViewState={{
          longitude: 0,
          latitude: 20,
          zoom: 1,
          bearing: 0,
          pitch: 0,
        }}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        onClick={(e) => debouncedClick(e, () => handleClick(e))}
        style={{ width: '100%', height: '100%' }}
        maxZoom={20}
        minZoom={1}
        projection={{ name: 'globe' }}
        terrain={{ source: 'mapbox-dem', exaggeration: terrainExaggeration }}
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

        {/* Earthquake Markers (Clustered) */}
        {renderClusters}

        {/* User-Generated Markers */}
        {userMarkers.map((marker) => (
          <Marker
            key={marker.id}
            longitude={marker.lng}
            latitude={marker.lat}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedFeature(marker);
            }}
          >
            <div className="user-marker">
              <span>{marker.label}</span>
            </div>
          </Marker>
        ))}

        {/* Popup */}
        {selectedFeature && (
          <Popup
            longitude={
              'geometry' in selectedFeature
                ? selectedFeature.geometry.coordinates[0]
                : selectedFeature.lng
            }
            latitude={
              'geometry' in selectedFeature
                ? selectedFeature.geometry.coordinates[1]
                : selectedFeature.lat
            }
            onClose={() => setSelectedFeature(null)}
          >
            <MarkerPopup
              marker={selectedFeature}
              onClose={() => setSelectedFeature(null)}
              onDelete={deleteUserMarker}
            />
          </Popup>
        )}
      </Map>
    </div>
  );
});

export default Earth;
