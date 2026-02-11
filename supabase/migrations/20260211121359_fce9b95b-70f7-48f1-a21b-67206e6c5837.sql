
-- Add unique constraint on hour_timestamp for upsert support
ALTER TABLE public.hourly_player_stats ADD CONSTRAINT hourly_player_stats_hour_unique UNIQUE (hour_timestamp);

-- Backfill daily_uptime_records from existing server_status_history
INSERT INTO public.daily_uptime_records (date, total_checks, online_checks, uptime_percentage, avg_players, peak_players, avg_ping)
SELECT 
  (timestamp AT TIME ZONE 'UTC' + interval '5 hours 45 minutes')::date as nepal_date,
  COUNT(*)::integer,
  COUNT(*) FILTER (WHERE is_online = true)::integer,
  CASE WHEN COUNT(*) > 0 THEN
    ROUND((COUNT(*) FILTER (WHERE is_online = true)::numeric / COUNT(*)::numeric) * 100, 2)
  ELSE 0 END,
  ROUND(COALESCE(AVG(java_players), 0)::numeric, 1),
  COALESCE(MAX(java_players), 0)::integer,
  ROUND(COALESCE(AVG(ping_ms), 0))::integer
FROM public.server_status_history
GROUP BY (timestamp AT TIME ZONE 'UTC' + interval '5 hours 45 minutes')::date
ON CONFLICT (date) DO UPDATE SET
  total_checks = EXCLUDED.total_checks,
  online_checks = EXCLUDED.online_checks,
  uptime_percentage = EXCLUDED.uptime_percentage,
  avg_players = EXCLUDED.avg_players,
  peak_players = EXCLUDED.peak_players,
  avg_ping = EXCLUDED.avg_ping;
