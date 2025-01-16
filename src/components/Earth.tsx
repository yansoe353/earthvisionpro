import React, { useCallback, useRef, forwardRef, useState, useMemo, useEffect, useImperativeHandle } from 'react';
import Map, { MapRef, Marker, Popup, MapLayerMouseEvent, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Earth.css';
import FeaturePanel from './FeaturePanel';
import WeatherWidget from './WeatherWidget';
import MarkerPopup from './MarkerPopup';
import MapControls from './MapControls';
import { Earthquake, UserMarker, WeatherData, EarthProps, EarthRef, MapboxStyle } from '../types';
import useEarthquakes from '../hooks/useEarthquakes';
import useWeatherData from '../hooks/useWeatherData';
import useUserMarkers from '../hooks/useUserMarkers';
import { MAPBOX_STYLES } from '../constants/mapboxStyles';
import Supercluster from 'supercluster';
import { debounce } from 'lodash';
import { Feature, Point } from 'geojson';

type Cluster = Feature<Point, { cluster?: boolean; point_count?: number; id?: string; mag?: number }>;

// Hotspot type
type Hotspot = {
  id: string;
  name: string;
  description: string;
  coordinates: [number, number]; // [lng, lat]
  iframeUrl: string; // URL of the embedded page
};

// Example hotspots
const hotspots: Hotspot[] = [
  {
    id: '1',
    name: 'Central Park',
    description: 'A large public park in New York City.',
    coordinates: [-73.9654, 40.7829],
    iframeUrl: 'https://earthvision.world/captures/helloworld', // Example URL
  },
  {
    id: '2',
    name: 'Eiffel Tower',
    description: 'A famous landmark in Paris, France.',
    coordinates: [2.2945, 48.8584],
    iframeUrl: 'https://earthvision.world/captures/helloworld', // Example URL
  },
  // Add more hotspots here
];

// Debounce function for map clicks
const debouncedClick = debounce(async (event: MapLayerMouseEvent, callback: () => void) => {
  callback();
}, 300);

const Earth = forwardRef<EarthRef, EarthProps>(({ onCaptureView, showWeatherWidget, setShowWeatherWidget }, ref) => {
  const mapRef = useRef<MapRef>(null);
  const [clickedLocation, setClickedLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<Earthquake | UserMarker | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null); // State for selected hotspot
  const [showFeaturePanel, setShowFeaturePanel] = useState(false);
  const [showDisasterAlerts, setShowDisasterAlerts] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isCaptureEnabled, setIsCaptureEnabled] = useState(true);
  const [mapStyle, setMapStyle] = useState<string>(MAPBOX_STYLES[0].value);
  const [terrainExaggeration, setTerrainExaggeration] = useState<number>(1.5);
  const [clusters, setClusters] = useState<Cluster[]>([]);

  // Layer visibility states
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [showSatellite, setShowSatellite] = useState(false);
  const [show3DTerrain, setShow3DTerrain] = useState(false);
  const [showChoropleth, setShowChoropleth] = useState(false);
  const [show3DBuildings, setShow3DBuildings] = useState(false);
  const [showContour, setShowContour] = useState(false);
  const [showPointsOfInterest, setShowPointsOfInterest] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showTransit, setShowTransit] = useState(false);

  // Custom hooks
  const { earthquakes } = useEarthquakes(showDisasterAlerts);
  const { weatherData, fetchWeatherData } = useWeatherData();
  const { userMarkers, addUserMarker, removeAllMarkers, deleteUserMarker, updateMarkerNote } = useUserMarkers();

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

  // Expose handleSearch and getMap to the parent component
  useImperativeHandle(ref, () => ({
    handleSearch,
    getMap: () => mapRef.current, // Expose the Mapbox map instance
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

  // Type guard to check if a marker is a UserMarker
  const isUserMarker = (marker: Earthquake | UserMarker): marker is UserMarker => {
    return 'label' in marker && 'id' in marker;
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Map Controls */}
      <MapControls
        toggleFeaturePanel={toggleFeaturePanel}
        isDarkTheme={isDarkTheme}
        showHeatmap={showHeatmap}
        setShowHeatmap={setShowHeatmap}
        showTraffic={showTraffic}
        setShowTraffic={setShowTraffic}
        showSatellite={showSatellite}
        setShowSatellite={setShowSatellite}
        show3DTerrain={show3DTerrain}
        setShow3DTerrain={setShow3DTerrain}
        showChoropleth={showChoropleth}
        setShowChoropleth={setShowChoropleth}
        show3DBuildings={show3DBuildings}
        setShow3DBuildings={setShow3DBuildings}
        showContour={showContour}
        setShowContour={setShowContour}
        showPointsOfInterest={showPointsOfInterest}
        setShowPointsOfInterest={setShowPointsOfInterest}
        showWeather={showWeather}
        setShowWeather={setShowWeather}
        showTransit={showTransit}
        setShowTransit={setShowTransit}
      />

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

        {/* Hotspots */}
        {hotspots.map((hotspot) => (
          <Marker
            key={hotspot.id}
            longitude={hotspot.coordinates[0]}
            latitude={hotspot.coordinates[1]}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedHotspot(hotspot);
            }}
          >
            <div className="hotspot-marker">
              🔥
            </div>
          </Marker>
        ))}

        {/* Popup for Selected Feature */}
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
              onDelete={isUserMarker(selectedFeature) ? deleteUserMarker : undefined}
              onUpdateNote={isUserMarker(selectedFeature) ? updateMarkerNote : undefined}
            />
          </Popup>
        )}

        {/* Popup for Selected Hotspot */}
        {selectedHotspot && (
          <Popup
            longitude={selectedHotspot.coordinates[0]}
            latitude={selectedHotspot.coordinates[1]}
            onClose={() => setSelectedHotspot(null)}
            closeButton={false}
            anchor="bottom"
            maxWidth="400px"
          >
            <div className="hotspot-popup">
              <h3>{selectedHotspot.name}</h3>
              <p>{selectedHotspot.description}</p>
              <iframe
                src={selectedHotspot.iframeUrl}
                width="100%"
                height="300px"
                style={{ border: 'none', borderRadius: '8px' }}
                title={selectedHotspot.name}
              />
              <button
                onClick={() => setSelectedHotspot(null)}
                style={{ marginTop: '10px' }}
              >
                Close
              </button>
            </div>
          </Popup>
        )}

        {/* Heatmap Layer */}
        {showHeatmap && (
          <Source
            id="earthquake-data"
            type="geojson"
            data={{
              type: 'FeatureCollection',
              features: earthquakes.map((eq) => ({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [eq.geometry.coordinates[0], eq.geometry.coordinates[1]],
                },
                properties: {
                  mag: eq.properties.mag,
                },
              })),
            }}
          >
            <Layer
              id="earthquake-heatmap"
              type="heatmap"
              paint={{
                'heatmap-weight': ['interpolate', ['linear'], ['get', 'mag'], 0, 0, 6, 1],
                'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
                'heatmap-color': [
                  'interpolate',
                  ['linear'],
                  ['heatmap-density'],
                  0,
                  'rgba(33, 102, 172, 0)',
                  0.2,
                  'rgb(103, 169, 207)',
                  0.4,
                  'rgb(209, 229, 240)',
                  0.6,
                  'rgb(253, 219, 199)',
                  0.8,
                  'rgb(239, 138, 98)',
                  1,
                  'rgb(178, 24, 43)',
                ],
                'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
                'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0],
              }}
            />
          </Source>
        )}

        {/* Traffic Layer */}
        {showTraffic && (
          <Source
            id="traffic"
            type="vector"
            url="mapbox://mapbox.mapbox-traffic-v1"
          >
            <Layer
              id="traffic-layer"
              type="line"
              source="traffic"
              source-layer="traffic"
              paint={{
                'line-color': [
                  'match',
                  ['get', 'class'],
                  'motorway',
                  '#ff0000',
                  'trunk',
                  '#ff7f00',
                  'primary',
                  '#ffff00',
                  'secondary',
                  '#00ff00',
                  '#0000ff',
                ],
                'line-width': 2,
              }}
            />
          </Source>
        )}

        {/* Satellite Layer */}
        {showSatellite && (
          <Source
            id="satellite"
            type="raster"
            url="mapbox://mapbox.satellite"
            tileSize={512}
          >
            <Layer
              id="satellite-layer"
              type="raster"
              source="satellite"
              paint={{
                'raster-opacity': 0.8,
              }}
            />
          </Source>
        )}

        {/* 3D Terrain Layer */}
        {show3DTerrain && (
          <Layer
            id="terrain-layer"
            type="hillshade"
            source="mapbox-dem"
            paint={{
              'hillshade-exaggeration': 0.5,
              'hillshade-shadow-color': '#000',
              'hillshade-highlight-color': '#fff',
              'hillshade-illumination-direction': 315,
            }}
          />
        )}

        {/* Choropleth Layer */}
        {showChoropleth && (
          <Source
            id="population"
            type="geojson"
            data={{
              type: 'FeatureCollection',
              features: [], // Add your GeoJSON data here
            }}
          >
            <Layer
              id="population-density"
              type="fill"
              paint={{
                'fill-color': [
                  'interpolate',
                  ['linear'],
                  ['get', 'density'],
                  0,
                  '#f7fbff',
                  100,
                  '#c6dbef',
                  500,
                  '#6baed6',
                  1000,
                  '#2171b5',
                  5000,
                  '#08306b',
                ],
                'fill-opacity': 0.7,
              }}
            />
          </Source>
        )}

        {/* 3D Buildings Layer */}
        {show3DBuildings && (
          <Source
            id="buildings"
            type="vector"
            url="mapbox://mapbox.mapbox-streets-v8"
            source-layer="building"
          >
            <Layer
              id="3d-buildings"
              type="fill-extrusion"
              paint={{
                'fill-extrusion-color': '#aaa',
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': ['get', 'min_height'],
                'fill-extrusion-opacity': 0.6,
              }}
            />
          </Source>
        )}

        {/* Contour Layer */}
        {showContour && (
          <Source
            id="contour"
            type="vector"
            url="mapbox://mapbox.mapbox-terrain-v2"
          >
            <Layer
              id="contour-layer"
              type="line"
              source="contour"
              source-layer="contour"
              paint={{
                'line-color': '#000',
                'line-width': 1,
              }}
            />
          </Source>
        )}
      </Map>
    </div>
  );
});

export default Earth;
