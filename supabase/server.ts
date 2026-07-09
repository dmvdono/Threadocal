import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnvError, getSupabasePublicKey, getSupabasePublicUrl } from "@/supabase/config";
import type { Database } from "@/types/supabase";

export function createServerSupabaseClient() {
  const supabaseUrl = getSupabasePublicUrl();
  const supabasePublicKey = getSupabasePublicKey();
  const envError = getSupabasePublicEnvError();

  if (envError) {
    throw new Error(envError);
  }

  return createClient<Database>(supabaseUrl, supabasePublicKey, {
    auth: {
      persistSession: false,
    },
  });
}
