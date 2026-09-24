import Storage from 'expo-sqlite/kv-store';
import { Song } from '@/yt';

const MAX_AGE = 6 * 60 * 60 * 1000;

type Entry = { at: number; songs: Song[] };

const read = (key: string): Entry | undefined => {
  const raw = Storage.getItemSync(`home:${key}`);
  return raw ? JSON.parse(raw) : undefined;
};

export const peekCached = (key: string) => read(key)?.songs;

// Home content is cached so the screen opens instantly, works offline, and doesn't refetch charts on every launch.
export async function fetchCached(key: string, fetcher: () => Promise<Song[]>, force = false) {
  const hit = read(key);
  if (hit && !force && Date.now() - hit.at < MAX_AGE) return hit.songs;
  try {
    const songs = await fetcher();
    Storage.setItemSync(`home:${key}`, JSON.stringify({ at: Date.now(), songs }));
    return songs;
  } catch (e) {
    if (hit) return hit.songs;
    throw e;
  }
}
