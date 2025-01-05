// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://florxlmkxjzferdcavht.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsb3J4bG1reGp6ZmVyZGNhdmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5OTI2MDgsImV4cCI6MjA1MTU2ODYwOH0.G1cJrNiVAGk1GHysww8X1r5RY0_rlUjuLIOjBHBjBfo";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});