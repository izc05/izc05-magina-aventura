import test from 'node:test';
import assert from 'node:assert/strict';
import * as routeEditor from '../src/core/route-editor.mjs';

const {
  routeBounds,
  pointToSvg,
  svgToLngLat,
  polylinePoints
} = routeEditor;

const route = [
  [-3.42, 37.98],
  [-3.40, 38.00],
  [-3.38, 38.01]
];

test('routeBounds calculates usable route extents', () => {
  assert.deepEqual(routeBounds(route), {
    minLng: -3.42,
    maxLng: -3.38,
    minLat: 37.98,
    maxLat: 38.01
  });
});

test('pointToSvg and svgToLngLat round-trip route coordinates', () => {
  const bounds = routeBounds(route);
  const svg = pointToSvg([-3.40, 38.00], bounds, 800, 420, 30);
  const restored = svgToLngLat(svg.x, svg.y, bounds, 800, 420, 30);

  assert.ok(Math.abs(restored[0] - -3.40) < 0.000001);
  assert.ok(Math.abs(restored[1] - 38.00) < 0.000001);
});

test('polylinePoints returns an SVG-compatible point list', () => {
  const result = polylinePoints(route, 800, 420, 30);
  assert.match(result, /^\d+(?:\.\d+)?,\d+(?:\.\d+)? /);
  assert.equal(result.trim().split(/\s+/).length, route.length);
});

test('municipalityOptions returns active municipalities sorted for the route form', () => {
  assert.equal(typeof routeEditor.municipalityOptions, 'function');
  assert.deepEqual(routeEditor.municipalityOptions([
    { id: '2', name: 'Jódar', active: true },
    { id: '3', name: 'Jimena', active: false },
    { id: '1', name: 'Bedmar y Garcíez', active: true }
  ]), [
    { value: '1', label: 'Bedmar y Garcíez' },
    { value: '2', label: 'Jódar' }
  ]);
});
