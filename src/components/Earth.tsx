import React, { useState, useRef, useCallback, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
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
import { getDistance } from 'geolib';

type Cluster = Feature<Point, { cluster?: boolean; point_count?: number; id?: string; mag?: number; cluster_id?: number }>;

type Hotspot = {
  id: string;
  name: string;
  description: string;
  coordinates: [number, number];
  iframeUrl: string;
};

type MagicalCreature = {
  id: string;
  name: string;
  type: 'dragon' | 'unicorn' | 'phoenix' | 'griffin';
  image: string;
  description: string;
  coordinates: [number, number];
  iframeUrl: string;
  minigameUrl: string;
};

const hotspots: Hotspot[] = [
  {
    id: '1',
    name: 'Central Park',
    description: 'A large public park in New York City.',
    coordinates: [-73.9654, 40.7829],
    iframeUrl: 'https://captures-three.vercel.app/',
  },
  {
    id: '2',
    name: 'Eiffel Tower',
    description: 'A famous landmark in Paris, France.',
    coordinates: [2.2945, 48.8584],
    iframeUrl: 'https://captures-three.vercel.app/',
  },
  {
    id: '3',
    name: 'Arosa Hörnli - Switzerland',
    description: 'A famous Arosa Hörnli in Switzerland.',
    coordinates: [9.714189134324783, 46.52136798216034],
    iframeUrl: 'https://captures-three.vercel.app/swis.html',
  },
];

const debouncedClick = debounce(async (event: MapLayerMouseEvent, callback: () => void) => {
  callback();
}, 300);

const Earth = forwardRef<EarthRef, EarthProps>(({ onCaptureView, showWeatherWidget, setShowWeatherWidget }, ref) => {
  const mapRef = useRef<MapRef>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clickedLocation, setClickedLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<Earthquake | UserMarker | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [selectedCreature, setSelectedCreature] = useState<MagicalCreature | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showFeaturePanel, setShowFeaturePanel] = useState(false);
  const [showDisasterAlerts, setShowDisasterAlerts] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isCaptureEnabled, setIsCaptureEnabled] = useState(true);
  const [mapStyle, setMapStyle] = useState<string>(MAPBOX_STYLES[0].value);
  const [terrainExaggeration, setTerrainExaggeration] = useState<number>(1.5);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [hotspotClusters, setHotspotClusters] = useState<Cluster[]>([]);
  const [hoveredFeature, setHoveredFeature] = useState<Feature | null>(null);
  const [userLocation, setUserLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isLocationPermissionGranted, setIsLocationPermissionGranted] = useState(false);
  const [creatures, setCreatures] = useState<MagicalCreature[]>([]);
  const [nearbyCreatures, setNearbyCreatures] = useState<MagicalCreature[]>([]);

  // Layer visibility states
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [showSatellite, setShowSatellite] = useState(false);
  const [show3DTerrain, setShow3DTerrain] = useState(false);
  const [showChoropleth, setShowChoropleth] = useState(false);
  const [show3DBuildings, setShow3DBuildings] = useState(false);
  const [showContour, setShowContour] = useState(false);
  const [showPointsOfInterest, setShowPointsOfInterest] = useState(false);
  const [showTransit, setShowTransit] = useState(false);
  const [showWeather, setShowWeather] = useState(false);

  // Weather layer stateS
  const [selectedWeatherLayer, setSelectedWeatherLayer] = useState<string | null>(null);
  const [showWeatherTabs, setShowWeatherTabs] = useState(false);

  // OpenWeatherMap tile URL
  const OPENWEATHERMAP_API_KEY = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;
  const OPENWEATHERMAP_TILES = `https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png?appid=${OPENWEATHERMAP_API_KEY}`;

  // Weather layers with icons
  const WEATHER_LAYERS = [
    { id: 'clouds_new', label: 'Clouds', icon: '☁️' },
    { id: 'precipitation_new', label: 'Rain', icon: '🌧️' },
    { id: 'temp_new', label: 'Temp', icon: '🌡️' },
    { id: 'wind_new', label: 'Wind', icon: '💨' },
    { id: 'pressure_new', label: 'Pressure', icon: '📊' },
    { id: 'humidity_new', label: 'Humidity', icon: '💧' },
    { id: 'snow_new', label: 'Snow', icon: '❄️' },
    { id: 'pressure_cntr_new', label: 'Sea Pressure', icon: '🌊' },
    { id: 'visibility_new', label: 'Visibility', icon: '👁️' },
  ];

  // Custom hooks
  const { earthquakes } = useEarthquakes(showDisasterAlerts);
  const { weatherData, fetchWeatherData } = useWeatherData();
  const { userMarkers, addUserMarker, removeAllMarkers, deleteUserMarker, updateMarkerNote } = useUserMarkers();

  // Initialize supercluster for earthquakes
  const supercluster = useMemo(() => {
    return new Supercluster({
      radius: 40,
      maxZoom: 16,
    });
  }, []);

  // Initialize supercluster for hotspots
  const hotspotSupercluster = useMemo(() => {
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

      const bounds = mapRef.current?.getBounds();
      const zoom = mapRef.current?.getZoom();

      if (bounds && zoom) {
        setClusters(supercluster.getClusters([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()], Math.floor(zoom)));
      }
    }
  }, [earthquakes, supercluster, mapRef]);

  // Load hotspot data into supercluster
  useEffect(() => {
    if (hotspots.length > 0) {
      const points = hotspots.map((hotspot) => ({
        type: "Feature" as const,
        properties: { id: hotspot.id },
        geometry: {
          type: "Point" as const,
          coordinates: [hotspot.coordinates[0], hotspot.coordinates[1]],
        },
      }));
      hotspotSupercluster.load(points);

      const bounds = mapRef.current?.getBounds();
      const zoom = mapRef.current?.getZoom();

      if (bounds && zoom) {
        setHotspotClusters(hotspotSupercluster.getClusters([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()], Math.floor(zoom)));
      }
    }
  }, [hotspots, hotspotSupercluster, mapRef]);

  // Handle map move and zoom events
  const handleMapMove = useCallback(() => {
    const bounds = mapRef.current?.getBounds();
    const zoom = mapRef.current?.getZoom();

    if (bounds && zoom) {
      setClusters(supercluster.getClusters([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()], Math.floor(zoom)));
      setHotspotClusters(hotspotSupercluster.getClusters([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()], Math.floor(zoom)));
    }

    // Recalculate nearby creatures when the map moves
    if (userLocation) {
      const nearby = creatures.filter((creature) =>
        isUserNearCreature(userLocation, creature.coordinates)
      );
      setNearbyCreatures(nearby);
    }
  }, [supercluster, hotspotSupercluster, mapRef, userLocation, creatures]);

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
    getMap: () => mapRef.current,
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

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setUserLocation({ lng: longitude, lat: latitude });
          setIsLoadingLocation(false);
          setIsLocationPermissionGranted(true);
        },
        (error) => {
          console.error('Error getting user location:', error);
          setIsLoadingLocation(false);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      setIsLoadingLocation(false);
    }
  }, []);

  // Spawn magical creatures
  useEffect(() => {
    if (userLocation) {
      const spawnCreatures = () => {
        const creatures: MagicalCreature[] = [];

        // Spawn creatures within 2 miles of the user
        for (let i = 0; i < 5; i++) {
          const randomCoordinates = getRandomCoordinates(userLocation, 2); // 2 miles
          const creatureTypes: ('dragon' | 'unicorn' | 'phoenix' | 'griffin')[] = ['dragon', 'unicorn', 'phoenix', 'griffin'];
          const randomType = creatureTypes[i % 4]; // Ensure valid type

          creatures.push({
            id: `creature-${i}`,
            name: `Creature ${i + 1}`,
            type: randomType, // Valid type
            image: `https://example.com/creature-${i}.jpg`,
            description: `A magical ${randomType}`,
            coordinates: randomCoordinates,
            iframeUrl: 'https://captures-three.vercel.app/',
            minigameUrl: 'https://example.com/minigame',
          });
        }

        // Ensure one creature is ~10 km away
        const farCoordinates = getRandomCoordinates(userLocation, 10); // 10 km
        creatures.push({
          id: 'creature-far',
          name: 'Rare Creature',
          type: 'phoenix', // Valid type
          image: 'https://example.com/rare-creature.jpg',
          description: 'A rare phoenix!',
          coordinates: farCoordinates,
          iframeUrl: 'https://captures-three.vercel.app/',
          minigameUrl: 'https://example.com/minigame',
        });

        setCreatures(creatures);
      };

      spawnCreatures();
    }
  }, [userLocation]);

  // Check if user is near a creature
  const isUserNearCreature = (userLocation: { lng: number; lat: number }, creatureCoordinates: [number, number]) => {
    const distance = getDistance(
      { latitude: userLocation.lat, longitude: userLocation.lng },
      { latitude: creatureCoordinates[1], longitude: creatureCoordinates[0] }
    );
    return distance <= 1000; // 1000 meters = 1 km
  };

  // Update nearby creatures based on user location
  useEffect(() => {
    if (userLocation) {
      const nearby = creatures.filter((creature) =>
        isUserNearCreature(userLocation, creature.coordinates)
      );
      setNearbyCreatures(nearby);
    }
  }, [userLocation, creatures]);

  // Render clusters
  const renderClusters = useMemo(() => {
    return clusters.map((cluster) => {
      const [longitude, latitude] = cluster.geometry.coordinates;

      const handleClusterClick = () => {
        if (cluster.properties.cluster) {
          const bbox = supercluster.getClusterExpansionZoom(cluster.properties.cluster_id!);
          mapRef.current?.flyTo({
            center: [longitude, latitude],
            zoom: bbox,
            duration: 1000,
          });
        } else {
          const earthquake: Earthquake = {
            id: cluster.properties.id || 'default-id',
            geometry: {
              coordinates: [longitude, latitude, 0],
            },
            properties: {
              title: `Earthquake - ${cluster.properties.id}`,
              mag: cluster.properties.mag || 0,
              place: 'Unknown',
            },
          };
          setSelectedFeature(earthquake);
        }
      };

      if (cluster.properties.cluster) {
        return (
          <Marker
            key={`cluster-${cluster.properties.cluster_id}`}
            longitude={longitude}
            latitude={latitude}
            onClick={handleClusterClick}
          >
            <div className="cluster-marker">
              {cluster.properties.point_count}
            </div>
          </Marker>
        );
      } else {
        return (
          <Marker
            key={`earthquake-${cluster.properties.id}`}
            longitude={longitude}
            latitude={latitude}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              const earthquake: Earthquake = {
                id: cluster.properties.id || 'default-id',
                geometry: {
                  coordinates: [longitude, latitude, 0],
                },
                properties: {
                  title: `Earthquake - ${cluster.properties.id}`,
                  mag: cluster.properties.mag || 0,
                  place: 'Unknown',
                },
              };
              setSelectedFeature(earthquake);
            }}
          >
            <div className="earthquake-marker">
              {cluster.properties.mag}
            </div>
          </Marker>
        );
      }
    });
  }, [clusters, supercluster, mapRef]);

  // Render hotspot clusters
  const renderHotspotClusters = useMemo(() => {
    return hotspotClusters.map((cluster) => {
      const [longitude, latitude] = cluster.geometry.coordinates;

      const handleClusterClick = () => {
        if (cluster.properties.cluster) {
          const bbox = hotspotSupercluster.getClusterExpansionZoom(cluster.properties.cluster_id!);
          mapRef.current?.flyTo({
            center: [longitude, latitude],
            zoom: bbox,
            duration: 1000,
          });
        } else {
          const hotspot: Hotspot = {
            id: cluster.properties.id || 'default-id',
            name: `Hotspot - ${cluster.properties.id}`,
            description: 'A popular hotspot',
            coordinates: [longitude, latitude],
            iframeUrl: 'https://captures-three.vercel.app/',
          };
          setSelectedHotspot(hotspot);
        }
      };

      if (cluster.properties.cluster) {
        return (
          <Marker
            key={`hotspot-cluster-${cluster.properties.cluster_id}`}
            longitude={longitude}
            latitude={latitude}
            onClick={handleClusterClick}
          >
            <div className="hotspot-cluster-marker" style={{ backgroundColor: 'orange', color: 'white', borderRadius: '50%', padding: '10px', fontSize: '14px' }}>
              {cluster.properties.point_count}
            </div>
          </Marker>
        );
      } else {
        return (
          <Marker
            key={`hotspot-${cluster.properties.id}`}
            longitude={longitude}
            latitude={latitude}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              const hotspot: Hotspot = {
                id: cluster.properties.id || 'default-id',
                name: `Hotspot - ${cluster.properties.id}`,
                description: 'A popular hotspot',
                coordinates: [longitude, latitude],
                iframeUrl: 'https://captures-three.vercel.app/',
              };
              setSelectedHotspot(hotspot);
            }}
          >
            <div className="hotspot-marker" style={{ backgroundColor: 'orange', color: 'white', borderRadius: '50%', padding: '10px', fontSize: '14px' }}>
              🔥
            </div>
          </Marker>
        );
      }
    });
  }, [hotspotClusters, hotspotSupercluster, mapRef]);

  // Type guard to check if a marker is a UserMarker
  const isUserMarker = (marker: Earthquake | UserMarker): marker is UserMarker => {
    return 'label' in marker && 'id' in marker;
  };

  // Helper function to generate random coordinates
  const getRandomCoordinates = (center: { lng: number; lat: number }, radiusInMiles: number): [number, number] => {
    const radiusInDegrees = radiusInMiles / 69; // Approx conversion
    const randomAngle = Math.random() * 2 * Math.PI;
    const randomRadius = Math.random() * radiusInDegrees;

    const lng = center.lng + randomRadius * Math.cos(randomAngle);
    const lat = center.lat + randomRadius * Math.sin(randomAngle);

    return [lng, lat];
  };

  const toggleFullscreen = useCallback(() => {
    if (mapContainerRef.current) {
      if (!isFullscreen) {
        // Enter fullscreen
        if (mapContainerRef.current.requestFullscreen) {
          mapContainerRef.current.requestFullscreen();
        } else if ((mapContainerRef.current as any).mozRequestFullScreen) { // Firefox
          (mapContainerRef.current as any).mozRequestFullScreen();
        } else if ((mapContainerRef.current as any).webkitRequestFullscreen) { // Chrome, Safari, Opera
          (mapContainerRef.current as any).webkitRequestFullscreen();
        } else if ((mapContainerRef.current as any).msRequestFullscreen) { // IE/Edge
          (mapContainerRef.current as any).msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).mozCancelFullScreen) { // Firefox
          (document as any).mozCancelFullScreen();
        } else if ((document as any).webkitExitFullscreen) { // Chrome, Safari, Opera
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) { // IE/Edge
          (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    }
  }, [isFullscreen]);

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // Safari
    document.addEventListener('mozfullscreenchange', handleFullscreenChange); // Firefox
    document.addEventListener('msfullscreenchange', handleFullscreenChange); // IE/Edge

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div ref={mapContainerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Fullscreen Button with Tooltip */}
      <button
        className="fullscreen-button"
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      >
        <span className="tooltip">
          {isFullscreen ? '❎' : '⬜'}
          <span className="tooltiptext">
            {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          </span>
        </span>
      </button>

      {/* Center on User Button */}
      <button
        className="center-user-button"
        onClick={() => {
          if (userLocation) {
            mapRef.current?.flyTo({
              center: [userLocation.lng, userLocation.lat],
              zoom: 14,
              duration: 2000,
            });
          }
        }}
        disabled={!userLocation}
      >
        🎯
      </button>

      {/* Loading Spinner */}
      {isLoadingLocation && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Fetching your location...</p>
        </div>
      )}

      {/* Permission Denied Message */}
      {!isLocationPermissionGranted && (
        <div className="permission-denied-message">
          <p>Location access is required to use this feature. Please enable it in your browser settings.</p>
        </div>
      )}

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

      {/* Weather Tabs */}
      <button
        className="call-tab-button"
        onClick={() => setShowWeatherTabs(!showWeatherTabs)}
      >
        {showWeatherTabs ? '✖' : '🌦️'}
      </button>

      <div className={`weather-tabs-container ${showWeatherTabs ? 'visible' : ''}`}>
        <div className="weather-tabs">
          {WEATHER_LAYERS.map((layer) => (
            <button
              key={layer.id}
              className={`weather-tab ${selectedWeatherLayer === layer.id ? 'active' : ''}`}
              onClick={() => setSelectedWeatherLayer(layer.id)}
            >
              <span className="weather-icon">{layer.icon}</span>
              <span className="weather-label">{layer.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Map Component */}
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
        onMove={handleMapMove}
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
        {/* User Location Marker */}
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
            <div className="user-location-marker">
              <img src="/user-icon.png" alt="Your Location" width={30} height={30} />
            </div>
          </Marker>
        )}

        {/* Magical Creatures */}
{creatures.map((creature) => (
  <Marker
    key={creature.id}
    longitude={creature.coordinates[0]}
    latitude={creature.coordinates[1]}
    onClick={(e) => {
      e.originalEvent.stopPropagation();
      setSelectedCreature(creature);
      setIframeLoaded(false);
    }}
  >
    <div className="creature-marker">
      <img src="https://i.ibb.co/tpjsgYY3/ered-1-removebg-preview.png " alt="Custom Icon" style={{ width: '24px', height: '24px' }} />
    </div>
  </Marker>
))}

        {/* Popup for Selected Creature */}
        {selectedCreature && (
          <Popup
            longitude={selectedCreature.coordinates[0]}
            latitude={selectedCreature.coordinates[1]}
            onClose={() => setSelectedCreature(null)}
            closeButton={false}
            anchor="bottom"
            maxWidth="400px"
            className="creature-popup-container"
          >
            <div className="creature-popup">
              <h3>{selectedCreature.name}</h3>
              <p>{selectedCreature.description}</p>
              <div className="iframe-container">
                {!iframeLoaded && (
                  <div className="iframe-loading">
                    <div className="spinner"></div>
                    <p>Loading...</p>
                  </div>
                )}
                <iframe
                  src={selectedCreature.iframeUrl}
                  width="100%"
                  height="300px"
                  style={{ border: 'none', borderRadius: '8px', display: iframeLoaded ? 'block' : 'none' }}
                  title={selectedCreature.name}
                  allowFullScreen
                  onLoad={() => setIframeLoaded(true)}
                />
              </div>
              <div className="creature-popup-buttons">
                <button
                  onClick={() => setSelectedCreature(null)}
                  className="close-button"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const iframe = document.querySelector('.iframe-container iframe');
                    if (iframe && iframe.requestFullscreen) {
                      iframe.requestFullscreen();
                    }
                  }}
                  className="fullscreen-button"
                >
                  Fullscreen
                </button>
                <button
                  onClick={() => {
                    mapRef.current?.flyTo({
                      center: selectedCreature.coordinates,
                      zoom: 14,
                      duration: 2000,
                    });
                  }}
                  className="zoom-button"
                >
                  Zoom to Location
                </button>
                {/* Play Game Button */}
                <button
                  onClick={() => window.open(selectedCreature.minigameUrl, '_blank')}
                  className="play-game-button"
                  disabled={!nearbyCreatures.some((creature) => creature.id === selectedCreature.id)}
                  title={
                    nearbyCreatures.some((creature) => creature.id === selectedCreature.id)
                      ? "Play the mini-game!"
                      : "You must be within 1 km of the creature to play the game."
                  }
                >
                  🎮 Play Game
                </button>
              </div>
            </div>
          </Popup>
        )}

        {/* Earthquake Markers (Clustered) */}
        {renderClusters}

        {/* Hotspot Markers (Clustered) */}
        {renderHotspotClusters}

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
            className="hotspot-popup-container"
          >
            <div className="hotspot-popup">
              <h3>{selectedHotspot.name}</h3>
              <p>{selectedHotspot.description}</p>
              <div className="iframe-container">
                {!iframeLoaded && (
                  <div className="iframe-loading">
                    <div className="spinner"></div>
                    <p>Loading...</p>
                  </div>
                )}
                <iframe
                  src={selectedHotspot.iframeUrl}
                  width="100%"
                  height="300px"
                  style={{ border: 'none', borderRadius: '8px', display: iframeLoaded ? 'block' : 'none' }}
                  title={selectedHotspot.name}
                  allowFullScreen
                  onLoad={() => setIframeLoaded(true)}
                />
              </div>
              <div className="hotspot-popup-buttons">
                <button
                  onClick={() => setSelectedHotspot(null)}
                  className="close-button"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const iframe = document.querySelector('.iframe-container iframe');
                    if (iframe && iframe.requestFullscreen) {
                      iframe.requestFullscreen();
                    }
                  }}
                  className="fullscreen-button"
                >
                  Fullscreen
                </button>
                <button
                  onClick={() => {
                    mapRef.current?.flyTo({
                      center: selectedHotspot.coordinates,
                      zoom: 14,
                      duration: 2000,
                    });
                  }}
                  className="zoom-button"
                >
                  Zoom to Location
                </button>
              </div>
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

        {/* OpenWeatherMap Weather Layer */}
        {showWeather && selectedWeatherLayer && OPENWEATHERMAP_API_KEY && (
          <Source
            id="openweathermap-layer"
            type="raster"
            tiles={[OPENWEATHERMAP_TILES.replace('{layer}', selectedWeatherLayer)]}
            tileSize={256}
          >
            <Layer
              id="openweathermap-layer-render"
              type="raster"
              source="openweathermap-layer"
              paint={{
                'raster-opacity': 0.7,
              }}
            />
          </Source>
        )}
      </Map>
    </div>
  );
});

export default Earth;
