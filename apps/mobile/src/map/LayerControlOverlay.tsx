import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';
import { type MapLayerVisibility, type MapThemeId } from './map-layers';
import { MAP_THEMES, getMapTheme } from './map-theme';

interface LayerControlOverlayProps {
  visibility: MapLayerVisibility;
  onToggleLayer: (key: keyof MapLayerVisibility) => void;
  activeThemeId: MapThemeId;
  onSelectTheme: (themeId: MapThemeId) => void;
}

export function LayerControlOverlay({
  visibility,
  onToggleLayer,
  activeThemeId,
  onSelectTheme,
}: LayerControlOverlayProps) {
  const [expanded, setExpanded] = useState(false);
  const activeTheme = getMapTheme(activeThemeId);

  return (
    <View style={styles.overlayContainer}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Control de Capas del Mapa"
        style={styles.floatingButton}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.floatingIcon}>🥞</Text>
        <Text style={styles.floatingLabel}>Capas & Temas</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Capas del Mapa</Text>
            <Pressable onPress={() => setExpanded(false)}>
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ESTILO Y TEMA VISUAL</Text>
            <View style={styles.themeGrid}>
              {(Object.keys(MAP_THEMES) as MapThemeId[]).map((themeId) => {
                const theme = MAP_THEMES[themeId];
                const isActive = themeId === activeThemeId;
                return (
                  <Pressable
                    key={themeId}
                    style={[
                      styles.themeChip,
                      isActive && styles.themeChipActive,
                      isActive && { borderColor: activeTheme.trackColor },
                    ]}
                    onPress={() => onSelectTheme(themeId)}
                  >
                    <View
                      style={[
                        styles.themeColorDot,
                        { backgroundColor: theme.trackColor },
                      ]}
                    />
                    <Text
                      style={[
                        styles.themeChipText,
                        isActive && styles.themeChipTextActive,
                      ]}
                    >
                      {theme.name.split(' ')[0]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CAPAS ACTIVAS</Text>

            <LayerToggleRow
              label="Track de la Ruta"
              icon="〰️"
              active={visibility.routeTrack}
              onToggle={() => onToggleLayer('routeTrack')}
            />

            <LayerToggleRow
              label="Checkpoints Verificados"
              icon="🎯"
              active={visibility.checkpoints}
              onToggle={() => onToggleLayer('checkpoints')}
            />

            <LayerToggleRow
              label="Descubrimientos & POIs"
              icon="📍"
              active={visibility.pois}
              onToggle={() => onToggleLayer('pois')}
            />

            <LayerToggleRow
              label="Parque Natural Sierra Mágina"
              icon="🏞️"
              active={visibility.parkBoundary}
              onToggle={() => onToggleLayer('parkBoundary')}
            />

            <LayerToggleRow
              label="Posición Senderista"
              icon="🥾"
              active={visibility.hikerPosition}
              onToggle={() => onToggleLayer('hikerPosition')}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function LayerToggleRow({
  label,
  icon,
  active,
  onToggle,
}: {
  label: string;
  icon: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable style={styles.toggleRow} onPress={onToggle}>
      <Text style={styles.toggleIcon}>{icon}</Text>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View
        style={[
          styles.switchTrack,
          active ? styles.switchTrackActive : styles.switchTrackInactive,
        ]}
      >
        <View
          style={[
            styles.switchThumb,
            active ? styles.switchThumbActive : styles.switchThumbInactive,
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: spacing[12],
    right: spacing[12],
    zIndex: 20,
  },
  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    backgroundColor: colors.ink,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    borderRadius: radius.pill,
    elevation: 4,
  },
  floatingIcon: {
    fontSize: 14,
  },
  floatingLabel: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '900',
  },
  panel: {
    position: 'absolute',
    top: 40,
    right: 0,
    width: 280,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing[16],
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 6,
    shadowColor: colors.ink,
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[12],
    paddingBottom: spacing[8],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.ink,
  },
  closeIcon: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.muted,
  },
  section: {
    marginBottom: spacing[12],
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: spacing[8],
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: radius.pill,
    backgroundColor: colors.limestone,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  themeChipActive: {
    backgroundColor: colors.warmBackground,
  },
  themeColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  themeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink,
  },
  themeChipTextActive: {
    fontWeight: '900',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  toggleIcon: {
    fontSize: 14,
    marginRight: spacing[8],
  },
  toggleLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
  },
  switchTrack: {
    width: 34,
    height: 20,
    borderRadius: 10,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: colors.olive900,
  },
  switchTrackInactive: {
    backgroundColor: colors.border,
  },
  switchThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  switchThumbInactive: {
    alignSelf: 'flex-start',
  },
});
