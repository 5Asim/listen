import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { ProgressRing } from '@/components/ProgressRing';
import { useLibrary } from '@/library';
import { usePlayer } from '@/player';
import { colors, fonts } from '@/theme';
import { Song } from '@/yt';

// Play, Shuffle, and download-everything for a list of songs (a playlist, Liked Songs).
export function CollectionActions({ songs }: { songs: Song[] }) {
  const { play, shuffle } = usePlayer();
  const { progress, isDownloaded, downloadAll, cancelAll } = useLibrary();
  const downloaded = songs.filter((s) => isDownloaded(s.id)).length;
  const active = songs.filter((s) => s.id in progress);
  const fraction = (downloaded + active.reduce((sum, s) => sum + progress[s.id], 0)) / songs.length;

  let download;
  if (active.length) {
    download = (
      <Pressable style={styles.round} onPress={() => cancelAll(songs.map((s) => s.id))}>
        <ProgressRing progress={fraction} size={26} />
      </Pressable>
    );
  } else if (downloaded === songs.length) {
    download = (
      <View style={styles.round}>
        <Icon name="check_circle" size={26} color={colors.accent} />
      </View>
    );
  } else {
    download = (
      <Pressable style={styles.round} onPress={() => downloadAll(songs)}>
        <Icon name="arrow_circle_down" size={26} color={colors.text} />
      </Pressable>
    );
  }

  return (
    <View style={styles.row}>
      <Pressable style={[styles.button, styles.play]} onPress={() => play(songs[0], songs)}>
        <Icon name="play_arrow" size={22} color="#000000" />
        <Text style={[styles.label, { color: '#000000' }]}>Play</Text>
      </Pressable>
      <Pressable style={[styles.button, styles.surface]} onPress={() => shuffle(songs)}>
        <Icon name="shuffle" size={22} color={colors.text} />
        <Text style={styles.label}>Shuffle</Text>
      </Pressable>
      {download}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, height: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  play: { backgroundColor: colors.accent },
  surface: { backgroundColor: colors.surface },
  label: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  round: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
