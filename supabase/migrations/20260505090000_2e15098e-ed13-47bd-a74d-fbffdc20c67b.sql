ALTER TABLE public.flyer_card_assignments ADD COLUMN IF NOT EXISTS burned_at timestamptz NULL, ADD COLUMN IF NOT EXISTS round text NOT NULL DEFAULT 'first_round';

CREATE UNIQUE INDEX IF NOT EXISTS flyer_card_assignments_round_user_idx ON public.flyer_card_assignments (round, user_id);

CREATE UNIQUE INDEX IF NOT EXISTS flyer_card_assignments_round_card_idx ON public.flyer_card_assignments (round, card_id);

DROP POLICY IF EXISTS "Users can burn their own flyer card" ON public.flyer_card_assignments;
CREATE POLICY "Users can burn their own flyer card" ON public.flyer_card_assignments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND burned_at IS NOT NULL);

ALTER TABLE public.flyer_card_assignments REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'flyer_card_assignments'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.flyer_card_assignments';
  END IF;
END $$;