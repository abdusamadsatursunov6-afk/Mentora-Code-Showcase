"use client";

import type {
  AnalyticsOverview,
  ClassroomData,
  DashboardData,
  LessonListItem,
} from "@mentora/shared-types";
import { Button } from "@mentora/ui";
import {
  BookOpen,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Plus,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LanguageSwitcher } from "@/components/language-switcher";
import {
  fetchAnalytics,
  fetchDashboard,
  fetchOnboardingStatus,
  listClassrooms,
  listLessons,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { LESSON_STATUS_KEYS, statusBadgeClass } from "@/lib/lessons";

const PAGE_SIZE = 20;

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, accessToken, logout, user } = useAuth();
  const { t, language } = useI18n();
  const [data, setData] = useState<DashboardData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [lessons, setLessons] = useState<LessonListItem[]>([]);
  const [lessonsTotal, setLessonsTotal] = useState(0);
  const [classes, setClasses] = useState<ClassroomData[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.replace("/login");
      return;
    }
    let active = true;
    (async () => {
      try {
        const status = await fetchOnboardingStatus(accessToken);
        if (!active) return;
        if (!status.completed) {
          router.replace("/onboarding");
          return;
        }
        const [overview, lessonList, stats, classList] = await Promise.all([
          fetchDashboard(accessToken),
          listLessons(accessToken, { limit: PAGE_SIZE, offset: 0 }),
          fetchAnalytics(accessToken),
          listClassrooms(accessToken),
        ]);
        if (active) {
          setData(overview);
          setLessons(lessonList.items);
          setLessonsTotal(lessonList.total);
          setAnalytics(stats);
          setClasses(classList.items);
        }
      } catch {
        if (active) router.replace("/login");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [accessToken, isAuthenticated, router]);

  async function loadMore() {
    if (!accessToken) return;
    setLoadingMore(true);
    try {
      const next = await listLessons(accessToken, { limit: PAGE_SIZE, offset: lessons.length });
      setLessons((previous) => [...previous, ...next.items]);
      setLessonsTotal(next.total);
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading || !data) {
    return (
      <main className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        {t("common.loading")}
      </main>
    );
  }

  const stats = [
    [t("dashboard.allLessons"), data.stats.total],
    [t("dashboard.drafts"), data.stats.draft],
    [t("dashboard.ready"), data.stats.ready],
    [t("dashboard.conducted"), data.stats.conducted],
  ] as const;

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 flex-col border-r border-border bg-card px-4 py-5 md:flex">
        <div className="mb-6 px-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Mentora
        </div>
        <nav aria-label={t("nav.main")} className="flex flex-col gap-1 text-sm">
          <span className="flex items-center gap-2 rounded-md bg-accent px-3 py-2 font-medium">
            <LayoutDashboard className="h-4 w-4" /> {t("nav.overview")}
          </span>
          <button
            type="button"
            onClick={() => router.push("/classes")}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-muted-foreground hover:text-foreground"
          >
            <Users className="h-4 w-4" /> {t("nav.classes")}
          </button>
          <button
            type="button"
            onClick={() => router.push("/lessons/new")}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-muted-foreground hover:text-foreground"
          >
            <BookOpen className="h-4 w-4" /> {t("nav.lessons")}
          </button>
          <button
            type="button"
            onClick={() => router.push("/feedback")}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-muted-foreground hover:text-foreground"
          >
            <MessageSquare className="h-4 w-4" /> {t("nav.feedback")}
          </button>
          <button
            type="button"
            onClick={() => router.push("/account")}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-4 w-4" /> {t("nav.account")}
          </button>
          {user?.is_admin && (
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-muted-foreground hover:text-foreground"
            >
              <ShieldCheck className="h-4 w-4" /> {t("nav.admin")}
            </button>
          )}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-6">
          <h1 className="text-lg font-semibold">{t("dashboard.title")}</h1>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <span className="hidden text-sm text-muted-foreground lg:inline">
              {data.teacher_name}
            </span>
            <Button size="sm" onClick={() => router.push("/lessons/new")}>
              <Plus className="h-4 w-4" /> {t("dashboard.createLesson")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await logout();
                router.push("/login");
              }}
            >
              <LogOut className="h-4 w-4" />{" "}
              <span className="hidden sm:inline">{t("nav.logout")}</span>
            </Button>
          </div>
        </header>

        <nav
          aria-label={t("nav.mobile")}
          className={`grid border-b border-border bg-card px-2 py-1 md:hidden ${user?.is_admin ? "grid-cols-6" : "grid-cols-5"}`}
        >
          <button
            type="button"
            aria-current="page"
            className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-md bg-accent px-1 text-[11px] font-medium"
          >
            <LayoutDashboard className="h-4 w-4" /> {t("nav.overview")}
          </button>
          <button
            type="button"
            onClick={() => router.push("/classes")}
            className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] text-muted-foreground"
          >
            <Users className="h-4 w-4" /> {t("nav.classes")}
          </button>
          <button
            type="button"
            onClick={() => router.push("/lessons/new")}
            className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] text-muted-foreground"
          >
            <BookOpen className="h-4 w-4" /> {t("nav.lessons")}
          </button>
          <button
            type="button"
            onClick={() => router.push("/feedback")}
            className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] text-muted-foreground"
          >
            <MessageSquare className="h-4 w-4" /> {t("nav.feedback")}
          </button>
          {user?.is_admin && (
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] text-muted-foreground"
            >
              <ShieldCheck className="h-4 w-4" /> {t("nav.admin")}
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push("/account")}
            className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] text-muted-foreground"
          >
            <Settings className="h-4 w-4" /> {t("nav.account")}
          </button>
        </nav>

        <main className="flex-1 px-4 py-6 sm:px-6">
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border bg-card p-4">
                <div className="text-sm text-muted-foreground">{label}</div>
                <div className="mt-1 text-2xl font-semibold">{value}</div>
              </div>
            ))}
          </div>
          <section className="mb-7">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("dashboard.myClasses")}</h2>
              <Button variant="outline" size="sm" onClick={() => router.push("/classes")}>
                {t("nav.classes")}
              </Button>
            </div>
            {classes.length === 0 ? (
              <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
                {t("classes.emptyHint")}
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {classes.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => router.push(`/classes/${item.id}`)}
                    className="rounded-xl border border-border bg-card p-4 text-left hover:bg-accent/50"
                  >
                    <div className="font-medium">{item.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {item.student_count} {t("classes.students")}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
          <div className="mb-7 grid gap-5 xl:grid-cols-2">
            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-lg font-semibold">{t("dashboard.activeQuizzes")}</h2>
              {data.active_quizzes.length ? (
                <div className="mt-3 space-y-2">
                  {data.active_quizzes.map((quiz) => (
                    <button
                      key={quiz.id}
                      type="button"
                      onClick={() => router.push(`/quiz-sessions/${quiz.id}`)}
                      className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-accent/50"
                    >
                      <span>
                        <span className="block font-medium">{quiz.lesson_title}</span>
                        <span className="text-sm text-muted-foreground">{quiz.classroom_name}</span>
                      </span>
                      <span className="text-sm font-medium">
                        {quiz.completed_count}/{quiz.participant_count}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("dashboard.noActiveQuizzes")}
                </p>
              )}
            </section>

            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-lg font-semibold">{t("dashboard.currentHomework")}</h2>
              {data.homework_assignments.length ? (
                <div className="mt-3 space-y-2">
                  {data.homework_assignments.map((homework) => (
                    <button
                      key={homework.id}
                      type="button"
                      onClick={() => router.push(`/classes/${homework.classroom_id}`)}
                      className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-accent/50"
                    >
                      <span>
                        <span className="block font-medium">{homework.title}</span>
                        <span className="text-sm text-muted-foreground">
                          {homework.classroom_name} ·{" "}
                          {new Date(homework.due_at).toLocaleDateString(language)}
                        </span>
                      </span>
                      <span className="text-sm font-medium">
                        {homework.completed_count}/{homework.assigned_count}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">{t("dashboard.noHomework")}</p>
              )}
            </section>

            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-lg font-semibold">{t("dashboard.requiresAttention")}</h2>
              {data.attention_items.length ? (
                <div className="mt-3 space-y-2">
                  {data.attention_items.map((item) => (
                    <button
                      key={`${item.classroom_id}-${item.topic}`}
                      type="button"
                      onClick={() => router.push(`/classes/${item.classroom_id}`)}
                      className="flex w-full items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-amber-950"
                    >
                      <span>
                        <span className="block font-medium">{item.classroom_name}</span>
                        <span className="text-sm">{item.topic}</span>
                      </span>
                      <span className="font-semibold">{item.mastery_percentage}%</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">{t("dashboard.noAttention")}</p>
              )}
            </section>

            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-lg font-semibold">{t("dashboard.recentResults")}</h2>
              {data.recent_results.length ? (
                <div className="mt-3 space-y-2">
                  {data.recent_results.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => router.push(`/quiz-sessions/${result.id}`)}
                      className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-accent/50"
                    >
                      <span>
                        <span className="block font-medium">{result.lesson_title}</span>
                        <span className="text-sm text-muted-foreground">
                          {result.classroom_name} · {result.completed_count}{" "}
                          {t("dashboard.completed")}
                        </span>
                      </span>
                      <span className="font-semibold">
                        {result.average_percentage === null ? "—" : `${result.average_percentage}%`}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">{t("dashboard.noResults")}</p>
              )}
            </section>
          </div>
          {analytics && (
            <div className="mb-6 flex flex-wrap gap-5 text-sm text-muted-foreground">
              <span>
                {t("dashboard.generations")}:{" "}
                <b className="text-foreground">{analytics.ai_generations}</b>
              </span>
              <span>
                {t("dashboard.exports")}: <b className="text-foreground">{analytics.exports}</b>
              </span>
            </div>
          )}
          <section>
            <h2 className="mb-3 text-lg font-semibold">{t("dashboard.recentLessons")}</h2>
            {lessons.length === 0 ? (
              <div className="rounded-xl border border-dashed p-10 text-center">
                <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium">{t("dashboard.createFirst")}</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  {t("dashboard.emptyHint")}
                </p>
                <Button className="mt-4" size="sm" onClick={() => router.push("/lessons/new")}>
                  <Plus className="h-4 w-4" /> {t("dashboard.createLesson")}
                </Button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border">
                {lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => router.push(`/lessons/${lesson.id}`)}
                    className="flex w-full items-center justify-between border-b border-border px-4 py-3 text-left last:border-0 hover:bg-accent/50"
                  >
                    <div>
                      <div className="font-medium">{lesson.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {lesson.subject} · {lesson.grade_level}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(lesson.status)}`}
                    >
                      {t(LESSON_STATUS_KEYS[lesson.status])}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
          {lessons.length < lessonsTotal && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                {loadingMore
                  ? t("common.loading")
                  : `${t("dashboard.showMore")} (${lessonsTotal - lessons.length})`}
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
