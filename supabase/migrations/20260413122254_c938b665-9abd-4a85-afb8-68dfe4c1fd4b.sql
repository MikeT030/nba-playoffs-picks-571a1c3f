-- Drop the old restrictive SELECT policy
DROP POLICY "Users can view their own picks" ON public.picks;

-- Create a new policy allowing all authenticated users to see all picks
CREATE POLICY "Authenticated users can view all picks"
ON public.picks
FOR SELECT
TO authenticated
USING (true);