import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ActionSheetIOS, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Collage } from '@/components/Collage';
import { Icon } from '@/components/Icon';
import { ListRow, ROW_HEIGHT } from '@/components/ListRow';
import { ReorderableList } from '@/components/ReorderableList';
import { StateMessage } from '@/components/StateMessage';
import { SwipeToRemove } from '@/components/SwipeToRemove';
import { formatTime } from '@/format';
import { loadPlaylistSongs, useLibrary } from '@/library';
import { moveItem } from '@/list';
import { usePlayer } from '@/player';
import { openSongMenu } from '@/songMenu';
import { colors, fonts } from '@/theme';

function formatTotal(seconds: number) {
  const minutes = Math.round(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)} hr ${minutes % 60} min` : `${minutes} min`;
}

export default function PlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const playlistId = Number(id);
  const { playlists, renamePlaylist, deletePlaylist, reorderPlaylist, removeFromPlaylist } = useLibrary();
  const { current, play, shuffle } = usePlayer();
  const playlist = playlists.find((p) => p.id === playlistId);
  // `playlist` is a fresh object after every playlist edit, which is the signal to re-read its songs.
  const songs = useMemo(() => (playlist ? loadPlaylistSongs(playlist.id) : []), [playlist]);

  if (!playlist) return null;

  function showMore() {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: playlist!.name,
        options: ['Rename', 'Delete Playlist', 'Cancel'],
        destructiveButtonIndex: 1,
        cancelButtonIndex: 2,
        userInterfaceStyle: 'dark',
      },
      (i) => {
        if (i === 0) {
          Alert.prompt(
            'Rename Playlist',
            undefined,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Save', onPress: (name?: string) => name?.trim() && renamePlaylist(playlistId, name.trim()) },
            ],
            'plain-text',
            playlist!.name,
          );
        } else if (i === 1) {
          Alert.alert('Delete playlist?', `"${playlist!.name}" will be deleted. Downloaded songs stay in your library.`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                router.back();
                deletePlaylist(playlistId);
              },
            },
          ]);
        }
      },
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.nav}>
        <Pressable style={styles.tapTarget} onPress={() => router.back()}>
          <Icon name="chevron_left" size={30} color={colors.accent} />
        </Pressable>
        <Pressable style={styles.tapTarget} onPress={showMore}>
          <Icon name="more_horiz" size={26} color={colors.text} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.padded}>
          <View style={styles.header}>
            <Collage artworks={playlist.artworks} size={144} radius={16} />
            <View style={styles.info}>
              <Text numberOfLines={2} style={styles.name}>{playlist.name}</Text>
              <Text style={styles.meta}>
                {playlist.count} {playlist.count === 1 ? 'song' : 'songs'}
              </Text>
              {playlist.count > 0 && <Text style={styles.meta}>{formatTotal(playlist.duration)}</Text>}
            </View>
          </View>
          {songs.length > 0 && (
            <>
              <View style={styles.actions}>
                <Pressable style={[styles.button, styles.playButton]} onPress={() => play(songs[0], songs)}>
                  <Icon name="play_arrow" size={22} color="#000000" />
                  <Text style={[styles.buttonLabel, { color: '#000000' }]}>Play</Text>
                </Pressable>
                <Pressable style={[styles.button, styles.shuffleButton]} onPress={() => shuffle(songs)}>
                  <Icon name="shuffle" size={22} color={colors.text} />
                  <Text style={styles.buttonLabel}>Shuffle</Text>
                </Pressable>
              </View>
              <Text style={styles.sectionLabel}>SONGS</Text>
            </>
          )}
        </View>
        {songs.length === 0 ? (
          <StateMessage
            icon={<Icon name="queue_music" size={42} color={colors.muted} />}
            title="No songs yet"
            description="Tap ⋯ on any song and choose Add to Playlist."
          />
        ) : (
          <ReorderableList
            data={songs}
            keyOf={(s) => s.id}
            rowHeight={ROW_HEIGHT.compact}
            onMove={(from, to) => reorderPlaylist(playlistId, moveItem(songs, from, to).map((s) => s.id))}
            renderRow={(song, _, handle) => (
              <SwipeToRemove onRemove={() => removeFromPlaylist(playlistId, song.id)}>
                <ListRow
                  compact
                  song={song}
                  subtitle={`${song.artist} · ${formatTime(song.duration)}`}
                  highlighted={song.id === current?.id}
                  trailing={handle}
                  onPress={() => play(song, songs)}
                  onLongPress={() => openSongMenu(song, { playlistId })}
                />
              </SwipeToRemove>
            )}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 44, paddingHorizontal: 8 },
  tapTarget: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: 24, flexGrow: 1 },
  padded: { paddingHorizontal: 16, paddingTop: 4, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  info: { flex: 1, gap: 7 },
  name: { fontFamily: fonts.bold, fontSize: 26, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  actions: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, height: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  playButton: { backgroundColor: colors.accent },
  shuffleButton: { backgroundColor: colors.surface },
  buttonLabel: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  sectionLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
});
