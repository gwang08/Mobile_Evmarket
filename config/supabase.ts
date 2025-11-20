import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rqvpqlewnxyeedymlwsp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxdnBxbGV3bnh5ZWVkeW1sd3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDQ3MzUsImV4cCI6MjA3NjA4MDczNX0.YZHEqPJA19CIwQ39c0FZblHY0aTDxJHf-wFI-0qClOY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
