import { useEffect, useState } from 'react';
import { File } from 'expo-file-system';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  createEmptyGpxCandidateAuthorizationDraft,
  createGpxCandidateReviewRecord,
  type GpxCandidateAuthorizationDraft,
  type GpxCandidateScopeValue,
} from '@magina-aventura/route-import';
import { useAuth } from '../../context/AuthContext';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import {
  gpxCandidateReviewDraftStore,
  type GpxCandidateReviewDraftStore,
} from './gpx-candidate-review-draft-store';
import {
  discardGpxLocalPreview,
  loadGpxLocalPreview,
  type GpxLocalPreviewLoadState,
  type GpxFilePickerPort,
} from './gpx-local-preview-flow';

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

type DraftStorageStatus = 'loading' | 'saving' | 'saved' | 'not-saved' | 'error';

interface GpxLocalPreviewSectionViewProps {
  state: GpxLocalPreviewLoadState;
  isSelecting: boolean;
  onChoose(): void;
  onDismiss(): void;
  authorizationDraft?: GpxCandidateAuthorizationDraft;
  onAuthorizationDraftChange?(patch: Partial<GpxCandidateAuthorizationDraft>): void;
  isDraftLoaded?: boolean;
  isDraftActive?: boolean;
  hasRecoveredDraft?: boolean;
  isAuthenticated?: boolean;
  draftStorageStatus?: DraftStorageStatus;
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

function authorizationStatusLabel(status: ReturnType<typeof createGpxCandidateReviewRecord>['authorizationStatus']): string {
  switch (status) {
    case 'incomplete':
      return 'Autorización incompleta';
    case 'rejected':
      return 'Permiso rechazado';
    case 'restricted':
      return 'Alcance insuficiente para este uso';
    case 'ready-for-official-review':
      return 'Declaración completa · pendiente de revisión oficial';
  }
}

function draftStorageMessage(
  isDraftLoaded: boolean,
  isAuthenticated: boolean,
  status: DraftStorageStatus,
): string {
  if (!isDraftLoaded || status === 'loading') return 'Cargando el borrador privado de esta cuenta…';
  if (!isAuthenticated) {
    return 'Modo visitante: el formulario solo permanece en esta pantalla; no se guarda y se descarta al salir.';
  }
  if (status === 'saving') return 'Guardando metadatos del borrador en SQLite privado de este dispositivo…';
  if (status === 'error') return 'No se pudo leer o guardar el borrador local. No se ha enviado a ningún servicio.';
  if (status === 'saved') return 'Borrador guardado solo en SQLite privado de este dispositivo y separado por cuenta; no se sincroniza ni se muestra a visitantes u otras cuentas.';
  return 'El borrador solo se guarda localmente para tu cuenta activa; no se sincroniza ni se muestra a visitantes u otras cuentas.';
}

const scopeOptions: Array<{ value: GpxCandidateScopeValue; label: string }> = [
  { value: 'unknown', label: 'Sin confirmar' },
  { value: 'permitted', label: 'Permitido' },
  { value: 'not-permitted', label: 'No permitido' },
];

function LocalTextField({
  label,
  value,
  placeholder,
  testID,
  multiline = false,
  maxLength,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  testID: string;
  multiline?: boolean;
  maxLength: number;
  onChangeText(value: string): void;
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        testID={testID}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={colors.olive700}
        onChangeText={onChangeText}
        multiline={multiline}
        maxLength={maxLength}
        autoCapitalize="sentences"
        autoCorrect={false}
        style={[styles.textInput, multiline && styles.multilineInput]}
      />
    </View>
  );
}

function PermissionDecisionField({
  value,
  onChange,
}: {
  value: GpxCandidateAuthorizationDraft['permissionDecision'];
  onChange(value: GpxCandidateAuthorizationDraft['permissionDecision']): void;
}) {
  const options: Array<{ value: GpxCandidateAuthorizationDraft['permissionDecision']; label: string }> = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'granted', label: 'Otorgado' },
    { value: 'rejected', label: 'Rechazado' },
  ];
  return (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>Estado declarado del permiso</Text>
      <View style={styles.choiceRow}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={`Permiso: ${option.label}`}
            accessibilityState={{ selected: value === option.value }}
            testID={`gpx-permission-${option.value}`}
            style={[styles.choiceButton, value === option.value && styles.choiceButtonSelected]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.choiceText, value === option.value && styles.choiceTextSelected]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.fieldHint}>Es una declaración local, no una comprobación de la licencia ni de la identidad del titular.</Text>
    </View>
  );
}

