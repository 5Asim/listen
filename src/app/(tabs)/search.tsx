import { useNetworkState } from 'expo-network';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { SongRow } from '@/components/SongRow';
import { StateMessage } from '@/components/StateMessage';
import { useLibrary } from '@/library';
import { usePlayer } from '@/player';
import { colors, fonts, type } from '@/theme';
import { searchSongs, Song } from '@/yt';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>();
  const [searching, setSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  const { current, play } = usePlayer();
  const { isDownloaded } = useLibrary();
  const network = useNetworkState();
  const offline = network.isConnected === false || network.isInternetReachable === false;

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    setFailed(false);
    try {
      setResults(await searchSongs(query));
    } catch {
      setFailed(true);
    } finally {
      setSearching(false);
    }
  }

  function body() {
    if (searching) {
      return (
        <StateMessage
          icon={<ActivityIndicator size="large" color={colors.accent} />}
          title="Searching…"
          description="Finding the best matches for you."
        />
      );
    }
    if (failed) {
      return (
        <StateMessage
          icon={<Icon name="error" size={42} color={colors.danger} />}
          title="Couldn't load results"
          description="Check your connection and retry."
        >
          <Pressable style={styles.retry} onPress={search}>
            <Text style={styles.retryLabel}>Try Again</Text>
          </Pressable>
        </StateMessage>
      );
    }
    if (!results) {
      return (
        <StateMessage
          icon={<Icon name="music_note" size={42} color={colors.muted} />}
          title="Find a song to play"
          description="Search millions of songs and artists."
        />
      );
    }
    if (results.length === 0) {
      return (
        <StateMessage
          icon={<Icon name="search_off" size={42} color={colors.muted} />}
          title="No results"
          description="Try a different song, artist, or album."
        />
      );
    }
    return (
      <FlatList
        data={results}
        keyExtractor={(song) => song.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => (
          <SongRow
            song={item}
            active={item.id === current?.id}
            disabled={offline && !isDownloaded(item.id)}
            onPress={() => play(item)}
          />
        )}
      />
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={type.largeTitle}>Search</Text>
        <View style={styles.searchField}>
          <Icon name="search" size={20} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Songs, artists, albums"
            placeholderTextColor={colors.muted}
            selectionColor={colors.accent}
            keyboardAppearance="dark"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={search}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable style={styles.clear} onPress={() => setQuery('')}>
              <Icon name="cancel" size={20} color={colors.muted} />
            </Pressable>
          )}
        </View>
        {offline && (
          <View style={styles.offline}>
            <Icon name="cloud_off" size={18} color={colors.accent} />
            <Text style={styles.offlineText}>{"You're offline. Only downloaded songs are available."}</Text>
          </View>
        )}
      </View>
      {body()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, gap: 12, paddingBottom: 12 },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingLeft: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, height: 44, fontFamily: fonts.regular, fontSize: 16, color: colors.text },
  clear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  offline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#33201F',
  },
  offlineText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, color: colors.text },
  retry: {
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 22,
    backgroundColor: colors.accent,
    justifyContent: 'center',
  },
  retryLabel: { fontFamily: fonts.bold, fontSize: 15, color: '#000000' },
});
