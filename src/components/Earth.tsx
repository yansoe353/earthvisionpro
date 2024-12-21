import { useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import Map, { MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Using Mapbox's satellite imagery
const MAPBOX_STYLE = 'mapbox://styles/pais0/cm4yfwja7006501s9hdgh1goe';

const Earth = forwardRef(({ onCaptureView }: { onCaptureView: () => void }, ref) => {
  const mapRef = useRef<MapRef>(null);

  const handleClick = useCallback(() => {
    onCaptureView();
  }, [onCaptureView]);

  const handleSearch = useCallback((lng: number, lat: number) => {
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: 5,
      duration: 2000
    });
  }, []);

  useImperativeHandle(ref, () => ({
    handleSearch
  }));

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
          pitch: 0
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
          'horizon-blend': 0.2
        }}
        attributionControl={false}
      />
    </div>
  );
});

export default Earth;