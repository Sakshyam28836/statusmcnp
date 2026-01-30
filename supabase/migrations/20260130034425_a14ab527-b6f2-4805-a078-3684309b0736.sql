-- Add email column to staff_members table
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS email text;

-- Update the get_uptime_stats function to use Nepal timezone (UTC+5:45)
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
DECLARE
  nepal_offset interval := interval '5 hours 45 minutes';
  nepal_now timestamp with time zone := now() AT TIME ZONE 'UTC' + nepal_offset;
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
  WHERE timestamp >= (now() - (hours_back || ' hours')::interval);
END;
$$;

-- Create function to get current Nepal time
CREATE OR REPLACE FUNCTION public.get_nepal_time()
RETURNS timestamp with time zone
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT now() AT TIME ZONE 'Asia/Kathmandu';
$$;

-- Create function to check if it's a new day in Nepal timezone
CREATE OR REPLACE FUNCTION public.is_nepal_new_day(check_time timestamp with time zone)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXTRACT(HOUR FROM check_time AT TIME ZONE 'Asia/Kathmandu') = 0 
     AND EXTRACT(MINUTE FROM check_time AT TIME ZONE 'Asia/Kathmandu') < 15;
$$;