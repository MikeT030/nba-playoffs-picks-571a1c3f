
-- Restrict SELECT on flyer_card_assignments to authenticated users only
DROP POLICY IF EXISTS "Anyone can view flyer assignments" ON public.flyer_card_assignments;
CREATE POLICY "Authenticated users can view flyer assignments"
ON public.flyer_card_assignments
FOR SELECT
TO authenticated
USING (true);
REVOKE SELECT ON public.flyer_card_assignments FROM anon;

-- Restrict SELECT on player_card_assignments to authenticated users only
DROP POLICY IF EXISTS "Anyone can view card assignments" ON public.player_card_assignments;
CREATE POLICY "Authenticated users can view card assignments"
ON public.player_card_assignments
FOR SELECT
TO authenticated
USING (true);
REVOKE SELECT ON public.player_card_assignments FROM anon;

-- Revoke EXECUTE on trigger-only SECURITY DEFINER functions from public/anon/authenticated
-- These are only invoked by triggers, never via the API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_user_deletion() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
