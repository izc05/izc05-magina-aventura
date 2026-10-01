import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  openURL: vi.fn().mockResolvedValue(true),
  alert: vi.fn(),
}));

vi.mock('react-native', () => ({
  Alert: { alert: mocks.alert },
  Image: 'Image',
  Linking: { openURL: mocks.openURL },
  Pressable: 'Pressable',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  View: 'View',
}));
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

describe('Wikimedia Commons contextual gallery', () => {
  it('labels the 2014 Rio Cuadros / Cueva del Agua photos as historical context, not the new trail or current evidence', () => {
    const tree = CommonsContextGallery();
    const text = visibleText(tree).join(' ');
    const warning = collectElements(tree).find((element) => element.props?.testID === 'commons-photo-context-warning');
    const images = collectElements(tree).filter((element) => element.type === 'Image');

    expect(text).toContain('Río Cuadros / Cueva del Agua (2014)');
    expect(warning).toBeDefined();
    expect(visibleText(warning).join(' ')).toContain('fotografiado en 2014');
    expect(visibleText(warning).join(' ')).toContain('No muestran el trazado ni son fotos del sendero fluvial inaugurado recientemente.');
    expect(visibleText(warning).join(' ')).toContain('No son evidencia de checkpoints ni del estado actual.');
    expect(images).toHaveLength(2);
    for (const image of images) {
      expect(image.props?.accessibilityRole).toBe('image');
      expect(image.props?.accessibilityLabel).toContain('fotografía de 2014');
      expect(image.props?.accessibilityLabel).not.toMatch(/trazado actual|checkpoint/i);
    }
    expect(images.every((image) => !String(image.props?.accessibilityLabel).includes('sendero fluvial inaugurado recientemente'))).toBe(true);
  });

  it('shows legible author attribution, unchanged-original notice, both Commons pages and the CC BY-SA 4.0 license link', async () => {
    const tree = CommonsContextGallery();
    const text = visibleText(tree).join(' ');
    const elements = collectElements(tree);
    const pageLinks = elements.filter((element) =>
      element.type === 'Pressable' && String(element.props?.accessibilityLabel).startsWith('Abrir en Wikimedia Commons:'),
    );
    const licenseLink = elements.find((element) =>
      element.type === 'Pressable' && String(element.props?.accessibilityLabel).startsWith('Licencia de las fotografías:'),
    );

    expect(text.match(/Veinticuatro de Jahén/g)).toHaveLength(3);
    expect(text).toContain('Originales sin modificaciones ni recortes.');
    expect(text).toContain('CC BY-SA 4.0');
    expect(text).toContain('Atribución-CompartirIgual 4.0 Internacional');
    expect(pageLinks).toHaveLength(2);
    expect(licenseLink?.props?.accessibilityRole).toBe('link');
    expect(typeof licenseLink?.props?.onPress).toBe('function');

    for (const link of pageLinks) await (link.props?.onPress as (() => Promise<void>) | undefined)?.();
    await (licenseLink?.props?.onPress as (() => Promise<void>) | undefined)?.();
    expect(mocks.openURL).toHaveBeenNthCalledWith(1, 'https://commons.wikimedia.org/wiki/File:Rio_Cuadros_Jaen1.JPG');
    expect(mocks.openURL).toHaveBeenNthCalledWith(2, 'https://commons.wikimedia.org/wiki/File:Rio_Cuadros_Jaen2.JPG');
    expect(mocks.openURL).toHaveBeenNthCalledWith(3, 'https://creativecommons.org/licenses/by-sa/4.0/');
  });
});
