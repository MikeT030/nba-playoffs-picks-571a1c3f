
-- Create picks table
CREATE TABLE public.picks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_name TEXT NOT NULL,
  series_id TEXT NOT NULL,
  winner TEXT NOT NULL,
  games_in_series INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, series_id)
);

-- Enable RLS
ALTER TABLE public.picks ENABLE ROW LEVEL SECURITY;

-- Users can view their own picks
CREATE POLICY "Users can view their own picks"
ON public.picks FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own picks
CREATE POLICY "Users can create their own picks"
ON public.picks FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own picks
CREATE POLICY "Users can update their own picks"
ON public.picks FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own picks
CREATE POLICY "Users can delete their own picks"
ON public.picks FOR DELETE
USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_picks_updated_at
BEFORE UPDATE ON public.picks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
