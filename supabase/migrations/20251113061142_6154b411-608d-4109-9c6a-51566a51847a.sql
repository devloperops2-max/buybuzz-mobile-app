-- Remove the self-service admin creation policy
-- This prevents users from granting themselves admin privileges
DROP POLICY IF EXISTS "Users can create their own admin role" ON public.user_roles;