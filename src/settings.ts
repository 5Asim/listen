import Storage from 'expo-sqlite/kv-store';

export type AudioQuality = 'normal' | 'high';
export type RepeatMode = 'off' | 'all' | 'one';

export const settings = {
  wifiOnly: () => Storage.getItemSync('wifiOnly') !== 'false',
  setWifiOnly: (value: boolean) => Storage.setItemSync('wifiOnly', String(value)),
  audioQuality: (): AudioQuality => (Storage.getItemSync('audioQuality') === 'normal' ? 'normal' : 'high'),
  setAudioQuality: (value: AudioQuality) => Storage.setItemSync('audioQuality', value),
  repeat: (): RepeatMode => (Storage.getItemSync('repeat') as RepeatMode | null) ?? 'off',
  setRepeat: (value: RepeatMode) => Storage.setItemSync('repeat', value),
};
