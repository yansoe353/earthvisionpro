import React, { useState, useEffect, useRef } from 'react';

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
  const controlBoxRef = useRef<HTMLDivElement>(null); // Ref for the control box

  // Update isMobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Click-outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        controlBoxRef.current &&
        !controlBoxRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('button[aria-label="Toggle Controls"]') // Ensure FAB clicks don't close the box
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        aria-label="Toggle Controls"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: isMobile ? '16px' : '20px',
          right: isMobile ? '16px' : '20px',
          zIndex: 1002, // Higher than info panel
          backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
          border: '1px solid #ccc',
          borderRadius: '50%',
          width: isMobile ? '48px' : '50px',
          height: isMobile ? '48px' : '50px',
          cursor: 'pointer',
          fontSize: isMobile ? '20px' : '24px',
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
      <div
        ref={controlBoxRef}
        style={{
          position: 'fixed',
          bottom: isMobile ? '80px' : '80px',
          right: isMobile ? '16px' : '20px',
          zIndex: 1001, // Lower than FAB but higher than other elements
          backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: isMobile ? '12px' : '16px',
          color: isDarkTheme ? '#fff' : '#000',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
          width: isMobile ? 'calc(100% - 32px)' : '280px',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          transform: isOpen ? 'translateY(0)' : 'translateY(20px)', // Slide-in animation
          opacity: isOpen ? 1 : 0, // Fade-in animation
          visibility: isOpen ? 'visible' : 'hidden', // Hide when closed
          transition: 'transform 0.3s ease, opacity 0.3s ease, visibility 0.3s ease',
        }}
      >
        {/* Layer Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: isMobile ? '16px' : '18px', color: isDarkTheme ? '#00ffff' : '#000' }}>
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
            <label key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: isMobile ? '14px' : '16px' }}>
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                style={{ margin: 0, cursor: 'pointer' }}
              />
              {label}
            </label>
          ))}
        </div>

        {/* Toggle Feature Panel Button */}
        <button
          onClick={toggleFeaturePanel}
          style={{
            padding: '8px 12px',
            backgroundColor: isDarkTheme ? 'rgba(0, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            border: `1px solid ${isDarkTheme ? 'rgba(0, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}`,
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: isMobile ? '14px' : '16px',
            color: isDarkTheme ? '#00ffff' : '#000',
            width: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
          }}
        >
          {isDarkTheme ? '🌙' : '☀️'} Toggle Feature Panel
        </button>
      </div>
    </>
  );
};

export default MapControls;
