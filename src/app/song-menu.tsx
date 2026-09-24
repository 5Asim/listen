import { router, useLocalSearchParams } from 'expo-router';
import { ReactNode, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { HeartIcon } from '@/components/LikeButton';
import { ProgressRing } from '@/components/ProgressRing';
import { useLibrary } from '@/library';
import { usePlayer } from '@/player';
import { SongMenuParams } from '@/songMenu';
import { colors, fonts } from '@/theme';
import { Song } from '@/yt';

function Row({ icon, label, color = colors.text, detail, onPress }: {
  icon: ReactNode;
  label: string;
  color?: string;
  detail?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={[styles.rowLabel, { color }]}>{label}</Text>
      {detail && <Text style={styles.rowDetail}>{detail}</Text>}
    </Pressable>
  );
}

export default function SongMenuSheet() {
  const params = useLocalSearchParams<SongMenuParams>();
  const song: Song = {
    id: params.id,
    title: params.title,
    artist: params.artist,
    duration: Number(params.duration),
    artwork: params.artwork,
  };
  const { play, playNext, addToQueue } = usePlayer();
  const {
    progress,
    isDownloaded,
    download,
    cancel,
    remove,
    playlists,
    addToPlaylist,
    createPlaylist,
    removeFromPlaylist,
    isLiked,
    toggleLike,
  } = useLibrary();
  const [mode, setMode] = useState(params.mode ?? 'actions');
  const insets = useSafeAreaInsets();
  const downloading = progress[song.id];

  // Close first so any follow-up alert (e.g. the cellular prompt) appears over the screen, not the sheet.
  const closeThen = (action: () => void) => {
    router.back();
    action();
  };

  function newPlaylist() {
    Alert.prompt('New Playlist', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Create',
        onPress: (name?: string) => {
          if (!name?.trim()) return;
          const id = createPlaylist(name.trim());
          closeThen(() => addToPlaylist(id, song));
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.header}>
        {mode === 'playlists' && params.mode !== 'playlists' ? (
          <Pressable style={styles.back} onPress={() => setMode('actions')}>
            <Icon name="chevron_left" size={28} color={colors.text} />
          </Pressable>
        ) : (
          <Image source={{ uri: song.artwork }} style={styles.art} />
        )}
        <View style={styles.headerText}>
          <Text numberOfLines={1} style={styles.title}>{mode === 'playlists' ? 'Add to Playlist' : song.title}</Text>
          <Text numberOfLines={1} style={styles.artist}>{mode === 'playlists' ? song.title : song.artist}</Text>
        </View>
      </View>

      {mode === 'actions' ? (
        <View>
          {params.showPlay && (
            <Row
              icon={<Icon name="play_arrow" color={colors.text} />}
              label="Play"
              onPress={() => closeThen(() => play(song))}
            />
          )}
          <Row
            icon={<Icon name="queue_play_next" color={colors.text} />}
            label="Play Next"
            onPress={() => closeThen(() => playNext(song))}
          />
          <Row
            icon={<Icon name="add_to_queue" color={colors.text} />}
            label="Add to Queue"
            onPress={() => closeThen(() => addToQueue(song))}
          />
          <Row
            icon={<HeartIcon liked={isLiked(song.id)} />}
            label={isLiked(song.id) ? 'Remove from Liked Songs' : 'Like'}
            onPress={() => closeThen(() => toggleLike(song))}
          />
          <Row
            icon={<Icon name="playlist_add" color={colors.text} />}
            label="Add to Playlist"
            onPress={() => setMode('playlists')}
          />
          {params.playlistId && (
            <Row
              icon={<Icon name="playlist_remove" color={colors.danger} />}
              label="Remove from Playlist"
              color={colors.danger}
              onPress={() => closeThen(() => removeFromPlaylist(Number(params.playlistId), song.id))}
            />
          )}
          {downloading !== undefined ? (
            <Row
              icon={<ProgressRing progress={downloading} />}
              label="Cancel Download"
              detail={`${Math.round(downloading * 100)}%`}
              onPress={() => closeThen(() => cancel(song.id))}
            />
          ) : isDownloaded(song.id) ? (
            <Row
              icon={<Icon name="delete" color={colors.danger} />}
              label="Remove Download"
              color={colors.danger}
              onPress={() => closeThen(() => remove(song))}
            />
          ) : (
            <Row
              icon={<Icon name="arrow_circle_down" color={colors.text} />}
              label="Download"
              onPress={() => closeThen(() => download(song))}
            />
          )}
        </View>
      ) : (
        <ScrollView style={styles.playlists}>
          <Row icon={<Icon name="add" color={colors.accent} />} label="New Playlist" color={colors.accent} onPress={newPlaylist} />
          {playlists.map((p) => (
            <Row
              key={p.id}
              icon={<Icon name="queue_music" color={colors.muted} />}
              label={p.name}
              detail={`${p.count} ${p.count === 1 ? 'song' : 'songs'}`}
              onPress={() => closeThen(() => addToPlaylist(p.id, song))}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.surface, paddingTop: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  art: { width: 56, height: 56, borderRadius: 8, backgroundColor: colors.surface2 },
  back: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, gap: 3 },
  title: { fontFamily: fonts.semibold, fontSize: 17, color: colors.text },
  artist: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, height: 52, paddingHorizontal: 20 },
  pressed: { backgroundColor: colors.surface2 },
  rowIcon: { width: 28, alignItems: 'center' },
  rowLabel: { flex: 1, fontFamily: fonts.regular, fontSize: 16 },
  rowDetail: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  playlists: { maxHeight: 360 },
});
