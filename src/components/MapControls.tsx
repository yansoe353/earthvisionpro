import React, { useState, useEffect } from 'react';

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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Update isMobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute',
          bottom: isMobile ? '10px' : '20px',
          right: isMobile ? '10px' : '20px',
          zIndex: 1,
          backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
          border: '1px solid #ccc',
          borderRadius: '50%',
          width: isMobile ? '40px' : '50px',
          height: isMobile ? '40px' : '50px',
          cursor: 'pointer',
          fontSize: isMobile ? '18px' : '20px',
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
            bottom: isMobile ? '60px' : '80px',
            right: isMobile ? '10px' : '20px',
            zIndex: 1,
            backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: isMobile ? '8px' : '16px',
            color: isDarkTheme ? '#fff' : '#000',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
            width: isMobile ? 'calc(100% - 20px)' : '250px', // Fit within screen width on mobile
            maxWidth: '300px',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
          }}
        >
          {/* Toggle Feature Panel Button */}
          <button
            onClick={toggleFeaturePanel}
            style={{
              padding: isMobile ? '6px 8px' : '8px 16px',
              backgroundColor: isDarkTheme ? 'rgba(0, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              border: `1px solid ${isDarkTheme ? 'rgba(0, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px',
              color: isDarkTheme ? '#00ffff' : '#000',
              marginBottom: isMobile ? '8px' : '16px',
              width: '100%',
              whiteSpace: 'nowrap', // Prevent text wrapping
              overflow: 'hidden', // Hide overflow
              textOverflow: 'ellipsis', // Add ellipsis for long text
              transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
            }}
          >
            {isDarkTheme ? '🌙' : '☀️'} Toggle Feature Panel
          </button>

          {/* Layer Toggles */}
          <div style={{ marginTop: isMobile ? '8px' : '10px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: isMobile ? '14px' : '16px', color: isDarkTheme ? '#00ffff' : '#000' }}>
              Map Layers
            </h3>
            {[
              { label: 'Heatmap', checked: showHeatmap, onChange: setShowHeatmap },
              { label: 'Traffic', checked: showTraffic, onChange: setShowTraffic },
              { label: 'Satellite', checked: showSatellite, onChange: setShowSatellite },
              { label: '3D Terrain', checked: show3DTerrain, onChange: setShow3DTerrain },
              { label: 'Choropleth', checked: showChoropleth, onChange: setShowChoropleth },
              { label: '3D Buildings', checked: show3DBuildings, onChange: setShow3DBuildings },
            ].map(({ label, checked, onChange }) => (
              <label key={label} style={{ display: 'block', marginBottom: '6px', fontSize: isMobile ? '12px' : '14px' }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onChange(e.target.checked)}
                  style={{ marginRight: '8px', cursor: 'pointer' }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default MapControls;
