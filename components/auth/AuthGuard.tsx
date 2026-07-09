"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { Profile, UserRole } from "@/types/auth";
import { getCurrentProfile, getRedirectPathForRole } from "@/services/auth";
import { routes } from "@/utils/routes";

type AuthGuardProps = {
  allowedRoles: UserRole[];
  children: (profile: Profile) => ReactNode;
};

export function AuthGuard({ allowedRoles, children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const currentProfile = await getCurrentProfile();

        if (!isMounted) {
          return;
        }

        if (!currentProfile) {
          router.replace(`${routes.login}?redirect=${encodeURIComponent(pathname)}`);
          return;
        }

        if (!allowedRoles.includes(currentProfile.role)) {
          router.replace(`${getRedirectPathForRole(currentProfile.role)}?notice=wrong-role`);
          return;
        }

        setProfile(currentProfile);
      } catch (guardError) {
        if (isMounted) {
          setError(guardError instanceof Error ? guardError.message : "Unable to load your account.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [allowedRoles, pathname, router]);

  if (isLoading) {
    return (
      <main className="auth-loading" aria-busy="true">
        Loading your account...
      </main>
    );
  }

  if (error) {
    return (
      <main className="auth-loading">
        <p className="auth-message error" role="alert">
          {error}
        </p>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  return children(profile);
}
