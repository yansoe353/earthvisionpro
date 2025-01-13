import React from 'react';
import { Earthquake, VolcanicEruption, Wildfire, UserMarker } from './types';

interface MarkerPopupProps {
  marker: Earthquake | VolcanicEruption | Wildfire | UserMarker;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

const MarkerPopup = ({ marker, onClose, onDelete }: MarkerPopupProps) => {
  // Helper function to determine the type of marker
  const getMarkerType = () => {
    if ('properties' in marker) {
      return 'earthquake';
    } else if ('status' in marker && 'size' in marker) {
      return 'wildfire';
    } else if ('status' in marker && 'name' in marker) {
      return 'volcanicEruption';
    } else {
      return 'userMarker';
    }
  };

  const markerType = getMarkerType();

  return (
    <div className="marker-popup">
      {/* Popup Header */}
      <h3>
        {markerType === 'earthquake'
          ? marker.properties.title
          : markerType === 'volcanicEruption'
          ? marker.name
          : markerType === 'wildfire'
          ? 'Wildfire'
          : marker.label}
      </h3>

      {/* Popup Content */}
      {markerType === 'earthquake' && (
        <>
          <p>Magnitude: {marker.properties.mag}</p>
          <p>Location: {marker.properties.place}</p>
        </>
      )}

      {markerType === 'volcanicEruption' && (
        <>
          <p>Status: {marker.status}</p>
          <p>Location: {`${marker.location.lat}, ${marker.location.lng}`}</p>
        </>
      )}

      {markerType === 'wildfire' && (
        <>
          <p>Size: {marker.size} acres</p>
          <p>Status: {marker.status}</p>
          <p>Location: {`${marker.location.lat}, ${marker.location.lng}`}</p>
        </>
      )}

      {markerType === 'userMarker' && (
        <button
          onClick={() => onDelete && onDelete(marker.id)}
          className="delete-button"
        >
          Delete Marker
        </button>
      )}

      {/* Close Button */}
      <button onClick={onClose} className="close-button">
        Close
      </button>
    </div>
  );
};

export default MarkerPopup;
