export const ROLE_CAPABILITIES = Object.freeze({
  super_admin: ['*'],
  admin: [
    'dashboard.read','routes.manage','map.manage','discoveries.manage','media.manage','users.read',
    'community.manage','moderation.manage','gamification.manage','olives.manage','rewards.manage',
    'partners.manage','redemptions.manage','notifications.manage','safety.manage','audit.read','settings.manage'
  ],
  route_manager: ['dashboard.read','routes.manage','map.manage','discoveries.manage','media.manage'],
  moderator: ['dashboard.read','users.read','community.manage','moderation.manage','audit.read'],
  partner: ['dashboard.read','rewards.manage','redemptions.manage']
});

export function can(role, capability) {
  const allowed = ROLE_CAPABILITIES[role] ?? [];
  return allowed.includes('*') || allowed.includes(capability);
}

export function canAny(roles, capability) {
  return roles.some((role) => can(role, capability));
}
