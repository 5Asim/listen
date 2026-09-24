import { useAudioPlayerStatus } from 'expo-audio';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, GestureResponderEvent, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { LikeButton } from '@/components/LikeButton';
import { ProgressRing } from '@/components/ProgressRing';
import { formatTime } from '@/format';
import { useLibrary } from '@/library';
import { usePlayer } from '@/player';
import { openSongMenu } from '@/songMenu';
import { colors, fonts } from '@/theme';

function SeekBar({ position, duration, onSeek }: { position: number; duration: number; onSeek: (seconds: number) => void }) {
  const [width, setWidth] = useState(0);
  const [dragFraction, setDragFraction] = useState<number | null>(null);
  const fractionAt = (e: GestureResponderEvent) => (width ? Math.min(Math.max(e.nativeEvent.locationX / width, 0), 1) : 0);
  const fraction = dragFraction ?? (duration ? Math.min(position / duration, 1) : 0);
  const shown = fraction * duration;

  return (
    <View
      style={styles.seek}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => duration > 0}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(e) => setDragFraction(fractionAt(e))}
      onResponderMove={(e) => setDragFraction(fractionAt(e))}
      onResponderRelease={(e) => {
        onSeek(fractionAt(e) * duration);
        setDragFraction(null);
      }}
    >
      {/* Children ignore touches so locationX is always measured against the full-width container. */}
      <View pointerEvents="none" style={styles.seekTrack}>
        <View style={[styles.seekFill, { width: `${fraction * 100}%` }]} />
      </View>
      <View pointerEvents="none" style={styles.seekTimes}>
        <Text style={styles.time}>{formatTime(shown)}</Text>
        <Text style={styles.time}>−{formatTime(duration - shown)}</Text>
      </View>
    </View>
  );
}

function DownloadAction() {
  const { current } = usePlayer();
  const { progress, isDownloaded, download, cancel, remove } = useLibrary();
  if (!current) return null;
  const downloading = progress[current.id];

  if (downloading !== undefined) {
    return (
      <Pressable style={styles.action} onPress={() => cancel(current.id)}>
        <ProgressRing progress={downloading} />
        <Text style={styles.actionLabel}>{Math.round(downloading * 100)}%</Text>
      </Pressable>
    );
  }
  if (isDownloaded(current.id)) {
    return (
      <Pressable
        style={styles.action}
        onPress={() =>
          Alert.alert('Remove download?', `"${current.title}" will be removed from this iPhone.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => remove(current) },
          ])
        }
      >
        <Icon name="check_circle" color={colors.accent} />
        <Text style={styles.actionLabel}>Downloaded</Text>
      </Pressable>
    );
  }
  return (
    <Pressable style={styles.action} onPress={() => download(current)}>
      <Icon name="cloud_download" color={colors.accent} />
      <Text style={[styles.actionLabel, { color: colors.accent }]}>Download</Text>
    </Pressable>
  );
}

export default function NowPlayingScreen() {
  const { player, current, upNext, source, streamDuration, loading, next, previous } = usePlayer();
  const status = useAudioPlayerStatus(player);
  if (!current) return null;

  const duration = streamDuration ?? (status.duration || current.duration);

  return (
    <View style={styles.container}>
      <View style={styles.grabberArea}>
        <View style={styles.grabber} />
      </View>
      <View style={styles.header}>
        <Pressable style={styles.tapTarget} onPress={() => router.back()}>
          <Icon name="keyboard_arrow_down" size={30} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <Pressable style={styles.tapTarget} onPress={() => openSongMenu(current, { showPlay: false })}>
          <Icon name="more_horiz" size={26} color={colors.text} />
        </Pressable>
      </View>
      <View style={styles.content}>
        <Image source={{ uri: current.artwork }} style={styles.artwork} />
        <View style={styles.infoRow}>
          <View style={styles.info}>
            <Text numberOfLines={1} style={styles.title}>{current.title}</Text>
            <Text numberOfLines={1} style={styles.artist}>{current.artist}</Text>
          </View>
          <View style={styles.badge}>
            <Icon name={source === 'file' ? 'check_circle' : 'wifi'} size={14} color={colors.accent} />
            <Text style={styles.badgeLabel}>{source === 'file' ? 'Downloaded' : 'Streaming'}</Text>
          </View>
          <LikeButton song={current} size={28} />
        </View>
        <SeekBar position={status.currentTime} duration={duration} onSeek={(s) => player.seekTo(s)} />
        <View style={styles.controls}>
          <Pressable style={styles.tapTarget} onPress={previous}>
            <Icon name="skip_previous" size={40} color={colors.text} />
          </Pressable>
          <Pressable style={styles.playButton} onPress={() => (status.playing ? player.pause() : player.play())}>
            {loading || status.isBuffering ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Icon name={status.playing ? 'pause' : 'play_arrow'} size={40} color="#000000" />
            )}
          </Pressable>
          <Pressable
            style={[styles.tapTarget, upNext.length === 0 && styles.disabled]}
            disabled={upNext.length === 0}
            onPress={next}
          >
            <Icon name="skip_next" size={40} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.secondary}>
          <DownloadAction />
          <Pressable style={styles.action} onPress={() => openSongMenu(current, { showPlay: false, mode: 'playlists' })}>
            <Icon name="playlist_add" color={colors.text} />
            <Text style={styles.actionLabel}>Add</Text>
          </Pressable>
          <Pressable style={styles.action} onPress={() => router.push('/queue')}>
            <Icon name="queue_music" color={colors.text} />
            <Text style={styles.actionLabel}>Queue</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  grabberArea: { height: 20, alignItems: 'center', justifyContent: 'center' },
  grabber: { width: 36, height: 5, borderRadius: 3, backgroundColor: colors.separator },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: 8,
  },
  headerTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  tapTarget: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, gap: 20, paddingTop: 10, paddingHorizontal: 20, paddingBottom: 28 },
  artwork: { width: '100%', aspectRatio: 1, borderRadius: 16, backgroundColor: colors.surface2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  info: { flex: 1, gap: 4 },
  title: { fontFamily: fonts.bold, fontSize: 26, color: colors.text },
  artist: { fontFamily: fonts.regular, fontSize: 17, color: colors.muted },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  badgeLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
  seek: { height: 44, gap: 7, justifyContent: 'center' },
  seekTrack: { height: 4, borderRadius: 2, backgroundColor: colors.surface2, overflow: 'hidden' },
  seekFill: { height: 4, backgroundColor: colors.accent },
  seekTimes: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 40, height: 82 },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.3 },
  secondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', height: 60 },
  action: { width: 88, height: 56, gap: 3, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
});
