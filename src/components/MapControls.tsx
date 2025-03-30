// MapControls.tsx
import React, { useState } from 'react';
import { FiSettings, FiLayers, FiMap, FiSun, FiMoon } from 'react-icons/fi';
import { FaMapMarkedAlt, FaTrafficLight, FaSatellite, FaMountain } from 'react-icons/fa';
import { RiContrastDropLine, RiBuilding3Line } from 'react-icons/ri';
import { MdOutlineWater, MdLocationPin, MdWbSunny } from 'react-icons/md';
import { IoMdAlert } from 'react-icons/io';
import { BsBusFront } from 'react-icons/bs';

interface MapControlsProps {
  toggleFeaturePanel: () => void;
  isDarkTheme: boolean;
  showHeatmap: boolean;
  setShowHeatmap: (show: boolean) => void;
  showTraffic: boolean;
  setShowTraffic: (show: boolean) => void;
  showSatellite: boolean;
  setShowSatellite: (show: boolean) => void;
  show3DTerrain: boolean;
  setShow3DTerrain: (show: boolean) => void;
  showChoropleth: boolean;
  setShowChoropleth: (show: boolean) => void;
  show3DBuildings: boolean;
  setShow3DBuildings: (show: boolean) => void;
  showContour: boolean;
  setShowContour: (show: boolean) => void;
  showPointsOfInterest: boolean;
  setShowPointsOfInterest: (show: boolean) => void;
  showWeather: boolean;
  setShowWeather: (show: boolean) => void;
  showTransit: boolean;
  setShowTransit: (show: boolean) => void;
  showDisasterAlerts: boolean;
  setShowDisasterAlerts: (show: boolean) => void;
}

const MapControls: React.FC<MapControlsProps> = ({
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
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'map' | 'layers'>('map');

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`map-controls-container ${isExpanded ? 'expanded' : ''}`}>
      <div className="map-controls-header">
        <button 
          onClick={toggleExpand} 
          className="controls-toggle-button"
          aria-label={isExpanded ? "Collapse controls" : "Expand controls"}
        >
          <FiSettings className="icon" />
        </button>
        <h3>{isExpanded ? 'Map Controls' : ''}</h3>
      </div>

      {isExpanded && (
        <div className="controls-content">
          <div className="controls-category-tabs">
            <button
              className={`category-tab ${activeCategory === 'map' ? 'active' : ''}`}
              onClick={() => setActiveCategory('map')}
            >
              <FiMap className="icon" />
              <span>Map</span>
            </button>
            <button
              className={`category-tab ${activeCategory === 'layers' ? 'active' : ''}`}
              onClick={() => setActiveCategory('layers')}
            >
              <FiLayers className="icon" />
              <span>Layers</span>
            </button>
          </div>

          <div className="controls-section">
            {activeCategory === 'map' && (
              <>
                <button 
                  onClick={toggleFeaturePanel} 
                  className="control-button"
                >
                  {isDarkTheme ? (
                    <>
                      <FiSun className="icon" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <FiMoon className="icon" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </button>
              </>
            )}

            {activeCategory === 'layers' && (
              <div className="layers-grid">
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`control-button ${showHeatmap ? 'active' : ''}`}
                >
                  <FaMapMarkedAlt className="icon" />
                  <span>Heatmap</span>
                </button>

                <button
                  onClick={() => setShowTraffic(!showTraffic)}
                  className={`control-button ${showTraffic ? 'active' : ''}`}
                >
                  <FaTrafficLight className="icon" />
                  <span>Traffic</span>
                </button>

                <button
                  onClick={() => setShowSatellite(!showSatellite)}
                  className={`control-button ${showSatellite ? 'active' : ''}`}
                >
                  <FaSatellite className="icon" />
                  <span>Satellite</span>
                </button>

                <button
                  onClick={() => setShow3DTerrain(!show3DTerrain)}
                  className={`control-button ${show3DTerrain ? 'active' : ''}`}
                >
                  <FaMountain className="icon" />
                  <span>3D Terrain</span>
                </button>

                <button
                  onClick={() => setShowChoropleth(!showChoropleth)}
                  className={`control-button ${showChoropleth ? 'active' : ''}`}
                >
                  <RiContrastDropLine className="icon" />
                  <span>Choropleth</span>
                </button>

                <button
                  onClick={() => setShow3DBuildings(!show3DBuildings)}
                  className={`control-button ${show3DBuildings ? 'active' : ''}`}
                >
                  <RiBuilding3Line className="icon" />
                  <span>3D Buildings</span>
                </button>

                <button
                  onClick={() => setShowContour(!showContour)}
                  className={`control-button ${showContour ? 'active' : ''}`}
                >
                  <MdOutlineWater className="icon" />
                  <span>Contour</span>
                </button>

                <button
                  onClick={() => setShowPointsOfInterest(!showPointsOfInterest)}
                  className={`control-button ${showPointsOfInterest ? 'active' : ''}`}
                >
                  <MdLocationPin className="icon" />
                  <span>Points of Interest</span>
                </button>

                <button
                  onClick={() => setShowWeather(!showWeather)}
                  className={`control-button ${showWeather ? 'active' : ''}`}
                >
                  <MdWbSunny className="icon" />
                  <span>Weather</span>
                </button>

                <button
                  onClick={() => setShowTransit(!showTransit)}
                  className={`control-button ${showTransit ? 'active' : ''}`}
                >
                  <BsBusFront className="icon" />
                  <span>Transit</span>
                </button>

                <button
                  onClick={() => setShowDisasterAlerts(!showDisasterAlerts)}
                  className={`control-button ${showDisasterAlerts ? 'active' : ''}`}
                >
                  <IoMdAlert className="icon" />
                  <span>Disaster Alerts</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapControls;
