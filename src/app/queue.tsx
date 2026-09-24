import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Icon } from '@/components/Icon';
import { ListRow, ROW_HEIGHT } from '@/components/ListRow';
import { ReorderableList } from '@/components/ReorderableList';
import { SwipeToRemove } from '@/components/SwipeToRemove';
import { usePlayer } from '@/player';
import { colors, fonts } from '@/theme';

export default function QueueSheet() {
  const { current, upNext, jumpToUpNext, moveUpNext, removeUpNext } = usePlayer();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Queue</Text>
        <Pressable style={styles.done} onPress={() => router.back()}>
          <Text style={styles.doneLabel}>Done</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {current && (
          <>
            <Text style={styles.label}>NOW PLAYING</Text>
            <ListRow
              song={current}
              subtitle={current.artist}
              highlighted
              trailing={
                <View style={styles.indicator}>
                  <Icon name="volume_up" size={22} color={colors.accent} />
                </View>
              }
            />
          </>
        )}
        <Text style={styles.label}>UP NEXT</Text>
        {upNext.length === 0 ? (
          <Text style={styles.empty}>Nothing up next. Use ⋯ → Add to Queue on any song.</Text>
        ) : (
          <ReorderableList
            data={upNext}
            keyOf={(s) => s.id}
            rowHeight={ROW_HEIGHT.regular}
            onMove={moveUpNext}
            renderRow={(song, i, handle) => (
              <SwipeToRemove onRemove={() => removeUpNext(i)}>
                <ListRow song={song} subtitle={song.artist} trailing={handle} onPress={() => jumpToUpNext(i)} />
              </SwipeToRemove>
            )}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingLeft: 16,
    paddingRight: 8,
  },
  title: { fontFamily: fonts.bold, fontSize: 28, color: colors.text },
  done: { height: 44, paddingHorizontal: 8, justifyContent: 'center' },
  doneLabel: { fontFamily: fonts.semibold, fontSize: 16, color: colors.accent },
  content: { paddingBottom: 24 },
  label: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted, paddingHorizontal: 16, marginTop: 12 },
  indicator: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  empty: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted, paddingHorizontal: 16, marginTop: 12 },
});
