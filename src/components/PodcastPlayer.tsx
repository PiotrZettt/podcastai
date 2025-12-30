import { useRef, useState } from 'react';

interface PodcastPlayerProps {
  audioUrl: string;
  onReset: () => void;
}

export default function PodcastPlayer({ audioUrl, onReset }: PodcastPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h2>Your Podcast is Ready!</h2>

      <div style={{
        marginTop: '2rem',
        padding: '2rem',
        border: '2px solid #28a745',
        borderRadius: '12px',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
          {isPlaying ? '⏸️' : '▶️'}
        </div>

        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        <button
          onClick={togglePlay}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          {isPlaying ? 'Pause' : 'Play Podcast'}
        </button>

        <div style={{ marginTop: '1rem' }}>
          <audio controls src={audioUrl} style={{ width: '100%' }} />
        </div>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <a
          href={audioUrl}
          download="podcast.mp3"
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: '#28a745',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px'
          }}
        >
          Download MP3
        </a>

        <button
          onClick={onReset}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Create New Podcast
        </button>
      </div>
    </div>
  );
}
