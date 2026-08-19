import type { LessonDetail } from "@mentora/shared-types";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  getLesson: vi.fn(),
  getAssessment: vi.fn(),
  getHomework: vi.fn(),
  getPresentation: vi.fn(),
  generateFullLesson: vi.fn(),
}));
const navigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "lesson-1" }),
  useRouter: () => navigation,
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ isAuthenticated: true, accessToken: "token" }),
}));

vi.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {},
  ...api,
  createExport: vi.fn(),
  deleteLesson: vi.fn(),
  downloadExport: vi.fn(),
}));

import LessonDetailPage from "@/app/lessons/[id]/page";

const emptyLesson: LessonDetail = {
  id: "lesson-1",
  title: "Сложение дробей",
  subject: "Математика",
  topic: "Дроби",
  grade_level: "5",
  duration_minutes: 45,
  status: "DRAFT",
  version: 1,
  updated_at: "2026-08-08T00:00:00Z",
  schema_version: "1",
  classroom_id: null,
  lesson_language: "ru",
  presentation_language: "ru",
  assignment_language: "ru",
  goals: [],
  sections: [
    { id: "theory", kind: "THEORY", title: "Теория", order_index: 0, blocks: [] },
    { id: "practice", kind: "PRACTICE", title: "Практика", order_index: 1, blocks: [] },
  ],
};

describe("one-click full lesson generation", () => {
  it("shows one primary generation action and applies the returned lesson", async () => {
    api.getLesson.mockResolvedValue(emptyLesson);
    api.getAssessment.mockResolvedValue({ id: "assessment", title: "Тест", questions: [] });
    api.getHomework.mockResolvedValue({ instructions: "" });
    api.getPresentation.mockResolvedValue({ id: "presentation", title: "", slides: [] });
    api.generateFullLesson.mockResolvedValue({
      ...emptyLesson,
      status: "READY",
      version: 2,
      goals: [{ id: "goal", text: "Складывать дроби", order_index: 0 }],
    });

    render(<LessonDetailPage />);
    const generate = await screen.findByRole("button", { name: "Генерация урока" });
    expect(screen.queryByRole("button", { name: /генерировать план/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /генерировать тест/i })).not.toBeInTheDocument();

    await userEvent.click(generate);
    await waitFor(() => expect(api.generateFullLesson).toHaveBeenCalledWith("token", "lesson-1"));
    expect(await screen.findByText("Урок полностью сгенерирован и сохранён.")).toBeInTheDocument();
    expect(screen.getByText("Складывать дроби")).toBeInTheDocument();
  });

  it("shows document pages and citation markers for grounded lessons", async () => {
    api.getLesson.mockResolvedValue({
      ...emptyLesson,
      sources: [
        {
          document_id: "document-1",
          title: "Fractions textbook.pdf",
          page_count: 80,
          page_ranges: [{ from: 24, to: 31 }],
          status: "READY",
          citations: [{ marker: 1, page_number: 24 }],
        },
      ],
    });
    api.getAssessment.mockResolvedValue({ id: "assessment", title: "Test", questions: [] });
    api.getHomework.mockResolvedValue({ instructions: "" });
    api.getPresentation.mockResolvedValue({ id: "presentation", title: "", slides: [] });

    render(<LessonDetailPage />);

    expect(await screen.findByText("Fractions textbook.pdf")).toBeInTheDocument();
    expect(screen.getByText(/24–31/)).toBeInTheDocument();
    expect(screen.getByText(/\[1\].*24/)).toBeInTheDocument();
  });
});
