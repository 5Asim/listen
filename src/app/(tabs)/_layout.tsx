import { BottomTabBar, Tabs } from 'expo-router/js-tabs';
import { Icon } from '@/components/Icon';
import { MiniPlayer } from '@/components/MiniPlayer';
import { colors, fonts } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => (
        <>
          <MiniPlayer />
          <BottomTabBar {...props} />
        </>
      )}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.tabBar, borderTopColor: colors.tabBarBorder },
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 10 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Search', tabBarIcon: ({ color }) => <Icon name="search" size={25} color={color} /> }} />
      <Tabs.Screen name="library" options={{ title: 'Library', tabBarIcon: ({ color }) => <Icon name="library_music" size={25} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <Icon name="settings" size={25} color={color} /> }} />
    </Tabs>
  );
}
