import { useState } from 'react';
import { File } from 'expo-file-system';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  discardGpxLocalPreview,
  loadGpxLocalPreview,
  type GpxLocalPreviewLoadState,
  type GpxFilePickerPort,
} from './gpx-local-preview-flow';
import { colors, radius, spacing, typography } from '../../theme/tokens';

const systemGpxPicker: GpxFilePickerPort = {
  async pickFile() {
    const result = await File.pickFileAsync({ multipleFiles: false, mimeTypes: ['*/*'] });
    if (result.canceled || !result.result) return null;
    const file = result.result;
    return {
      name: file.name,
      sizeBytes: file.size,
      readText: () => file.text(),
    };
  },
};

interface GpxLocalPreviewSectionViewProps {
  state: GpxLocalPreviewLoadState;
  isSelecting: boolean;
  onChoose(): void;
  onDismiss(): void;
}

function invalidMessage(reason: Extract<GpxLocalPreviewLoadState, { status: 'invalid' }>['reason']): string {
  switch (reason) {
    case 'wrong-extension':
      return 'El archivo no tiene extensión .gpx.';
    case 'empty-file':
      return 'El archivo está vacío o dañado.';
    case 'file-too-large':
      return 'El archivo supera el límite de 5 MB para esta vista previa local.';
    case 'unsafe-xml-declaration':
      return 'El GPX contiene una declaración XML no admitida.';
    case 'not-gpx':
      return 'El contenido seleccionado no es un documento GPX.';
    case 'unsupported-version':
      return 'La versión declarada del GPX no es compatible con esta vista previa.';
    case 'invalid-gpx-structure':
      return 'La estructura del GPX está dañada o no es reconocible.';
    case 'invalid-xml':
      return 'El contenido XML está inválido o dañado.';
  }
}

