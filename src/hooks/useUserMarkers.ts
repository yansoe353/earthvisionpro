import { useState, useEffect } from 'react';

export interface UserMarker {
  lng: number;
  lat: number;
  label: string;
  id: string;
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
  const addUserMarker = (lng: number, lat: number) => {
    const newMarker: UserMarker = {
      lng,
      lat,
      label: 'Marker', // Default label
      id: Math.random().toString(36).substring(7), // Generate a unique ID
    };
    setUserMarkers((prev) => [...prev, newMarker]);
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
    removeAllMarkers,
    deleteUserMarker,
  };
};

export default useUserMarkers;
