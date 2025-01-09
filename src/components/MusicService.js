const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
const FREESOUND_API_KEY = import.meta.env.VITE_FREESOUND_API_KEY;

// Spotify API: Get Access Token
const getSpotifyToken = async () => {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
};

// Spotify API: Search for Tracks
export const searchSpotifyTracks = async (query) => {
  const token = await getSpotifyToken();
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();
  return data.tracks.items;
};

// Freesound API: Search for Sounds
export const searchFreesound = async (query) => {
  const response = await fetch(
    `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(query)}&fields=id,name,previews&token=${FREESOUND_API_KEY}`
  );

  const data = await response.json();
  return data.results;
};
