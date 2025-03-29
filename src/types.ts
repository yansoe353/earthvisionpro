/**
 * Represents an earthquake event.
 */
// types.ts
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


/**
 * Represents a user-generated marker on the map.
 */
export interface UserMarker {
  id: string; // Unique identifier for the marker
  lng: number; // Longitude of the marker
  lat: number; // Latitude of the marker
  label: string; // Custom label for the marker
  note: string; // Add the note property
}

/**
 * Represents a Mapbox style.
 */
export type MapboxStyle = {
  label: string; // Display name for the style
  value: string; // Mapbox style URL
};

/**
 * Props for the FeaturePanel component.
 */
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

/**
 * Represents weather data for a specific location.
 */
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

// types.ts
type Cluster = Feature<Point, {
  cluster?: boolean;
  point_count?: number;
  id?: string;
  mag?: number;
  cluster_id?: number;
  time?: number; // Add the time property
}>;



/**
 * Props for the Earth component.
 */
export interface EarthProps {
  onCaptureView: () => void; // Callback for capturing the map view
  showWeatherWidget: boolean; // Whether the weather widget is visible
  setShowWeatherWidget: (show: boolean) => void; // Function to toggle weather widget visibility
}

/**
 * Ref for the Earth component.
 */
export interface EarthRef {
  handleSearch: (lng: number, lat: number) => void; // Function to handle location search
}
