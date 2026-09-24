import { AudioPlayer, setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { localAudioUri } from '@/library';
import { moveItem } from '@/list';
import { getAudio, Song } from '@/yt';

type Queue = { songs: Song[]; index: number };

type PlayerContextValue = {
  player: AudioPlayer;
  current?: Song;
  upNext: Song[];
  source?: 'file' | 'stream';
  // Set for streams only: AVPlayer reports them at double length, so this is the real one.
  streamDuration?: number;
  loading: boolean;
  play: (song: Song, list?: Song[]) => void;
  shuffle: (list: Song[]) => void;
  next: () => void;
  previous: () => void;
  playNext: (song: Song) => void;
  addToQueue: (song: Song) => void;
  jumpToUpNext: (i: number) => void;
  moveUpNext: (from: number, to: number) => void;
  removeUpNext: (i: number) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayer();
  const [queue, setQueue] = useState<Queue>({ songs: [], index: -1 });
  const [source, setSource] = useState<'file' | 'stream'>();
  const [streamDuration, setStreamDuration] = useState<number>();
  const lastTime = useRef(0);
  const [loading, setLoading] = useState(false);
  const latestId = useRef<string>(undefined);
  const current = queue.songs[queue.index];
  const upNext = useMemo(() => queue.songs.slice(queue.index + 1), [queue]);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' });
  }, []);

  async function load(song: Song) {
    latestId.current = song.id;
    player.pause();
    setLoading(true);
    try {
      const local = localAudioUri(song.id);
      const stream = local ? undefined : await getAudio(song.id);
      // A later tap may have started resolving another song while this one was in flight.
      if (latestId.current !== song.id) return;
      setSource(local ? 'file' : 'stream');
      setStreamDuration(stream?.duration);
      lastTime.current = 0;
      player.replace({ uri: local ?? stream!.url });
      player.play();
      player.setActiveForLockScreen(true, { title: song.title, artist: song.artist, artworkUrl: song.artwork });
    } catch (e) {
      if (latestId.current === song.id) Alert.alert("Couldn't play this song", String(e));
    } finally {
      if (latestId.current === song.id) setLoading(false);
    }
  }

  function playAt(songs: Song[], index: number) {
    setQueue({ songs, index });
    load(songs[index]);
  }

  const play = (song: Song, list: Song[] = [song]) => {
    const index = list.findIndex((s) => s.id === song.id);
    playAt(index < 0 ? [song] : list, Math.max(index, 0));
  };

  const shuffle = (list: Song[]) => {
    const songs = [...list];
    for (let i = songs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [songs[i], songs[j]] = [songs[j], songs[i]];
    }
    if (songs.length) playAt(songs, 0);
  };

  const next = () => {
    if (queue.index + 1 < queue.songs.length) playAt(queue.songs, queue.index + 1);
  };

  const previous = () => {
    if (player.currentTime > 3 || queue.index <= 0) player.seekTo(0);
    else playAt(queue.songs, queue.index - 1);
  };

  function insertUpNext(song: Song, at: 'start' | 'end') {
    if (!current) return play(song);
    const rest = upNext.filter((s) => s.id !== song.id);
    const reordered = at === 'start' ? [song, ...rest] : [...rest, song];
    setQueue({ songs: [...queue.songs.slice(0, queue.index + 1), ...reordered], index: queue.index });
  }

  const setUpNext = (songs: Song[]) =>
    setQueue({ songs: [...queue.songs.slice(0, queue.index + 1), ...songs], index: queue.index });

  // Re-subscribed on every render so the handler always advances from the latest queue.
  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (status) => {
      // Streams never report finishing on time (see fixDurationHeader), so their end is when playback
      // crosses the real duration. Downloaded files have repaired headers and finish normally.
      const end = streamDuration ? streamDuration - 0.25 : undefined;
      const crossedEnd = end !== undefined && lastTime.current < end && status.currentTime >= end;
      lastTime.current = status.currentTime;
      if (!(end === undefined ? status.didJustFinish : crossedEnd)) return;
      if (queue.index + 1 < queue.songs.length) next();
      else player.pause();
    });
    return () => sub.remove();
  });

  return (
    <PlayerContext.Provider
      value={{
        player,
        current,
        upNext,
        source,
        streamDuration,
        loading,
        play,
        shuffle,
        next,
        previous,
        playNext: (song) => insertUpNext(song, 'start'),
        addToQueue: (song) => insertUpNext(song, 'end'),
        jumpToUpNext: (i) => playAt(queue.songs, queue.index + 1 + i),
        moveUpNext: (from, to) => setUpNext(moveItem(upNext, from, to)),
        removeUpNext: (i) => setUpNext(upNext.filter((_, j) => j !== i)),
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const value = useContext(PlayerContext);
  if (!value) throw new Error('usePlayer must be used inside PlayerProvider');
  return value;
}
