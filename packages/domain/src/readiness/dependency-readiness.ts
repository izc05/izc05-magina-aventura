export interface IntegrationNode {
  id: string;
  parentId?: string;
  headSha: string;
  integrated: boolean;
  retargetedToIntegratedParent: boolean;
}

export interface IntegrationReadiness {
  id: string;
  status: 'READY' | 'BLOCKED';
  blockers: string[];
}

export function evaluateIntegrationChain(
  nodes: IntegrationNode[],
): IntegrationReadiness[] {
  const counts = new Map<string, number>();
  const byId = new Map<string, IntegrationNode>();

  for (const node of nodes) {
    counts.set(node.id, (counts.get(node.id) ?? 0) + 1);
    if (!byId.has(node.id)) {
      byId.set(node.id, node);
    }
  }

  return [...nodes]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((node): IntegrationReadiness => {
      if ((counts.get(node.id) ?? 0) > 1) {
        return {
          id: node.id,
          status: 'BLOCKED',
          blockers: ['duplicate-node-id'],
        };
      }

      if (!node.parentId) {
        return { id: node.id, status: 'READY', blockers: [] };
      }

      const parent = byId.get(node.parentId);
      if (!parent) {
        return {
          id: node.id,
          status: 'BLOCKED',
          blockers: [`missing-parent:${node.parentId}`],
        };
      }

      if (parent.integrated || node.retargetedToIntegratedParent) {
        return { id: node.id, status: 'READY', blockers: [] };
      }

      return {
        id: node.id,
        status: 'BLOCKED',
        blockers: [`parent-not-integrated:${node.parentId}`],
      };
    });
}
