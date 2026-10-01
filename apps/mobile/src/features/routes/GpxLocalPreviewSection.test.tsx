import { afterEach, describe, expect, it, vi } from 'vitest';
import { SYNTHETIC_TEST_ONLY_GPX } from '../../../../../packages/route-import/src/gpx-local-preview.test-fixture';
import {
  createEmptyGpxCandidateAuthorizationDraft,
  createGpxCandidateReviewRecord,
  createGpxLocalPreview,
  type GpxCandidateAuthorizationDraft,
} from '@magina-aventura/route-import';
import { GpxLocalPreviewSectionView } from './GpxLocalPreviewSection';

const mocks = vi.hoisted(() => ({ pickFileAsync: vi.fn() }));
vi.mock('expo-file-system', () => ({ File: { pickFileAsync: mocks.pickFileAsync } }));
vi.mock('expo-sqlite', () => ({ openDatabaseAsync: vi.fn() }));
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: null, isLoading: false }),
}));
vi.mock('react-native', () => ({
  Pressable: 'Pressable',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  TextInput: 'TextInput',
  View: 'View',
}));

type ElementLike = { type?: unknown; props?: Record<string, unknown> };
function renderedChildren(element: ElementLike): unknown {
  if (typeof element.type === 'function') {
    return (element.type as (props: Record<string, unknown>) => unknown)(element.props ?? {});
  }
  return element.props?.children;
}
function collectElements(node: unknown, elements: ElementLike[] = []): ElementLike[] {
  if (Array.isArray(node)) {
    for (const child of node) collectElements(child, elements);
  } else if (node !== null && typeof node === 'object' && 'props' in node) {
    const element = node as ElementLike;
    elements.push(element);
    collectElements(renderedChildren(element), elements);
  }
  return elements;
}
function visibleText(node: unknown): string[] {
  if (typeof node === 'string' || typeof node === 'number') return [String(node)];
  if (Array.isArray(node)) return node.flatMap(visibleText);
  if (node !== null && typeof node === 'object' && 'props' in node) {
    return visibleText(renderedChildren(node as ElementLike));
  }
  return [];
}
function renderState(status: 'cancelled' | 'invalid' | 'access-error') {
  if (status === 'invalid') return { status, reason: 'invalid-xml' } as const;
  return { status } as const;
}
function validPreviewState() {
  return {
    status: 'valid-local' as const,
    preview: createGpxLocalPreview('/private/fixture-sintetico.gpx', SYNTHETIC_TEST_ONLY_GPX, SYNTHETIC_TEST_ONLY_GPX.length),
  };
}
const completeDraft: GpxCandidateAuthorizationDraft = {
  sourceOrUrl: 'fuente de prueba',
  rightsHolderOrAuthor: 'titular de prueba',
  licenseOrPermissionType: 'permiso escrito de prueba',
  permissionDecision: 'granted',
  commercialUse: 'permitted',
  derivatives: 'permitted',
  distribution: 'permitted',
  requiredAttributionText: 'Atribución de prueba',
  localAuthorizationReference: '',
};
afterEach(() => vi.clearAllMocks());

