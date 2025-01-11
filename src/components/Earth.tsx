import { useCallback, useRef, forwardRef, useState, useImperativeHandle } from 'react';
import Map, { MapRef, Layer, Source, Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_STYLE = 'mapbox://styles/mapbox/streets-v11'; // Default map style

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

const Earth = forwardRef<EarthRef, EarthProps>(
  ({ onCaptureView, weatherData }, ref) => {
    const mapRef = useRef<MapRef>(null); // Reference to the Mapbox map
    const [clickedLocation, setClickedLocation] = useState<{ lng: number; lat: number } | null>(null); // Store clicked location
    const [showWeatherWidget, setShowWeatherWidget] = useState(true); // Control visibility of weather widget

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

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* Mapbox Map */}
        <Map
          ref={mapRef}
          mapStyle={MAPBOX_STYLE}
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
            color: '#242B4B',
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
              minZoom={15}
              paint={{
                'fill-extrusion-color': '#ddd', // Building color
                'fill-extrusion-height': ['get', 'height'], // Use building height
                'fill-extrusion-base': ['get', 'min_height'], // Base height
                'fill-extrusion-opacity': 0.6, // Slightly transparent
              }}
            />
          </Source>

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
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              backgroundColor: 'white',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              zIndex: 1,
            }}
          >
            <button
              onClick={handleClose}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'none',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              &times;
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
