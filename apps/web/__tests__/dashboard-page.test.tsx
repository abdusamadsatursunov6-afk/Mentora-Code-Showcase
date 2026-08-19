import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    accessToken: "test-token",
    logout: vi.fn(),
    user: { full_name: "Анна", is_admin: true },
  }),
}));

vi.mock("@/lib/api", () => ({
  fetchOnboardingStatus: vi.fn().mockResolvedValue({ completed: true, preferences: {} }),
  fetchDashboard: vi.fn().mockResolvedValue({
    teacher_name: "Анна",
    onboarding_completed: true,
    stats: { total: 1, draft: 1, ready: 0, conducted: 0 },
    recent_lessons: [],
    active_quizzes: [],
    homework_assignments: [],
    recent_results: [],
    attention_items: [],
  }),
  listLessons: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  listClassrooms: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  fetchAnalytics: vi.fn().mockResolvedValue({
    lessons_total: 1,
    lessons_ready: 0,
    lessons_conducted: 0,
    ai_generations: 0,
    exports: 0,
  }),
}));

import DashboardPage from "@/app/dashboard/page";

describe("DashboardPage mobile navigation", () => {
  beforeEach(() => push.mockClear());

  it("keeps all primary destinations available without the desktop sidebar", async () => {
    render(<DashboardPage />);

    const navigation = await screen.findByRole("navigation", {
      name: "Мобильная навигация",
    });
    const mobile = within(navigation);

    expect(mobile.getByRole("button", { name: "Обзор" })).toHaveAttribute("aria-current", "page");
    expect(mobile.getByRole("button", { name: "Уроки" })).toBeInTheDocument();
    expect(mobile.getByRole("button", { name: "Отзыв" })).toBeInTheDocument();
    expect(mobile.getByRole("button", { name: "Аккаунт" })).toBeInTheDocument();
    expect(mobile.getByRole("button", { name: "Админ" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Активные тесты" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Домашние задания" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Требуют внимания" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Последние результаты" })).toBeInTheDocument();

    await userEvent.click(mobile.getByRole("button", { name: "Аккаунт" }));
    expect(push).toHaveBeenCalledWith("/account");
  });
});
