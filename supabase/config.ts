export type SupabasePublicEnvStatus = {
  supabaseUrlPresent: boolean;
  publicKeyPresent: boolean;
  urlFormatValid: boolean;
  projectRefMatchesUrl: boolean | null;
};

function getJwtProjectRef(publicKey: string) {
  if (publicKey.startsWith("sb_publishable_")) {
    return null;
  }

  const payload = publicKey.split(".")[1];

  if (!payload) {
    return null;
  }

  try {
    const normalizedPayload = payload.replaceAll("-", "+").replaceAll("_", "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    );
    const decodedPayload = JSON.parse(atob(paddedPayload)) as { ref?: string };

    return decodedPayload.ref ?? null;
  } catch {
    return null;
  }
}

function getSupabaseUrlHost(supabaseUrl: string) {
  try {
    return new URL(supabaseUrl).host;
  } catch {
    return null;
  }
}

export function getSupabasePublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  );
}

export function getSupabasePublicUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

export function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export function getSupabasePublicEnvStatus(): SupabasePublicEnvStatus {
  const supabaseUrl = getSupabasePublicUrl();
  const supabasePublicKey = getSupabasePublicKey();
  const host = getSupabaseUrlHost(supabaseUrl);
  const jwtProjectRef = getJwtProjectRef(supabasePublicKey);

  return {
    supabaseUrlPresent: Boolean(supabaseUrl),
    publicKeyPresent: Boolean(supabasePublicKey),
    urlFormatValid: Boolean(
      supabaseUrl && supabaseUrl.startsWith("https://") && supabaseUrl.endsWith(".supabase.co"),
    ),
    projectRefMatchesUrl: jwtProjectRef ? host === `${jwtProjectRef}.supabase.co` : null,
  };
}

export function getSupabasePublicEnvError() {
  const envStatus = getSupabasePublicEnvStatus();

  if (!envStatus.supabaseUrlPresent || !envStatus.publicKeyPresent) {
    return "Missing public Supabase environment variables. Check .env.local.";
  }

  if (!envStatus.urlFormatValid) {
    return "NEXT_PUBLIC_SUPABASE_URL must be the full Supabase Project URL, like https://your-project-ref.supabase.co.";
  }

  if (envStatus.projectRefMatchesUrl === false) {
    return "NEXT_PUBLIC_SUPABASE_URL does not match the Supabase project in NEXT_PUBLIC_SUPABASE_ANON_KEY. Use the Project URL from the same Supabase project as the anon key.";
  }

  return null;
}
