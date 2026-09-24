import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { StateMessage } from '@/components/StateMessage';
import { loadStats, Stats } from '@/library';
import { colors, fonts, type } from '@/theme';

const DAY = 24 * 60 * 60 * 1000;
const periods = [
  { label: 'Week', days: 7 },
  { label: 'Month', days: 30 },
  { label: 'All time', days: undefined },
] as const;

const compact = (n: number) => (n >= 10_000 ? `${(n / 1000).toFixed(1)}K` : Math.round(n).toLocaleString());
const playsLabel = (n: number) => `${n} ${n === 1 ? 'play' : 'plays'}`;

// A thin single-series bar: length is plays relative to the top entry; the count is always written beside it.
function Bar({ fraction }: { fraction: number }) {
  return (
    <View style={styles.barTrack}>
      <View style={[styles.bar, { width: `${Math.max(fraction * 100, 2)}%` }]} />
    </View>
  );
}

export default function StatsScreen() {
  const [period, setPeriod] = useState(0);
  const [stats, setStats] = useState<Stats>();

  useFocusEffect(
    useCallback(() => {
      const days = periods[period].days;
      setStats(loadStats(days ? Date.now() - days * DAY : 0));
    }, [period]),
  );

  const topSongPlays = stats?.topSongs[0]?.plays ?? 1;
  const topArtistPlays = stats?.topArtists[0]?.plays ?? 1;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Pressable style={styles.back} onPress={() => router.back()}>
        <Icon name="chevron_left" size={30} color={colors.text} />
      </Pressable>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={type.largeTitle}>Listening stats</Text>
        <View style={styles.segmented}>
          {periods.map((p, i) => (
            <Pressable key={p.label} style={[styles.segment, period === i && styles.segmentActive]} onPress={() => setPeriod(i)}>
              <Text style={[styles.segmentLabel, period === i && { color: colors.text }]}>{p.label}</Text>
            </Pressable>
          ))}
        </View>

        {stats && stats.minutes < 1 && stats.plays === 0 ? (
          <StateMessage
            icon={<Icon name="insights" size={42} color={colors.muted} />}
            title="No listening yet"
            description="Play some music and your top songs and artists will show up here."
          />
        ) : (
          stats && (
            <>
              <View style={styles.hero}>
                <Text style={styles.heroValue}>{compact(stats.minutes)}</Text>
                <Text style={styles.tileLabel}>Minutes listened</Text>
              </View>
              <View style={styles.tiles}>
                <View style={styles.tile}>
                  <Text style={styles.tileValue}>{compact(stats.plays)}</Text>
                  <Text style={styles.tileLabel}>Songs played</Text>
                </View>
                <View style={styles.tile}>
                  <Text style={styles.tileValue}>{compact(stats.artists)}</Text>
                  <Text style={styles.tileLabel}>Artists</Text>
                </View>
              </View>

              {stats.topSongs.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Top songs</Text>
                  {stats.topSongs.map((song, i) => (
                    <View key={song.id} style={styles.rankRow}>
                      <Text style={styles.rank}>{i + 1}</Text>
                      <Image source={{ uri: song.artwork }} style={styles.art} />
                      <View style={styles.rankText}>
                        <Text numberOfLines={1} style={styles.name}>{song.title}</Text>
                        <Text numberOfLines={1} style={styles.meta}>{song.artist}</Text>
                        <Bar fraction={song.plays / topSongPlays} />
                      </View>
                      <Text style={styles.count}>{playsLabel(song.plays)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {stats.topArtists.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Top artists</Text>
                  {stats.topArtists.map((artist, i) => (
                    <View key={artist.name} style={styles.rankRow}>
                      <Text style={styles.rank}>{i + 1}</Text>
                      <View style={styles.rankText}>
                        <Text numberOfLines={1} style={styles.name}>{artist.name}</Text>
                        <Bar fraction={artist.plays / topArtistPlays} />
                      </View>
                      <Text style={styles.count}>{playsLabel(artist.plays)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  back: { width: 44, height: 44, marginLeft: 8, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 20, flexGrow: 1 },
  segmented: { flexDirection: 'row', height: 36, padding: 2, borderRadius: 9, backgroundColor: colors.surface },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 7 },
  segmentActive: { backgroundColor: colors.surface2 },
  segmentLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
  hero: { gap: 2 },
  heroValue: { fontFamily: fonts.semibold, fontSize: 56, color: colors.text },
  tiles: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: colors.surface, gap: 2 },
  tileValue: { fontFamily: fonts.semibold, fontSize: 28, color: colors.text },
  tileLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  section: { gap: 4 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.text, marginBottom: 6 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60 },
  rank: { width: 20, fontFamily: fonts.bold, fontSize: 15, color: colors.muted, textAlign: 'center' },
  art: { width: 44, height: 44, borderRadius: 8, backgroundColor: colors.surface2 },
  rankText: { flex: 1, gap: 3 },
  name: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  barTrack: { height: 6, marginTop: 2 },
  bar: { height: 6, borderTopRightRadius: 3, borderBottomRightRadius: 3, backgroundColor: colors.accent },
  count: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, fontVariant: ['tabular-nums'] },
});
