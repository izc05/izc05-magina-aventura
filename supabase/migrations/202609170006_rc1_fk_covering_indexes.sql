-- RC1 FK Covering Indexes for baseline tables

CREATE INDEX IF NOT EXISTS idx_activities_route_id ON public.activities(route_id);
CREATE INDEX IF NOT EXISTS idx_activity_track_batches_activity_user ON public.activity_track_batches(activity_id, user_id);
CREATE INDEX IF NOT EXISTS idx_activity_track_batches_user_id ON public.activity_track_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_community_photos_discovery_id ON public.community_photos(discovery_id);
CREATE INDEX IF NOT EXISTS idx_community_staff_members_created_by ON public.community_staff_members(created_by);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_actor_user_id ON public.moderation_actions(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_home_municipality_id ON public.profiles(home_municipality_id);
CREATE INDEX IF NOT EXISTS idx_route_comments_user_id ON public.route_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_route_incidents_photo_id ON public.route_incidents(photo_id);
CREATE INDEX IF NOT EXISTS idx_route_incidents_user_id ON public.route_incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_route_reviews_user_id ON public.route_reviews(user_id);
