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
  if (item === 'Inicio') {
    return (
      <View style={styles.glyphBox}>
        <View style={[styles.homeRoof, { borderBottomColor: color }]} />
        <View style={[styles.homeBody, { borderColor: color }]} />
        <View style={[styles.homeDoor, { backgroundColor: color }]} />
      </View>
    );
  }

  if (item === 'Explorar') {
    return (
      <View style={styles.glyphBox}>
        <View style={[styles.searchCircle, { borderColor: color }]} />
        <View style={[styles.searchHandle, { backgroundColor: color }]} />
      </View>
    );
  }

  if (item === 'Mapa') {
    return (
      <View style={styles.glyphBox}>
        <View style={[styles.mapPanelLeft, { borderColor: color }]} />
        <View style={[styles.mapPanelCenter, { borderColor: color }]} />
        <View style={[styles.mapPanelRight, { borderColor: color }]} />
      </View>
    );
  }

  if (item === 'Comunidad') {
    return (
      <View style={styles.glyphBox}>
        <View style={[styles.communityHeadLeft, { borderColor: color }]} />
        <View style={[styles.communityHeadRight, { borderColor: color }]} />
        <View style={[styles.communityBody, { borderColor: color }]} />
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
  homeRoof: {
    position: 'absolute',
    top: 1,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  homeBody: {
    position: 'absolute',
    bottom: 1,
    width: 17,
    height: 13,
    borderWidth: 1.8,
    borderTopWidth: 0,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  homeDoor: {
    position: 'absolute',
    bottom: 1,
    width: 4,
    height: 8,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  searchCircle: {
    position: 'absolute',
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1.8,
    left: 3,
    top: 2,
  },
  searchHandle: {
    position: 'absolute',
    width: 9,
    height: 2,
    borderRadius: 2,
    right: 2,
    bottom: 4,
    transform: [{ rotate: '45deg' }],
  },
  mapPanelLeft: {
    position: 'absolute',
    left: 1,
    width: 9,
    height: 20,
    borderWidth: 1.6,
    borderRightWidth: 0,
    transform: [{ skewY: '-12deg' }],
  },
  mapPanelCenter: {
    position: 'absolute',
    width: 9,
    height: 20,
    borderWidth: 1.6,
    transform: [{ skewY: '12deg' }],
  },
  mapPanelRight: {
    position: 'absolute',
    right: 1,
    width: 9,
    height: 20,
    borderWidth: 1.6,
    borderLeftWidth: 0,
    transform: [{ skewY: '-12deg' }],
  },
  communityHeadLeft: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.6,
    left: 4,
    top: 2,
  },
  communityHeadRight: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.6,
    right: 4,
    top: 2,
  },
  communityBody: {
    position: 'absolute',
    width: 24,
    height: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 1.6,
    borderBottomWidth: 0,
    bottom: 1,
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
