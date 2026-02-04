-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_logs;

-- Create proper policy for authenticated users to insert activity logs
CREATE POLICY "Authenticated users can insert activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);