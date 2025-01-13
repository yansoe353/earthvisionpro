import React from 'react';
import { Earthquake, UserMarker } from './types';

// Icons (You can use an icon library like FontAwesome or Material Icons)
const CloseIcon = () => <span>×</span>;
const DisasterIcon = () => <span>🌍</span>;
const VolcanoIcon = () => <span>🌋</span>;
const FireIcon = () => <span>🔥</span>;
const ThemeIcon = () => <span>🌙</span>;
const CaptureIcon = () => <span>📸</span>;
const MarkerIcon = () => <span>📍</span>;
const RemoveIcon = () => <span>🗑️</span>;

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
  onClose: () => void;
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
    <button
      className="close-button"
      onClick={onClose}
      aria-label="Close panel"
    >
      <CloseIcon />
    </button>

    {/* Panel Title */}
    <h2 className="panel-title">Map Features</h2>

    {/* Disaster Alerts Toggle */}
    <div className="feature-toggle">
      <DisasterIcon />
      <label>
        <input
          type="checkbox"
          checked={showDisasterAlerts}
          onChange={toggleDisasterAlerts}
          aria-label="Toggle disaster alerts"
        />
        {showDisasterAlerts ? 'Disable Disaster Alerts' : 'Enable Disaster Alerts'}
      </label>
    </div>

    {/* Volcanic Eruptions Toggle */}
    <div className="feature-toggle">
      <VolcanoIcon />
      <label>
        <input
          type="checkbox"
          checked={showVolcanicEruptions}
          onChange={toggleVolcanicEruptions}
          aria-label="Toggle volcanic eruptions"
        />
        {showVolcanicEruptions ? 'Hide Volcanic Eruptions' : 'Show Volcanic Eruptions'}
      </label>
    </div>

    {/* Wildfires Toggle */}
    <div className="feature-toggle">
      <FireIcon />
      <label>
        <input
          type="checkbox"
          checked={showWildfires}
          onChange={toggleWildfires}
          aria-label="Toggle wildfires"
        />
        {showWildfires ? 'Hide Wildfires' : 'Show Wildfires'}
      </label>
    </div>

    {/* Dark Theme Toggle */}
    <div className="feature-toggle">
      <ThemeIcon />
      <label>
        <input
          type="checkbox"
          checked={isDarkTheme}
          onChange={toggleDarkTheme}
          aria-label="Toggle dark theme"
        />
        {isDarkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      </label>
    </div>

    {/* Capture Feature Toggle */}
    <div className="feature-toggle">
      <CaptureIcon />
      <label>
        <input
          type="checkbox"
          checked={isCaptureEnabled}
          onChange={toggleCaptureFeature}
          aria-label="Toggle capture feature"
        />
        {isCaptureEnabled ? 'Disable Capture' : 'Enable Capture'}
      </label>
    </div>

    {/* Add Marker Button */}
    <button
      className="action-button"
      onClick={() => clickedLocation && addUserMarker(clickedLocation.lng, clickedLocation.lat)}
      disabled={!clickedLocation}
      aria-label="Add marker"
    >
      <MarkerIcon />
      Add Marker
    </button>

    {/* Remove All Markers Button */}
    <button
      className="action-button"
      onClick={removeAllMarkers}
      aria-label="Remove all markers"
    >
      <RemoveIcon />
      Remove All Markers
    </button>
  </div>
);

export default FeaturePanel;
