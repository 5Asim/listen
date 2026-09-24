import { Innertube, YTNodes } from 'youtubei.js';
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

// Search results list artists under `artists`; chart playlists list them under `authors`.
function fromListItem(item: YTNodes.MusicResponsiveListItem): Song[] {
  if (!item.id) return [];
  return [{
    id: item.id,
    title: item.title ?? '',
    artist: (item.artists ?? item.authors)?.map((a) => a.name).join(', ') ?? '',
    duration: item.duration?.seconds ?? 0,
    artwork: item.thumbnail?.contents[0]?.url,
  }];
}

export async function searchSongs(query: string): Promise<Song[]> {
  const yt = await ytPromise;
  const res = await yt.music.search(query, { type: 'song' });
  return (res.songs?.contents ?? []).flatMap(fromListItem);
}

// YouTube Music has song charts only globally; for India the closest chart is music videos.
export const charts = [
  { key: 'global', title: 'Trending Global', playlistId: 'PL4fGSI1pDJn6puJdseH2Rt9sMvt9E2M4i' },
  { key: 'india', title: 'Trending in India', playlistId: 'PL4fGSI1pDJn40WjZ6utkIuj2rNg-7iGsq' },
] as const;

export async function getChart(playlistId: string): Promise<Song[]> {
  const yt = await ytPromise;
  const playlist = await yt.music.getPlaylist(playlistId);
  return (playlist.items ?? []).flatMap((item) => (item.is(YTNodes.MusicResponsiveListItem) ? fromListItem(item) : []));
}

// YouTube Music's automix: the related songs it would play after this one.
export async function getRadio(id: string): Promise<Song[]> {
  const yt = await ytPromise;
  const panel = await yt.music.getUpNext(id, true);
  return panel.contents.flatMap((item) =>
    item.is(YTNodes.PlaylistPanelVideo) && item.video_id !== id
      ? [{
          id: item.video_id,
          title: item.title.toString(),
          artist: item.artists?.map((a) => a.name).join(', ') ?? item.author ?? '',
          duration: item.duration.seconds,
          artwork: item.thumbnail[0]?.url,
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
