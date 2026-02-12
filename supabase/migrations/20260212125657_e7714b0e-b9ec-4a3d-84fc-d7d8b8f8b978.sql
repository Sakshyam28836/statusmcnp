
-- Create a function to get hourly player stats for the last 24 hours
-- Uses Nepal time and aggregates from server_status_history directly
CREATE OR REPLACE FUNCTION public.get_hourly_player_stats(hours_back integer DEFAULT 24)
RETURNS TABLE(
  hour_label text,
  hour_ts timestamp with time zone,
  avg_players integer,
  peak_players integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH hourly AS (
    SELECT 
      date_trunc('hour', timestamp AT TIME ZONE 'Asia/Kathmandu') AS nepal_hour,
      ROUND(AVG(java_players))::integer AS avg_p,
      MAX(java_players)::integer AS peak_p
    FROM public.server_status_history
    WHERE timestamp >= (now() - (hours_back || ' hours')::interval)
      AND is_online = true
    GROUP BY date_trunc('hour', timestamp AT TIME ZONE 'Asia/Kathmandu')
    ORDER BY nepal_hour ASC
  )
  SELECT 
    to_char(h.nepal_hour, 'HH12 AM') AS hour_label,
    h.nepal_hour AS hour_ts,
    h.avg_p AS avg_players,
    h.peak_p AS peak_players
  FROM hourly h;
END;
$$;
