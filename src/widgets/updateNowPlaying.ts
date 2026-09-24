import { Directory, File } from 'expo-file-system';
import { widgetsDirectory } from 'expo-widgets';
import NowPlaying from '@/widgets/NowPlaying';
import { Song } from '@/yt';

// The widget can only read images from the shared App Group folder, so artwork is copied there first.
// Each song gets its own file name so the widget never reads a half-written image; older files are removed.
export async function updateNowPlayingWidget(song: Song) {
  let artworkUri: string | undefined;
  if (song.artwork && widgetsDirectory) {
    const dir = new Directory(widgetsDirectory);
    const file = new File(dir, `art-${song.id.replace(/\W/g, '')}.jpg`);
    try {
      if (!file.exists) {
        if (song.artwork.startsWith('file:')) await new File(song.artwork).copy(file);
        else await File.downloadFileAsync(song.artwork, file);
      }
      artworkUri = file.uri;
      for (const item of dir.list()) {
        if (item instanceof File && item.name.startsWith('art-') && item.name !== file.name) item.delete();
      }
    } catch {
      // Offline or a bad URL: show the song without artwork rather than skipping the update.
    }
  }
  NowPlaying.updateSnapshot({ title: song.title, artist: song.artist, artworkUri });
}
