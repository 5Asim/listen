import { useAudioPlayerStatus } from 'expo-audio';
import { router } from 'expo-router';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { LikeButton } from '@/components/LikeButton';
import { usePlayer } from '@/player';
import { colors, fonts } from '@/theme';

export function MiniPlayer() {
  const { player, current, streamDuration, loading } = usePlayer();
  const status = useAudioPlayerStatus(player);
  if (!current) return null;

  const duration = streamDuration ?? status.duration;
  const progress = duration ? Math.min(status.currentTime / duration, 1) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View style={[styles.progress, { width: `${progress * 100}%` }]} />
      </View>
      <Pressable style={styles.content} onPress={() => router.push('/player')}>
        <Image source={{ uri: current.artwork }} style={styles.art} />
        <View style={styles.text}>
          <Text numberOfLines={1} style={styles.title}>{current.title}</Text>
          <Text numberOfLines={1} style={styles.artist}>{current.artist}</Text>
        </View>
        <View style={styles.controls}>
          <LikeButton song={current} />
          {loading || status.isBuffering ? (
            <View style={styles.button}>
              <ActivityIndicator color={colors.muted} />
            </View>
          ) : (
            <Pressable style={styles.button} onPress={() => (status.playing ? player.pause() : player.play())}>
              <Icon name={status.playing ? 'pause' : 'play_arrow'} size={28} color={colors.text} />
            </Pressable>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  track: { height: 2, backgroundColor: colors.surface2 },
  progress: { height: 2, backgroundColor: colors.accent },
  content: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 64, paddingHorizontal: 12 },
  art: { width: 48, height: 48, borderRadius: 8, backgroundColor: colors.surface2 },
  text: { flex: 1, gap: 2 },
  controls: { flexDirection: 'row', alignItems: 'center' },
  title: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  artist: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
