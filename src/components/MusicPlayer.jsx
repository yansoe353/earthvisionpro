import React, { useState, useEffect, useRef } from 'react';
import { searchSpotifyTracks, searchFreesound } from '../services/MusicService';

const MusicPlayer = ({ location }) => {
  const [tracks, setTracks] = useState([]);
  const [sounds, setSounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!location) return;

    const fetchMusicAndSounds = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch Spotify tracks
        const spotifyTracks = await searchSpotifyTracks(location);
        setTracks(spotifyTracks);

        // Fetch Freesound ambient sounds
        const freesoundResults = await searchFreesound(location);
        setSounds(freesoundResults);
      } catch (error) {
        console.error('Error fetching music/sounds:', error);
        setError('Failed to fetch music and sounds. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMusicAndSounds();
  }, [location]);

  const playAudio = (url) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = url;
      audioRef.current.play();
    }
  };

  return (
    <div className="music-player">
      <h2>Local Music and Sounds for {location}</h2>
      {loading && <p>Loading music and sounds...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="tracks">
        <h3>Music</h3>
        {tracks.map((track) => (
          <div key={track.id} className="track" onClick={() => playAudio(track.preview_url)}>
            <p>{track.name} - {track.artists[0].name}</p>
          </div>
        ))}
      </div>

      <div className="sounds">
        <h3>Ambient Sounds</h3>
        {sounds.map((sound) => (
          <div key={sound.id} className="sound" onClick={() => playAudio(sound.previews['preview-hq-mp3'])}>
            <p>{sound.name}</p>
          </div>
        ))}
      </div>

      <audio ref={audioRef} controls style={{ display: 'none' }} />
    </div>
  );
};

export default MusicPlayer;
