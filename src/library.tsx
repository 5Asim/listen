import { Directory, DownloadTask, File, FileMode, Paths } from 'expo-file-system';
import { getNetworkStateAsync, NetworkStateType } from 'expo-network';
import { openDatabaseSync } from 'expo-sqlite';
import Storage from 'expo-sqlite/kv-store';
import { createContext, ReactNode, useContext, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { getAudio, Song } from '@/yt';

export type LibrarySong = Song & { addedAt: number };
export type Playlist = { id: number; name: string; count: number; duration: number; artworks: string[] };

type SongRecord = {
  id: string;
  title: string;
  artist: string;
  duration: number;
  artwork: string | null;
  added_at: number;
};

const db = openDatabaseSync('listen.db');
db.execSync(`PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS songs (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  duration INTEGER NOT NULL,
  artwork TEXT,
  added_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS playlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS playlist_songs (
  playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  song_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  duration INTEGER NOT NULL,
  artwork TEXT,
  position INTEGER NOT NULL,
  PRIMARY KEY (playlist_id, song_id)
);
CREATE TABLE IF NOT EXISTS liked_songs (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  duration INTEGER NOT NULL,
  artwork TEXT,
  added_at INTEGER NOT NULL
)`);

const songsDir = new Directory(Paths.document, 'songs');
songsDir.create({ idempotent: true });

// Files are located by song id rather than a stored URI: the app container path changes between installs.
const audioFile = (id: string) => new File(songsDir, `${id}.m4a`);
const artworkFile = (id: string) => new File(songsDir, `${id}.jpg`);

// YouTube's fragmented m4a files also store the full length in the moov header, and AVPlayer adds that to the
// fragments' own length: it reports double the duration and keeps "playing" silence past the real end.
// Zeroing the header durations makes AVPlayer derive the length from the fragments alone.
function fixDurationHeader(file: File) {
  const handle = file.open(FileMode.ReadWrite);
  try {
    const head = handle.readBytes(Math.min(file.size, 64 * 1024));
    const view = new DataView(head.buffer);
    // [box type, duration offset from the type field for version 0, for version 1]
    const boxes: [string, number, number][] = [
      ['mvhd', 20, 28],
      ['tkhd', 24, 32],
      ['mdhd', 20, 28],
    ];
    for (const [type, v0, v1] of boxes) {
      const i = head.findIndex((_, j) => String.fromCharCode(...head.subarray(j, j + 4)) === type);
      if (i < 0) continue;
      if (head[i + 4] === 0) view.setUint32(i + v0, 0);
      else view.setBigUint64(i + v1, 0n);
    }
    handle.offset = 0;
    handle.writeBytes(head);
  } finally {
    handle.close();
  }
}

// Songs downloaded before fixDurationHeader existed need the same one-time repair.
if (Storage.getItemSync('durationHeadersFixed') !== '1') {
  for (const item of songsDir.list()) {
    if (item instanceof File && item.name.endsWith('.m4a')) fixDurationHeader(item);
  }
  Storage.setItemSync('durationHeadersFixed', '1');
}

export function localAudioUri(id: string) {
  const file = audioFile(id);
  return file.exists ? file.uri : undefined;
}

export const isWifiOnly = () => Storage.getItemSync('wifiOnly') !== 'false';

function loadSongs(table: 'songs' | 'liked_songs'): LibrarySong[] {
  return db.getAllSync<SongRecord>(`SELECT * FROM ${table} ORDER BY added_at DESC`).map((r) => {
    return {
      id: r.id,
      title: r.title,
      artist: r.artist,
      duration: r.duration,
      artwork: localOr(r.id, r.artwork),
      addedAt: r.added_at,
    };
  });
}

const localOr = (id: string, remote: string | null) => {
  const art = artworkFile(id);
  return art.exists ? art.uri : (remote ?? undefined);
};

function loadPlaylists(): Playlist[] {
  return db
    .getAllSync<Omit<Playlist, 'artworks'>>(
      `SELECT p.id, p.name, COUNT(ps.song_id) AS count, COALESCE(SUM(ps.duration), 0) AS duration
       FROM playlists p LEFT JOIN playlist_songs ps ON ps.playlist_id = p.id
       GROUP BY p.id ORDER BY p.created_at DESC`,
    )
    .map((p) => ({
      ...p,
      artworks: db
        .getAllSync<{ song_id: string; artwork: string | null }>(
          'SELECT song_id, artwork FROM playlist_songs WHERE playlist_id = ? ORDER BY position LIMIT 4',
          p.id,
        )
        .flatMap((r) => localOr(r.song_id, r.artwork) ?? []),
    }));
}

export function loadPlaylistSongs(playlistId: number): Song[] {
  return db
    .getAllSync<{ song_id: string; title: string; artist: string; duration: number; artwork: string | null }>(
      'SELECT song_id, title, artist, duration, artwork FROM playlist_songs WHERE playlist_id = ? ORDER BY position',
      playlistId,
    )
    .map((r) => ({ id: r.song_id, title: r.title, artist: r.artist, duration: r.duration, artwork: localOr(r.song_id, r.artwork) }));
}

async function allowedOnCurrentNetwork() {
  if (!isWifiOnly()) return true;
  const { type } = await getNetworkStateAsync();
  if (type !== NetworkStateType.CELLULAR) return true;
  return new Promise<boolean>((resolve) =>
    Alert.alert('Download on cellular?', 'Download on Wi-Fi only is turned on.', [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Download', onPress: () => resolve(true) },
    ]),
  );
}

// Downloaded songs carry a local artwork path, which goes stale after reinstall; store the remote URL instead.
function remoteArtwork(song: Song) {
  if (!song.artwork?.startsWith('file:')) return song.artwork ?? null;
  return db.getFirstSync<{ artwork: string | null }>('SELECT artwork FROM songs WHERE id = ?', song.id)?.artwork ?? null;
}

function deleteIfExists(file: File) {
  if (file.exists) file.delete();
}

type LibraryContextValue = {
  songs: LibrarySong[];
  progress: Record<string, number>;
  isDownloaded: (id: string) => boolean;
  download: (song: Song) => Promise<void>;
  cancel: (id: string) => void;
  remove: (song: Song) => void;
  playlists: Playlist[];
  addToPlaylist: (playlistId: number, song: Song) => void;
  createPlaylist: (name: string) => number;
  renamePlaylist: (id: number, name: string) => void;
  deletePlaylist: (id: number) => void;
  reorderPlaylist: (id: number, songIds: string[]) => void;
  removeFromPlaylist: (id: number, songId: string) => void;
  liked: LibrarySong[];
  isLiked: (id: string) => boolean;
  toggleLike: (song: Song) => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [songs, setSongs] = useState(() => loadSongs('songs'));
  const [liked, setLiked] = useState(() => loadSongs('liked_songs'));
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [playlists, setPlaylists] = useState(loadPlaylists);
  const tasks = useRef(new Map<string, DownloadTask>());
  const cancelled = useRef(new Set<string>());
  const downloadedIds = useMemo(() => new Set(songs.map((s) => s.id)), [songs]);
  const likedIds = useMemo(() => new Set(liked.map((s) => s.id)), [liked]);

  function setSongProgress(id: string, value?: number) {
    setProgress((p) => {
      const next = { ...p };
      if (value === undefined) delete next[id];
      else next[id] = value;
      return next;
    });
  }

  async function download(song: Song) {
    if (song.id in progress || downloadedIds.has(song.id)) return;
    if (!(await allowedOnCurrentNetwork())) return;
    cancelled.current.delete(song.id);
    setSongProgress(song.id, 0);
    const file = audioFile(song.id);
    try {
      const { url } = await getAudio(song.id);
      if (cancelled.current.has(song.id)) return;
      deleteIfExists(file);
      let lastPercent = 0;
      const task = File.createDownloadTask(url, file, {
        // Without a Range header YouTube throttles the transfer to roughly playback speed.
        headers: { Range: 'bytes=0-' },
        onProgress: ({ bytesWritten, totalBytes }) => {
          // Re-render once per percent, not on every network chunk.
          const percent = totalBytes > 0 ? Math.floor((bytesWritten / totalBytes) * 100) : 0;
          if (percent === lastPercent) return;
          lastPercent = percent;
          setSongProgress(song.id, percent / 100);
        },
      });
      tasks.current.set(song.id, task);
      await task.downloadAsync();
      fixDurationHeader(file);
      if (song.artwork) {
        const art = artworkFile(song.id);
        deleteIfExists(art);
        await File.downloadFileAsync(song.artwork, art).catch(() => {});
      }
      db.runSync(
        'INSERT OR REPLACE INTO songs (id, title, artist, duration, artwork, added_at) VALUES (?, ?, ?, ?, ?, ?)',
        song.id,
        song.title,
        song.artist,
        song.duration,
        song.artwork ?? null,
        Date.now(),
      );
      setSongs(loadSongs('songs'));
    } catch (e) {
      deleteIfExists(file);
      if (!cancelled.current.has(song.id)) Alert.alert("Couldn't download this song", String(e));
    } finally {
      tasks.current.delete(song.id);
      setSongProgress(song.id);
    }
  }

  function cancel(id: string) {
    cancelled.current.add(id);
    tasks.current.get(id)?.cancel();
  }

  function remove(song: Song) {
    deleteIfExists(audioFile(song.id));
    deleteIfExists(artworkFile(song.id));
    db.runSync('DELETE FROM songs WHERE id = ?', song.id);
    setSongs(loadSongs('songs'));
  }

  function addToPlaylist(playlistId: number, song: Song) {
    db.runSync(
      `INSERT OR IGNORE INTO playlist_songs (playlist_id, song_id, title, artist, duration, artwork, position)
       VALUES (?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(position), -1) + 1 FROM playlist_songs WHERE playlist_id = ?))`,
      playlistId,
      song.id,
      song.title,
      song.artist,
      song.duration,
      remoteArtwork(song),
      playlistId,
    );
    setPlaylists(loadPlaylists());
  }

  function createPlaylist(name: string) {
    const { lastInsertRowId } = db.runSync('INSERT INTO playlists (name, created_at) VALUES (?, ?)', name, Date.now());
    setPlaylists(loadPlaylists());
    return lastInsertRowId;
  }

  function renamePlaylist(id: number, name: string) {
    db.runSync('UPDATE playlists SET name = ? WHERE id = ?', name, id);
    setPlaylists(loadPlaylists());
  }

  function deletePlaylist(id: number) {
    db.runSync('DELETE FROM playlists WHERE id = ?', id);
    setPlaylists(loadPlaylists());
  }

  function reorderPlaylist(id: number, songIds: string[]) {
    db.withTransactionSync(() => {
      songIds.forEach((songId, position) =>
        db.runSync('UPDATE playlist_songs SET position = ? WHERE playlist_id = ? AND song_id = ?', position, id, songId),
      );
    });
    setPlaylists(loadPlaylists());
  }

  function removeFromPlaylist(id: number, songId: string) {
    db.runSync('DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?', id, songId);
    setPlaylists(loadPlaylists());
  }

  function toggleLike(song: Song) {
    if (likedIds.has(song.id)) {
      db.runSync('DELETE FROM liked_songs WHERE id = ?', song.id);
    } else {
      db.runSync(
        'INSERT INTO liked_songs (id, title, artist, duration, artwork, added_at) VALUES (?, ?, ?, ?, ?, ?)',
        song.id,
        song.title,
        song.artist,
        song.duration,
        remoteArtwork(song),
        Date.now(),
      );
    }
    setLiked(loadSongs('liked_songs'));
  }

  const isDownloaded = (id: string) => downloadedIds.has(id);
  const isLiked = (id: string) => likedIds.has(id);

  return (
    <LibraryContext.Provider value={{ songs, progress, isDownloaded, download, cancel, remove, playlists, addToPlaylist, createPlaylist, renamePlaylist, deletePlaylist, reorderPlaylist, removeFromPlaylist, liked, isLiked, toggleLike }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const value = useContext(LibraryContext);
  if (!value) throw new Error('useLibrary must be used inside LibraryProvider');
  return value;
}
