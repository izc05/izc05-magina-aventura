import test from 'node:test';
import assert from 'node:assert/strict';
import {
  routeOptions,
  municipalityOptions,
  partnerOptions,
  userOptions
} from '../src/core/lookups.mjs';

test('routeOptions uses friendly route code and title while keeping id as internal value', () => {
  assert.deepEqual(routeOptions([
    { id: '2', route_code: 'MA-002', title: 'Pico Mágina' },
    { id: '1', route_code: 'MA-001', title: 'Las Viñas' },
    { id: '3', route_code: null, slug: 'sendero-cuadros', title: 'Sendero de Cuadros' }
  ]), [
    { value: '1', label: 'MA-001 · Las Viñas' },
    { value: '2', label: 'MA-002 · Pico Mágina' },
    { value: '3', label: 'Sendero de Cuadros' }
  ]);
});

test('municipalityOptions sorts active municipalities by human name', () => {
  assert.deepEqual(municipalityOptions([
    { id: 'jodar', name: 'Jódar', active: true },
    { id: 'bedmar', name: 'Bedmar y Garcíez', active: true },
    { id: 'old', name: 'Municipio antiguo', active: false }
  ]), [
    { value: 'bedmar', label: 'Bedmar y Garcíez' },
    { value: 'jodar', label: 'Jódar' }
  ]);
});

test('partnerOptions hides inactive partners and labels them by name', () => {
  assert.deepEqual(partnerOptions([
    { id: 'p2', name: 'Almazara Sierra Mágina', active: true },
    { id: 'p1', name: 'Cooperativa Bedmar', active: true },
    { id: 'p3', name: 'Partner antiguo', active: false }
  ]), [
    { value: 'p2', label: 'Almazara Sierra Mágina' },
    { value: 'p1', label: 'Cooperativa Bedmar' }
  ]);
});

test('userOptions prefers display name or email and never exposes UUID as label', () => {
  assert.deepEqual(userOptions([
    { id: 'u2', display_name: 'Rocío López', email: 'rocio@example.test' },
    { id: 'u1', display_name: '', email: 'ivan@example.test' }
  ]), [
    { value: 'u1', label: 'ivan@example.test' },
    { value: 'u2', label: 'Rocío López · rocio@example.test' }
  ]);
});
