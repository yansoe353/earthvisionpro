import React, { useState, useCallback } from 'react';
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

  // Handle saving the note
  const handleSaveNote = useCallback(() => {
    if (isNoteChanged) {
      onUpdateNote(marker.id, note);
    }
  }, [isNoteChanged, marker.id, note, onUpdateNote]);

  // Handle changes to the note input
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
  };

  // Calculate remaining characters
  const maxLength = 500;
  const remainingChars = maxLength - note.length;

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
          onChange={handleNoteChange}
          placeholder="Add a note..."
          maxLength={maxLength}
          aria-describedby="note-char-count"
        />
        <span id="note-char-count" className="char-count">
          {remainingChars} characters remaining
        </span>
      </div>

      {/* Action Buttons */}
      <div className="button-group">
        <button
          onClick={handleSaveNote}
          disabled={!isNoteChanged}
          aria-label="Save Note"
          aria-disabled={!isNoteChanged}
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
