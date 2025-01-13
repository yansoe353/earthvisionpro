import React from 'react';

interface MapControlsProps {
  toggleFeaturePanel: () => void;
  isDarkTheme: boolean;
}

const MapControls = ({ toggleFeaturePanel, isDarkTheme }: MapControlsProps) => (
  <button
    onClick={toggleFeaturePanel}
    style={{
      position: 'absolute',
      bottom: 20,
      right: 20,
      zIndex: 1,
      padding: '8px 16px',
      backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
      border: '1px solid #ccc',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      color: isDarkTheme ? '#fff' : '#000',
    }}
  >
    Show Features
  </button>
);

export default MapControls;
