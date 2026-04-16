
-- Table to track which player card is assigned to each user
CREATE TABLE public.player_card_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(card_id)
);

ALTER TABLE public.player_card_assignments ENABLE ROW LEVEL SECURITY;

-- Everyone can see assignments (to know which cards are taken)
CREATE POLICY "Anyone can view card assignments"
  ON public.player_card_assignments FOR SELECT
  TO public
  USING (true);

-- Authenticated users can insert their own assignment
CREATE POLICY "Users can insert their own card assignment"
  ON public.player_card_assignments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own assignment
CREATE POLICY "Users can delete their own card assignment"
  ON public.player_card_assignments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
