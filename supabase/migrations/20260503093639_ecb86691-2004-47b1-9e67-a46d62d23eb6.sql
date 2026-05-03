CREATE TABLE public.flyer_card_assignments (
  card_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  assigned_by UUID,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.flyer_card_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view flyer assignments"
ON public.flyer_card_assignments
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert flyer assignments"
ON public.flyer_card_assignments
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update flyer assignments"
ON public.flyer_card_assignments
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete flyer assignments"
ON public.flyer_card_assignments
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));