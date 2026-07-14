import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnvError, getSupabasePublicKey, getSupabasePublicUrl } from "@/supabase/config";
import { createServerSupabaseAdminClient } from "@/supabase/server";
import type { Profile } from "@/types/auth";
import type { Database } from "@/types/supabase";

export type ApiAuthContext = {
  admin: ReturnType<typeof createServerSupabaseAdminClient>;
  profile: Profile;
  token: string;
  user: {
    id: string;
    email?: string;
  };
};

export class ApiAuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? "";
}

export async function requireApiAuth(request: Request): Promise<ApiAuthContext> {
  const envError = getSupabasePublicEnvError();

  if (envError) {
    throw new ApiAuthError(envError, 500);
  }

  const token = getBearerToken(request);

  if (!token) {
    throw new ApiAuthError("Log in before continuing.", 401);
  }

  const authClient = createClient<Database>(getSupabasePublicUrl(), getSupabasePublicKey(), {
    auth: {
      persistSession: false,
    },
  });
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(token);

  if (userError || !user) {
    throw new ApiAuthError("Your session expired. Log in again.", 401);
  }

  const admin = createServerSupabaseAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, email, full_name, role, city, state, zip_code, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new ApiAuthError(profileError.message, 500);
  }

  if (!profile) {
    throw new ApiAuthError("Threadocal could not load your profile. Log out and log in again.", 403);
  }

  return {
    admin,
    profile,
    token,
    user: {
      id: user.id,
      email: user.email,
    },
  };
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof ApiAuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : "Threadocal could not complete that request.";
  return Response.json({ error: message }, { status: 500 });
}
