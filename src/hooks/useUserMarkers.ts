import { useState, useEffect } from 'react';

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

  // Load markers from localStorage on component mount
  useEffect(() => {
    const savedMarkers = localStorage.getItem('userMarkers');
    if (savedMarkers) {
      setUserMarkers(JSON.parse(savedMarkers));
    }
  }, []);

  // Save markers to localStorage whenever userMarkers changes
  useEffect(() => {
    localStorage.setItem('userMarkers', JSON.stringify(userMarkers));
  }, [userMarkers]);

  // Add a new user marker
  const addUserMarker = (lng: number, lat: number, label: string = 'Marker', note: string = '') => {
    const newMarker: UserMarker = {
      lng,
      lat,
      label, // Use the provided label or default to 'Marker'
      id: Math.random().toString(36).substring(7), // Generate a unique ID
      note, // Add the note
    };
    setUserMarkers((prev) => [...prev, newMarker]);
  };

  // Update a user marker's note
  const updateMarkerNote = (id: string, note: string) => {
    setUserMarkers((prev) =>
      prev.map((marker) =>
        marker.id === id ? { ...marker, note } : marker
      )
    );
  };

  // Remove all user markers
  const removeAllMarkers = () => {
    setUserMarkers([]);
  };

  // Delete a specific user marker by ID
  const deleteUserMarker = (id: string) => {
    setUserMarkers((prev) => prev.filter((marker) => marker.id !== id));
  };

  return {
    userMarkers,
    addUserMarker,
    updateMarkerNote,
    removeAllMarkers,
    deleteUserMarker,
  };
};

export default useUserMarkers;
