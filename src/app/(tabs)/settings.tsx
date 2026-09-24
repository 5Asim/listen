import Constants from 'expo-constants';
import { Paths } from 'expo-file-system';
import { ReactNode, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { formatBytes } from '@/format';
import { downloadsSize, useLibrary } from '@/library';
import { AudioQuality, settings } from '@/settings';
import { colors, fonts, type } from '@/theme';

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.group}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const { songs, removeAllDownloads, importFiles } = useLibrary();
  const [wifiOnly, setWifiOnly] = useState(settings.wifiOnly);
  const [quality, setQuality] = useState(settings.audioQuality);
  const [importing, setImporting] = useState(false);
  const used = downloadsSize();
  const usedFraction = used / (used + Paths.availableDiskSpace);

  function toggleWifiOnly(value: boolean) {
    settings.setWifiOnly(value);
    setWifiOnly(value);
  }

  function chooseQuality(value: AudioQuality) {
    settings.setAudioQuality(value);
    setQuality(value);
  }

  function confirmRemoveAll() {
    Alert.alert('Remove all downloads?', `${songs.length} songs (${formatBytes(used)}) will be removed from this iPhone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove All', style: 'destructive', onPress: removeAllDownloads },
    ]);
  }

  async function runImport() {
    setImporting(true);
    try {
      const count = await importFiles();
      if (count) Alert.alert('Imported', `${count} ${count === 1 ? 'song was' : 'songs were'} added to your library.`);
    } catch (e) {
      Alert.alert("Couldn't import", String(e));
    } finally {
      setImporting(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={type.largeTitle}>Settings</Text>

        <Section label="DOWNLOADS">
          <View style={[styles.row, styles.divider]}>
            <Text style={styles.label}>Download on Wi-Fi only</Text>
            <Switch
              value={wifiOnly}
              onValueChange={toggleWifiOnly}
              trackColor={{ true: colors.accent, false: colors.surface2 }}
              ios_backgroundColor={colors.surface2}
            />
          </View>
          <View style={[styles.row, styles.divider]}>
            <Text style={styles.label}>Audio quality</Text>
            <View style={styles.segmented}>
              {(['normal', 'high'] as const).map((q) => (
                <Pressable key={q} style={[styles.segment, quality === q && styles.segmentActive]} onPress={() => chooseQuality(q)}>
                  <Text style={[styles.segmentLabel, quality === q && styles.segmentLabelActive]}>
                    {q === 'normal' ? 'Normal' : 'High'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={[styles.storageRow, styles.divider]}>
            <View style={styles.storageSummary}>
              <Text style={styles.storageLabel}>Storage used by downloads</Text>
              <Text style={styles.storageValue}>{formatBytes(used)}</Text>
            </View>
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${Math.max(usedFraction * 100, used ? 1 : 0)}%` }]} />
            </View>
            <Text style={styles.caption}>{formatBytes(Paths.availableDiskSpace)} free on this iPhone</Text>
          </View>
          <Pressable style={styles.row} disabled={songs.length === 0} onPress={confirmRemoveAll}>
            <Text style={[styles.label, { color: colors.danger }, songs.length === 0 && styles.dimmed]}>
              Remove all downloads
            </Text>
          </Pressable>
        </Section>

        <Section label="IMPORT">
          <Pressable style={[styles.row, styles.linkRow]} disabled={importing} onPress={runImport}>
            <Icon name="folder_open" size={22} color={colors.accent} />
            <Text style={[styles.label, styles.flex]}>Import from Files</Text>
            {importing ? <ActivityIndicator color={colors.muted} /> : <Icon name="chevron_right" size={22} color={colors.muted} />}
          </Pressable>
        </Section>

        <Section label="ABOUT">
          <View style={[styles.row, { height: 52 }]}>
            <Text style={styles.label}>Version</Text>
            <Text style={styles.value}>{Constants.expoConfig?.version}</Text>
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 24, gap: 22 },
  section: { gap: 7 },
  sectionLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
  group: { backgroundColor: colors.surface, borderRadius: 14, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 56, paddingHorizontal: 14 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
  linkRow: { justifyContent: 'flex-start', gap: 12 },
  flex: { flex: 1 },
  label: { fontFamily: fonts.regular, fontSize: 16, color: colors.text },
  value: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted },
  dimmed: { opacity: 0.4 },
  segmented: { flexDirection: 'row', width: 142, height: 32, padding: 2, borderRadius: 8, backgroundColor: colors.surface2 },
  segment: { flex: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: colors.accent },
  segmentLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  segmentLabelActive: { fontFamily: fonts.bold, color: '#000000' },
  storageRow: { gap: 6, paddingHorizontal: 14, paddingVertical: 14 },
  storageSummary: { flexDirection: 'row', justifyContent: 'space-between' },
  storageLabel: { fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  storageValue: { fontFamily: fonts.semibold, fontSize: 15, color: colors.muted },
  bar: { height: 4, borderRadius: 2, backgroundColor: colors.surface2, overflow: 'hidden' },
  barFill: { height: 4, backgroundColor: colors.accent },
  caption: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
});
