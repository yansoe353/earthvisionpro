import { useCallback, useRef, forwardRef, useState, useEffect, useImperativeHandle } from 'react';
import Map, { MapRef } from 'react-map-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

const MAPBOX_STYLE = 'mapbox://styles/htetnay/cm52c39vv00bz01sa0qzx4ro7';

interface EarthProps {
  onCaptureView: () => void;
  weatherData: any;
  isMeasurementMode: boolean; // Measurement mode prop
  isAIAnalysisMode: boolean;
  onAIAnalysis: (location: { lng: number; lat: number }) => void;
}

interface EarthRef {
  handleSearch: (lng: number, lat: number) => void;
}

const Earth = forwardRef<EarthRef, EarthProps>(
  (
    { onCaptureView, weatherData, isMeasurementMode, isAIAnalysisMode, onAIAnalysis },
    ref
  ) => {
    const mapRef = useRef<MapRef>(null);
    const drawRef = useRef<MapboxDraw | null>(null);
    const [clickedLocation, setClickedLocation] = useState<{ lng: number; lat: number } | null>(null);
    const [showWeatherWidget, setShowWeatherWidget] = useState(true);
    const [measurement, setMeasurement] = useState<string>('');

    // Initialize the drawing tool
    useEffect(() => {
      if (!mapRef.current) return;

      // Initialize Mapbox Draw
      drawRef.current = new MapboxDraw({
        displayControlsDefault: false, // Hide default controls
        controls: {
          polygon: true, // Enable polygon drawing
          line_string: true, // Enable line drawing
          trash: true, // Enable delete tool
        },
      });

      // Add the drawing tool to the map
      mapRef.current.getMap().addControl(drawRef.current);

      // Handle drawing events
      mapRef.current.getMap().on('draw.create', updateMeasurement);
      mapRef.current.getMap().on('draw.update', updateMeasurement);
      mapRef.current.getMap().on('draw.delete', () => setMeasurement(''));

      // Cleanup on unmount
      return () => {
        if (drawRef.current) {
          mapRef.current?.getMap().removeControl(drawRef.current);
        }
      };
    }, []);

    // Toggle measurement mode
    useEffect(() => {
      if (!mapRef.current || !drawRef.current) return;

      if (isMeasurementMode) {
        // Show drawing controls
        drawRef.current.changeMode('draw_line_string'); // Default to line drawing
      } else {
        // Clear drawings and hide controls
        drawRef.current.deleteAll();
        setMeasurement('');
      }
    }, [isMeasurementMode]);

    // Update measurement when a shape is drawn or updated
    const updateMeasurement = useCallback(() => {
      if (!drawRef.current || !mapRef.current) return;

      const data = drawRef.current.getAll();
      if (data.features.length > 0) {
        const feature = data.features[0];
        if (feature.geometry.type === 'LineString') {
          // Calculate distance for lines
          const length = turf.length(feature);
          setMeasurement(`Distance: ${(length * 1000).toFixed(2)} meters`);
        } else if (feature.geometry.type === 'Polygon') {
          // Calculate area for polygons
          const area = turf.area(feature);
          setMeasurement(`Area: ${(area / 1000000).toFixed(2)} km²`);
        }
      } else {
        setMeasurement('');
      }
    }, []);

    // Handle click on the map
    const handleClick = useCallback(
      (event: any) => {
        const { lngLat } = event;
        setClickedLocation(lngLat); // Store the clicked location
        setShowWeatherWidget(true); // Show the weather widget
        onCaptureView(); // Trigger the capture view function

        // Trigger AI analysis if in AI analysis mode
        if (isAIAnalysisMode) {
          onAIAnalysis(lngLat);
        }
      },
      [onCaptureView, isAIAnalysisMode, onAIAnalysis]
    );

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

        {/* Measurement Display */}
        {isMeasurementMode && measurement && (
          <div className="measurement-widget">
            <p>{measurement}</p>
          </div>
        )}
      </div>
    );
  }
);

export default Earth;
