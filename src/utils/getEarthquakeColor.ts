// utils/getEarthquakeColor.ts
export const getEarthquakeColor = (magnitude: number) => {
  if (magnitude < 3) return '#00FF00'; // Green
  if (magnitude < 5) return '#FFFF00'; // Yellow
  if (magnitude < 7) return '#FFA500'; // Orange
  return '#FF0000'; // Red
};
