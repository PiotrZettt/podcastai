import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Play, Pause, Download, RefreshCw } from 'lucide-react';

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
    <div className="container section">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-8">Your Podcast is Ready!</h2>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              Podcast Player
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <div className="text-6xl mb-4">
                {isPlaying ? '⏸️' : '▶️'}
              </div>
            </div>

            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            <Button
              onClick={togglePlay}
              size="lg"
              variant="outline"
              className="w-full mb-4 text-yellow-800 border-yellow-600 hover:bg-yellow-600 hover:text-white"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Play Podcast
                </>
              )}
            </Button>

            <div className="border rounded-lg p-4 bg-muted">
              <audio controls src={audioUrl} className="w-full" />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          <Button asChild size="lg" variant="outline" className="text-yellow-800 border-yellow-600 hover:bg-yellow-600 hover:text-white">
            <a
              href={audioUrl}
              download="podcast.mp3"
            >
              <Download className="w-4 h-4 mr-2" />
              Download MP3
            </a>
          </Button>

          <Button onClick={onReset} variant="outline" size="lg" className="text-yellow-800 border-yellow-600 hover:bg-yellow-600 hover:text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Create New Podcast
          </Button>
        </div>
      </div>
    </div>
  );
}
