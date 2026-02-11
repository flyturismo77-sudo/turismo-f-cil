// Re-export with hardcoded values since VITE_ env vars may not be available in preview
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://duzfdwkjqqsayisfllww.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1emZkd2tqcXFzYXlpc2ZsbHd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzI4ODksImV4cCI6MjA4NjQwODg4OX0.DKdBuaeaPunvxh_gawqaDHva3nOI0Qcbvby6zMV_8PA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  }
});
