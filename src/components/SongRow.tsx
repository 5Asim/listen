import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { formatTime } from '@/format';
import { useLibrary } from '@/library';
import { openSongMenu } from '@/songMenu';
import { colors, fonts } from '@/theme';
import { Song } from '@/yt';

type Props = { song: Song; active: boolean; disabled?: boolean; onPress: () => void };

export function SongRow({ song, active, disabled, onPress }: Props) {
  const { progress, isDownloaded } = useLibrary();
  const downloading = progress[song.id];

  return (
    <Pressable
      style={[styles.row, disabled && styles.disabled]}
      disabled={disabled}
      onPress={onPress}
      onLongPress={() => openSongMenu(song)}
    >
      <Image source={{ uri: song.artwork }} style={styles.art} />
      <View style={styles.text}>
        <Text numberOfLines={1} style={[styles.title, active && { color: colors.accent }]}>
          {song.title}
        </Text>
        <View style={styles.subtitleRow}>
          {isDownloaded(song.id) && <Icon name="check_circle" size={14} color={colors.accent} />}
          <Text numberOfLines={1} style={styles.subtitle}>
            {song.artist} ·{' '}
            {downloading !== undefined ? `Downloading ${Math.round(downloading * 100)}%` : formatTime(song.duration)}
          </Text>
        </View>
      </View>
      <Pressable style={styles.button} disabled={disabled} onPress={() => openSongMenu(song)}>
        <Icon name="more_horiz" color={colors.muted} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 64, paddingHorizontal: 16 },
  disabled: { opacity: 0.35 },
  art: { width: 48, height: 48, borderRadius: 8, backgroundColor: colors.surface2 },
  text: { flex: 1, gap: 3 },
  title: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  subtitle: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
