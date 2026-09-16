-- Safe public views use security_invoker, so the anonymous role must be able
-- to evaluate their moderation/deletion predicates on the underlying rows.
-- Exact geometry remains intentionally ungranted.
grant select (moderation_status, deleted_at)
on public.community_photos
to anon;

grant select (deleted_at)
on public.route_incidents
to anon;
