import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { SongRow } from '@/components/SongRow';
import { fetchCached, peekCached } from '@/homeFeed';
import { usePlayer } from '@/player';
import { colors, fonts, type } from '@/theme';
import { charts, getChart } from '@/yt';

export default function ChartScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const chart = charts.find((c) => c.key === key);
  const { current, play } = usePlayer();
  const [songs, setSongs] = useState(() => peekCached(`chart:${key}`));

  useEffect(() => {
    if (!chart) return;
    fetchCached(`chart:${chart.key}`, () => getChart(chart.playlistId))
      .then(setSongs)
      .catch(() => {});
  }, [chart]);

  if (!chart) return null;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Pressable style={styles.back} onPress={() => router.back()}>
        <Icon name="chevron_left" size={30} color={colors.text} />
      </Pressable>
      <View style={styles.header}>
        <Text style={type.largeTitle}>{chart.title}</Text>
        <Text style={styles.subtitle}>Top songs on YouTube Music this week</Text>
      </View>
      {songs ? (
        <FlatList
          data={songs}
          keyExtractor={(song) => song.id}
          renderItem={({ item, index }) => (
            <View style={styles.rankRow}>
              <Text style={styles.rank}>{index + 1}</Text>
              <View style={styles.flex}>
                <SongRow song={item} active={item.id === current?.id} onPress={() => play(item, songs)} />
              </View>
            </View>
          )}
        />
      ) : (
        <ActivityIndicator color={colors.accent} style={styles.spinner} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  back: { width: 44, height: 44, marginLeft: 8, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 16, paddingBottom: 12, gap: 2 },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted },
  rankRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16 },
  rank: { width: 24, fontFamily: fonts.bold, fontSize: 15, color: colors.muted, textAlign: 'center' },
  flex: { flex: 1 },
  spinner: { marginTop: 40 },
});
