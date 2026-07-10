import type { LoginInput, Profile, SignupInput, UserRole } from "@/types/auth";
import { createBrowserSupabaseClient } from "@/supabase/client";
import { getSupabasePublicEnvError, getSupabasePublicKey, getSupabasePublicUrl } from "@/supabase/config";
import { routes } from "@/utils/routes";

type AuthSuccess = {
  ok: true;
  profile: Profile;
  redirectTo: string;
};

type AuthFailure = {
  ok: false;
  error: string;
};

export type AuthResult = AuthSuccess | AuthFailure;

const SUPABASE_CONNECTION_ERROR =
  "Threadocal could not connect to Supabase. Check that your Supabase project is active and that NEXT_PUBLIC_SUPABASE_URL plus your public anon or publishable key match Project Settings > API.";
const PROFILE_SELECT = "id, email, full_name, role, city, state, zip_code, created_at";

type SignupProfileInput = {
  id: string;
  email: string;
  fullName: string;
  role: Exclude<UserRole, "admin">;
  city?: string;
  state?: string;
  zipCode?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getStringField(error: unknown, field: string) {
  if (!isRecord(error)) {
    return null;
  }

  const value = error[field];

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return null;
}

function stringifyUnknownError(error: unknown) {
  if (error instanceof Error) {
    const properties = Object.fromEntries(
      Object.getOwnPropertyNames(error).map((property) => [
        property,
        (error as unknown as Record<string, unknown>)[property],
      ]),
    );

    return JSON.stringify(properties);
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function normalizeOptional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getAuthErrorMessage(error: unknown) {
  const message = getStringField(error, "message") ?? (typeof error === "string" ? error : null);

  if (isDuplicateEmailError(error)) {
    return "An account already exists for this email. Log in instead, or use a different email address.";
  }

  if (message === "Failed to fetch" || message === "Load failed") {
    return SUPABASE_CONNECTION_ERROR;
  }

  const details = [
    message ? `Message: ${message}` : null,
    getStringField(error, "name") ? `Name: ${getStringField(error, "name")}` : null,
    getStringField(error, "status") ? `Status: ${getStringField(error, "status")}` : null,
    getStringField(error, "code") ? `Code: ${getStringField(error, "code")}` : null,
    getStringField(error, "error_code") ? `Error code: ${getStringField(error, "error_code")}` : null,
    getStringField(error, "details") ? `Details: ${getStringField(error, "details")}` : null,
    getStringField(error, "hint") ? `Hint: ${getStringField(error, "hint")}` : null,
  ].filter(Boolean);

  if (details.length > 0) {
    return details.join(" | ");
  }

  const fallback = stringifyUnknownError(error);

  if (fallback && fallback !== "{}") {
    return fallback;
  }

  return "Unknown authentication error. Open the browser console for full details.";
}

function logAuthError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[Threadocal auth] ${context}`, error);
  }
}

function isMissingSessionError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message === "Auth session missing!" || error.name === "AuthSessionMissingError";
}

function isDuplicateEmailError(error: unknown) {
  const message = (getStringField(error, "message") ?? (typeof error === "string" ? error : "")).toLowerCase();
  const code = (getStringField(error, "code") ?? getStringField(error, "error_code") ?? "").toLowerCase();
  const details = (getStringField(error, "details") ?? "").toLowerCase();

  return (
    code === "user_already_exists" ||
    code === "email_exists" ||
    code === "23505" ||
    message.includes("user already registered") ||
    message.includes("already been registered") ||
    message.includes("already exists") ||
    details.includes("profiles_email_key")
  );
}

type SignupValidationResult =
  | {
      ok: true;
      fullName: string;
      email: string;
    }
  | {
      ok: false;
      error: string;
    };

function validateSignupInput(input: SignupInput): SignupValidationResult {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();

  if (input.role !== "customer" && input.role !== "brand_owner") {
    return { ok: false, error: "Select an account type." };
  }

  if (!fullName) {
    return { ok: false, error: "Full name is required." };
  }

  if (!email) {
    return { ok: false, error: "Email is required." };
  }

  if (input.password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  if (input.password !== input.confirmPassword) {
    return { ok: false, error: "Passwords do not match." };
  }

  return { ok: true, fullName, email };
}

async function verifySupabaseSignupReachability() {
  const envError = getSupabasePublicEnvError();

  if (envError) {
    return envError;
  }

  const supabaseUrl = getSupabasePublicUrl();
  const publicKey = getSupabasePublicKey();

  try {
    await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: {
        apikey: publicKey,
      },
    });

    return null;
  } catch {
    return SUPABASE_CONNECTION_ERROR;
  }
}

async function runAuthRequest<T>(request: () => PromiseLike<T> | T): Promise<T> {
  try {
    return await request();
  } catch (error) {
    logAuthError("request failed", error);
    throw new Error(getAuthErrorMessage(error));
  }
}

async function runFormAuthRequest<T>(request: () => PromiseLike<T> | T): Promise<{ data?: T; error?: string }> {
  try {
    return { data: await request() };
  } catch (error) {
    logAuthError("form request failed", error);
    return { error: getAuthErrorMessage(error) };
  }
}

async function createSignupProfile(
  supabase: ReturnType<typeof createBrowserSupabaseClient>,
  input: SignupProfileInput,
) {
  const email = input.email.trim().toLowerCase();

  if (!email) {
    return { error: "Threadocal could not create your profile because the signup email was missing." };
  }

  const profile = {
    id: input.id,
    email,
    full_name: input.fullName,
    role: input.role,
    city: normalizeOptional(input.city),
    state: normalizeOptional(input.state),
    zip_code: normalizeOptional(input.zipCode),
  };

  return runFormAuthRequest(() =>
    supabase
      .from("profiles")
      .upsert(profile, { onConflict: "id" })
      .select(PROFILE_SELECT)
      .single(),
  );
}

export function getRedirectPathForRole(role: UserRole) {
  if (role === "admin") {
    return routes.admin;
  }

  if (role === "brand_owner") {
    return routes.brandDashboard;
  }

  return routes.dashboard;
}

export function isDashboardRouteForRole(path: string, role: UserRole) {
  return getRedirectPathForRole(role) === path;
}

export async function getCurrentProfile() {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await runAuthRequest(() => supabase.auth.getUser());

  if (userError) {
    if (isMissingSessionError(userError)) {
      return null;
    }

    throw new Error(userError.message);
  }

  if (!user) {
    return null;
  }

  const { data, error } = await runAuthRequest(() =>
    supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", user.id)
      .single(),
  );

  if (error) {
    throw new Error(error.message);
  }

  return data as Profile;
}

export async function signup(input: SignupInput): Promise<AuthResult> {
  const validation = validateSignupInput(input);

  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  const { fullName, email } = validation;
  const reachabilityError = await verifySupabaseSignupReachability();

  if (reachabilityError) {
    return { ok: false, error: reachabilityError };
  }

  const supabase = createBrowserSupabaseClient();
  const signupResult = await runFormAuthRequest(() =>
    supabase.auth.signUp({
      email,
      password: input.password,
      options: {
        data: {
          email,
          full_name: fullName,
          role: input.role,
          city: normalizeOptional(input.city),
          state: normalizeOptional(input.state),
          zip_code: normalizeOptional(input.zipCode),
        },
      },
    }),
  );

  if (signupResult.error) {
    logAuthError("signup request failed", signupResult.error);
    return { ok: false, error: signupResult.error };
  }

  if (!signupResult.data) {
    return { ok: false, error: "Unable to create your account. Please try again." };
  }

  const { data, error } = signupResult.data;

  if (error) {
    logAuthError("signup returned Supabase error", error);
    return { ok: false, error: getAuthErrorMessage(error) };
  }

  if (!data.user) {
    return { ok: false, error: "Unable to create your account. Please try again." };
  }

  if (!data.session) {
    return {
      ok: false,
      error:
        "Supabase created the Auth user but did not return a login session, so Threadocal could not create the profile row. Confirm email confirmation is disabled while testing signup, then try again.",
    };
  }

  const profileResult = await createSignupProfile(supabase, {
    id: data.user.id,
    email,
    fullName,
    role: input.role,
    city: input.city,
    state: input.state,
    zipCode: input.zipCode,
  });

  if (profileResult.error) {
    logAuthError("signup profile insert failed", profileResult.error);
    return { ok: false, error: profileResult.error };
  }

  const { data: createdProfile, error: profileError } = profileResult.data ?? {};

  if (profileError) {
    logAuthError("signup profile insert returned Supabase error", profileError);
    return { ok: false, error: getAuthErrorMessage(profileError) };
  }

  if (!createdProfile) {
    return { ok: false, error: "Auth user was created, but Threadocal could not create the profile row." };
  }

  return {
    ok: true,
    profile: createdProfile as Profile,
    redirectTo: getRedirectPathForRole(input.role),
  };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();

  if (!email || !input.password) {
    return { ok: false, error: "Email and password are required." };
  }

  const supabase = createBrowserSupabaseClient();
  const loginResult = await runFormAuthRequest(() =>
    supabase.auth.signInWithPassword({
      email,
      password: input.password,
    }),
  );

  if (loginResult.error) {
    logAuthError("login request failed", loginResult.error);
    return { ok: false, error: loginResult.error };
  }

  if (!loginResult.data) {
    return { ok: false, error: "Unable to log in. Please try again." };
  }

  const { error } = loginResult.data;

  if (error) {
    logAuthError("login returned Supabase error", error);
    return { ok: false, error: getAuthErrorMessage(error) };
  }

  const profileResult = await runFormAuthRequest(() => getCurrentProfile());

  if (profileResult.error) {
    logAuthError("login profile fetch failed", profileResult.error);
    return { ok: false, error: profileResult.error };
  }

  if (!profileResult.data) {
    return { ok: false, error: "No profile was found for this account." };
  }

  return {
    ok: true,
    profile: profileResult.data,
    redirectTo: getRedirectPathForRole(profileResult.data.role),
  };
}

export async function logout() {
  const supabase = createBrowserSupabaseClient();
  const { error } = await runAuthRequest(() => supabase.auth.signOut());

  if (error) {
    throw new Error(error.message);
  }
}
