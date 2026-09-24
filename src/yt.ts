import { Innertube } from 'youtubei.js';
import type { AudioQuality } from '@/settings';

export type Song = {
  id: string;
  title: string;
  artist: string;
  duration: number;
  artwork?: string;
};

// Don't set generate_session_locally: VISIONOS rejects locally generated visitor data with LOGIN_REQUIRED.
// The player script is skipped because VISIONOS URLs need no deciphering, and parsing it stalls Hermes for seconds.
const ytPromise = Innertube.create({ retrieve_player: false });

export async function searchSongs(query: string): Promise<Song[]> {
  const yt = await ytPromise;
  const res = await yt.music.search(query, { type: 'song' });
  return (res.songs?.contents ?? []).flatMap((item) =>
    item.id
      ? [{
          id: item.id,
          title: item.title ?? '',
          artist: item.artists?.map((a) => a.name).join(', ') ?? '',
          duration: item.duration?.seconds ?? 0,
          artwork: item.thumbnail?.contents[0]?.url,
        }]
      : [],
  );
}

// VISIONOS is the only client that returns plain AAC URLs serving the whole file without a PO token;
// others need tokens or 403 partway through a track. URLs expire after a few hours, so resolve right before use.
// 'high' is AAC at ~128 kbps (itag 140); 'normal' is HE-AAC at ~50 kbps (itag 139), under half the size.
export async function getAudio(id: string, quality: AudioQuality): Promise<{ url: string; duration: number }> {
  const yt = await ytPromise;
  const info = await yt.getBasicInfo(id, { client: 'VISIONOS' });
  const format = info.chooseFormat({ type: 'audio', format: 'mp4', quality: quality === 'high' ? 'best' : 'bestefficiency' });
  return { url: await format.decipher(yt.session.player), duration: format.approx_duration_ms / 1000 };
}