describe('Bedmar local GPX preview section', () => {
  it('explains local-only behavior, preparation materials, and privacy before a GPX is selected', () => {
    const tree = GpxLocalPreviewSectionView({
      state: { status: 'idle' },
      isSelecting: false,
      onChoose: vi.fn(),
      onDismiss: vi.fn(),
    });
    const text = visibleText(tree).join(' ');
    const choose = collectElements(tree).find((element) => element.props?.accessibilityLabel === 'Elegir un archivo GPX para vista previa local');
    expect(text).toContain('selector del sistema');
    expect(text).toContain('No se solicita acceso general al almacenamiento');
    expect(text).toContain('La vista previa no se mezcla con GPS de actividad ni con navegación');
    expect(text).toContain('oculta su nombre y metadatos personales');
    expect(text).toContain('Qué preparar para una revisión futura');
    expect(text).toContain('fuente o URL');
    expect(text).toContain('titular/autor');
    expect(text).toContain('licencia o autorización escrita');
    expect(text).toContain('uso comercial, derivados y distribución');
    expect(text).toContain('texto de atribución requerido');
    expect(text).toContain('consérvalo privado en tu dispositivo');
    expect(text).toContain('nunca se sincronizan');
    expect(text).toContain('Seleccionar el archivo no acredita permiso ni valida el sendero');
    expect(choose?.props?.accessibilityRole).toBe('button');
    expect(choose?.props?.accessibilityHint).toContain('No guarda ni importa la geometría');
    expect(collectElements(tree).some((element) => element.props?.testID === 'gpx-valid-local-state')).toBe(false);
    expect(mocks.pickFileAsync).not.toHaveBeenCalled();
  });

  it('shows only a generic filename, technical version, anonymous counts, and unverified provenance', () => {
    const tree = GpxLocalPreviewSectionView({
      state: validPreviewState(),
      isSelecting: false,
      onChoose: vi.fn(),
      onDismiss: vi.fn(),
    });
    const text = visibleText(tree).join(' ');
    expect(collectElements(tree).some((element) => element.props?.testID === 'gpx-valid-local-state')).toBe(true);
    expect(text).toContain('Archivo GPX local');
    expect(text).toContain('DETALLES TÉCNICOS');
    expect(text).not.toContain('fixture-sintetico.gpx');
    expect(text).toMatch(/Tracks:\s+1/);
    expect(text).toMatch(/Waypoints:\s+2/);
    expect(text).toContain('Sin verificar / pendiente de autorización');
    expect(text).not.toContain('Nombre declarado');
    expect(text).not.toContain('Autoría sintética de prueba');
    expect(text).not.toContain('Distancia');
    expect(text).not.toContain('Desnivel');
    expect(text).not.toContain('Perfil');
    expect(text).not.toContain('Checkpoint');
    expect(text).not.toContain('Duración de ruta');
    expect(text).not.toContain('Iniciar navegación');
    expect(text).toMatch(/Estado:\s+CANDIDATE\s+\/\s+UNVERIFIED/);
    expect(text).toContain('Ruta bloqueada · no operativa');
    expect(text).toContain('Modo visitante');
    expect(mocks.pickFileAsync).not.toHaveBeenCalled();
  });

  it('collects each rights field independently and keeps the optional authorization reference out of persistent storage', () => {
    const onAuthorizationDraftChange = vi.fn();
    const tree = GpxLocalPreviewSectionView({
      state: validPreviewState(),
      isSelecting: false,
      onChoose: vi.fn(),
      onDismiss: vi.fn(),
      authorizationDraft: createEmptyGpxCandidateAuthorizationDraft(),
      onAuthorizationDraftChange,
      isAuthenticated: true,
      isDraftActive: true,
      draftStorageStatus: 'saved',
    });
    const elements = collectElements(tree);
    const inputElements = elements.filter((element) => element.type === 'TextInput');
    const inputIds = inputElements.map((element) => element.props?.testID);
    expect(inputIds).toEqual(expect.arrayContaining([
      'gpx-source-or-url',
      'gpx-rights-holder-author',
      'gpx-license-permission-type',
      'gpx-required-attribution',
      'gpx-local-authorization-reference',
    ]));
    expect(elements.some((element) => element.props?.testID === 'gpx-scope-commercialUse')).toBe(true);
    expect(elements.some((element) => element.props?.testID === 'gpx-scope-derivatives')).toBe(true);
    expect(elements.some((element) => element.props?.testID === 'gpx-scope-distribution')).toBe(true);
    expect(elements.some((element) => element.props?.accessibilityLabel === 'Permiso: Rechazado')).toBe(true);
    expect(visibleText(tree).join(' ')).toContain('Referencia local al documento de autorización (opcional)');
    expect(visibleText(tree).join(' ')).toContain('La referencia local es texto temporal y no se persiste');
    expect(visibleText(tree).join(' ')).toContain('SQLite privado de este dispositivo y separado por cuenta');

    const sourceInput = inputElements.find((element) => element.props?.testID === 'gpx-source-or-url');
    (sourceInput?.props?.onChangeText as ((value: string) => void) | undefined)?.('https://local.test/source');
    expect(onAuthorizationDraftChange).toHaveBeenCalledWith({ sourceOrUrl: 'https://local.test/source' });
    expect(mocks.pickFileAsync).not.toHaveBeenCalled();
  });

  it('recovers a private rights draft without implying that the GPX file was saved or linked', () => {
    const tree = GpxLocalPreviewSectionView({
      state: { status: 'idle' },
      isSelecting: false,
      onChoose: vi.fn(),
      onDismiss: vi.fn(),
      authorizationDraft: completeDraft,
      isAuthenticated: true,
      isDraftLoaded: true,
      isDraftActive: true,
      hasRecoveredDraft: true,
      draftStorageStatus: 'saved',
    });
    const text = visibleText(tree).join(' ');
    const inputValues = collectElements(tree)
      .filter((element) => element.type === 'TextInput')
      .map((element) => element.props?.value);
    expect(text).toContain('Borrador privado recuperado');
    expect(text).toContain('El archivo GPX no se guardó ni quedó vinculado');
    expect(text).toMatch(/Estado:\s+CANDIDATE\s+\/\s+UNVERIFIED/);
    expect(inputValues).toContain('fuente de prueba');
    expect(inputValues).toContain('Atribución de prueba');
    expect(text).toContain('Publicación: bloqueada');
  });

  it('keeps publication, GPS use, and checkpoint creation blocked when the authorization declaration is complete', () => {
    const review = createGpxCandidateReviewRecord(completeDraft);
    const tree = GpxLocalPreviewSectionView({
      state: validPreviewState(),
      isSelecting: false,
      onChoose: vi.fn(),
      onDismiss: vi.fn(),
      authorizationDraft: completeDraft,
    });
    const text = visibleText(tree).join(' ');
    const elements = collectElements(tree);
    expect(review.authorizationStatus).toBe('ready-for-official-review');
    expect(review.status).toBe('CANDIDATE');
    expect(review.verificationStatus).toBe('UNVERIFIED');
    expect(review.capabilities).toEqual({ canPublishRoute: false, canUseForGps: false, canCreateCheckpoints: false });
    expect(text).toContain('Declaración completa · pendiente de revisión oficial');
    expect(text).toContain('Publicación: bloqueada');
    expect(text).toContain('Uso con GPS: bloqueado');
    expect(text).toContain('Crear checkpoints: bloqueado');
    expect(text).toContain('hace falta revisión oficial y verificación en terreno');
    expect(elements.some((element) => element.props?.accessibilityLabel === 'Marcar como verificada')).toBe(false);
    expect(elements.some((element) => element.props?.accessibilityLabel === 'Publicar ruta')).toBe(false);
  });

  it.each([
    ['cancelled', 'Selección cancelada', 'gpx-cancelled-state'],
    ['invalid', 'Archivo inválido o dañado', 'gpx-invalid-state'],
    ['access-error', 'Error de acceso al archivo', 'gpx-access-error-state'],
  ] as const)('renders the %s state and lets the user discard it', (status, heading, testID) => {
    const onDismiss = vi.fn();
    const tree = GpxLocalPreviewSectionView({
      state: renderState(status),
      isSelecting: false,
      onChoose: vi.fn(),
      onDismiss,
    });
    const elements = collectElements(tree);
    expect(visibleText(tree).join(' ')).toContain(heading);
    expect(elements.some((element) => element.props?.testID === testID)).toBe(true);
    const dismiss = elements.find((element) => element.props?.accessibilityLabel === 'Descartar vista previa y borrador local de GPX');
    expect(dismiss?.props?.accessibilityRole).toBe('button');
    (dismiss?.props?.onPress as (() => void) | undefined)?.();
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
