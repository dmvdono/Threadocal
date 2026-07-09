import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnvError, getSupabasePublicKey, getSupabasePublicUrl } from "@/supabase/config";
import type { Database } from "@/types/supabase";

let browserSupabaseClient: SupabaseClient<Database> | null = null;

export function createBrowserSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = getSupabasePublicUrl();
  const supabasePublicKey = getSupabasePublicKey();
  const envError = getSupabasePublicEnvError();

  if (envError) {
    throw new Error(envError);
  }

  if (!browserSupabaseClient) {
    browserSupabaseClient = createClient<Database>(supabaseUrl, supabasePublicKey);
  }

  return browserSupabaseClient;
}