export function GpxLocalPreviewSectionView({
  state,
  isSelecting,
  onChoose,
  onDismiss,
}: GpxLocalPreviewSectionViewProps) {
  const hasOutcome = state.status !== 'idle';
  return (
    <View testID="municipal-gpx-preview-section" style={styles.section}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.kicker}>ARCHIVO PROPIO · SOLO LOCAL</Text>
          <Text accessibilityRole="header" style={styles.title}>Vista previa de GPX</Text>
        </View>
        <Text style={styles.badge}>SIN IMPORTAR</Text>
      </View>
      <Text style={styles.body}>
        Elige un archivo GPX con el selector de archivos del sistema. La app no publica, sincroniza ni conserva el archivo; solo muestra una ficha temporal en pantalla.
      </Text>
      <Text style={styles.pickerNote}>
        No se solicita acceso general al almacenamiento. La vista previa no se mezcla con GPS de actividad ni con navegación.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Elegir un archivo GPX para vista previa local"
        accessibilityHint="Abre el selector de archivos del sistema. No guarda ni importa la geometría del sendero."
        accessibilityState={{ disabled: isSelecting }}
        disabled={isSelecting}
        style={({ pressed }) => [styles.chooseButton, pressed && styles.chooseButtonPressed, isSelecting && styles.disabledButton]}
        onPress={onChoose}
      >
        <Text style={styles.chooseButtonText}>{isSelecting ? 'Leyendo archivo local…' : 'Elegir archivo GPX'}</Text>
      </Pressable>
      {state.status === 'cancelled' ? (
        <View testID="gpx-cancelled-state" accessibilityLiveRegion="polite" style={styles.statePanel}>
          <Text style={styles.stateTitle}>Selección cancelada</Text>
          <Text style={styles.stateBody}>No se ha leído ni guardado ningún GPX.</Text>
        </View>
      ) : null}
      {state.status === 'invalid' ? (
        <View testID="gpx-invalid-state" accessibilityLiveRegion="polite" style={[styles.statePanel, styles.errorPanel]}>
          <Text style={styles.stateTitle}>Archivo inválido o dañado</Text>
          <Text style={styles.stateBody}>{invalidMessage(state.reason)}</Text>
        </View>
      ) : null}
      {state.status === 'access-error' ? (
        <View testID="gpx-access-error-state" accessibilityLiveRegion="polite" style={[styles.statePanel, styles.errorPanel]}>
          <Text style={styles.stateTitle}>Error de acceso al archivo</Text>
          <Text style={styles.stateBody}>No se pudo abrir o leer el archivo. No se ha guardado; vuelve a elegir un GPX accesible.</Text>
        </View>
      ) : null}
      {state.status === 'valid-local' ? (
        <View testID="gpx-valid-local-state" accessibilityLiveRegion="polite" style={styles.previewCard}>
          <Text accessibilityRole="header" style={styles.previewTitle}>Vista previa local válida</Text>
          <Text style={styles.detailLabel}>ARCHIVO</Text>
          <Text selectable style={styles.detailValue}>{state.preview.fileName}</Text>
          <Text style={styles.detailLabel}>METADATOS GPX PRESENTES</Text>
          {state.preview.metadata.length > 0 ? state.preview.metadata.map((item, index) => (
            <View key={`${item.label}-${index}`} style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>{item.label}</Text>
              <Text selectable style={styles.metadataValue}>{item.value}</Text>
            </View>
          )) : <Text style={styles.detailValue}>Sin metadatos adicionales reconocidos.</Text>}
          <View style={styles.countRow}>
            <Text style={styles.countValue}>Tracks: {state.preview.trackCount}</Text>
            <Text style={styles.countValue}>Waypoints: {state.preview.waypointCount}</Text>
          </View>
          <Text style={styles.detailLabel}>PROCEDENCIA</Text>
          <Text style={styles.provenance}>{state.preview.provenanceStatus}</Text>
          <Text style={styles.authorizationNotice}>
            Seleccionar el archivo no acredita permiso ni valida el sendero. Se necesita autorización del titular antes de importar geometría.
          </Text>
        </View>
      ) : null}
      {state.status !== 'valid-local' ? (
        <Text style={styles.authorizationNotice}>
          Seleccionar el archivo no acredita permiso ni valida el sendero. Se necesita autorización del titular antes de importar geometría.
        </Text>
      ) : null}
      {hasOutcome ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Descartar vista previa de GPX"
          accessibilityHint="Borra de la pantalla los metadatos temporales de esta vista previa."
          style={styles.dismissButton}
          onPress={onDismiss}
        >
          <Text style={styles.dismissButtonText}>Descartar vista previa</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function GpxLocalPreviewSection() {
  const [state, setState] = useState<GpxLocalPreviewLoadState>({ status: 'idle' });
  const [isSelecting, setIsSelecting] = useState(false);
  const chooseFile = async () => {
    if (isSelecting) return;
    setIsSelecting(true);
    try {
      setState(await loadGpxLocalPreview(systemGpxPicker));
    } finally {
      setIsSelecting(false);
    }
  };
  return (
    <GpxLocalPreviewSectionView
      state={state}
      isSelecting={isSelecting}
      onChoose={() => { void chooseFile(); }}
      onDismiss={() => setState(discardGpxLocalPreview())}
    />
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: spacing[16],
    marginTop: spacing[24],
    padding: spacing[16],
    gap: spacing[12],
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
  headingCopy: { flex: 1 },
  kicker: { color: colors.olive700, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.ink, fontSize: typography.title, fontWeight: '900', marginTop: spacing[4] },
  badge: { color: colors.olive900, backgroundColor: colors.limestone, borderRadius: radius.pill, paddingHorizontal: spacing[8], paddingVertical: spacing[4], fontSize: 9, fontWeight: '900' },
  body: { color: colors.ink, fontSize: 14, lineHeight: 21 },
  pickerNote: { color: colors.olive700, fontSize: 12, lineHeight: 18 },
  chooseButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.olive900, paddingHorizontal: spacing[16] },
  chooseButtonPressed: { opacity: 0.82 },
  disabledButton: { opacity: 0.55 },
  chooseButtonText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  statePanel: { gap: spacing[4], borderRadius: radius.md, backgroundColor: colors.limestone, padding: spacing[12] },
  errorPanel: { borderWidth: 1, borderColor: colors.earth },
  stateTitle: { color: colors.ink, fontSize: 14, fontWeight: '900' },
  stateBody: { color: colors.ink, fontSize: 13, lineHeight: 18 },
  previewCard: { gap: spacing[8], borderRadius: radius.md, backgroundColor: colors.warmBackground, padding: spacing[12] },
  previewTitle: { color: colors.olive900, fontSize: 16, fontWeight: '900' },
  detailLabel: { color: colors.olive700, fontSize: 10, fontWeight: '900', letterSpacing: 0.6, marginTop: spacing[4] },
  detailValue: { color: colors.ink, fontSize: 13, lineHeight: 18 },
  metadataRow: { gap: spacing[4] },
  metadataLabel: { color: colors.earth, fontSize: 11, fontWeight: '800' },
  metadataValue: { color: colors.ink, fontSize: 13, lineHeight: 18 },
  countRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[16], paddingVertical: spacing[4] },
  countValue: { color: colors.olive900, fontSize: 13, fontWeight: '800' },
  provenance: { color: colors.earth, fontSize: 13, fontWeight: '900' },
  authorizationNotice: { color: colors.earth, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  dismissButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.olive700, borderRadius: radius.md, paddingHorizontal: spacing[12] },
  dismissButtonText: { color: colors.olive900, fontSize: 13, fontWeight: '800' },
});
