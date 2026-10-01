import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  openURL: vi.fn().mockResolvedValue(true),
  alert: vi.fn(),
  stateValues: [] as unknown[],
  stateCursor: 0,
}));

vi.mock('react', () => ({
  useState: (initialValue: unknown) => {
    const index = mocks.stateCursor;
    mocks.stateCursor += 1;
    if (mocks.stateValues[index] === undefined) mocks.stateValues[index] = initialValue;
    const setValue = (value: unknown) => {
      const current = mocks.stateValues[index];
      mocks.stateValues[index] = typeof value === 'function'
        ? (value as (current: unknown) => unknown)(current)
        : value;
    };
    return [mocks.stateValues[index], setValue];
  },
}));
vi.mock('react-native', () => ({
  Alert: { alert: mocks.alert },
  Image: 'Image',
  Linking: { openURL: mocks.openURL },
  Modal: 'Modal',
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  View: 'View',
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));
vi.mock('./commons-context-assets', () => ({
  CC_BY_SA_4_0_URL: 'https://creativecommons.org/licenses/by-sa/4.0/',
  commonsContextPhotos: [
    {
      id: 'rio-cuadros-jaen1',
      fileName: 'Rio Cuadros Jaen1.JPG',
      source: 1,
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Rio_Cuadros_Jaen1.JPG',
      accessibilityLabel: 'Cueva del Agua del río Cuadros, fotografía de 2014. No muestra el trazado del sendero fluvial nuevo.',
      author: 'Veinticuatro de Jahén',
    },
    {
      id: 'rio-cuadros-jaen2',
      fileName: 'Rio Cuadros Jaen2.JPG',
      source: 2,
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Rio_Cuadros_Jaen2.JPG',
      accessibilityLabel: 'Cueva del Agua del río Cuadros, fotografía de 2014. No muestra el trazado del sendero fluvial nuevo.',
      author: 'Veinticuatro de Jahén',
    },
  ],
}));

import { CommonsContextGallery } from './CommonsContextGallery';

type ElementLike = { type?: unknown; props?: Record<string, unknown> };
const CONTEXT_WARNING = 'paraje Cueva del Agua/Río Cuadros, fotos de 2014; no documentan la senda nueva ni validan el trazado';
const LICENSE_LABEL = 'Creative Commons Atribución-CompartirIgual 4.0 Internacional (CC BY-SA 4.0)';

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

function getByTestId(tree: unknown, testID: string): ElementLike {
  const element = collectElements(tree).find((candidate) => candidate.props?.testID === testID);
  if (!element) throw new Error(`Missing element with testID ${testID}`);
  return element;
}

function press(element: ElementLike) {
  const onPress = element.props?.onPress;
  if (typeof onPress !== 'function') throw new Error('Element is not pressable');
  (onPress as () => void)();
}

function renderGallery() {
  mocks.stateCursor = 0;
  return CommonsContextGallery();
}

beforeEach(() => {
  mocks.stateValues.length = 0;
  mocks.stateCursor = 0;
  mocks.openURL.mockReset();
  mocks.openURL.mockResolvedValue(true);
  mocks.alert.mockReset();
});

describe('Wikimedia Commons contextual gallery and enlarged viewer', () => {
  it('exposes accessible image buttons and opens/closes the full, uncropped original with the persistent warning', () => {
    let tree = renderGallery();
    const openingButton = getByTestId(tree, 'commons-photo-open-rio-cuadros-jaen1');
    expect(openingButton.props?.accessibilityRole).toBe('button');
    expect(openingButton.props?.accessibilityLabel).toContain('Rio Cuadros Jaen1.JPG');
    expect(openingButton.props?.accessibilityLabel).toContain('Veinticuatro de Jahén');
    expect(openingButton.props?.accessibilityHint).toContain('sin recortar');

    press(openingButton);
    tree = renderGallery();
    const modal = getByTestId(tree, 'commons-photo-viewer-modal');
    const image = getByTestId(tree, 'commons-photo-viewer-image');
    const viewerWarning = getByTestId(tree, 'commons-photo-viewer-warning');
    expect(modal.props?.visible).toBe(true);
    expect(modal.props?.onRequestClose).toBeTypeOf('function');
    expect(image.props?.source).toBe(1);
    expect(image.props?.resizeMode).toBe('contain');
    expect(image.props?.accessibilityRole).toBe('image');
    expect(image.props?.accessibilityLabel).toContain('Rio Cuadros Jaen1.JPG');
    expect(visibleText(viewerWarning).join(' ')).toContain(CONTEXT_WARNING);

    press(getByTestId(tree, 'commons-photo-viewer-close'));
    tree = renderGallery();
    expect(getByTestId(tree, 'commons-photo-viewer-modal').props?.visible).toBe(false);
    expect(visibleText(getByTestId(tree, 'commons-photo-context-warning')).join(' ')).toContain(CONTEXT_WARNING);

    press(getByTestId(tree, 'commons-photo-open-rio-cuadros-jaen1'));
    tree = renderGallery();
    (getByTestId(tree, 'commons-photo-viewer-modal').props?.onRequestClose as (() => void) | undefined)?.();
    tree = renderGallery();
    expect(getByTestId(tree, 'commons-photo-viewer-modal').props?.visible).toBe(false);
  });

  it('navigates between both originals in both directions without changing the image sources', () => {
    let tree = renderGallery();
    press(getByTestId(tree, 'commons-photo-open-rio-cuadros-jaen1'));
    tree = renderGallery();
    expect(getByTestId(tree, 'commons-photo-viewer-image').props?.source).toBe(1);
    expect(getByTestId(tree, 'commons-photo-viewer-previous').props?.accessibilityRole).toBe('button');
    expect(getByTestId(tree, 'commons-photo-viewer-next').props?.accessibilityLabel).toContain('Rio Cuadros Jaen2.JPG');

    press(getByTestId(tree, 'commons-photo-viewer-next'));
    tree = renderGallery();
    expect(getByTestId(tree, 'commons-photo-viewer-image').props?.source).toBe(2);
    expect(visibleText(getByTestId(tree, 'commons-photo-viewer-attribution')).join(' ')).toContain('Rio Cuadros Jaen2.JPG');

    press(getByTestId(tree, 'commons-photo-viewer-previous'));
    tree = renderGallery();
    expect(getByTestId(tree, 'commons-photo-viewer-image').props?.source).toBe(1);
  });

  it('provides complete visible and screen-reader attribution, Commons and license links for the selected photo', async () => {
    let tree = renderGallery();
    press(getByTestId(tree, 'commons-photo-open-rio-cuadros-jaen1'));
    tree = renderGallery();
    const attribution = getByTestId(tree, 'commons-photo-viewer-attribution');
    const attributionText = visibleText(attribution).join(' ');
    expect(attributionText).toContain('Rio Cuadros Jaen1.JPG');
    expect(attributionText).toContain('Veinticuatro de Jahén');
    expect(attributionText).toContain('Wikimedia Commons');
    expect(attributionText).toContain(LICENSE_LABEL);

    const elements = collectElements(attribution);
    const sourceLink = elements.find((element) => element.props?.accessibilityRole === 'link' && String(element.props?.accessibilityLabel).includes('Wikimedia Commons'));
    const licenseLink = elements.find((element) => element.props?.accessibilityRole === 'link' && String(element.props?.accessibilityLabel).includes('CC BY-SA 4.0'));
    expect(sourceLink?.props?.accessibilityLabel).toContain('Rio Cuadros Jaen1.JPG');
    expect(licenseLink?.props?.accessibilityLabel).toContain(LICENSE_LABEL);
    expect(typeof sourceLink?.props?.onPress).toBe('function');
    expect(typeof licenseLink?.props?.onPress).toBe('function');

    press(sourceLink!);
    press(licenseLink!);
    expect(mocks.openURL).toHaveBeenNthCalledWith(1, 'https://commons.wikimedia.org/wiki/File:Rio_Cuadros_Jaen1.JPG');
    expect(mocks.openURL).toHaveBeenNthCalledWith(2, 'https://creativecommons.org/licenses/by-sa/4.0/');

    press(getByTestId(tree, 'commons-photo-viewer-next'));
    tree = renderGallery();
    const secondAttribution = getByTestId(tree, 'commons-photo-viewer-attribution');
    expect(visibleText(secondAttribution).join(' ')).toContain('Rio Cuadros Jaen2.JPG');
    expect(collectElements(secondAttribution).some((element) => String(element.props?.accessibilityLabel).includes('Rio Cuadros Jaen2.JPG'))).toBe(true);
  });

  it('keeps the precise provenance warning visible and readable by screen readers in the gallery and viewer', () => {
    let tree = renderGallery();
    const galleryWarning = getByTestId(tree, 'commons-photo-context-warning');
    const galleryWarningText = collectElements(galleryWarning).find((element) => String(element.props?.accessibilityLabel) === CONTEXT_WARNING);
    expect(visibleText(galleryWarning).join(' ')).toContain(CONTEXT_WARNING);
    expect(galleryWarningText).toBeDefined();

    press(getByTestId(tree, 'commons-photo-open-rio-cuadros-jaen2'));
    tree = renderGallery();
    const viewerWarning = getByTestId(tree, 'commons-photo-viewer-warning');
    const viewerWarningText = collectElements(viewerWarning).find((element) => String(element.props?.accessibilityLabel) === CONTEXT_WARNING);
    expect(visibleText(viewerWarning).join(' ')).toContain(CONTEXT_WARNING);
    expect(viewerWarningText).toBeDefined();
    expect(getByTestId(tree, 'commons-photo-viewer-image').props?.source).toBe(2);
  });

  it('marks the overlay as a modal accessibility context and exposes large, labeled close/navigation controls', () => {
    let tree = renderGallery();
    press(getByTestId(tree, 'commons-photo-open-rio-cuadros-jaen1'));
    tree = renderGallery();
    const elements = collectElements(tree);
    const modalContext = elements.find((element) => element.props?.accessibilityViewIsModal === true);
    const closeButton = getByTestId(tree, 'commons-photo-viewer-close');
    const previousButton = getByTestId(tree, 'commons-photo-viewer-previous');
    const nextButton = getByTestId(tree, 'commons-photo-viewer-next');
    expect(modalContext?.props?.importantForAccessibility).toBe('yes');
    expect(modalContext?.props?.onAccessibilityEscape).toBeTypeOf('function');
    expect(closeButton.props?.accessibilityLabel).toBe('Cerrar visor ampliado');
    expect(previousButton.props?.accessibilityLabel).toContain('Rio Cuadros Jaen2.JPG');
    expect(nextButton.props?.accessibilityLabel).toContain('Rio Cuadros Jaen2.JPG');
    expect(getByTestId(tree, 'commons-photo-viewer-image').props?.accessible).toBe(true);

    (modalContext?.props?.onAccessibilityEscape as (() => void) | undefined)?.();
    tree = renderGallery();
    expect(getByTestId(tree, 'commons-photo-viewer-modal').props?.visible).toBe(false);
  });

  it('retains the gallery-level attribution and opens its source/license links', async () => {
    const tree = renderGallery();
    const text = visibleText(tree).join(' ');
    const elements = collectElements(tree);
    const pageLinks = elements.filter((element) =>
      element.type === 'Pressable' && String(element.props?.accessibilityLabel).startsWith('Abrir en Wikimedia Commons:'),
    );
    const licenseLink = elements.find((element) =>
      element.type === 'Pressable' && String(element.props?.accessibilityLabel).startsWith('Licencia de las fotografías:'),
    );

    expect(text).toContain('Originales sin modificaciones ni recortes.');
    expect(text).toContain('Veinticuatro de Jahén');
    expect(text).toContain('CC BY-SA 4.0');
    expect(text).toContain('Atribución-CompartirIgual 4.0 Internacional');
    expect(pageLinks).toHaveLength(2);
    expect(licenseLink?.props?.accessibilityRole).toBe('link');
    expect(typeof licenseLink?.props?.onPress).toBe('function');

    for (const link of pageLinks) press(link);
    press(licenseLink!);
    expect(mocks.openURL).toHaveBeenNthCalledWith(1, 'https://commons.wikimedia.org/wiki/File:Rio_Cuadros_Jaen1.JPG');
    expect(mocks.openURL).toHaveBeenNthCalledWith(2, 'https://commons.wikimedia.org/wiki/File:Rio_Cuadros_Jaen2.JPG');
    expect(mocks.openURL).toHaveBeenNthCalledWith(3, 'https://creativecommons.org/licenses/by-sa/4.0/');
  });
});
