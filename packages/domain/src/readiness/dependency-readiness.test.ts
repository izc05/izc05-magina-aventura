import { describe, expect, it } from 'vitest';
import {
  evaluateIntegrationChain,
  type IntegrationNode,
} from './dependency-readiness';

const node = (overrides: Partial<IntegrationNode>): IntegrationNode => ({
  id: 'root',
  headSha: 'sha-root',
  integrated: false,
  retargetedToIntegratedParent: false,
  ...overrides,
});

describe('evaluateIntegrationChain', () => {
  it('blocks a child while its required parent is not integrated or retargeted', () => {
    const result = evaluateIntegrationChain([
      node({ id: 'parent' }),
      node({ id: 'child', parentId: 'parent', headSha: 'sha-child' }),
    ]);

    expect(result).toEqual([
      { id: 'child', status: 'BLOCKED', blockers: ['parent-not-integrated:parent'] },
      { id: 'parent', status: 'READY', blockers: [] },
    ]);
  });

  it('allows a child when the parent is integrated', () => {
    const result = evaluateIntegrationChain([
      node({ id: 'parent', integrated: true }),
      node({ id: 'child', parentId: 'parent', headSha: 'sha-child' }),
    ]);

    expect(result.find((item) => item.id === 'child')).toEqual({
      id: 'child',
      status: 'READY',
      blockers: [],
    });
  });

  it('allows a child explicitly retargeted onto an integrated parent state', () => {
    const result = evaluateIntegrationChain([
      node({ id: 'parent' }),
      node({
        id: 'child',
        parentId: 'parent',
        headSha: 'sha-child',
        retargetedToIntegratedParent: true,
      }),
    ]);

    expect(result.find((item) => item.id === 'child')).toEqual({
      id: 'child',
      status: 'READY',
      blockers: [],
    });
  });

  it('returns deterministic ordering by node id', () => {
    expect(
      evaluateIntegrationChain([
        node({ id: 'zeta' }),
        node({ id: 'alpha' }),
        node({ id: 'middle' }),
      ]).map((item) => item.id),
    ).toEqual(['alpha', 'middle', 'zeta']);
  });

  it('blocks duplicate ids deterministically', () => {
    expect(
      evaluateIntegrationChain([
        node({ id: 'duplicate', headSha: 'sha-a' }),
        node({ id: 'duplicate', headSha: 'sha-b' }),
      ]),
    ).toEqual([
      { id: 'duplicate', status: 'BLOCKED', blockers: ['duplicate-node-id'] },
      { id: 'duplicate', status: 'BLOCKED', blockers: ['duplicate-node-id'] },
    ]);
  });

  it('blocks a node whose parent reference is missing', () => {
    expect(
      evaluateIntegrationChain([
        node({ id: 'child', parentId: 'missing', headSha: 'sha-child' }),
      ]),
    ).toEqual([
      { id: 'child', status: 'BLOCKED', blockers: ['missing-parent:missing'] },
    ]);
  });
});
