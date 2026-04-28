-- Allow admins to insert, update, and delete series_results.
-- Reads remain public (existing policy). Writes are gated by has_role(..., 'admin').

CREATE POLICY "Admins can insert series results"
ON public.series_results
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update series results"
ON public.series_results
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete series results"
ON public.series_results
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Keep updated_at fresh on edits
DROP TRIGGER IF EXISTS update_series_results_updated_at ON public.series_results;
CREATE TRIGGER update_series_results_updated_at
BEFORE UPDATE ON public.series_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Unique constraint so upserts on series_id behave correctly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'series_results_series_id_key'
  ) THEN
    ALTER TABLE public.series_results
      ADD CONSTRAINT series_results_series_id_key UNIQUE (series_id);
  END IF;
END $$;