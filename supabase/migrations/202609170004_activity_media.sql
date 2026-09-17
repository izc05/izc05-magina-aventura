-- Activity media (private-first)

CREATE TABLE public.activity_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discovery_id uuid,
  checkpoint_id uuid,
  remote_object_path text,
  privacy text NOT NULL DEFAULT 'PRIVATE' CHECK (privacy IN ('PRIVATE', 'PUBLIC')),
  sync_state text NOT NULL DEFAULT 'LOCAL' CHECK (sync_state IN ('LOCAL', 'QUEUED', 'UPLOADING', 'SYNCED', 'FAILED')),
  mime_type text,
  byte_size integer,
  captured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_media_activity ON public.activity_media(activity_id);
CREATE INDEX idx_activity_media_user ON public.activity_media(user_id);

ALTER TABLE public.activity_media ENABLE ROW LEVEL SECURITY;

-- Owners can read and insert their own media
CREATE POLICY "Users can read own media" ON public.activity_media
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own media" ON public.activity_media
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND privacy = 'PRIVATE');

-- Users can update sync_state of their own media (for upload progress)
CREATE POLICY "Users can update own media sync" ON public.activity_media
  FOR UPDATE TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Community publication is a separate table referencing approved media
CREATE TABLE public.community_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid NOT NULL REFERENCES public.activity_media(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caption text,
  published_at timestamptz NOT NULL DEFAULT now(),
  hidden boolean NOT NULL DEFAULT false
);

ALTER TABLE public.community_publications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read visible publications" ON public.community_publications
  FOR SELECT TO authenticated USING (hidden = false);

CREATE POLICY "Users can insert own publications" ON public.community_publications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Hiding/removing the public post does NOT destroy the private activity evidence
CREATE POLICY "Users can hide own publications" ON public.community_publications
  FOR UPDATE TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
