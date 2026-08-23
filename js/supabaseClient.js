import {
  createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://irqactaqwpbduyqfttou.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_BHZ3nb-V51rbscsBpaZHvw_MiJLtCOb";

let supabaseClient = null;

export async function getSupabase() {
  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );

  return supabaseClient;
}