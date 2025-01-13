// src/components/Earth/types.ts

/**
 * Represents an earthquake event.
 */
export interface Earthquake {
  id: string; // Unique identifier for the earthquake
  geometry: {
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    title: string; // Title of the earthquake event
    mag: number; // Magnitude of the earthquake
    place: string; // Location description
  };
}

/**
 * Represents a volcanic eruption event.
 */
export interface VolcanicEruption {
  volcano_name_appended: string; // Name of the volcano
  latitude: number; // Latitude of the eruption
  longitude: number; // Longitude of the eruption
  vnum: string; // Volcano number
  elevation_meters: number; // Elevation in meters
  elevation_feet: number; // Elevation in feet
  obs_fullname: string; // Observatory name
  alert_level: string; // Alert level (e.g., "WATCH")
  color_code: string; // Color code (e.g., "ORANGE")
  cap_certainty: string; // CAP certainty
  cap_severity: string; // CAP severity
  cap_urgency: string; // CAP urgency
  is_elevated_cap: boolean; // Whether the CAP is elevated
  prev_is_elevated_cap: boolean; // Previous CAP elevation status
  notice_identifier: string; // Notice identifier
  pubDate: string; // Publication date
  sent_date_cap: string; // CAP sent date
  prev_sent_date_cap: string; // Previous CAP sent date
  cap_expires: string; // CAP expiration date
  mail_subject: string; // Email subject
  author: string; // Author
  synopsis: string; // Synopsis of the eruption
  guid: string; // GUID
  prev_guid: string; // Previous GUID
  msgType: string; // Message type
  noticeTypeCd: string; // Notice type code
  notice_url: string; // Notice URL
  prev_notice_url: string; // Previous notice URL
  notice_data: string; // Notice data URL
}
/**
 * Represents a wildfire event.
 */
export interface Wildfire {
  id: string; // Unique identifier for the wildfire
  location: { lng: number; lat: number }; // Coordinates of the wildfire
  size: number; // Size of the wildfire in acres
  status: string; // Current status of the wildfire (e.g., "active")
}

/**
 * Represents a user-generated marker on the map.
 */
export interface UserMarker {
  id: string; // Unique identifier for the marker
  lng: number; // Longitude of the marker
  lat: number; // Latitude of the marker
  label: string; // Custom label for the marker
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
