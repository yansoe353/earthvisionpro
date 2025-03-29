// MarkerPopup.tsx
import React, { useState, useEffect } from 'react';
import { Earthquake, UserMarker } from '../types';

interface MarkerPopupProps {
  marker: Earthquake | UserMarker;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onUpdateNote?: (id: string, note: string) => void;
}

const MarkerPopup: React.FC<MarkerPopupProps> = ({ marker, onClose, onDelete, onUpdateNote }) => {
  // Type guard to check if the marker is a UserMarker
  const isUserMarker = (marker: Earthquake | UserMarker): marker is UserMarker => {
    return 'label' in marker && 'id' in marker;
  };

  // State for the note input
  const [note, setNote] = useState(isUserMarker(marker) ? marker.note : '');
  const [charCount, setCharCount] = useState(note.length);

  // Update note state when marker changes
  useEffect(() => {
    if (isUserMarker(marker)) {
      setNote(marker.note);
      setCharCount(marker.note.length);
    }
  }, [marker]);

  // Handle saving the note
  const handleSaveNote = () => {
    if (isUserMarker(marker) && onUpdateNote) {
      onUpdateNote(marker.id, note);
    }
  };

  // Handle note input change
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 500) {
      setNote(value);
      setCharCount(value.length);
    }
  };

  // Handle delete (no confirmation dialog)
  const handleDelete = () => {
    if (isUserMarker(marker) && onDelete) {
      onDelete(marker.id);
    }
  };

  return (
    <div className="marker-popup">
      {/* Popup Header */}
      <h3>{isUserMarker(marker) ? marker.label : marker.properties.title}</h3>

      {/* Popup Content */}
      {isUserMarker(marker) ? (
        <>
          <p><strong>Location:</strong> {marker.lat}, {marker.lng}</p>
          <div className="note-input">
            <label htmlFor="note">Notes:</label>
            <textarea
              id="note"
              value={note}
              onChange={handleNoteChange}
              placeholder="Add a note..."
              maxLength={500}
              aria-label="Note input"
            />
            <div className="char-count">{charCount}/500 characters</div>
          </div>
          <button onClick={handleSaveNote} className="save-button">
            Save Note
          </button>
        </>
      ) : (
        <>
          <p><strong>Magnitude:</strong> {marker.properties.mag}</p>
          <p><strong>Location:</strong> {marker.properties.place}</p>
          <p>
            <strong>Coordinates:</strong> {marker.geometry.coordinates[0]}, {marker.geometry.coordinates[1]}
          </p>
          {/* Display earthquake occurrence time */}
          <p>
            <strong>Occurred at:</strong> {new Date(marker.properties.time).toLocaleString()}
          </p>
        </>
      )}

      {/* Delete Button (only for UserMarker) */}
      {isUserMarker(marker) && onDelete && (
        <button onClick={handleDelete} className="delete-button">
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
