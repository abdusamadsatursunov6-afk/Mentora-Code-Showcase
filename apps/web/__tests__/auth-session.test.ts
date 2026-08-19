import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchMe, refreshTokens } from "@/lib/api";
import { configureAuthSession, resetAuthSessionForTests } from "@/lib/auth-session";

function response(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function success(data: unknown) {
  return { data, meta: { request_id: "test" } };
}

function unauthorized() {
  return {
    error: { code: "UNAUTHORIZED", message: "Expired", details: {}, request_id: "test" },
  };
}

let tokenSequence = 0;

function token(expSeconds = Math.floor(Date.now() / 1000) + 3600): string {
  tokenSequence += 1;
  const payload = btoa(JSON.stringify({ exp: expSeconds, jti: `test-${tokenSequence}` }))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `header.${payload}.signature`;
}

describe("authenticated request refresh", () => {
  let accessToken: string;
  let refreshToken: string;
  let expired = vi.fn();

  beforeEach(() => {
    accessToken = token();
    refreshToken = "refresh-old";
    expired = vi.fn();
    configureAuthSession({
      getAccessToken: () => accessToken,
      getRefreshToken: () => refreshToken,
      refresh: refreshTokens,
      updateTokens: (tokens) => {
        accessToken = tokens.access_token;
        refreshToken = tokens.refresh_token;
      },
      expireSession: expired,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetAuthSessionForTests();
  });

  it("refreshes after 401 and retries the request once", async () => {
    const fresh = token();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(401, unauthorized()))
      .mockResolvedValueOnce(
        response(200, success({ access_token: fresh, refresh_token: "refresh-new" })),
      )
      .mockResolvedValueOnce(
        response(200, success({ id: "u1", email: "a@b.dev", full_name: "A" })),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchMe(accessToken)).resolves.toMatchObject({ id: "u1" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2]?.[1]?.headers.Authorization).toBe(`Bearer ${fresh}`);
  });

  it("uses one refresh for parallel 401 responses", async () => {
    const old = accessToken;
    const fresh = token();
    let releaseRefresh!: () => void;
    const refreshGate = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });
    let refreshCalls = 0;
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/auth/refresh")) {
        refreshCalls += 1;
        await refreshGate;
        return response(200, success({ access_token: fresh, refresh_token: "refresh-new" }));
      }
      const authorization = (init?.headers as Record<string, string>)?.Authorization;
      if (authorization === `Bearer ${old}`) return response(401, unauthorized());
      return response(200, success({ id: "u1", email: "a@b.dev", full_name: "A" }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const requests = [fetchMe(old), fetchMe(old), fetchMe(old)];
    await vi.waitFor(() => expect(refreshCalls).toBe(1));
    releaseRefresh();
    await expect(Promise.all(requests)).resolves.toHaveLength(3);
    expect(refreshCalls).toBe(1);
  });

  it("expires the session when refresh is invalid", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(response(401, unauthorized()))
        .mockResolvedValueOnce(response(401, unauthorized())),
    );

    await expect(fetchMe(accessToken)).rejects.toMatchObject({ status: 401 });
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it("does not loop when the retried request also returns 401", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(401, unauthorized()))
      .mockResolvedValueOnce(
        response(200, success({ access_token: token(), refresh_token: "refresh-new" })),
      )
      .mockResolvedValueOnce(response(401, unauthorized()));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchMe(accessToken)).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("refreshes before sending a request when the token is near expiry", async () => {
    accessToken = token(Math.floor(Date.now() / 1000) + 10);
    const fresh = token();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response(200, success({ access_token: fresh, refresh_token: "refresh-new" })),
      )
      .mockResolvedValueOnce(
        response(200, success({ id: "u1", email: "a@b.dev", full_name: "A" })),
      );
    vi.stubGlobal("fetch", fetchMock);

    await fetchMe(accessToken);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/auth/refresh");
    expect(fetchMock.mock.calls[1]?.[1]?.headers.Authorization).toBe(`Bearer ${fresh}`);
  });
});
