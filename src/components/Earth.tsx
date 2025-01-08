import { useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import Map, { MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Using Mapbox's satellite imagery
const MAPBOX_STYLE = 'mapbox://styles/htetnay/cm52c39vv00bz01sa0qzx4ro7';

interface EarthProps {
  onCaptureView: () => void;
  onClick: (lat: number, lng: number) => void;
  onAddMarker: (lat: number, lng: number) => void;
}

const Earth = forwardRef(({ onCaptureView, onClick, onAddMarker }: EarthProps, ref) => {
  const mapRef = useRef<MapRef>(null);

  const handleMapClick = useCallback(
    (event: any) => {
      const { lng, lat } = event.lngLat;
      onClick(lat, lng); // Trigger reverse geocoding
      onAddMarker(lat, lng); // Add a marker if marker mode is active
    },
    [onClick, onAddMarker]
  );

  const handleSearch = useCallback((lng: number, lat: number) => {
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: 5,
      duration: 2000,
    });
  }, []);

  useImperativeHandle(ref, () => ({
    handleSearch,
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
          pitch: 0,
        }}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        onClick={handleMapClick}
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
    </div>
  );
});

export default Earth;
