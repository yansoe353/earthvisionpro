// MapControls.tsx
import React from 'react';

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
  return (
    <div className="map-controls">
      <button onClick={toggleFeaturePanel} className="control-button">
        {isDarkTheme ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>
      <button onClick={() => setShowHeatmap(!showHeatmap)} className="control-button">
        {showHeatmap ? '🔥 Hide Heatmap' : '🔥 Show Heatmap'}
      </button>
      <button onClick={() => setShowTraffic(!showTraffic)} className="control-button">
        {showTraffic ? '🚗 Hide Traffic' : '🚗 Show Traffic'}
      </button>
      <button onClick={() => setShowSatellite(!showSatellite)} className="control-button">
        {showSatellite ? '🛰️ Hide Satellite' : '🛰️ Show Satellite'}
      </button>
      <button onClick={() => setShow3DTerrain(!show3DTerrain)} className="control-button">
        {show3DTerrain ? '⛰️ Hide 3D Terrain' : '⛰️ Show 3D Terrain'}
      </button>
      <button onClick={() => setShowChoropleth(!showChoropleth)} className="control-button">
        {showChoropleth ? '🗺️ Hide Choropleth' : '🗺️ Show Choropleth'}
      </button>
      <button onClick={() => setShow3DBuildings(!show3DBuildings)} className="control-button">
        {show3DBuildings ? '🏢 Hide 3D Buildings' : '🏢 Show 3D Buildings'}
      </button>
      <button onClick={() => setShowContour(!showContour)} className="control-button">
        {showContour ? '📉 Hide Contour' : '📉 Show Contour'}
      </button>
      <button onClick={() => setShowPointsOfInterest(!showPointsOfInterest)} className="control-button">
        {showPointsOfInterest ? '📍 Hide POI' : '📍 Show POI'}
      </button>
      <button onClick={() => setShowWeather(!showWeather)} className="control-button">
        {showWeather ? '☀️ Hide Weather' : '☀️ Show Weather'}
      </button>
      <button onClick={() => setShowTransit(!showTransit)} className="control-button">
        {showTransit ? '🚆 Hide Transit' : '🚆 Show Transit'}
      </button>
      <button onClick={() => setShowDisasterAlerts(!showDisasterAlerts)} className="control-button">
        {showDisasterAlerts ? '⚠️ Disable Alerts' : '⚠️ Enable Alerts'}
      </button>
    </div>
  );
};

export default MapControls;
