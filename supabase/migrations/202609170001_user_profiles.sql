-- Create a table for public profiles
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username text UNIQUE,
  level integer DEFAULT 1,
  xp integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- Create a table for user discovered items (collections)
CREATE TABLE public.user_discoveries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  discovery_id text NOT NULL, -- references a slug or ID from the domain
  discovered_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, discovery_id)
);

ALTER TABLE public.user_discoveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own discoveries."
  ON public.user_discoveries FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert their own discoveries."
  ON public.user_discoveries FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

-- Create a table for completed routes
CREATE TABLE public.user_completed_routes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  route_id text NOT NULL, -- references route slug
  completed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  time_taken_seconds integer,
  xp_rewarded integer DEFAULT 0
);

ALTER TABLE public.user_completed_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own completed routes."
  ON public.user_completed_routes FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert their own completed routes."
  ON public.user_completed_routes FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

-- Set up a trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
