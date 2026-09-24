import { AudioPlayer, setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { addListenTime, localAudioUri, recordPlay, startPlay } from '@/library';
import { moveItem } from '@/list';
import { RepeatMode, settings } from '@/settings';
import { updateNowPlayingWidget } from '@/widgets/updateNowPlaying';
import { getAudio, getRadio, Song } from '@/yt';

// `songs` is what the user chose or queued (history, current, up next). `autoplay` holds related songs
// from YouTube Music's radio, played once `songs` runs out; each one moves into `songs` as it starts.
// `unshuffled` keeps the original order of the upcoming songs so turning shuffle off can restore it.
type Queue = { songs: Song[]; index: number; autoplay: Song[]; seed?: Song; unshuffled?: Song[] };

export type SleepTimer = number | 'end' | undefined;

type PlayerContextValue = {
  player: AudioPlayer;
  current?: Song;
  upNext: Song[];
  autoplay: Song[];
  autoplaySeed?: Song;
  source?: 'file' | 'stream';
  // Set for streams only: AVPlayer reports them at double length, so this is the real one.
  streamDuration?: number;
  loading: boolean;
  repeat: RepeatMode;
  shuffled: boolean;
  // Epoch ms to pause at, or 'end' to pause when the current song finishes.
  sleepTimer: SleepTimer;
  cycleRepeat: () => void;
  toggleShuffle: () => void;
  setSleepTimer: (minutes: number | 'end' | undefined) => void;
  play: (song: Song, list?: Song[]) => void;
  shuffle: (list: Song[]) => void;
  next: () => void;
  previous: () => void;
  playNext: (song: Song) => void;
  addToQueue: (song: Song) => void;
  jumpToUpNext: (i: number) => void;
  moveUpNext: (from: number, to: number) => void;
  removeUpNext: (i: number) => void;
  jumpToAutoplay: (i: number) => void;
  moveAutoplay: (from: number, to: number) => void;
  removeAutoplay: (i: number) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

function shuffleList(list: Song[]) {
  const songs = [...list];
  for (let i = songs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [songs[i], songs[j]] = [songs[j], songs[i]];
  }
  return songs;
}

function advance(q: Queue, loop: boolean): Queue | undefined {
  if (q.index + 1 < q.songs.length) return { ...q, index: q.index + 1 };
  if (loop && q.songs.length) return { ...q, index: 0 };
  if (q.autoplay.length) {
    return { ...q, songs: [...q.songs, q.autoplay[0]], autoplay: q.autoplay.slice(1), index: q.index + 1 };
  }
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayer();
  const [queue, setQueue] = useState<Queue>({ songs: [], index: -1, autoplay: [] });
  const [source, setSource] = useState<'file' | 'stream'>();
  const [streamDuration, setStreamDuration] = useState<number>();
  const lastTime = useRef(0);
  const [loading, setLoading] = useState(false);
  const [repeat, setRepeat] = useState(settings.repeat);
  const [shuffled, setShuffled] = useState(false);
  const [sleepTimer, setSleepTimerState] = useState<SleepTimer>();
  const latestId = useRef<string>(undefined);
  const autoplayFor = useRef<string>(undefined);
  const playId = useRef<number>(undefined);
  const unsavedListening = useRef(0);
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
      const stream = local ? undefined : await getAudio(song.id, settings.audioQuality());
      // A later tap may have started resolving another song while this one was in flight.
      if (latestId.current !== song.id) return;
      setSource(local ? 'file' : 'stream');
      setStreamDuration(stream?.duration);
      lastTime.current = 0;
      player.replace({ uri: local ?? stream!.url });
      player.play();
      player.setActiveForLockScreen(true, { title: song.title, artist: song.artist, artworkUrl: song.artwork });
      recordPlay(song);
      flushListening();
      playId.current = startPlay(song);
      updateNowPlayingWidget(song);
    } catch (e) {
      if (latestId.current === song.id) Alert.alert("Couldn't play this song", String(e));
    } finally {
      if (latestId.current === song.id) setLoading(false);
    }
  }

  function flushListening() {
    if (playId.current !== undefined && unsavedListening.current > 0) addListenTime(playId.current, unsavedListening.current);
    unsavedListening.current = 0;
  }

  function fetchAutoplay(seed: Song) {
    if (autoplayFor.current === seed.id) return;
    autoplayFor.current = seed.id;
    getRadio(seed.id)
      .then((radio) =>
        setQueue((q) => {
          // Stale if the user queued more songs or started another list while this was loading.
          if (q.songs[q.songs.length - 1]?.id !== seed.id || q.autoplay.length) return q;
          const queued = new Set(q.songs.map((s) => s.id));
          return { ...q, autoplay: radio.filter((s) => !queued.has(s.id)), seed };
        }),
      )
      // Offline or a YouTube error: playback simply stops at the end of the list.
      .catch(() => {});
  }

  function goTo(q: Queue) {
    setQueue(q);
    load(q.songs[q.index]);
    // Fetch related songs while the last chosen song plays, so the next one starts without a wait.
    // Repeat-all loops the list instead, so it never needs them.
    if (repeat !== 'all' && q.index === q.songs.length - 1 && q.autoplay.length === 0) fetchAutoplay(q.songs[q.index]);
  }

  const play = (song: Song, list: Song[] = [song]) => {
    autoplayFor.current = undefined;
    const index = list.findIndex((s) => s.id === song.id);
    if (index < 0) return goTo({ songs: [song], index: 0, autoplay: [] });
    if (!shuffled) return goTo({ songs: list, index, autoplay: [] });
    const rest = list.filter((_, i) => i !== index);
    goTo({ songs: [song, ...shuffleList(rest)], index: 0, autoplay: [], unshuffled: list.slice(index + 1) });
  };

  const shuffle = (list: Song[]) => {
    if (!list.length) return;
    autoplayFor.current = undefined;
    const songs = shuffleList(list);
    setShuffled(true);
    goTo({ songs, index: 0, autoplay: [], unshuffled: list.slice(list.indexOf(songs[0]) + 1) });
  };

  const next = () => {
    const q = advance(queue, repeat === 'all');
    if (q) goTo(q);
  };

  const toggleShuffle = () => {
    setQueue((q) => {
      const head = q.songs.slice(0, q.index + 1);
      const rest = q.songs.slice(q.index + 1);
      if (!shuffled) return { ...q, songs: [...head, ...shuffleList(rest)], unshuffled: rest };
      const original = q.unshuffled ?? rest;
      const inRest = new Set(rest.map((s) => s.id));
      const known = new Set(original.map((s) => s.id));
      // Songs queued while shuffled have no original position, so they go last.
      const restored = [...original.filter((s) => inRest.has(s.id)), ...rest.filter((s) => !known.has(s.id))];
      return { ...q, songs: [...head, ...restored], unshuffled: undefined };
    });
    setShuffled(!shuffled);
  };

  const cycleRepeat = () => {
    const nextMode: RepeatMode = repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off';
    settings.setRepeat(nextMode);
    setRepeat(nextMode);
  };

  const setSleepTimer = (minutes: number | 'end' | undefined) =>
    setSleepTimerState(typeof minutes === 'number' ? Date.now() + minutes * 60_000 : minutes);

  const previous = () => {
    if (player.currentTime > 3 || queue.index <= 0) player.seekTo(0);
    else goTo({ ...queue, index: queue.index - 1 });
  };

  function enqueue(song: Song, at: 'start' | 'end') {
    if (!current) return play(song);
    setQueue((q) => {
      const head = q.songs.slice(0, q.index + 1);
      const rest = q.songs.slice(q.index + 1).filter((s) => s.id !== song.id);
      return {
        ...q,
        songs: at === 'start' ? [...head, song, ...rest] : [...head, ...rest, song],
        autoplay: q.autoplay.filter((s) => s.id !== song.id),
      };
    });
  }

  const setUpNext = (songs: Song[]) => setQueue((q) => ({ ...q, songs: [...q.songs.slice(0, q.index + 1), ...songs] }));
  const setAutoplay = (autoplay: Song[]) => setQueue((q) => ({ ...q, autoplay }));

  // Re-subscribed on every render so the handler always advances from the latest queue.
  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (status) => {
      if (typeof sleepTimer === 'number' && Date.now() >= sleepTimer) {
        player.pause();
        setSleepTimerState(undefined);
        return;
      }
      // Streams never report finishing on time (see fixDurationHeader), so their end is when playback
      // crosses the real duration. Downloaded files have repaired headers and finish normally.
      const end = streamDuration ? streamDuration - 0.25 : undefined;
      const crossedEnd = end !== undefined && lastTime.current < end && status.currentTime >= end;
      // Count forward progress while playing; seeks show up as jumps and are ignored.
      const step = status.currentTime - lastTime.current;
      if (status.playing && step > 0 && step < 3) {
        unsavedListening.current += step;
        if (unsavedListening.current >= 10) flushListening();
      }
      lastTime.current = status.currentTime;
      if (!(end === undefined ? status.didJustFinish : crossedEnd)) return;
      if (sleepTimer === 'end') {
        player.pause();
        setSleepTimerState(undefined);
      } else if (repeat === 'one') {
        lastTime.current = 0;
        player.seekTo(0);
        player.play();
      } else {
        const q = advance(queue, repeat === 'all');
        if (q) goTo(q);
        else player.pause();
      }
    });
    return () => sub.remove();
  });

  return (
    <PlayerContext.Provider
      value={{
        player,
        current,
        upNext,
        autoplay: queue.autoplay,
        autoplaySeed: queue.seed,
        source,
        streamDuration,
        loading,
        repeat,
        shuffled,
        sleepTimer,
        cycleRepeat,
        toggleShuffle,
        setSleepTimer,
        play,
        shuffle,
        next,
        previous,
        playNext: (song) => enqueue(song, 'start'),
        addToQueue: (song) => enqueue(song, 'end'),
        jumpToUpNext: (i) => goTo({ ...queue, index: queue.index + 1 + i }),
        moveUpNext: (from, to) => setUpNext(moveItem(upNext, from, to)),
        removeUpNext: (i) => setUpNext(upNext.filter((_, j) => j !== i)),
        jumpToAutoplay: (i) =>
          goTo({
            ...queue,
            songs: [...queue.songs, queue.autoplay[i]],
            autoplay: queue.autoplay.slice(i + 1),
            index: queue.songs.length,
          }),
        moveAutoplay: (from, to) => setAutoplay(moveItem(queue.autoplay, from, to)),
        removeAutoplay: (i) => setAutoplay(queue.autoplay.filter((_, j) => j !== i)),
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
