// src/constants/mapboxStyles.ts
export interface MapboxStyle {
  label: string;
  value: string;
}

export const MAPBOX_STYLES: MapboxStyle[] = [
  {
    label: "Default",
    value: "mapbox://styles/mapbox/streets-v12",
  },
  {
    label: "Satellite",
    value: "mapbox://styles/mapbox/satellite-v9",
  },
  {
    label: "Dark",
    value: "mapbox://styles/mapbox/dark-v11",
  },
  {
    label: "Light",
    value: "mapbox://styles/mapbox/light-v11",
  },
  {
    label: "Outdoors",
    value: "mapbox://styles/mapbox/outdoors-v12",
  },
];
