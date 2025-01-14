import React, { useState } from 'react';
import { Earthquake, UserMarker } from '../types';

interface MarkerPopupProps {
  marker: Earthquake | UserMarker;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onUpdateNote?: (id: string, note: string) => void;
}

const MarkerPopup = ({ marker, onClose, onDelete, onUpdateNote }: MarkerPopupProps) => {
  const isUserMarker = (marker: Earthquake | UserMarker): marker is UserMarker => {
    return 'label' in marker && 'id' in marker;
  };

  const [note, setNote] = useState(isUserMarker(marker) ? marker.note : '');

  const handleSaveNote = () => {
    if (isUserMarker(marker) && onUpdateNote) {
      onUpdateNote(marker.id, note);
    }
  };

  return (
    <div className="marker-popup">
      <h3>{isUserMarker(marker) ? marker.label : marker.properties.title}</h3>
      <p>Location: {isUserMarker(marker) ? `${marker.lat}, ${marker.lng}` : marker.properties.place}</p>

      {isUserMarker(marker) && (
        <>
          <div className="note-input">
            <label htmlFor="note">Notes:</label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              maxLength={500}
            />
          </div>
          <button onClick={handleSaveNote}>Save Note</button>
        </>
      )}

      {isUserMarker(marker) && onDelete && (
        <button onClick={() => onDelete(marker.id)}>Delete Marker</button>
      )}

      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default MarkerPopup;
