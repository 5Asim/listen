import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Collage } from '@/components/Collage';
import { Icon } from '@/components/Icon';
import { HeartIcon } from '@/components/LikeButton';
import { SongRow } from '@/components/SongRow';
import { StateMessage } from '@/components/StateMessage';
import { LibrarySong, Playlist, useLibrary } from '@/library';
import { usePlayer } from '@/player';
import { colors, fonts, type } from '@/theme';

const sorts: { label: string; compare: (a: LibrarySong, b: LibrarySong) => number }[] = [
  { label: 'Recently added', compare: (a, b) => b.addedAt - a.addedAt },
  { label: 'Title', compare: (a, b) => a.title.localeCompare(b.title) },
  { label: 'Artist', compare: (a, b) => a.artist.localeCompare(b.artist) },
];

const songCount = (n: number) => `${n} ${n === 1 ? 'song' : 'songs'}`;

function SongsTab() {
  const { songs, liked } = useLibrary();
  const { current, play } = usePlayer();
  const [sortIndex, setSortIndex] = useState(0);
  const sorted = useMemo(() => [...songs].sort(sorts[sortIndex].compare), [songs, sortIndex]);

  function chooseSort() {
    ActionSheetIOS.showActionSheetWithOptions(
      { options: [...sorts.map((s) => s.label), 'Cancel'], cancelButtonIndex: sorts.length, userInterfaceStyle: 'dark' },
      (i) => i < sorts.length && setSortIndex(i),
    );
  }

  const header = (
    <View style={styles.padded}>
      <Pressable style={styles.likedRow} onPress={() => router.push('/library/liked')}>
        <View style={styles.likedTile}>
          <HeartIcon liked />
        </View>
        <View style={styles.likedText}>
          <Text style={styles.likedTitle}>Liked Songs</Text>
          <Text style={styles.likedCount}>{songCount(liked.length)}</Text>
        </View>
        <Icon name="chevron_right" color={colors.muted} />
      </Pressable>
      {songs.length > 0 && (
        <View style={styles.sortRow}>
          <Text style={styles.sortTitle}>Downloaded songs</Text>
          <Pressable style={styles.sortButton} onPress={chooseSort}>
            <Text style={styles.sortValue}>{sorts[sortIndex].label}</Text>
            <Icon name="keyboard_arrow_down" size={18} color={colors.accent} />
          </Pressable>
        </View>
      )}
    </View>
  );

  if (songs.length === 0) {
    return (
      <>
        {header}
        <StateMessage
          icon={<Icon name="cloud_download" size={44} color={colors.muted} />}
          title="No downloads yet"
          description="Download songs to listen without an internet connection."
        >
          <Pressable style={styles.cta} onPress={() => router.navigate('/')}>
            <Icon name="search" size={22} color="#000000" />
            <Text style={styles.ctaLabel}>Find songs</Text>
          </Pressable>
        </StateMessage>
      </>
    );
  }

  return (
    <FlatList
      data={sorted}
      keyExtractor={(song) => song.id}
      ListHeaderComponent={header}
      renderItem={({ item }) => <SongRow song={item} active={item.id === current?.id} onPress={() => play(item, sorted)} />}
    />
  );
}

function PlaylistsTab() {
  const { playlists, createPlaylist } = useLibrary();
  const { width } = useWindowDimensions();
  const tileSize = (width - 32 - 16) / 2;

  function newPlaylist() {
    Alert.prompt('New Playlist', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Create',
        onPress: (name?: string) => {
          if (name?.trim()) router.push(`/library/playlist/${createPlaylist(name.trim())}`);
        },
      },
    ]);
  }

  const tiles: ('new' | Playlist)[] = ['new', ...playlists];
  const rows = [];
  for (let i = 0; i < tiles.length; i += 2) rows.push(tiles.slice(i, i + 2));

  return (
    <ScrollView contentContainerStyle={[styles.padded, styles.grid]}>
      {rows.map((row, i) => (
        <View key={i} style={styles.gridRow}>
          {row.map((tile) =>
            tile === 'new' ? (
              <Pressable key="new" style={[styles.tile, { width: tileSize }]} onPress={newPlaylist}>
                <View style={[styles.newArt, { width: tileSize, height: tileSize }]}>
                  <Icon name="add" size={42} color={colors.accent} />
                </View>
                <Text style={[styles.tileName, { color: colors.accent }]}>New Playlist</Text>
                <Text style={styles.tileCount}>Start a collection</Text>
              </Pressable>
            ) : (
              <Pressable
                key={tile.id}
                style={[styles.tile, { width: tileSize }]}
                onPress={() => router.push(`/library/playlist/${tile.id}`)}
              >
                <Collage artworks={tile.artworks} size={tileSize} radius={16} />
                <Text numberOfLines={1} style={styles.tileName}>{tile.name}</Text>
                <Text style={styles.tileCount}>{songCount(tile.count)}</Text>
              </Pressable>
            ),
          )}
        </View>
      ))}
    </ScrollView>
  );
}

export default function LibraryScreen() {
  const [tab, setTab] = useState<'songs' | 'playlists'>('songs');

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={[styles.padded, styles.header]}>
        <Text style={type.largeTitle}>Library</Text>
        <View style={styles.segmented}>
          {(['songs', 'playlists'] as const).map((t) => (
            <Pressable key={t} style={[styles.segment, tab === t && styles.segmentActive]} onPress={() => setTab(t)}>
              <Text style={[styles.segmentLabel, tab === t && { color: colors.text }]}>
                {t === 'songs' ? 'Songs' : 'Playlists'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {tab === 'songs' ? <SongsTab /> : <PlaylistsTab />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  padded: { paddingHorizontal: 16 },
  header: { gap: 16, paddingBottom: 8 },
  segmented: { flexDirection: 'row', height: 44, padding: 2, borderRadius: 9, backgroundColor: colors.surface },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 7 },
  segmentActive: { backgroundColor: colors.surface2 },
  segmentLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
  likedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 64 },
  likedTile: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likedText: { flex: 1, gap: 3 },
  likedTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  likedCount: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44 },
  sortTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  sortButton: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 44 },
  sortValue: { fontFamily: fonts.regular, fontSize: 13, color: colors.accent },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: 168,
    height: 50,
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  ctaLabel: { fontFamily: fonts.bold, fontSize: 16, color: '#000000' },
  grid: { gap: 18, paddingTop: 8, paddingBottom: 24 },
  gridRow: { flexDirection: 'row', gap: 16 },
  tile: { gap: 8 },
  newArt: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileName: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  tileCount: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
});
