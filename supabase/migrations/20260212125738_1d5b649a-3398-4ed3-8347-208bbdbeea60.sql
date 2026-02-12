
DROP FUNCTION IF EXISTS public.get_hourly_player_stats(integer);

CREATE OR REPLACE FUNCTION public.get_hourly_player_stats(hours_back integer DEFAULT 24)
RETURNS TABLE(
  hour_label text,
  avg_players integer,
  peak_players integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_char(date_trunc('hour', s.timestamp AT TIME ZONE 'Asia/Kathmandu'), 'HH12 AM') AS hour_label,
    ROUND(AVG(s.java_players))::integer AS avg_players,
    MAX(s.java_players)::integer AS peak_players
  FROM public.server_status_history s
  WHERE s.timestamp >= (now() - (hours_back || ' hours')::interval)
    AND s.is_online = true
  GROUP BY date_trunc('hour', s.timestamp AT TIME ZONE 'Asia/Kathmandu')
  ORDER BY date_trunc('hour', s.timestamp AT TIME ZONE 'Asia/Kathmandu') ASC;
END;
$$;
