import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  clipShape,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  padding,
  resizable,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type NowPlayingProps = { title?: string; artist?: string; artworkUri?: string };

// The 'widget' function is compiled into the widget extension on its own: it can't use module-level
// constants, hooks, or async code, so every value it needs is inlined or comes in through props.
function NowPlaying(props: NowPlayingProps, env: WidgetEnvironment) {
  'widget';
  const small = env.widgetFamily === 'systemSmall';
  const size = small ? 64 : 110;
  const artwork = props.artworkUri ? (
    <Image uiImage={props.artworkUri} modifiers={[resizable(), frame({ width: size, height: size }), clipShape('roundedRectangle', 10)]} />
  ) : (
    <Image systemName="music.note" size={small ? 28 : 40} color="#FF6B5F" />
  );
  const text = (
    <VStack alignment="leading" spacing={2}>
      {!small && <Text modifiers={[font({ weight: 'semibold', size: 11 }), foregroundStyle('#FF6B5F')]}>NOW PLAYING</Text>}
      <Text modifiers={[font({ weight: 'semibold', size: small ? 14 : 17 }), foregroundStyle('#F5F5F7'), lineLimit(2)]}>
        {props.title ?? 'Listen'}
      </Text>
      <Text modifiers={[font({ size: small ? 12 : 14 }), foregroundStyle('#A1A1A6'), lineLimit(1)]}>
        {props.artist ?? 'Tap to play music'}
      </Text>
    </VStack>
  );

  return small ? (
    <VStack alignment="leading" spacing={8} modifiers={[padding({ all: 4 }), containerBackground('#000000', 'widget'), widgetURL('listen://')]}>
      {artwork}
      <Spacer />
      {text}
    </VStack>
  ) : (
    <HStack spacing={14} modifiers={[containerBackground('#000000', 'widget'), widgetURL('listen://')]}>
      {artwork}
      {text}
      <Spacer />
    </HStack>
  );
}

export default createWidget('NowPlaying', NowPlaying);
