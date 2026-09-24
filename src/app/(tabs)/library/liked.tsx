import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CollectionActions } from '@/components/CollectionActions';
import { Icon } from '@/components/Icon';
import { HeartIcon } from '@/components/LikeButton';
import { SongRow } from '@/components/SongRow';
import { StateMessage } from '@/components/StateMessage';
import { useLibrary } from '@/library';
import { usePlayer } from '@/player';
import { colors, fonts, type } from '@/theme';

export default function LikedSongsScreen() {
  const { liked } = useLibrary();
  const { current, play } = usePlayer();

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Pressable style={styles.back} onPress={() => router.back()}>
        <Icon name="chevron_left" size={30} color={colors.text} />
      </Pressable>
      <View style={styles.header}>
        <Text style={type.largeTitle}>Liked Songs</Text>
        <Text style={styles.count}>
          {liked.length} {liked.length === 1 ? 'song' : 'songs'}
        </Text>
        {liked.length > 0 && (
          <View style={styles.actions}>
            <CollectionActions songs={liked} />
          </View>
        )}
      </View>
      {liked.length === 0 ? (
        <StateMessage
          icon={<HeartIcon liked={false} size={44} color={colors.muted} />}
          title="No liked songs yet"
          description="Tap the heart on any song to save it here."
        />
      ) : (
        <FlatList
          data={liked}
          keyExtractor={(song) => song.id}
          renderItem={({ item }) => <SongRow song={item} active={item.id === current?.id} onPress={() => play(item, liked)} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  back: { width: 44, height: 44, marginLeft: 8, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 16, paddingBottom: 12, gap: 2 },
  count: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted },
  actions: { marginTop: 14 },
});
