import Storage from 'expo-sqlite/kv-store';

export type AudioQuality = 'normal' | 'high';

export const settings = {
  wifiOnly: () => Storage.getItemSync('wifiOnly') !== 'false',
  setWifiOnly: (value: boolean) => Storage.setItemSync('wifiOnly', String(value)),
  audioQuality: (): AudioQuality => (Storage.getItemSync('audioQuality') === 'normal' ? 'normal' : 'high'),
  setAudioQuality: (value: AudioQuality) => Storage.setItemSync('audioQuality', value),
};
