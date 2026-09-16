-- Complete audit coverage for administrative catalog/content mutations that are
-- performed directly through the Data API under RLS.

create trigger audit_route_media
  after insert or update or delete on public.route_media
  for each row execute function private.audit_row_change();

create trigger audit_gamification_levels
  after insert or update or delete on public.gamification_levels
  for each row execute function private.audit_row_change();

create trigger audit_gamification_badges
  after insert or update or delete on public.gamification_badges
  for each row execute function private.audit_row_change();

create trigger audit_gamification_challenges
  after insert or update or delete on public.gamification_challenges
  for each row execute function private.audit_row_change();
