import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnvError, getSupabasePublicKey, getSupabasePublicUrl, getSupabaseServiceRoleKey } from "@/supabase/config";
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

export function createServerSupabaseAdminClient() {
  const supabaseUrl = getSupabasePublicUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();
  const envError = getSupabasePublicEnvError();

  if (envError) {
    throw new Error(envError);
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY. Server-only order and Stripe reconciliation routes require it.");
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}
