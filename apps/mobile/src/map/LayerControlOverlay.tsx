import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';
import { type MapLayerVisibility, type MapThemeId } from './map-layers';
import { MAP_THEMES, getMapTheme } from './map-theme';

interface LayerControlOverlayProps {
  visibility: MapLayerVisibility;
  elevationAvailable: boolean;
  onToggleLayer: (key: keyof MapLayerVisibility) => void;
  activeThemeId: MapThemeId;
  onSelectTheme: (themeId: MapThemeId) => void;
}

export function LayerControlOverlay({
  visibility,
  elevationAvailable,
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
        accessibilityLabel="Control de capas y temas del mapa"
        accessibilityState={{ expanded }}
        style={styles.floatingButton}
        onPress={() => setExpanded(!expanded)}
      >
        <LayersGlyph />
        <Text style={styles.floatingLabel}>Capas y temas</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Capas del Mapa</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar capas y temas"
              onPress={() => setExpanded(false)}
            >
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
                    accessibilityRole="button"
                    accessibilityLabel={`Tema ${theme.name}`}
                    accessibilityState={{ selected: isActive }}
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

            <LayerToggleRow
              label="Altimetría del recorrido"
              icon="⛰️"
              active={elevationAvailable && visibility.elevationGrid}
              disabled={!elevationAvailable}
              hint={!elevationAvailable ? 'Sin perfil altimétrico cargado' : undefined}
              onToggle={() => onToggleLayer('elevationGrid')}
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
  disabled = false,
  hint,
}: {
  label: string;
  icon: string;
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
  hint?: string | undefined;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ checked: active, disabled }}
      disabled={disabled}
      style={[styles.toggleRow, disabled && styles.toggleRowDisabled]}
      onPress={onToggle}
    >
      <Text style={styles.toggleIcon}>{icon}</Text>
      <View style={styles.toggleCopy}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {hint ? <Text style={styles.toggleHint}>{hint}</Text> : null}
      </View>
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

function LayersGlyph() {
  return (
    <View style={styles.layersGlyph} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.layersGlyphLine, styles.layersGlyphTop]} />
      <View style={[styles.layersGlyphLine, styles.layersGlyphMiddle]} />
      <View style={[styles.layersGlyphLine, styles.layersGlyphBottom]} />
    </View>
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
  layersGlyph: { width: 18, height: 18, justifyContent: 'center', gap: 2 },
  layersGlyphLine: { height: 4, borderRadius: 2, borderWidth: 1, borderColor: colors.white },
  layersGlyphTop: { width: 11, alignSelf: 'center', opacity: 0.72 },
  layersGlyphMiddle: { width: 15, alignSelf: 'center', opacity: 0.86 },
  layersGlyphBottom: { width: 18, alignSelf: 'center' },
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
    minHeight: 44,
    paddingVertical: spacing[4],
  },
  toggleRowDisabled: {
    opacity: 0.58,
  },
  toggleIcon: {
    fontSize: 14,
    marginRight: spacing[8],
  },
  toggleCopy: { flex: 1, paddingVertical: spacing[4] },
  toggleLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
  },
  toggleHint: { color: colors.muted, fontSize: 9, fontWeight: '700', marginTop: 2 },
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
