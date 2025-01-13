import React from 'react';
import { Earthquake, VolcanicEruption, Wildfire, UserMarker } from './types';

interface MarkerPopupProps {
  marker: Earthquake | VolcanicEruption | Wildfire | UserMarker;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

const MarkerPopup = ({ marker, onClose, onDelete }: MarkerPopupProps) => {
  // Type guard for Earthquake
  const isEarthquake = (marker: any): marker is Earthquake => {
    return 'properties' in marker;
  };

  // Type guard for VolcanicEruption
  const isVolcanicEruption = (marker: any): marker is VolcanicEruption => {
    return 'name' in marker && 'status' in marker;
  };

  // Type guard for Wildfire
  const isWildfire = (marker: any): marker is Wildfire => {
    return 'size' in marker && 'status' in marker;
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
          : isVolcanicEruption(marker)
          ? marker.name
          : isWildfire(marker)
          ? 'Wildfire'
          : marker.label}
      </h3>

      {/* Popup Content */}
      {isEarthquake(marker) && (
        <>
          <p>Magnitude: {marker.properties.mag}</p>
          <p>Location: {marker.properties.place}</p>
          <p>Time: {new Date(marker.properties.time).toLocaleString()}</p>
        </>
      )}

      {isVolcanicEruption(marker) && (
        <>
          <p>Status: {marker.status}</p>
          <p>Alert Level: {marker.alertLevel}</p>
          <p>Location: {`${marker.location.lat}, ${marker.location.lng}`}</p>
          <p>Last Updated: {new Date(marker.lastUpdated).toLocaleString()}</p>
        </>
      )}

      {isWildfire(marker) && (
        <>
          <p>Size: {marker.size} acres</p>
          <p>Status: {marker.status}</p>
          <p>Location: {`${marker.location.lat}, ${marker.location.lng}`}</p>
          <p>Reported On: {new Date(marker.reportedOn).toLocaleString()}</p>
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
