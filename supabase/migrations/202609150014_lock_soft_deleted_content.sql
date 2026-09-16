alter policy community_photos_update_own
on public.community_photos
using (
  user_id = auth.uid()
  and deleted_at is null
)
with check (user_id = auth.uid());

alter policy route_comments_update_own
on public.route_comments
using (
  user_id = auth.uid()
  and deleted_at is null
)
with check (user_id = auth.uid());

alter policy route_reviews_update_own
on public.route_reviews
using (
  user_id = auth.uid()
  and deleted_at is null
)
with check (user_id = auth.uid());

alter policy route_incidents_update_own
on public.route_incidents
using (
  user_id = auth.uid()
  and deleted_at is null
)
with check (user_id = auth.uid());
