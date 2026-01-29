-- Create table for storing server status history
CREATE TABLE public.server_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  is_online boolean NOT NULL DEFAULT false,
  java_players integer NOT NULL DEFAULT 0,
  java_max_players integer NOT NULL DEFAULT 0,
  bedrock_online boolean NOT NULL DEFAULT false,
  ping_ms integer DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for efficient time-based queries
CREATE INDEX idx_server_status_timestamp ON public.server_status_history(timestamp DESC);

-- Enable RLS
ALTER TABLE public.server_status_history ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read status history (public data)
CREATE POLICY "Anyone can view server status history"
ON public.server_status_history
FOR SELECT
USING (true);

-- Only allow inserts from authenticated service or anon (for the status hook)
CREATE POLICY "Anyone can insert status history"
ON public.server_status_history
FOR INSERT
WITH CHECK (true);

-- Create function to clean up old records (keep 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_status_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.server_status_history
  WHERE timestamp < now() - interval '30 days';
END;
$$;

-- Create function to get uptime statistics
CREATE OR REPLACE FUNCTION public.get_uptime_stats(hours_back integer DEFAULT 24)
RETURNS TABLE(
  total_checks bigint,
  online_checks bigint,
  uptime_percentage numeric,
  avg_players numeric,
  max_players integer,
  avg_ping numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_checks,
    COUNT(*) FILTER (WHERE is_online = true)::bigint as online_checks,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE is_online = true)::numeric / COUNT(*)::numeric) * 100, 2)
      ELSE 0
    END as uptime_percentage,
    ROUND(AVG(java_players)::numeric, 1) as avg_players,
    MAX(java_players)::integer as max_players,
    ROUND(AVG(ping_ms)::numeric, 0) as avg_ping
  FROM public.server_status_history
  WHERE timestamp >= now() - (hours_back || ' hours')::interval;
END;
$$;