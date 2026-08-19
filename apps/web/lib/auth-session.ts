import type { TokenPair } from "@mentora/shared-types";

const REFRESH_SKEW_MS = 60_000;

export interface AuthSessionAdapter {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  refresh: (refreshToken: string) => Promise<TokenPair>;
  updateTokens: (tokens: TokenPair) => void;
  expireSession: () => void;
}

let adapter: AuthSessionAdapter | null = null;
let refreshInFlight: Promise<string> | null = null;

export function configureAuthSession(next: AuthSessionAdapter): () => void {
  adapter = next;
  return () => {
    if (adapter === next) adapter = null;
  };
}

function tokenExpiresAt(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized)) as { exp?: unknown };
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function millisecondsUntilRefresh(token: string): number | null {
  const expiresAt = tokenExpiresAt(token);
  return expiresAt === null ? null : Math.max(0, expiresAt - Date.now() - REFRESH_SKEW_MS);
}

export async function refreshSession(): Promise<string> {
  if (refreshInFlight) return refreshInFlight;
  if (!adapter) throw new Error("Auth session is not configured");

  const refreshToken = adapter.getRefreshToken();
  if (!refreshToken) {
    adapter.expireSession();
    throw new Error("Refresh token is not available");
  }

  const activeAdapter = adapter;
  refreshInFlight = activeAdapter
    .refresh(refreshToken)
    .then((tokens) => {
      activeAdapter.updateTokens(tokens);
      return tokens.access_token;
    })
    .catch((error: unknown) => {
      activeAdapter.expireSession();
      throw error;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

export async function accessTokenForRequest(fallback: string): Promise<string> {
  if (!adapter) return fallback;
  const current = adapter.getAccessToken() ?? fallback;
  const refreshIn = millisecondsUntilRefresh(current);
  if (refreshIn !== null && refreshIn <= 0 && adapter.getRefreshToken()) {
    return refreshSession();
  }
  return current;
}

export async function recoverFromUnauthorized(failedToken: string): Promise<string> {
  if (!adapter) throw new Error("Auth session is not configured");

  const current = adapter.getAccessToken();
  if (current && current !== failedToken) return current;
  return refreshSession();
}

export function resetAuthSessionForTests(): void {
  adapter = null;
  refreshInFlight = null;
}
