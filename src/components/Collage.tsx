import { Image, StyleSheet, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { colors } from '@/theme';

export function Collage({ artworks, size, radius }: { artworks: string[]; size: number; radius: number }) {
  const box = { width: size, height: size, borderRadius: radius };

  if (artworks.length === 0) {
    return (
      <View style={[box, styles.empty]}>
        <Icon name="queue_music" size={size * 0.3} color={colors.muted} />
      </View>
    );
  }
  if (artworks.length < 4) return <Image source={{ uri: artworks[0] }} style={[box, styles.empty]} />;
  return (
    <View style={[box, styles.grid]}>
      {artworks.map((uri, i) => (
        <Image key={i} source={{ uri }} style={{ width: size / 2, height: size / 2 }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', overflow: 'hidden', backgroundColor: colors.surface },
});
