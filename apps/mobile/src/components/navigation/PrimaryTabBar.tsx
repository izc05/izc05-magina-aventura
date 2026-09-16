import { router } from 'expo-router';
import { View, StyleSheet } from 'react-native';

import type { BottomNavigationItem } from '../../theme/branding';
import { destinationForBottomNavigation } from '../../navigation/app-shell';
import { BottomNav } from './BottomNav';

type PrimaryTabBarProps = Readonly<{
  active: BottomNavigationItem;
}>;

export function PrimaryTabBar({ active }: PrimaryTabBarProps) {
  return (
    <View style={styles.wrap}>
      <BottomNav
        active={active}
        onSelect={(item) => {
          const destination = destinationForBottomNavigation(item);
          if (destination === destinationForBottomNavigation(active)) return;
          router.replace(destination as never);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
