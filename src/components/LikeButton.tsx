import { Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useLibrary } from '@/library';
import { colors } from '@/theme';
import { Song } from '@/yt';

// Material Symbols Rounded "favorite". The bundled icon font only has the outline style, so both states are drawn here.
const outline =
  'M451.5-152q-14.5-5-25.5-16l-69-63q-106-97-191.5-192.5T80-634q0-94 63-157t157-63q53 0 100 22.5t80 61.5q33-39 80-61.5T660-854q94 0 157 63t63 157q0 115-85 211T602-230l-68 62q-11 11-25.5 16t-28.5 5q-14 0-28.5-5ZM442-690q-29-41-62-62.5T300-774q-60 0-100 40t-40 100q0 52 37 110.5T285.5-410q51.5 55 106 103t88.5 79q34-31 88.5-79t106-103Q726-465 763-523.5T800-634q0-60-40-100t-100-40q-47 0-80 21.5T518-690q-7 10-17 15t-21 5q-11 0-21-5t-17-15Zm38 189Z';
const filled =
  'M451.5-152q-14.5-5-25.5-16l-69-63q-106-97-191.5-192.5T80-634q0-94 63-157t157-63q53 0 100 22.5t80 61.5q33-39 80-61.5T660-854q94 0 157 63t63 157q0 115-85 211T602-230l-68 62q-11 11-25.5 16t-28.5 5q-14 0-28.5-5Z';

export function HeartIcon({ liked, size = 24, color = colors.text }: { liked: boolean; size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path d={liked ? filled : outline} fill={liked ? colors.accent : color} />
    </Svg>
  );
}

export function LikeButton({ song, size = 24, color }: { song: Song; size?: number; color?: string }) {
  const { isLiked, toggleLike } = useLibrary();
  return (
    <Pressable
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
      onPress={() => toggleLike(song)}
      accessibilityRole="button"
      accessibilityLabel={isLiked(song.id) ? 'Remove from Liked Songs' : 'Like'}
    >
      <HeartIcon liked={isLiked(song.id)} size={size} color={color} />
    </Pressable>
  );
}
