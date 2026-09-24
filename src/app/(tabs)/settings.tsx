import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type } from '@/theme';

export default function SettingsScreen() {
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Text style={type.largeTitle}>Settings</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
});
