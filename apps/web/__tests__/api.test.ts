import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createQuizSession,
  createHomeworkAssignment,
  fetchHealth,
  getClassPerformance,
  ingestUrlMaterial,
  joinPublicQuiz,
  joinHomework,
  registerUser,
  uploadMaterial,
} from "@/lib/api";

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    json: async () => body,
  });
}

describe("api response envelope", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("loads protected evidence-based classroom analytics", async () => {
    const fetchMock = mockFetch(200, {
      data: { classroom_id: "class-1", topics: [], recommendations: [] },
      meta: { request_id: "analytics-1" },
    });
    vi.stubGlobal("fetch", fetchMock);

    await getClassPerformance("teacher-token", "class-1");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/analytics/classes/class-1"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer teacher-token" }),
      }),
    );
  });

  it("uses private teacher and public student homework endpoints", async () => {
    const fetchMock = mockFetch(201, {
      data: { id: "assignment-1", public_token: "homework-token" },
      meta: { request_id: "r6" },
    });
    vi.stubGlobal("fetch", fetchMock);

    await createHomeworkAssignment("teacher-token", {
      lesson_id: "lesson-1",
      due_at: "2026-08-10T12:00:00Z",
    });
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining("/api/v1/homework/assignments"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer teacher-token" }),
      }),
    );

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: { attempt_token: "attempt-token", response_text: "" },
        meta: { request_id: "r7" },
      }),
    });
    await joinHomework("homework-token", "ABCD1234");
    const publicCall = fetchMock.mock.calls.at(-1);
    expect(publicCall?.[0]).toContain("/api/v1/homework/public/homework-token/join");
    expect(publicCall?.[1]?.headers).not.toHaveProperty("Authorization");
  });

  it("unwraps a success envelope to its data", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(200, {
        data: { status: "healthy", service: "mentora-api", database: "connected" },
        meta: { request_id: "r1" },
      }),
    );
    const health = await fetchHealth();
    expect(health.status).toBe("healthy");
    expect(health.database).toBe("connected");
  });

  it("throws ApiError carrying the code on an error envelope", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(400, {
        error: {
          code: "BAD_REQUEST",
          message: "Некорректный запрос.",
          details: {},
          request_id: "r2",
        },
      }),
    );
    await expect(
      registerUser({ email: "a@mentora.dev", password: "supersecret1", full_name: "N" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST", status: 400 });
  });

  it("uses the real teacher and public quiz endpoints", async () => {
    const fetchMock = mockFetch(201, {
      data: { id: "session-1", public_token: "secure-token" },
      meta: { request_id: "r3" },
    });
    vi.stubGlobal("fetch", fetchMock);
    await createQuizSession("teacher-token", "assessment-1", {
      classroom_id: "class-1",
      show_score: true,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/quizzes/assessment-1/sessions"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer teacher-token" }),
      }),
    );

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: { attempt_token: "attempt", questions: [] },
        meta: { request_id: "r4" },
      }),
    });
    await joinPublicQuiz("secure-token", "ABCD1234");
    const publicCall = fetchMock.mock.calls.at(-1);
    expect(publicCall?.[0]).toContain("/api/v1/quiz-sessions/public/secure-token/join");
    expect(publicCall?.[1]?.headers).not.toHaveProperty("Authorization");
  });

  it("uploads files as multipart and ingests public material URLs", async () => {
    const fetchMock = mockFetch(201, {
      data: { id: "material-1", title: "Textbook", status: "READY", page_count: 42 },
      meta: { request_id: "r5" },
    });
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["chapter text"], "chapter.txt", { type: "text/plain" });
    await uploadMaterial("teacher-token", file);
    const uploadCall = fetchMock.mock.calls.at(-1);
    expect(uploadCall?.[0]).toContain("/api/v1/materials/upload");
    expect(uploadCall?.[1]?.body).toBeInstanceOf(FormData);
    expect(uploadCall?.[1]?.headers).not.toHaveProperty("Content-Type");

    await ingestUrlMaterial("teacher-token", "https://example.org/chapter");
    const urlCall = fetchMock.mock.calls.at(-1);
    expect(urlCall?.[0]).toContain("/api/v1/materials/url");
    expect(urlCall?.[1]?.body).toContain("https://example.org/chapter");
  });
});
