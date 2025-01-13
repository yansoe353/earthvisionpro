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
    return 'volcano_name_appended' in marker && 'alert_level' in marker;
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
          ? marker.volcano_name_appended // Use volcano_name_appended
          : isWildfire(marker)
          ? 'Wildfire'
          : marker.label}
      </h3>

      {/* Popup Content */}
      {isEarthquake(marker) && (
        <>
          <p>Magnitude: {marker.properties.mag}</p>
          <p>Location: {marker.properties.place}</p>
        </>
      )}

      {isVolcanicEruption(marker) && (
        <>
          <p>Name: {marker.volcano_name_appended}</p>
          <p>Status: {marker.alert_level}</p>
          <p>Location: {`${marker.latitude}, ${marker.longitude}`}</p>
          <p>Synopsis: {marker.synopsis}</p>
        </>
      )}

      {isWildfire(marker) && (
        <>
          <p>Size: {marker.size} acres</p>
          <p>Status: {marker.status}</p>
          <p>Location: {`${marker.location.lat}, ${marker.location.lng}`}</p>
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
