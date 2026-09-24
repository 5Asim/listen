import { ColorValue, Text } from 'react-native';

// Material Symbols draws icons through font ligatures: the text "search" renders as the search glyph.
export function Icon({ name, size = 24, color }: { name: string; size?: number; color: ColorValue }) {
  return (
    <Text
      style={{ fontFamily: 'MaterialSymbolsRounded-Regular', fontSize: size, lineHeight: size, color }}
      allowFontScaling={false}
      accessible={false}
    >
      {name}
    </Text>
  );
}
