import { useState, useEffect, useCallback } from 'react';

export interface UserMarker {
  lng: number;
  lat: number;
  label: string;
  id: string;
  note: string; // Add a note property
}

const useUserMarkers = () => {
  // State to store user markers
  const [userMarkers, setUserMarkers] = useState<UserMarker[]>([]);

  // Check if localStorage is available
  const isLocalStorageAvailable = typeof localStorage !== 'undefined';

  // Load markers from localStorage on component mount
  useEffect(() => {
    if (!isLocalStorageAvailable) return;

    const savedMarkers = localStorage.getItem('userMarkers');
    if (savedMarkers) {
      try {
        const parsedMarkers = JSON.parse(savedMarkers);
        // Validate parsed markers
        if (Array.isArray(parsedMarkers) && parsedMarkers.every(isValidUserMarker)) {
          setUserMarkers(parsedMarkers);
        } else {
          console.error('Invalid markers data in localStorage');
          localStorage.removeItem('userMarkers'); // Clear invalid data
        }
      } catch (error) {
        console.error('Error parsing saved markers:', error);
        localStorage.removeItem('userMarkers'); // Clear invalid data
      }
    }
  }, [isLocalStorageAvailable]);

  // Save markers to localStorage whenever userMarkers changes
  useEffect(() => {
    if (isLocalStorageAvailable) {
      try {
        localStorage.setItem('userMarkers', JSON.stringify(userMarkers));
      } catch (error) {
        console.error('Error saving markers to localStorage:', error);
      }
    }
  }, [userMarkers, isLocalStorageAvailable]);

  // Add a new user marker
  const addUserMarker = useCallback(
    (lng: number, lat: number, label: string = 'Custom Marker', note: string = '') => {
      const newMarker: UserMarker = {
        lng,
        lat,
        label,
        id: crypto.randomUUID(), // Use crypto.randomUUID() for unique IDs
        note,
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

// Helper function to validate UserMarker objects
const isValidUserMarker = (marker: any): marker is UserMarker => {
  return (
    typeof marker === 'object' &&
    typeof marker.lng === 'number' &&
    typeof marker.lat === 'number' &&
    typeof marker.label === 'string' &&
    typeof marker.id === 'string' &&
    typeof marker.note === 'string'
  );
};

export default useUserMarkers;
