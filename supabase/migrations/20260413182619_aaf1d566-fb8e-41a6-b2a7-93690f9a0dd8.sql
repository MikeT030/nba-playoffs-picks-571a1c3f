
CREATE TABLE public.series_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  series_id TEXT NOT NULL UNIQUE,
  winner TEXT NOT NULL,
  games_played INTEGER NOT NULL CHECK (games_played BETWEEN 4 AND 7),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.series_results ENABLE ROW LEVEL SECURITY;

-- Everyone can read results
CREATE POLICY "Series results are viewable by everyone"
ON public.series_results
FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_series_results_updated_at
BEFORE UPDATE ON public.series_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
