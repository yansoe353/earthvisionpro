import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserMarker } from '../types';

const useUserMarkers = () => {
  const [userMarkers, setUserMarkers] = useState<UserMarker[]>([]);

  // Load markers from localStorage on mount
  useEffect(() => {
    const savedMarkers = localStorage.getItem('userMarkers');
    if (savedMarkers) {
      try {
        const parsedMarkers = JSON.parse(savedMarkers);
        if (Array.isArray(parsedMarkers)) {
          setUserMarkers(parsedMarkers);
        }
      } catch (error) {
        console.error('Failed to parse userMarkers from localStorage:', error);
      }
    }
  }, []);

  // Save markers to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userMarkers', JSON.stringify(userMarkers));
  }, [userMarkers]);

  // Add a new user marker
  const addUserMarker = useCallback(
    (lng: number, lat: number, label: string = 'Custom Marker', note: string = '') => {
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        console.error('Invalid coordinates');
        return;
      }

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

  // Memoize the userMarkers array to avoid unnecessary re-renders
  const memoizedUserMarkers = useMemo(() => userMarkers, [userMarkers]);

  return {
    userMarkers: memoizedUserMarkers,
    addUserMarker,
    updateMarkerNote,
    removeAllMarkers,
    deleteUserMarker,
  };
};

export default useUserMarkers;
