import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserMarker } from '../types';

const useUserMarkers = () => {
  const [userMarkers, setUserMarkers] = useState<UserMarker[]>([]);

  // Add a new user marker
  const addUserMarker = useCallback(
    (lng: number, lat: number, label: string = 'Custom Marker', note: string = '') => {
      const newMarker: UserMarker = {
        lng,
        lat,
        label,
        id: crypto.randomUUID(), // Use crypto.randomUUID() for unique IDs
        note, // Include the note property
      };
      setUserMarkers((prev) => [...prev, newMarker]);
    },
    []
  );

  // Update a user marker's note
  const updateMarkerNote = useCallback((id: string, note: string) => {
    setUserMarkers((prev) =>
      prev.map((marker) =>
        marker.id === id ? { ...marker, note } : marker
      )
    );
  }, []);

  // Remove all user markers
  const removeAllMarkers = useCallback(() => {
    setUserMarkers([]);
  }, []);

  // Delete a specific user marker by ID
  const deleteUserMarker = useCallback((id: string) => {
    setUserMarkers((prev) => prev.filter((marker) => marker.id !== id));
  }, []);

  return {
    userMarkers,
    addUserMarker,
    updateMarkerNote,
    removeAllMarkers,
    deleteUserMarker,
  };
};

export default useUserMarkers;
