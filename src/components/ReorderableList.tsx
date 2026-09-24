import { ReactNode, useLayoutEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Icon } from '@/components/Icon';
import { colors } from '@/theme';

type Props<T> = {
  data: T[];
  keyOf: (item: T) => string;
  rowHeight: number;
  renderRow: (item: T, index: number, dragHandle: ReactNode) => ReactNode;
  onMove: (from: number, to: number) => void;
};

// Rows must all be `rowHeight` tall: drop positions are computed from the drag distance, not measured.
export function ReorderableList<T>({ data, keyOf, rowHeight, renderRow, onMove }: Props<T>) {
  const active = useSharedValue(-1);
  const dragY = useSharedValue(0);

  // A successful drop keeps rows shifted until the reordered data renders, so they don't flash back first.
  useLayoutEffect(() => {
    active.set(-1);
    dragY.set(0);
  }, [data, active, dragY]);

  return (
    <View>
      {data.map((item, index) => (
        <Row
          key={keyOf(item)}
          index={index}
          count={data.length}
          rowHeight={rowHeight}
          active={active}
          dragY={dragY}
          onMove={onMove}
          render={(handle) => renderRow(item, index, handle)}
        />
      ))}
    </View>
  );
}

type RowProps = {
  index: number;
  count: number;
  rowHeight: number;
  active: SharedValue<number>;
  dragY: SharedValue<number>;
  onMove: (from: number, to: number) => void;
  render: (handle: ReactNode) => ReactNode;
};

function Row({ index, count, rowHeight, active, dragY, onMove, render }: RowProps) {
  const targetIndex = () => {
    'worklet';
    return Math.min(Math.max(Math.round(active.get() + dragY.get() / rowHeight), 0), count - 1);
  };

  const style = useAnimatedStyle(() => {
    if (active.get() === index) {
      return { zIndex: 1, shadowOpacity: 0.6, transform: [{ translateY: dragY.get() }, { scale: 1.02 }] };
    }
    if (active.get() < 0) return { zIndex: 0, shadowOpacity: 0, transform: [{ translateY: 0 }, { scale: 1 }] };
    const target = targetIndex();
    let shift = 0;
    if (index > active.get() && index <= target) shift = -rowHeight;
    else if (index < active.get() && index >= target) shift = rowHeight;
    return { zIndex: 0, shadowOpacity: 0, transform: [{ translateY: withTiming(shift, { duration: 150 }) }, { scale: 1 }] };
  });

  const pan = Gesture.Pan()
    .activeOffsetY([-4, 4])
    .failOffsetX([-12, 12])
    .onStart(() => {
      active.set(index);
    })
    .onUpdate((e) => {
      dragY.set(e.translationY);
    })
    .onEnd(() => {
      const target = targetIndex();
      if (target !== index) {
        dragY.set(withTiming((target - index) * rowHeight, { duration: 120 }));
        scheduleOnRN(onMove, index, target);
      } else {
        active.set(-1);
        dragY.set(0);
      }
    });

  return (
    <Animated.View style={[styles.row, style]}>
      {render(
        <GestureDetector gesture={pan}>
          <View style={styles.handle}>
            <Icon name="drag_handle" color={colors.muted} />
          </View>
        </GestureDetector>,
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { shadowColor: '#000000', shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  handle: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
