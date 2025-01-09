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
  isAIAnalysisMode: boolean;
  onAIAnalysis: (location: { lng: number; lat: number }) => void;
}

interface EarthRef {
  handleSearch: (lng: number, lat: number) => void;
}

const Earth = forwardRef<EarthRef, EarthProps>(
  (
    { onCaptureView, weatherData, isAIAnalysisMode, onAIAnalysis },
    ref
  ) => {
    const mapRef = useRef<MapRef>(null);
    const drawRef = useRef<MapboxDraw | null>(null);
    const [clickedLocation, setClickedLocation] = useState<{ lng: number; lat: number } | null>(null);
    const [showWeatherWidget, setShowWeatherWidget] = useState(true);
    const [measurement, setMeasurement] = useState<string>('');

    useEffect(() => {
      if (!mapRef.current || drawRef.current) return;

      const map = mapRef.current.getMap();
      drawRef.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          line_string: true,
          trash: true,
        },
      });

      map.addControl(drawRef.current);
      map.on('draw.create', updateMeasurement);
      map.on('draw.update', updateMeasurement);
      map.on('draw.delete', () => setMeasurement(''));

      return () => {
        if (drawRef.current) {
          map.removeControl(drawRef.current);
        }
      };
    }, []);

    const updateMeasurement = useCallback(() => {
      if (!drawRef.current || !mapRef.current) return;

      const data = drawRef.current.getAll();
      if (data.features.length > 0) {
        const feature = data.features[0];
        if (feature.geometry.type === 'LineString') {
          const length = turf.length(feature);
          setMeasurement(`Distance: ${(length * 1000).toFixed(2)} meters`);
        } else if (feature.geometry.type === 'Polygon') {
          const area = turf.area(feature);
          setMeasurement(`Area: ${(area / 1000000).toFixed(2)} km²`);
        }
      } else {
        setMeasurement('');
      }
    }, []);

    const handleClick = useCallback(
      (event: any) => {
        const { lngLat } = event;
        setClickedLocation(lngLat);
        setShowWeatherWidget(true);
        onCaptureView();

        if (isAIAnalysisMode) {
          onAIAnalysis(lngLat);
        }
      },
      [onCaptureView, isAIAnalysisMode, onAIAnalysis]
    );

    const handleSearch = useCallback((lng: number, lat: number) => {
      mapRef.current?.flyTo({
        center: [lng, lat],
        zoom: 5,
        duration: 2000,
      });
      setClickedLocation({ lng, lat });
      setShowWeatherWidget(true);
    }, []);

    useImperativeHandle(ref, () => ({
      handleSearch,
    }));

    const handleClose = useCallback(() => {
      setShowWeatherWidget(false);
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

        {clickedLocation && showWeatherWidget && (
          <div className="weather-widget">
            <button className="close-button" onClick={handleClose}>
              &times;
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
              <p>No weather data available.</p>
            )}
          </div>
        )}

        {measurement && (
          <div className="measurement-widget">
            <p>{measurement}</p>
          </div>
        )}
      </div>
    );
  }
);

export default Earth;
