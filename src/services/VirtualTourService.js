const GOOGLE_STREETVIEW_API_KEY = import.meta.env.VITE_GOOGLE_STREETVIEW_API_KEY;
const MAPILLARY_API_KEY = import.meta.env.VITE_MAPILLARY_API_KEY;

// Google Street View: Get 360 Image URL
export const getGoogleStreetView = (lat, lng) => {
  return `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${lat},${lng}&fov=90&heading=0&pitch=0&key=${GOOGLE_STREETVIEW_API_KEY}`;
};

// Mapillary: Get 360 Image URL
export const getMapillaryImage = async (lat, lng) => {
  const response = await fetch(
    `https://graph.mapillary.com/images?access_token=${MAPILLARY_API_KEY}&fields=thumb_1024_url&closeto=${lng},${lat}&limit=1`
  );
  const data = await response.json();
  if (data.data && data.data.length > 0) {
    return data.data[0].thumb_1024_url;
  }
  return null;
};
