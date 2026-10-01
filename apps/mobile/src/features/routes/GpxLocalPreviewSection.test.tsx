import { afterEach, describe, expect, it, vi } from 'vitest';
import { SYNTHETIC_TEST_ONLY_GPX } from '../../../../../packages/route-import/src/gpx-local-preview.test-fixture';
import { createGpxLocalPreview } from '@magina-aventura/route-import';
import { GpxLocalPreviewSectionView } from './GpxLocalPreviewSection';

const mocks = vi.hoisted(() => ({ pickFileAsync: vi.fn() }));
vi.mock('expo-file-system', () => ({ File: { pickFileAsync: mocks.pickFileAsync } }));
vi.mock('react-native', () => ({
  Pressable: 'Pressable',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  View: 'View',
}));

type ElementLike = { type?: unknown; props?: Record<string, unknown> };
function collectElements(node: unknown, elements: ElementLike[] = []): ElementLike[] {
  if (Array.isArray(node)) {
    for (const child of node) collectElements(child, elements);
  } else if (node !== null && typeof node === 'object' && 'props' in node) {
    const element = node as ElementLike;
    elements.push(element);
    collectElements(element.props?.children, elements);
  }
  return elements;
}
function visibleText(node: unknown): string[] {
  if (typeof node === 'string' || typeof node === 'number') return [String(node)];
  if (Array.isArray(node)) return node.flatMap(visibleText);
  if (node !== null && typeof node === 'object' && 'props' in node) {
    return visibleText((node as ElementLike).props?.children);
  }
  return [];
}
function renderState(status: 'cancelled' | 'invalid' | 'access-error') {
  if (status === 'invalid') return { status, reason: 'invalid-xml' } as const;
  return { status } as const;
}
afterEach(() => vi.clearAllMocks());

describe('Bedmar local GPX preview section', () => {
  it('explains local-only behavior, the system picker, no broad storage access, and the permission requirement', () => {
    const tree = GpxLocalPreviewSectionView({
      state: { status: 'idle' },
      isSelecting: false,
      onChoose: vi.fn(),
      onDismiss: vi.fn(),
    });
    const text = visibleText(tree).join(' ');
    const choose = collectElements(tree).find((element) => element.props?.accessibilityLabel === 'Elegir un archivo GPX para vista previa local');
    expect(text).toContain('selector de archivos del sistema');
    expect(text).toContain('No se solicita acceso general al almacenamiento');
    expect(text).toContain('La vista previa no se mezcla con GPS de actividad ni con navegación');
    expect(text).toContain('Seleccionar el archivo no acredita permiso ni valida el sendero');
    expect(text).toContain('autorización del titular antes de importar geometría');
    expect(choose?.props?.accessibilityRole).toBe('button');
    expect(choose?.props?.accessibilityHint).toContain('No guarda ni importa la geometría');
    expect(collectElements(tree).some((element) => element.props?.testID === 'gpx-valid-local-state')).toBe(false);
    expect(mocks.pickFileAsync).not.toHaveBeenCalled();
  });

  it('shows only the synthetic fixture filename, present metadata, counts, and unverified provenance in a valid local state', () => {
    const preview = createGpxLocalPreview('fixture-sintetico.gpx', SYNTHETIC_TEST_ONLY_GPX, SYNTHETIC_TEST_ONLY_GPX.length);
    const tree = GpxLocalPreviewSectionView({
      state: { status: 'valid-local', preview },
      isSelecting: false,
      onChoose: vi.fn(),
      onDismiss: vi.fn(),
    });
    const text = visibleText(tree).join(' ');
    expect(collectElements(tree).some((element) => element.props?.testID === 'gpx-valid-local-state')).toBe(true);
    expect(text).toContain('fixture-sintetico.gpx');
    expect(text).toMatch(/Tracks:\s+1/);
    expect(text).toMatch(/Waypoints:\s+2/);
    expect(text).toContain('Sin verificar / pendiente de autorización');
    expect(text).toContain('Nombre declarado');
    expect(text).not.toContain('Distancia');
    expect(text).not.toContain('Desnivel');
    expect(text).not.toContain('Perfil');
    expect(text).not.toContain('Checkpoint');
    expect(text).not.toContain('Duración de ruta');
    expect(text).not.toContain('Iniciar navegación');
    expect(mocks.pickFileAsync).not.toHaveBeenCalled();
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
    const dismiss = elements.find((element) => element.props?.accessibilityLabel === 'Descartar vista previa de GPX');
    expect(dismiss?.props?.accessibilityRole).toBe('button');
    (dismiss?.props?.onPress as (() => void) | undefined)?.();
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
