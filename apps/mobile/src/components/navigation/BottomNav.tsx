import { Pressable, StyleSheet, Text, View } from 'react-native';

import { brand, type BottomNavigationItem } from '../../theme/branding';
import { colors, spacing } from '../../theme/tokens';

type BottomNavProps = Readonly<{
  active: BottomNavigationItem;
  onSelect?: (item: BottomNavigationItem) => void;
}>;

export function BottomNav({ active, onSelect }: BottomNavProps) {
  return (
    <View style={styles.navigation}>
      {brand.bottomNavigation.map((item) => {
        const selected = item === active;
        const color = selected ? colors.olive900 : colors.muted;

        return (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled: !onSelect }}
            disabled={!onSelect}
            onPress={() => onSelect?.(item)}
            style={styles.item}
          >
            <NavGlyph item={item} color={color} />
            <Text style={[styles.label, { color }, selected && styles.activeLabel]}>{item}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function NavGlyph({ item, color }: { item: BottomNavigationItem; color: string }) {
  if (item === 'Rutas') {
    return (
      <View style={styles.glyphBox}>
        <View style={[styles.routePeakLeft, { borderBottomColor: color }]} />
        <View style={[styles.routePeakRight, { borderBottomColor: color }]} />
        <View style={[styles.routePath, { backgroundColor: color }]} />
      </View>
    );
  }

  if (item === 'Retos') {
    return (
      <View style={styles.glyphBox}>
        <View style={[styles.medal, { borderColor: color }]} />
        <View style={[styles.ribbonLeft, { backgroundColor: color }]} />
        <View style={[styles.ribbonRight, { backgroundColor: color }]} />
      </View>
    );
  }

  if (item === 'Colecciones') {
    return (
      <View style={styles.glyphBox}>
        <View style={[styles.collectionBack, { borderColor: color }]} />
        <View style={[styles.collectionFront, { borderColor: color }]} />
      </View>
    );
  }

  if (item === 'Ranking') {
    return (
      <View style={[styles.glyphBox, styles.bars]}>
        <View style={[styles.bar, { height: 9, backgroundColor: color }]} />
        <View style={[styles.bar, { height: 15, backgroundColor: color }]} />
        <View style={[styles.bar, { height: 21, backgroundColor: color }]} />
      </View>
    );
  }

  return (
    <View style={styles.glyphBox}>
      <View style={[styles.profileHead, { borderColor: color }]} />
      <View style={[styles.profileBody, { borderColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  navigation: {
    minHeight: 82,
    paddingTop: 10,
    paddingBottom: spacing[20],
    paddingHorizontal: spacing[8],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
  },
  activeLabel: {
    fontWeight: '900',
  },
  glyphBox: {
    width: 28,
    height: 24,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routePeakLeft: {
    position: 'absolute',
    left: 2,
    bottom: 3,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 13,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  routePeakRight: {
    position: 'absolute',
    right: 0,
    bottom: 3,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  routePath: {
    position: 'absolute',
    width: 4,
    height: 13,
    borderRadius: 4,
    bottom: 0,
    transform: [{ rotate: '28deg' }],
  },
  medal: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginTop: -4,
  },
  ribbonLeft: {
    position: 'absolute',
    width: 3,
    height: 8,
    bottom: 0,
    left: 9,
    transform: [{ rotate: '18deg' }],
  },
  ribbonRight: {
    position: 'absolute',
    width: 3,
    height: 8,
    bottom: 0,
    right: 9,
    transform: [{ rotate: '-18deg' }],
  },
  collectionBack: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderWidth: 1.7,
    borderRadius: 3,
    top: 2,
    left: 4,
  },
  collectionFront: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderWidth: 1.7,
    borderRadius: 3,
    bottom: 1,
    right: 3,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
  profileHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.8,
    position: 'absolute',
    top: 1,
  },
  profileBody: {
    width: 20,
    height: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 1.8,
    borderBottomWidth: 0,
    position: 'absolute',
    bottom: 1,
  },
});
