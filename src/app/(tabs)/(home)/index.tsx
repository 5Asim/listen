import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchCached, peekCached } from '@/homeFeed';
import { loadHistory, useLibrary } from '@/library';
import { usePlayer } from '@/player';
import { openSongMenu } from '@/songMenu';
import { colors, fonts, type } from '@/theme';
import { charts, getChart, getRadio, Song } from '@/yt';

const CARD = 140;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function Shelf({
  title,
  subtitle,
  songs,
  ranked,
  onSeeAll,
  onPlay,
}: {
  title: string;
  subtitle?: string;
  songs?: Song[];
  ranked?: boolean;
  onSeeAll?: () => void;
  onPlay: (song: Song) => void;
}) {
  const { current } = usePlayer();
  return (
    <View style={styles.shelf}>
      <View style={styles.shelfHeader}>
        <View style={styles.flex}>
          <Text style={styles.shelfTitle}>{title}</Text>
          {subtitle && (
            <Text numberOfLines={1} style={styles.shelfSubtitle}>
              {subtitle}
            </Text>
          )}
        </View>
        {onSeeAll && (
          <Pressable style={styles.seeAll} onPress={onSeeAll}>
            <Text style={styles.seeAllLabel}>See all</Text>
          </Pressable>
        )}
      </View>
      {songs ? (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={songs.slice(0, 20)}
          keyExtractor={(song) => song.id}
          contentContainerStyle={styles.shelfList}
          renderItem={({ item, index }) => (
            <Pressable style={styles.card} onPress={() => onPlay(item)} onLongPress={() => openSongMenu(item)}>
              <Image source={{ uri: item.artwork }} style={styles.cardArt} />
              <Text numberOfLines={1} style={[styles.cardTitle, item.id === current?.id && { color: colors.accent }]}>
                {ranked && <Text style={styles.rank}>{index + 1} </Text>}
                {item.title}
              </Text>
              <Text numberOfLines={1} style={styles.cardArtist}>
                {item.artist}
              </Text>
            </Pressable>
          )}
        />
      ) : (
        <View style={styles.shelfList}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.cardArt, styles.placeholder]} />
          ))}
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const { play } = usePlayer();
  const { liked } = useLibrary();
  const [history, setHistory] = useState(loadHistory);
  const [chartSongs, setChartSongs] = useState(() =>
    Object.fromEntries(charts.map((c) => [c.key, peekCached(`chart:${c.key}`)])),
  );
  const seed = liked[0] ?? history[0];
  const [relatedBySeed, setRelatedBySeed] = useState<Record<string, Song[]>>({});
  const related = seed ? (relatedBySeed[seed.id] ?? peekCached(`radio:${seed.id}`)) : undefined;
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => setHistory(loadHistory()), []));

  const loadCharts = useCallback(async (force: boolean) => {
    await Promise.all(
      charts.map((c) =>
        fetchCached(`chart:${c.key}`, () => getChart(c.playlistId), force)
          .then((songs) => setChartSongs((prev) => ({ ...prev, [c.key]: songs })))
          .catch(() => {}),
      ),
    );
  }, []);

  const loadRelated = useCallback(async (seedId: string | undefined, force: boolean) => {
    if (!seedId) return;
    await fetchCached(`radio:${seedId}`, () => getRadio(seedId), force)
      .then((songs) => setRelatedBySeed((prev) => ({ ...prev, [seedId]: songs })))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadCharts(false);
  }, [loadCharts]);

  useEffect(() => {
    loadRelated(seed?.id, false);
  }, [seed?.id, loadRelated]);

  async function refresh() {
    setRefreshing(true);
    await Promise.all([loadCharts(true), loadRelated(seed?.id, true)]);
    setRefreshing(false);
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.muted} />}
      >
        <Text style={[type.largeTitle, styles.padded]}>{greeting()}</Text>

        {history.length > 0 && (
          <Shelf title="Recently played" songs={history} onPlay={(song) => play(song)} />
        )}

        {seed && (
          <Shelf
            title={`More like ${seed.title}`}
            subtitle={liked[0] ? 'Because you liked it' : 'Because you played it'}
            songs={related}
            onPlay={(song) => play(song, related)}
          />
        )}

        {charts.map((c) => (
          <Shelf
            key={c.key}
            title={c.title}
            songs={chartSongs[c.key]}
            ranked
            onSeeAll={() => router.push(`/chart/${c.key}`)}
            onPlay={(song) => play(song, chartSongs[c.key])}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 24, gap: 28 },
  padded: { paddingHorizontal: 16 },
  flex: { flex: 1 },
  shelf: { gap: 12 },
  shelfHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  shelfTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.text },
  shelfSubtitle: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  seeAll: { height: 44, justifyContent: 'center', paddingLeft: 12 },
  seeAllLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.accent },
  shelfList: { flexDirection: 'row', gap: 12, paddingHorizontal: 16 },
  card: { width: CARD, gap: 4 },
  cardArt: { width: CARD, height: CARD, borderRadius: 8, backgroundColor: colors.surface2, marginBottom: 4 },
  placeholder: { backgroundColor: colors.surface },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  rank: { fontFamily: fonts.bold, color: colors.accent },
  cardArtist: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
});
