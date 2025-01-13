// src/components/Earth/FeaturePanel.tsx

import React from 'react';
import { Earthquake, UserMarker } from './types';

interface FeaturePanelProps {
  isDarkTheme: boolean;
  showDisasterAlerts: boolean;
  showVolcanicEruptions: boolean;
  showWildfires: boolean;
  isCaptureEnabled: boolean;
  clickedLocation: { lng: number; lat: number } | null;
  toggleDisasterAlerts: () => void;
  toggleVolcanicEruptions: () => void;
  toggleWildfires: () => void;
  toggleDarkTheme: () => void;
  toggleCaptureFeature: () => void;
  addUserMarker: (lng: number, lat: number) => void;
  removeAllMarkers: () => void;
  onClose: () => void; // Prop for closing the panel
}

const FeaturePanel = ({
  isDarkTheme,
  showDisasterAlerts,
  showVolcanicEruptions,
  showWildfires,
  isCaptureEnabled,
  clickedLocation,
  toggleDisasterAlerts,
  toggleVolcanicEruptions,
  toggleWildfires,
  toggleDarkTheme,
  toggleCaptureFeature,
  addUserMarker,
  removeAllMarkers,
  onClose,
}: FeaturePanelProps) => (
  <div className={`feature-panel ${isDarkTheme ? 'dark' : ''}`}>
    {/* Close Button */}
    <button className="close-button" onClick={onClose}>
      ×
    </button>

    {/* Disaster Alerts Toggle */}
    <label>
      <input
        type="checkbox"
        checked={showDisasterAlerts}
        onChange={toggleDisasterAlerts}
      />
      {showDisasterAlerts ? 'Disable Disaster Alerts' : 'Enable Disaster Alerts'}
    </label>

    {/* Volcanic Eruptions Toggle */}
    <label>
      <input
        type="checkbox"
        checked={showVolcanicEruptions}
        onChange={toggleVolcanicEruptions}
      />
      {showVolcanicEruptions ? 'Hide Volcanic Eruptions' : 'Show Volcanic Eruptions'}
    </label>

    {/* Wildfires Toggle */}
    <label>
      <input
        type="checkbox"
        checked={showWildfires}
        onChange={toggleWildfires}
      />
      {showWildfires ? 'Hide Wildfires' : 'Show Wildfires'}
    </label>

    {/* Dark Theme Toggle */}
    <label>
      <input
        type="checkbox"
        checked={isDarkTheme}
        onChange={toggleDarkTheme}
      />
      {isDarkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
    </label>

    {/* Capture Feature Toggle */}
    <label>
      <input
        type="checkbox"
        checked={isCaptureEnabled}
        onChange={toggleCaptureFeature}
      />
      {isCaptureEnabled ? 'Disable Capture' : 'Enable Capture'}
    </label>

    {/* Add Marker Button */}
    <button
      onClick={() => clickedLocation && addUserMarker(clickedLocation.lng, clickedLocation.lat)}
      disabled={!clickedLocation}
    >
      Add Marker
    </button>

    {/* Remove All Markers Button */}
    <button onClick={removeAllMarkers}>Remove All Markers</button>
  </div>
);

export default FeaturePanel;
