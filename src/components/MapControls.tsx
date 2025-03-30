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
  showContour: boolean;
  setShowContour: (value: boolean) => void;
  showPointsOfInterest: boolean;
  setShowPointsOfInterest: (value: boolean) => void;
  showWeather: boolean;
  setShowWeather: (value: boolean) => void;
  showTransit: boolean;
  setShowTransit: (value: boolean) => void;
  showDisasterAlerts: boolean;
  setShowDisasterAlerts: (value: boolean) => void;
  // Add this prop to force refresh the map
  refreshMap: () => void;
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
  showContour,
  setShowContour,
  showPointsOfInterest,
  setShowPointsOfInterest,
  showWeather,
  setShowWeather,
  showTransit,
  setShowTransit,
  showDisasterAlerts,
  setShowDisasterAlerts,
  refreshMap, // Add this prop
}: MapControlsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const controlBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        controlBoxRef.current &&
        !controlBoxRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('button[aria-label="Toggle Controls"]')
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDisasterAlerts = () => {
    const newValue = !showDisasterAlerts;
    setShowDisasterAlerts(newValue);
    
    // Force a map refresh when toggling disaster alerts
    refreshMap();
    
    // You might also need to clear any existing alerts from the maps
    // This would depend on how your map implementation works
    if (!newValue) {
      // Add code here to clear disaster alerts from the map if needed
      console.log('Disaster alerts turned off - should clear from map');
    }
  };

  return (
    <>
      <button
        aria-label="Toggle Controls"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: isMobile ? '16px' : '20px',
          right: isMobile ? '16px' : '20px',
          zIndex: 1002,
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

      <div
        ref={controlBoxRef}
        style={{
          position: 'fixed',
          bottom: isMobile ? '80px' : '80px',
          right: isMobile ? '16px' : '20px',
          zIndex: 1001,
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
          transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transition: 'transform 0.3s ease, opacity 0.3s ease, visibility 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: isMobile ? '16px' : '18px', color: isDarkTheme ? '#00ffff' : '#000' }}>
            Map Layers
          </h3>
          {[
            { label: 'Heatmap', checked: showHeatmap, onChange: setShowHeatmap },
            { label: 'Choropleth', checked: showChoropleth, onChange: setShowChoropleth },
            { label: 'Points of Interest', checked: showPointsOfInterest, onChange: setShowPointsOfInterest },
            { label: 'Weather', checked: showWeather, onChange: setShowWeather },
            { label: 'Transit', checked: showTransit, onChange: setShowTransit },
            { label: 'Traffic', checked: showTraffic, onChange: setShowTraffic },
            { label: 'Satellite', checked: showSatellite, onChange: setShowSatellite },
            { label: '3D Terrain', checked: show3DTerrain, onChange: setShow3DTerrain },
            { label: '3D Buildings', checked: show3DBuildings, onChange: setShow3DBuildings },
            { label: 'Contour', checked: showContour, onChange: setShowContour },
            { 
              label: 'Disaster Alerts', 
              checked: showDisasterAlerts, 
              onChange: toggleDisasterAlerts,
              style: { 
                color: showDisasterAlerts ? (isDarkTheme ? '#ff5555' : '#ff0000') : 'inherit',
                fontWeight: showDisasterAlerts ? 'bold' : 'normal'
              }
            },
          ].map(({ label, checked, onChange, style }) => (
            <label 
              key={label} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontSize: isMobile ? '14px' : '16px',
                ...style 
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                style={{ 
                  margin: 0, 
                  cursor: 'pointer',
                  accentColor: label === 'Disaster Alerts' ? (isDarkTheme ? '#ff5555' : '#ff0000') : undefined
                }}
              />
              {label}
              {label === 'Disaster Alerts' && (
                <span style={{ 
                  marginLeft: 'auto',
                  fontSize: '12px',
                  color: isDarkTheme ? '#ff8888' : '#ff4444'
                }}>
                  {checked ? 'ACTIVE' : 'INACTIVE'}
                </span>
              )}
            </label>
          ))}
        </div>

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
