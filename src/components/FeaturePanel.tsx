import React from 'react';
import { Earthquake, UserMarker, MapboxStyle } from './types';
import { FaTimes, FaGlobeAmericas, FaMoon, FaCamera, FaMapMarkerAlt, FaTrash } from 'react-icons/fa';

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
  onClose: () => void;
  mapStyle: string; // Current map style
  setMapStyle: (style: string) => void; // Function to update map style
  mapStyles: MapboxStyle[]; // List of available map styles
}

const FeatureToggle = ({ icon, label, checked, onChange, ariaLabel }: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
}) => (
  <div className="feature-toggle">
    {icon}
    <label>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={ariaLabel}
      />
      {label}
    </label>
  </div>
);

const ActionButton = ({ icon, label, onClick, disabled, ariaLabel }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel: string;
}) => (
  <button
    className="action-button"
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
  >
    {icon}
    {label}
  </button>
);

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
  onClose,
  mapStyle,
  setMapStyle,
  mapStyles,
}: FeaturePanelProps) => (
  <div className={`feature-panel ${isDarkTheme ? 'dark' : ''}`}>
    {/* Close Button */}
    <button className="close-button" onClick={onClose} aria-label="Close panel">
      <FaTimes />
    </button>

    {/* Panel Title */}
    <h2 className="panel-title">Map Features</h2>

    {/* Map Style Dropdown */}
    <div className="feature-toggle">
      <label>
        Map Style:
        <select
          value={mapStyle}
          onChange={(e) => setMapStyle(e.target.value)}
          aria-label="Select map style"
        >
          {mapStyles.map((style) => (
            <option key={style.value} value={style.value}>
              {style.label}
            </option>
          ))}
        </select>
      </label>
    </div>

    {/* Disaster Alerts Toggle */}
    <FeatureToggle
      icon={<FaGlobeAmericas />}
      label={showDisasterAlerts ? 'Disable Disaster Alerts' : 'Enable Disaster Alerts'}
      checked={showDisasterAlerts}
      onChange={toggleDisasterAlerts}
      ariaLabel="Toggle disaster alerts"
    />

    {/* Dark Theme Toggle */}
    <FeatureToggle
      icon={<FaMoon />}
      label={isDarkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      checked={isDarkTheme}
      onChange={toggleDarkTheme}
      ariaLabel="Toggle dark theme"
    />

    {/* Capture Feature Toggle */}
    <FeatureToggle
      icon={<FaCamera />}
      label={isCaptureEnabled ? 'Disable Capture' : 'Enable Capture'}
      checked={isCaptureEnabled}
      onChange={toggleCaptureFeature}
      ariaLabel="Toggle capture feature"
    />

    {/* Add Marker Button */}
    <ActionButton
      icon={<FaMapMarkerAlt />}
      label="Add Marker"
      onClick={() => clickedLocation && addUserMarker(clickedLocation.lng, clickedLocation.lat)}
      disabled={!clickedLocation}
      ariaLabel="Add marker"
    />

    {/* Remove All Markers Button */}
    <ActionButton
      icon={<FaTrash />}
      label="Remove All Markers"
      onClick={removeAllMarkers}
      ariaLabel="Remove all markers"
    />
  </div>
);

export default FeaturePanel;
