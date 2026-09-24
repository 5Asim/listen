import { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/theme';
import { Song } from '@/yt';

// Row for reorderable lists (playlist, queue): fixed height, opaque so swipe actions stay hidden behind it.
export function ListRow({
  song,
  subtitle,
  compact,
  highlighted,
  trailing,
  onPress,
  onLongPress,
}: {
  song: Song;
  subtitle: string;
  compact?: boolean;
  highlighted?: boolean;
  trailing: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const art = compact ? 44 : 48;
  return (
    <Pressable
      style={[styles.row, { height: compact ? 56 : 64, gap: compact ? 10 : 12 }]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <Image source={{ uri: song.artwork }} style={[styles.art, { width: art, height: art }]} />
      <View style={styles.text}>
        <Text
          numberOfLines={1}
          style={[styles.title, { fontSize: compact ? 15 : 16 }, highlighted && { color: colors.accent }]}
        >
          {song.title}
        </Text>
        <Text numberOfLines={1} style={[styles.subtitle, { fontSize: compact ? 12 : 13 }]}>
          {subtitle}
        </Text>
      </View>
      {trailing}
    </Pressable>
  );
}

export const ROW_HEIGHT = { compact: 56, regular: 64 };

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, backgroundColor: colors.bg },
  art: { borderRadius: 8, backgroundColor: colors.surface2 },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.semibold, color: colors.text },
  subtitle: { fontFamily: fonts.regular, color: colors.muted },
});
