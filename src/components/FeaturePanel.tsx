import React from 'react';
import { Earthquake, UserMarker } from './types';

interface FeaturePanelProps {
  isDarkTheme: boolean;
  showDisasterAlerts: boolean;
  isCaptureEnabled: boolean;
  clickedLocation: { lng: number; lat: number } | null;
  toggleDisasterAlerts: () => void;
  toggleDarkTheme: () => void;
  toggleCaptureFeature: () => void;
  addUserMarker: (lng: number, lat: number) => void;
  removeAllMarkers: () => void;
}

const FeaturePanel = ({
  isDarkTheme,
  showDisasterAlerts,
  isCaptureEnabled,
  clickedLocation,
  toggleDisasterAlerts,
  toggleDarkTheme,
  toggleCaptureFeature,
  addUserMarker,
  removeAllMarkers,
}: FeaturePanelProps) => (
  <div className={`feature-panel ${isDarkTheme ? 'dark' : ''}`}>
    <button onClick={toggleDisasterAlerts}>
      {showDisasterAlerts ? 'Disable Alerts' : 'Enable Alerts'}
    </button>
    <button onClick={toggleDarkTheme}>
      {isDarkTheme ? 'Light Theme' : 'Dark Theme'}
    </button>
    <button onClick={toggleCaptureFeature}>
      {isCaptureEnabled ? 'Disable Capture' : 'Enable Capture'}
    </button>
    <button onClick={() => clickedLocation && addUserMarker(clickedLocation.lng, clickedLocation.lat)}>
      Add Marker
    </button>
    <button onClick={removeAllMarkers}>Remove All Markers</button>
  </div>
);

export default FeaturePanel;
