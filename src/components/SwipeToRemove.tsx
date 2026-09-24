import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Icon } from '@/components/Icon';
import { colors, fonts } from '@/theme';

export function SwipeToRemove({ onRemove, children }: { onRemove: () => void; children: ReactNode }) {
  return (
    <Swipeable
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={() => (
        <Pressable style={styles.action} onPress={onRemove}>
          <Icon name="delete" size={22} color="#FFFFFF" />
          <Text style={styles.label}>Remove</Text>
        </Pressable>
      )}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  action: { width: 88, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontFamily: fonts.semibold, fontSize: 12, color: '#FFFFFF' },
});
