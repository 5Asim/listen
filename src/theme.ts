import { StyleSheet } from 'react-native';

export const colors = {
  bg: '#000000',
  surface: '#161616',
  surface2: '#28282A',
  text: '#F5F5F7',
  muted: '#A1A1A6',
  separator: '#2C2C2E',
  accent: '#FF6B5F',
  danger: '#FF453A',
  tabBar: '#050505',
  tabBarBorder: '#242426',
};

// iOS resolves embedded fonts by PostScript name; fontWeight would not pick Inter's weights.
export const fonts = {
  regular: 'Inter-Regular',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
};

export const type = StyleSheet.create({
  largeTitle: { fontFamily: fonts.bold, fontSize: 34, color: colors.text },
});
