// types.ts
import { Feature, Point } from 'geojson';

export interface Earthquake {
  id: string; // Unique identifier for the earthquake
  geometry: {
    coordinates: [number, number, number]; // [longitude, latitude, depth]
  };
  properties: {
    title: string; // Title of the earthquake event
    mag: number; // Magnitude of the earthquake
    place: string; // Location description
    time: number; // Time of the earthquake in milliseconds since the epoch
  };
}

export interface UserMarker {
  id: string; // Unique identifier for the marker
  lng: number; // Longitude of the marker
  lat: number; // Latitude of the marker
  label: string; // Custom label for the marker
  note: string; // Add the note property
}

export interface WeatherData {
  name: string; // Location name
  main: {
    temp: number; // Temperature in Celsius
    feels_like: number; // "Feels like" temperature in Celsius
    humidity: number; // Humidity percentage
  };
  weather: {
    description: string; // Weather condition description (e.g., "clear sky")
    icon: string; // Weather icon code (e.g., "01d" for clear sky day)
  }[];
  wind: {
    speed: number; // Wind speed in meters per second
  };
}

export interface EarthProps {
  onCaptureView: () => void; // Callback for capturing the map view
  showWeatherWidget: boolean; // Whether the weather widget is visible
  setShowWeatherWidget: (show: boolean) => void; // Function to toggle weather widget visibility
}

export interface EarthRef {
  handleSearch: (lng: number, lat: number) => void; // Function to handle location search
}

export interface MarkerPopupProps {
  marker: Earthquake | UserMarker;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onUpdateNote?: (id: string, note: string) => void;
}

export interface FeaturePanelProps {
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
  mapStyles: MapboxStyle[]; // Array of available map styles
}

export type MapboxStyle = {
  label: string; // Display name for the style
  value: string; // Mapbox style URL
};
