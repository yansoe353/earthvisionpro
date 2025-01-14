import React from 'react';
import { Earthquake, UserMarker } from './types';

interface MarkerPopupProps {
  marker: Earthquake | UserMarker;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

const MarkerPopup = ({ marker, onClose, onDelete }: MarkerPopupProps) => {
  // Type guard for Earthquake
  const isEarthquake = (marker: any): marker is Earthquake => {
    return 'properties' in marker;
  };

  // Type guard for UserMarker
  const isUserMarker = (marker: any): marker is UserMarker => {
    return 'label' in marker && 'id' in marker;
  };

  return (
    <div className="marker-popup">
      {/* Popup Header */}
      <h3>
        {isEarthquake(marker)
          ? marker.properties.title
          : marker.label}
      </h3>

      {/* Popup Content */}
      {isEarthquake(marker) && (
        <>
          <p>Magnitude: {marker.properties.mag}</p>
          <p>Location: {marker.properties.place}</p>
        </>
      )}

      {isUserMarker(marker) && (
        <>
          <p>Location: {`${marker.lat}, ${marker.lng}`}</p>
          <button
            onClick={() => onDelete && onDelete(marker.id)}
            className="delete-button"
          >
            Delete Marker
          </button>
        </>
      )}

      {/* Close Button */}
      <button onClick={onClose} className="close-button">
        Close
      </button>
    </div>
  );
};

export default MarkerPopup;
