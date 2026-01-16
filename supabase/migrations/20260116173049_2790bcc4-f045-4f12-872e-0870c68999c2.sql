-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule keep-alive to run every 12 hours (twice daily for safety)
SELECT cron.schedule(
  'keep-alive-ping',
  '0 */12 * * *', -- Every 12 hours (at 00:00 and 12:00 UTC)
  $$
  SELECT
    net.http_post(
      url := 'https://ugefzrktqeyspnzhxzzw.supabase.co/functions/v1/keep-alive',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZWZ6cmt0cWV5c3Buemh4enp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNTI2NTIsImV4cCI6MjA3MTcyODY1Mn0.vVGtBuwYN1tSviYCLxbZpUnl7S6peZrtLAhyd7BnxVs"}'::jsonb,
      body := concat('{"source": "cron", "timestamp": "', now(), '"}')::jsonb
    ) AS request_id;
  $$
);