"use client";

import type { UserAccount } from "@mentora/shared-types";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ApiError, fetchMe, loginUser, logoutUser, refreshTokens, registerUser } from "@/lib/api";
import { configureAuthSession, millisecondsUntilRefresh, refreshSession } from "@/lib/auth-session";

/**
 * Client-side auth state.
 *
 * Design (see docs/DECISION_LOG.md, D-024): tokens are held in memory only —
 * never in localStorage/cookies — which avoids cross-origin cookie issues in
 * local development and reduces XSS token-theft surface. A page reload requires
 * re-authentication; persistent sessions via an httpOnly refresh cookie behind
 * a same-origin gateway are a later hardening step.
 */
interface AuthState {
  user: UserAccount | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
    inviteCode?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserAccount | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const setTokens = useCallback((tokens: { access_token: string; refresh_token: string }) => {
    accessTokenRef.current = tokens.access_token;
    refreshTokenRef.current = tokens.refresh_token;
    setAccessToken(tokens.access_token);
    setRefreshToken(tokens.refresh_token);
  }, []);

  const clearSession = useCallback(() => {
    accessTokenRef.current = null;
    refreshTokenRef.current = null;
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  }, []);

  useEffect(
    () =>
      configureAuthSession({
        getAccessToken: () => accessTokenRef.current,
        getRefreshToken: () => refreshTokenRef.current,
        refresh: refreshTokens,
        updateTokens: setTokens,
        expireSession: () => {
          clearSession();
          router.replace("/login");
        },
      }),
    [clearSession, router, setTokens],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await loginUser({ email, password });
        setUser(result.user);
        setTokens(result.tokens);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "auth.loginError");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [setTokens],
  );

  const register = useCallback(
    async (email: string, password: string, fullName: string, inviteCode?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await registerUser({
          email,
          password,
          full_name: fullName,
          ...(inviteCode ? { invite_code: inviteCode } : {}),
        });
        setUser(result.user);
        setTokens(result.tokens);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "auth.registerError");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [setTokens],
  );

  const logout = useCallback(async () => {
    if (accessToken) {
      try {
        // Pass the refresh token so the server revokes it too, not just access.
        await logoutUser(accessToken, refreshToken ?? undefined);
      } catch {
        // Logout is best-effort; the client always clears its own state below.
      }
    }
    clearSession();
  }, [accessToken, clearSession, refreshToken]);

  // Keep the in-memory user fresh: if we hold a refresh token but lost the
  // access token, transparently re-issue and reload the profile.
  useEffect(() => {
    if (accessToken || !refreshToken) return;
    let active = true;
    (async () => {
      try {
        const tokens = await refreshTokens(refreshToken);
        if (!active) return;
        setTokens(tokens);
        setUser(await fetchMe(tokens.access_token));
      } catch {
        if (active) {
          clearSession();
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [accessToken, clearSession, refreshToken, setTokens]);

  // Refresh one minute before expiry even when the user is idle. API requests
  // also perform the same check, so sleeping tabs recover safely on wake-up.
  useEffect(() => {
    if (!accessToken || !refreshToken) return;
    const delay = millisecondsUntilRefresh(accessToken);
    if (delay === null) return;
    const timer = window.setTimeout(() => {
      void refreshSession().catch(() => undefined);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [accessToken, refreshToken]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      accessToken,
      isAuthenticated: user !== null,
      isLoading,
      error,
      login,
      register,
      logout,
    }),
    [user, accessToken, isLoading, error, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
