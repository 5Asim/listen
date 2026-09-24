import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LibraryProvider } from '@/library';
import { PlayerProvider } from '@/player';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <LibraryProvider>
        <PlayerProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="player" options={{ presentation: 'modal' }} />
          <Stack.Screen
            name="queue"
            options={{ presentation: 'formSheet', sheetGrabberVisible: true, contentStyle: { backgroundColor: colors.bg } }}
          />
          <Stack.Screen
            name="song-menu"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: 'fitToContents',
              sheetGrabberVisible: true,
              contentStyle: { backgroundColor: colors.surface },
            }}
          />
        </Stack>
        <StatusBar style="light" />
        </PlayerProvider>
      </LibraryProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
