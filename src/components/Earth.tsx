import { useCallback, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import Map, { MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Using Mapbox's satellite imagery
const MAPBOX_STYLE = 'mapbox://styles/htetnay/cm52c39vv00bz01sa0qzx4ro7';

const Earth = forwardRef(
  (
    { onCaptureView, weatherData }: { onCaptureView: () => void; weatherData: any },
    ref
  ) => {
    const mapRef = useRef<MapRef>(null);
    const [clickedLocation, setClickedLocation] = useState<{ lng: number; lat: number } | null>(null);
    const [showWeatherWidget, setShowWeatherWidget] = useState(true); // State to control widget visibility

    // Handle click on the map
    const handleClick = useCallback((event: any) => {
      const { lngLat } = event;
      setClickedLocation(lngLat); // Store the clicked location
      setShowWeatherWidget(true); // Show the weather widget
      onCaptureView(); // Trigger the capture view function
    }, [onCaptureView]);

    // Handle search for a location
    const handleSearch = useCallback((lng: number, lat: number) => {
      mapRef.current?.flyTo({
        center: [lng, lat],
        zoom: 5,
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
          terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
          fog={{
            range: [1, 10],
            color: '#242B4B',
            'horizon-blend': 0.2,
          }}
          attributionControl={false}
        />

        {/* Weather Widget */}
        {clickedLocation && showWeatherWidget && (
          <div className="weather-widget">
            <button className="close-button" onClick={handleClose}>
              &times; {/* Close icon (×) */}
            </button>
            <h3>Weather at ({clickedLocation.lat.toFixed(2)}, {clickedLocation.lng.toFixed(2)})</h3>
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
