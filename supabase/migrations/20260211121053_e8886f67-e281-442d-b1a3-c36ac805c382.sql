
-- Table to store daily uptime aggregates for accurate weekly/monthly tracking
CREATE TABLE public.daily_uptime_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_checks INTEGER NOT NULL DEFAULT 0,
  online_checks INTEGER NOT NULL DEFAULT 0,
  uptime_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  avg_players NUMERIC(5,1) NOT NULL DEFAULT 0,
  peak_players INTEGER NOT NULL DEFAULT 0,
  avg_ping INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_uptime_records ENABLE ROW LEVEL SECURITY;

-- Anyone can read daily uptime records
CREATE POLICY "Anyone can view daily uptime records"
ON public.daily_uptime_records FOR SELECT USING (true);

-- Only service role can insert/update (via edge function)
CREATE POLICY "Service role can insert daily uptime records"
ON public.daily_uptime_records FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update daily uptime records"
ON public.daily_uptime_records FOR UPDATE USING (true);

-- Table to store hourly player snapshots (for graph even without visitors)
CREATE TABLE public.hourly_player_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hour_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  avg_players NUMERIC(5,1) NOT NULL DEFAULT 0,
  peak_players INTEGER NOT NULL DEFAULT 0,
  min_players INTEGER NOT NULL DEFAULT 0,
  is_online BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hourly_player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hourly player stats"
ON public.hourly_player_stats FOR SELECT USING (true);

CREATE POLICY "Anyone can insert hourly player stats"
ON public.hourly_player_stats FOR INSERT WITH CHECK (true);

-- Create index for efficient queries
CREATE INDEX idx_hourly_player_stats_hour ON public.hourly_player_stats(hour_timestamp DESC);
CREATE INDEX idx_daily_uptime_records_date ON public.daily_uptime_records(date DESC);

-- Function to aggregate daily uptime from server_status_history
CREATE OR REPLACE FUNCTION public.aggregate_daily_uptime()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_date DATE;
  nepal_offset INTERVAL := interval '5 hours 45 minutes';
BEGIN
  -- Calculate yesterday's Nepal date
  target_date := ((now() AT TIME ZONE 'UTC' + nepal_offset) - interval '1 day')::date;
  
  -- Upsert daily record from server_status_history
  INSERT INTO public.daily_uptime_records (date, total_checks, online_checks, uptime_percentage, avg_players, peak_players, avg_ping)
  SELECT 
    target_date,
    COUNT(*)::integer,
    COUNT(*) FILTER (WHERE is_online = true)::integer,
    CASE WHEN COUNT(*) > 0 THEN
      ROUND((COUNT(*) FILTER (WHERE is_online = true)::numeric / COUNT(*)::numeric) * 100, 2)
    ELSE 0 END,
    ROUND(COALESCE(AVG(java_players), 0)::numeric, 1),
    COALESCE(MAX(java_players), 0)::integer,
    ROUND(COALESCE(AVG(ping_ms), 0))::integer
  FROM public.server_status_history
  WHERE (timestamp AT TIME ZONE 'UTC' + nepal_offset)::date = target_date
  ON CONFLICT (date) DO UPDATE SET
    total_checks = EXCLUDED.total_checks,
    online_checks = EXCLUDED.online_checks,
    uptime_percentage = EXCLUDED.uptime_percentage,
    avg_players = EXCLUDED.avg_players,
    peak_players = EXCLUDED.peak_players,
    avg_ping = EXCLUDED.avg_ping;
END;
$function$;

-- Also aggregate today's running stats
CREATE OR REPLACE FUNCTION public.aggregate_today_uptime()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_date DATE;
  nepal_offset INTERVAL := interval '5 hours 45 minutes';
BEGIN
  target_date := (now() AT TIME ZONE 'UTC' + nepal_offset)::date;
  
  INSERT INTO public.daily_uptime_records (date, total_checks, online_checks, uptime_percentage, avg_players, peak_players, avg_ping)
  SELECT 
    target_date,
    COUNT(*)::integer,
    COUNT(*) FILTER (WHERE is_online = true)::integer,
    CASE WHEN COUNT(*) > 0 THEN
      ROUND((COUNT(*) FILTER (WHERE is_online = true)::numeric / COUNT(*)::numeric) * 100, 2)
    ELSE 0 END,
    ROUND(COALESCE(AVG(java_players), 0)::numeric, 1),
    COALESCE(MAX(java_players), 0)::integer,
    ROUND(COALESCE(AVG(ping_ms), 0))::integer
  FROM public.server_status_history
  WHERE (timestamp AT TIME ZONE 'UTC' + nepal_offset)::date = target_date
  ON CONFLICT (date) DO UPDATE SET
    total_checks = EXCLUDED.total_checks,
    online_checks = EXCLUDED.online_checks,
    uptime_percentage = EXCLUDED.uptime_percentage,
    avg_players = EXCLUDED.avg_players,
    peak_players = EXCLUDED.peak_players,
    avg_ping = EXCLUDED.avg_ping;
END;
$function$;
