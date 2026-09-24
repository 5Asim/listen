import { router } from 'expo-router';
import { Song } from '@/yt';

export type SongMenuParams = {
  id: string;
  title: string;
  artist: string;
  duration: string;
  artwork?: string;
  showPlay?: '1';
  mode?: 'playlists';
  playlistId?: string;
};

type Options = { showPlay?: boolean; mode?: 'playlists'; playlistId?: number };

export function openSongMenu(song: Song, { showPlay = true, mode, playlistId }: Options = {}) {
  const params: SongMenuParams = {
    id: song.id,
    title: song.title,
    artist: song.artist,
    duration: String(song.duration),
    artwork: song.artwork,
    showPlay: showPlay ? '1' : undefined,
    mode,
    playlistId: playlistId === undefined ? undefined : String(playlistId),
  };
  router.push({ pathname: '/song-menu', params });
}
