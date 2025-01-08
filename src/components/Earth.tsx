import { useCallback, useRef, forwardRef, useImperativeHandle, useState } from 'react';
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
  const [markers, setMarkers] = useState<Array<{ lat: number; lng: number; name: string }>>([]);
  const [isMarkerMode, setIsMarkerMode] = useState(false);

  // Handle click on the map
  const handleMapClick = useCallback(
    (event: any) => {
      const { lng, lat } = event.lngLat;
      onClick(lat, lng); // Trigger reverse geocoding
      if (isMarkerMode) {
        onAddMarker(lat, lng); // Add a marker if marker mode is active
      }
    },
    [onClick, onAddMarker, isMarkerMode]
  );

  // Fly to a specific location
  const handleSearch = useCallback((lng: number, lat: number) => {
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: 5,
      duration: 2000,
    });
  }, []);

  // Add a marker to the map
  const addMarker = useCallback((lat: number, lng: number, name: string) => {
    setMarkers((prevMarkers) => [...prevMarkers, { lat, lng, name }]);
  }, []);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    handleSearch,
    addMarker,
    toggleMarkerMode: () => setIsMarkerMode((prev) => !prev),
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
      >
        {/* Render markers on the map */}
        {markers.map((marker, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              transform: `translate(${mapRef.current?.project([marker.lng, marker.lat]).x}px, ${mapRef.current?.project([marker.lng, marker.lat]).y}px)`,
              color: 'white',
              backgroundColor: 'red',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              textAlign: 'center',
              lineHeight: '20px',
              cursor: 'pointer',
            }}
            onClick={() => handleSearch(marker.lng, marker.lat)}
          >
            {marker.name}
          </div>
        ))}
      </Map>

      {/* Marker mode toggle button */}
      <button
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1,
          padding: '10px',
          backgroundColor: isMarkerMode ? 'red' : 'blue',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
        onClick={() => setIsMarkerMode((prev) => !prev)}
      >
        {isMarkerMode ? 'Exit Marker Mode' : 'Add Marker'}
      </button>
    </div>
  );
});

export default Earth;
