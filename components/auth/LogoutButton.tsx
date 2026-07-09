"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/services/auth";
import { routes } from "@/utils/routes";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setError(null);
    setIsLoggingOut(true);

    try {
      await logout();
      router.replace(routes.login);
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Unable to log out.");
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="logout-area">
      <button className="primary-link" disabled={isLoggingOut} onClick={handleLogout} type="button">
        {isLoggingOut ? "Logging out..." : "Log Out"}
      </button>
      {error && (
        <p className="auth-message error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
