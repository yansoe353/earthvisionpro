import React, { useState } from 'react';
import { UserMarker } from '../types';

interface MarkerPopupProps {
  marker: UserMarker;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
}

const MarkerPopup = ({ marker, onClose, onDelete, onUpdateNote }: MarkerPopupProps) => {
  const [note, setNote] = useState(marker.note || '');

  // Check if the note has changed
  const isNoteChanged = note !== marker.note;

  const handleSaveNote = () => {
    if (isNoteChanged) {
      onUpdateNote(marker.id, note);
    }
  };

  return (
    <div className="marker-popup">
      {/* Popup Header */}
      <h3>{marker.label}</h3>

      {/* Popup Content */}
      <p>Location: {`${marker.lat}, ${marker.lng}`}</p>

      {/* Note Input */}
      <div className="note-input">
        <label htmlFor="note">Notes:</label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note..."
          maxLength={500} // Optional: Add a character limit
        />
      </div>

      {/* Action Buttons */}
      <div className="button-group">
        <button
          onClick={handleSaveNote}
          disabled={!isNoteChanged}
          aria-label="Save Note"
        >
          Save Note
        </button>
        <button
          onClick={() => onDelete(marker.id)}
          className="delete-button"
          aria-label="Delete Marker"
        >
          Delete Marker
        </button>
        <button
          onClick={onClose}
          className="close-button"
          aria-label="Close Popup"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default MarkerPopup;