function ScopeField({
  field,
  label,
  value,
  onChange,
}: {
  field: 'commercialUse' | 'derivatives' | 'distribution';
  label: string;
  value: GpxCandidateScopeValue;
  onChange(value: GpxCandidateScopeValue): void;
}) {
  return (
    <View testID={`gpx-scope-${field}`} style={styles.formField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.choiceRow}>
        {scopeOptions.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${option.label}`}
            accessibilityState={{ selected: value === option.value }}
            testID={`gpx-${field}-${option.value}`}
            style={[styles.choiceButton, value === option.value && styles.choiceButtonSelected]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.choiceText, value === option.value && styles.choiceTextSelected]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function CandidateRightsReview({
  draft,
  onChange,
}: {
  draft: GpxCandidateAuthorizationDraft;
  onChange(patch: Partial<GpxCandidateAuthorizationDraft>): void;
}) {
  const review = createGpxCandidateReviewRecord(draft);
  return (
    <View testID="gpx-candidate-rights-review" style={styles.reviewPanel}>
      <Text accessibilityRole="header" style={styles.reviewTitle}>Revisión local de procedencia</Text>
      <View testID="gpx-candidate-status" accessibilityLiveRegion="polite" style={styles.candidateStatusPanel}>
        <Text style={styles.statusLine}>Estado: {review.status} / {review.verificationStatus}</Text>
        <Text style={styles.statusLine}>{authorizationStatusLabel(review.authorizationStatus)}</Text>
      </View>
      <Text style={styles.reviewIntro}>
        Completa cada dato por separado. Los alcances desconocidos o no permitidos mantienen el uso bloqueado; la declaración no autentica por sí sola el permiso.
      </Text>

      <LocalTextField
        label="Fuente o URL de origen"
        testID="gpx-source-or-url"
        placeholder="Publicación, archivo fuente o URL"
        value={draft.sourceOrUrl}
        maxLength={2000}
        onChangeText={(value) => onChange({ sourceOrUrl: value })}
      />
      <LocalTextField
        label="Titular o autor"
        testID="gpx-rights-holder-author"
        placeholder="Persona u organización titular"
        value={draft.rightsHolderOrAuthor}
        maxLength={300}
        onChangeText={(value) => onChange({ rightsHolderOrAuthor: value })}
      />
      <LocalTextField
        label="Tipo de licencia o permiso otorgado"
        testID="gpx-license-permission-type"
        placeholder="Nombre de licencia o descripción del permiso"
        value={draft.licenseOrPermissionType}
        maxLength={1000}
        onChangeText={(value) => onChange({ licenseOrPermissionType: value })}
      />
      <PermissionDecisionField
        value={draft.permissionDecision}
        onChange={(value) => onChange({ permissionDecision: value })}
      />
      <ScopeField
        field="commercialUse"
        label="Uso comercial"
        value={draft.commercialUse}
        onChange={(value) => onChange({ commercialUse: value })}
      />
      <ScopeField
        field="derivatives"
        label="Obras derivadas"
        value={draft.derivatives}
        onChange={(value) => onChange({ derivatives: value })}
      />
      <ScopeField
        field="distribution"
        label="Distribución"
        value={draft.distribution}
        onChange={(value) => onChange({ distribution: value })}
      />
      <LocalTextField
        label="Texto requerido de atribución"
        testID="gpx-required-attribution"
        placeholder="Escribe el texto exacto o ‘No requerida’"
        value={draft.requiredAttributionText}
        maxLength={2000}
        multiline
        onChangeText={(value) => onChange({ requiredAttributionText: value })}
      />
      <LocalTextField
        label="Referencia local al documento de autorización (opcional)"
        testID="gpx-local-authorization-reference"
        placeholder="Referencia privada guardada en este dispositivo"
        value={draft.localAuthorizationReference}
        maxLength={500}
        onChangeText={(value) => onChange({ localAuthorizationReference: value })}
      />
      <Text style={styles.fieldHint}>
        No adjuntes ni copies aquí el documento de autorización. La referencia local es texto temporal y no se persiste; el documento permanece privado en tu dispositivo y no se abre ni se sube.
      </Text>

      <View testID="gpx-operational-blocked" accessibilityLiveRegion="polite" style={styles.blockedPanel}>
        <Text style={styles.blockedTitle}>Ruta bloqueada · no operativa</Text>
        <Text style={styles.blockedText}>Publicación: bloqueada</Text>
        <Text style={styles.blockedText}>Uso con GPS: bloqueado</Text>
        <Text style={styles.blockedText}>Crear checkpoints: bloqueado</Text>
        <Text style={styles.blockedText}>
          Aun con todos los campos completos, hace falta revisión oficial y verificación en terreno. No existe una acción local para marcar la ruta como verificada.
        </Text>
      </View>
    </View>
  );
}

export function GpxLocalPreviewSectionView({
  state,
  isSelecting,
  onChoose,
  onDismiss,
  authorizationDraft = createEmptyGpxCandidateAuthorizationDraft(),
  onAuthorizationDraftChange = () => undefined,
  isDraftLoaded = true,
  isDraftActive = false,
  hasRecoveredDraft = false,
  isAuthenticated = false,
  draftStorageStatus = 'not-saved',
}: GpxLocalPreviewSectionViewProps) {
  const showReview = state.status === 'valid-local' || isDraftActive;
  const hasOutcome = state.status !== 'idle' || isDraftActive;
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
        Elige un archivo GPX con el selector del sistema. La app no publica, sincroniza ni conserva el archivo; oculta su nombre y metadatos personales y solo muestra detalles técnicos temporales.
      </Text>
      <Text style={styles.pickerNote}>
        No se solicita acceso general al almacenamiento. La vista previa no se mezcla con GPS de actividad ni con navegación.
      </Text>
      <View testID="gpx-preparation-checklist" style={styles.checklist}>
        <Text style={styles.checklistTitle}>Qué preparar para una revisión futura</Text>
        <Text style={styles.checklistText}>
          Ten a mano un GPX que puedas compartir, la fuente o URL, el nombre del titular/autor, una licencia o autorización escrita y el alcance de uso comercial, derivados y distribución, además del texto de atribución requerido.
        </Text>
        <Text style={styles.checklistText}>
          No subas el documento de autorización desde aquí: consérvalo privado en tu dispositivo. La referencia local es opcional. Solo se persisten metadatos del borrador en el almacenamiento privado de la cuenta activa; nunca se sincronizan.
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Elegir un archivo GPX para vista previa local"
        accessibilityHint="Abre el selector de archivos del sistema. No guarda ni importa la geometría del sendero."
        accessibilityState={{ disabled: isSelecting || !isDraftLoaded }}
        disabled={isSelecting || !isDraftLoaded}
        style={({ pressed }) => [styles.chooseButton, pressed && styles.chooseButtonPressed, (isSelecting || !isDraftLoaded) && styles.disabledButton]}
        onPress={onChoose}
      >
        <Text style={styles.chooseButtonText}>
          {!isDraftLoaded ? 'Cargando borrador privado…' : isSelecting ? 'Leyendo archivo local…' : 'Elegir archivo GPX'}
        </Text>
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
          <Text style={styles.detailLabel}>DETALLES TÉCNICOS</Text>
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
            Seleccionar el archivo no acredita permiso ni valida el sendero. La geometría no se importa.
          </Text>
        </View>
      ) : null}
      {hasRecoveredDraft && state.status !== 'valid-local' ? (
        <View testID="gpx-restored-draft-notice" style={styles.statePanel}>
          <Text style={styles.stateTitle}>Borrador privado recuperado</Text>
          <Text style={styles.stateBody}>
            Se han recuperado los metadatos de derechos de tu cuenta. El archivo GPX no se guardó ni quedó vinculado: selecciónalo de nuevo y confirma que corresponde a este borrador.
          </Text>
        </View>
      ) : null}
      {showReview ? (
        <>
          <CandidateRightsReview
            draft={authorizationDraft}
            onChange={onAuthorizationDraftChange}
          />
          <View testID="gpx-draft-storage-status" accessibilityLiveRegion="polite" style={styles.storagePanel}>
            <Text style={styles.fieldHint}>{draftStorageMessage(isDraftLoaded, isAuthenticated, draftStorageStatus)}</Text>
          </View>
        </>
      ) : null}
      {state.status !== 'valid-local' && !isDraftActive ? (
        <Text style={styles.authorizationNotice}>
          Seleccionar el archivo no acredita permiso ni valida el sendero. Se requiere autorización del titular antes de importar geometría.
        </Text>
      ) : null}
      {hasOutcome ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Descartar vista previa y borrador local de GPX"
          accessibilityHint="Descarta el preview temporal y elimina solo el borrador privado de derechos de tu cuenta en este dispositivo."
          style={styles.dismissButton}
          onPress={onDismiss}
        >
          <Text style={styles.dismissButtonText}>Descartar vista previa y borrador local</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function GpxLocalPreviewSection() {
  const { user, isLoading: authIsLoading } = useAuth();
  const [state, setState] = useState<GpxLocalPreviewLoadState>({ status: 'idle' });
  const [authorizationDraft, setAuthorizationDraft] = useState(createEmptyGpxCandidateAuthorizationDraft);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [draftOwnerId, setDraftOwnerId] = useState<string | null>(null);
  const [isDraftActive, setIsDraftActive] = useState(false);
  const [hasRecoveredDraft, setHasRecoveredDraft] = useState(false);
  const [draftStorageStatus, setDraftStorageStatus] = useState<DraftStorageStatus>('loading');

  useEffect(() => {
    let mounted = true;
    setState(discardGpxLocalPreview());
    setAuthorizationDraft(createEmptyGpxCandidateAuthorizationDraft());
    setDraftOwnerId(null);
    setIsDraftActive(false);
    setHasRecoveredDraft(false);
    setIsDraftLoaded(false);
    setDraftStorageStatus('loading');

    if (authIsLoading) {
      return () => { mounted = false; };
    }
    if (!user) {
      setIsDraftLoaded(true);
      setDraftStorageStatus('not-saved');
      return () => { mounted = false; };
    }

    const ownerId = user.id;
    void gpxCandidateReviewDraftStore.loadDraft(ownerId)
      .then((stored) => {
        if (!mounted) return;
        setDraftOwnerId(ownerId);
        setAuthorizationDraft(stored?.authorizationDraft ?? createEmptyGpxCandidateAuthorizationDraft());
        setIsDraftActive(stored !== null);
        setHasRecoveredDraft(stored !== null);
        setIsDraftLoaded(true);
        setDraftStorageStatus(stored ? 'saved' : 'not-saved');
      })
      .catch(() => {
        if (!mounted) return;
        setDraftOwnerId(ownerId);
        setIsDraftLoaded(true);
        setDraftStorageStatus('error');
      });

    return () => { mounted = false; };
  }, [authIsLoading, user?.id]);

  useEffect(() => {
    if (
      authIsLoading || !isDraftLoaded || !isDraftActive || !user ||
      draftOwnerId !== user.id
    ) return;

    let mounted = true;
    setDraftStorageStatus('saving');
    void gpxCandidateReviewDraftStore.saveDraft(user.id, authorizationDraft)
      .then(() => {
        if (mounted) setDraftStorageStatus('saved');
      })
      .catch(() => {
        if (mounted) setDraftStorageStatus('error');
      });
    return () => { mounted = false; };
  }, [authorizationDraft, authIsLoading, draftOwnerId, isDraftActive, isDraftLoaded, user?.id]);

  const draftContextReady = !authIsLoading && isDraftLoaded && (
    user ? draftOwnerId === user.id : draftOwnerId === null
  );
  const safeDraft = draftContextReady
    ? authorizationDraft
    : createEmptyGpxCandidateAuthorizationDraft();
  const safeDraftActive = draftContextReady && isDraftActive;
  const safeRecoveredDraft = draftContextReady && hasRecoveredDraft;

  const chooseFile = async () => {
    if (isSelecting || !draftContextReady) return;
    setIsSelecting(true);
    setState(discardGpxLocalPreview());
    try {
      const nextState = await loadGpxLocalPreview(systemGpxPicker);
      setState(nextState);
      if (nextState.status === 'valid-local') {
        setIsDraftActive(true);
        setHasRecoveredDraft(false);
        if (!user) setDraftStorageStatus('not-saved');
      }
    } finally {
      setIsSelecting(false);
    }
  };

  const updateAuthorizationDraft = (patch: Partial<GpxCandidateAuthorizationDraft>) => {
    if (!draftContextReady) return;
    setAuthorizationDraft((current) => ({ ...current, ...patch }));
    setIsDraftActive(true);
    if (!user) setDraftStorageStatus('not-saved');
  };

  const dismissDraft = () => {
    setState(discardGpxLocalPreview());
    setAuthorizationDraft(createEmptyGpxCandidateAuthorizationDraft());
    setIsDraftActive(false);
    setHasRecoveredDraft(false);
    if (user && draftOwnerId === user.id) {
      setDraftStorageStatus('saving');
      void gpxCandidateReviewDraftStore.clearDraft(user.id)
        .then(() => setDraftStorageStatus('not-saved'))
        .catch(() => setDraftStorageStatus('error'));
    } else {
      setDraftStorageStatus('not-saved');
    }
  };

  return (
    <GpxLocalPreviewSectionView
      state={state}
      isSelecting={isSelecting}
      onChoose={() => { void chooseFile(); }}
      onDismiss={dismissDraft}
      authorizationDraft={safeDraft}
      onAuthorizationDraftChange={updateAuthorizationDraft}
      isDraftLoaded={draftContextReady}
      isDraftActive={safeDraftActive}
      hasRecoveredDraft={safeRecoveredDraft}
      isAuthenticated={draftContextReady && user !== null}
      draftStorageStatus={draftStorageStatus}
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
  checklist: { gap: spacing[8], backgroundColor: colors.limestone, borderRadius: radius.md, padding: spacing[12] },
  checklistTitle: { color: colors.olive900, fontSize: 13, fontWeight: '900' },
  checklistText: { color: colors.ink, fontSize: 12, lineHeight: 18 },
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
  reviewPanel: { gap: spacing[12], borderRadius: radius.md, backgroundColor: colors.warmBackground, padding: spacing[12], borderWidth: 1, borderColor: colors.border },
  reviewTitle: { color: colors.olive900, fontSize: 16, fontWeight: '900' },
  candidateStatusPanel: { gap: spacing[4], backgroundColor: colors.limestone, borderRadius: radius.md, padding: spacing[8] },
  statusLine: { color: colors.olive900, fontSize: 13, fontWeight: '900' },
  reviewIntro: { color: colors.ink, fontSize: 12, lineHeight: 18 },
  formField: { gap: spacing[8] },
  fieldLabel: { color: colors.ink, fontSize: 12, lineHeight: 17, fontWeight: '800' },
  textInput: { minHeight: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: spacing[12], paddingVertical: spacing[8], color: colors.ink, fontSize: 13 },
  multilineInput: { minHeight: 72, textAlignVertical: 'top' },
  fieldHint: { color: colors.olive700, fontSize: 11, lineHeight: 16 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[8] },
  choiceButton: { minHeight: 38, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: spacing[8], paddingVertical: spacing[8] },
  choiceButtonSelected: { borderColor: colors.olive900, backgroundColor: colors.limestone },
  choiceText: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  choiceTextSelected: { color: colors.olive900, fontWeight: '900' },
  blockedPanel: { gap: spacing[8], borderRadius: radius.md, borderWidth: 1, borderColor: colors.earth, backgroundColor: colors.limestone, padding: spacing[12] },
  blockedTitle: { color: colors.earth, fontSize: 13, fontWeight: '900' },
  blockedText: { color: colors.ink, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  storagePanel: { borderRadius: radius.md, backgroundColor: colors.limestone, padding: spacing[8] },
  dismissButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.olive700, borderRadius: radius.md, paddingHorizontal: spacing[12] },
  dismissButtonText: { color: colors.olive900, fontSize: 13, fontWeight: '800' },
});
