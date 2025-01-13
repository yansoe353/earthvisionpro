import React from 'react';
import { Earthquake, UserMarker } from './types';

interface MarkerPopupProps {
  marker: Earthquake | UserMarker;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

const MarkerPopup = ({ marker, onClose, onDelete }: MarkerPopupProps) => (
  <div>
    <h3>{'properties' in marker ? marker.properties.title : marker.label}</h3>
    {'properties' in marker ? (
      <>
        <p>Magnitude: {marker.properties.mag}</p>
        <p>Location: {marker.properties.place}</p>
      </>
    ) : (
      <button onClick={() => onDelete && onDelete(marker.id)}>
        Delete Marker
      </button>
    )}
  </div>
);

export default MarkerPopup;
