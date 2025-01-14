import React, { useState } from 'react';

interface MapControlsProps {
  toggleFeaturePanel: () => void;
  isDarkTheme: boolean;
  showHeatmap: boolean;
  setShowHeatmap: (value: boolean) => void;
  showTraffic: boolean;
  setShowTraffic: (value: boolean) => void;
  showSatellite: boolean;
  setShowSatellite: (value: boolean) => void;
  show3DTerrain: boolean;
  setShow3DTerrain: (value: boolean) => void;
  showChoropleth: boolean;
  setShowChoropleth: (value: boolean) => void;
  show3DBuildings: boolean;
  setShow3DBuildings: (value: boolean) => void;
}

const MapControls = ({
  toggleFeaturePanel,
  isDarkTheme,
  showHeatmap,
  setShowHeatmap,
  showTraffic,
  setShowTraffic,
  showSatellite,
  setShowSatellite,
  show3DTerrain,
  setShow3DTerrain,
  showChoropleth,
  setShowChoropleth,
  show3DBuildings,
  setShow3DBuildings,
}: MapControlsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          zIndex: 1,
          backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
          border: '1px solid #ccc',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          cursor: 'pointer',
          fontSize: '20px',
          color: isDarkTheme ? '#00ffff' : '#000',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.3s ease, background-color 0.3s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        ⚙️
      </button>

      {/* Control Box (Visible when FAB is clicked) */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            right: 20,
            zIndex: 1,
            backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '16px',
            color: isDarkTheme ? '#fff' : '#000',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
            width: '250px',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
          }}
        >
          {/* Toggle Feature Panel Button */}
          <button
            onClick={toggleFeaturePanel}
            style={{
              padding: '8px 16px',
              backgroundColor: isDarkTheme ? 'rgba(0, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              border: `1px solid ${isDarkTheme ? 'rgba(0, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              color: isDarkTheme ? '#00ffff' : '#000',
              marginBottom: '16px',
              width: '100%',
              transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
            }}
          >
            {isDarkTheme ? '🌙' : '☀️'} Toggle Feature Panel
          </button>

          {/* Layer Toggles */}
          <div style={{ marginTop: '10px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: isDarkTheme ? '#00ffff' : '#000' }}>
              Map Layers
            </h3>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={(e) => setShowHeatmap(e.target.checked)}
                style={{ marginRight: '8px', cursor: 'pointer' }}
              />
              Heatmap
            </label>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={showTraffic}
                onChange={(e) => setShowTraffic(e.target.checked)}
                style={{ marginRight: '8px', cursor: 'pointer' }}
              />
              Traffic
            </label>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={showSatellite}
                onChange={(e) => setShowSatellite(e.target.checked)}
                style={{ marginRight: '8px', cursor: 'pointer' }}
              />
              Satellite
            </label>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={show3DTerrain}
                onChange={(e) => setShow3DTerrain(e.target.checked)}
                style={{ marginRight: '8px', cursor: 'pointer' }}
              />
              3D Terrain
            </label>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={showChoropleth}
                onChange={(e) => setShowChoropleth(e.target.checked)}
                style={{ marginRight: '8px', cursor: 'pointer' }}
              />
              Choropleth
            </label>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={show3DBuildings}
                onChange={(e) => setShow3DBuildings(e.target.checked)}
                style={{ marginRight: '8px', cursor: 'pointer' }}
              />
              3D Buildings
            </label>
          </div>
        </div>
      )}
    </>
  );
};

export default MapControls;
