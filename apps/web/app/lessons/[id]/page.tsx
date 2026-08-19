"use client";

import type {
  AssessmentData,
  HomeworkData,
  LessonDetail,
  PresentationData,
  StudentData,
} from "@mentora/shared-types";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@mentora/ui";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  LoaderCircle,
  Pencil,
  Presentation as PresentationIcon,
  Sparkles,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ApiError,
  createHomeworkAssignment,
  createExport,
  deleteLesson,
  downloadExport,
  generateFullLesson,
  getAssessment,
  getHomework,
  getLesson,
  getPresentation,
  listStudents,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { LESSON_STATUS_KEYS, statusBadgeClass } from "@/lib/lessons";

const GENERATION_STAGES = [
  "lesson.stageStructure",
  "lesson.stageTheory",
  "lesson.stagePractice",
  "lesson.stageTest",
  "lesson.stageHomework",
  "lesson.stagePresentation",
];

export default function LessonDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { isAuthenticated, accessToken } = useAuth();
  const { t } = useI18n();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [homework, setHomework] = useState<HomeworkData | null>(null);
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [dueAt, setDueAt] = useState("");
  const [classStudents, setClassStudents] = useState<StudentData[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [assignmentLink, setAssignmentLink] = useState<string | null>(null);

  const loadArtifacts = useCallback(async () => {
    if (!accessToken) return;
    const [assessmentData, homeworkData, presentationData] = await Promise.all([
      getAssessment(accessToken, params.id),
      getHomework(accessToken, params.id),
      getPresentation(accessToken, params.id),
    ]);
    setAssessment(assessmentData);
    setHomework(homeworkData);
    setPresentation(presentationData);
  }, [accessToken, params.id]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const lessonData = await getLesson(accessToken, params.id);
      setLesson(lessonData);
      await loadArtifacts();
    } catch {
      setError(t("lesson.notFound"));
    } finally {
      setLoading(false);
    }
  }, [accessToken, params.id, loadArtifacts, t]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.replace("/login");
      return;
    }
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated, accessToken, router, load]);

  useEffect(() => {
    if (!generating) return;
    const timer = window.setInterval(() => {
      setStageIndex((current) => Math.min(current + 1, GENERATION_STAGES.length - 1));
    }, 3500);
    return () => window.clearInterval(timer);
  }, [generating]);

  const hasGeneratedContent = useMemo(
    () =>
      Boolean(
        lesson?.goals.length ||
        lesson?.sections.some((section) => section.blocks.length > 0) ||
        assessment?.questions.length ||
        homework?.instructions.trim() ||
        presentation?.slides.length,
      ),
    [lesson, assessment, homework, presentation],
  );

  async function handleGenerate() {
    if (!lesson || !accessToken || generating) return;
    if (hasGeneratedContent && !window.confirm(t("lesson.regenerateConfirm"))) {
      return;
    }
    setGenerating(true);
    setStageIndex(0);
    setError(null);
    setSuccess(null);
    try {
      setLesson(await generateFullLesson(accessToken, lesson.id));
      await loadArtifacts();
      setStageIndex(GENERATION_STAGES.length - 1);
      setSuccess(t("lesson.generated"));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t("lesson.generateError"));
      await load();
    } finally {
      setGenerating(false);
    }
  }

  async function handleExport(format: "docx" | "pptx") {
    if (!lesson || !accessToken) return;
    setBusyAction(format);
    setError(null);
    try {
      const job = await createExport(accessToken, lesson.id, format);
      if (job.filename) await downloadExport(accessToken, job.id, job.filename);
    } catch (caught) {
      setError(
        caught instanceof ApiError && !caught.message.startsWith("lesson.")
          ? caught.message
          : t("lesson.exportError"),
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function openAssignment() {
    if (!lesson?.classroom_id || !accessToken) {
      setError(t("lesson.assignNeedsClass"));
      return;
    }
    setError(null);
    try {
      const roster = await listStudents(accessToken, lesson.classroom_id);
      setClassStudents(roster.items);
      setAssignOpen(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t("lesson.assignError"));
    }
  }

  async function assignHomework() {
    if (!lesson?.classroom_id || !accessToken || !dueAt) return;
    setAssigning(true);
    setError(null);
    try {
      const assignment = await createHomeworkAssignment(accessToken, {
        lesson_id: lesson.id,
        classroom_id: lesson.classroom_id,
        due_at: new Date(dueAt).toISOString(),
        student_ids: selectedStudentIds,
      });
      setAssignmentLink(`${window.location.origin}/homework/${assignment.public_token}`);
      setSuccess(t("lesson.assignedSuccess"));
      setAssignOpen(false);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t("lesson.assignError"));
    } finally {
      setAssigning(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
        <p className="text-sm text-muted-foreground">{t("lesson.loading")}</p>
      </main>
    );
  }

  if (error && !lesson) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
          {t("commonActions.dashboard")}
        </Button>
      </main>
    );
  }

  if (!lesson || !accessToken) return null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("commonActions.dashboard")}
      </button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(lesson.status)}`}
            >
              {t(LESSON_STATUS_KEYS[lesson.status])}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("commonActions.version")} {lesson.version}
            </span>
          </div>
          <CardTitle className="text-2xl">{lesson.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {lesson.subject} · {lesson.grade_level} {t("lesson.class")} · {lesson.duration_minutes}{" "}
            {t("commonActions.minutes")}
            {lesson.topic ? ` · ${lesson.topic}` : ""}
          </p>
        </CardHeader>
        <CardContent className="space-y-7">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <Button className="w-full gap-2" disabled={generating} onClick={handleGenerate}>
              {generating ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {generating ? t("lesson.generatingFull") : t("lesson.generate")}
            </Button>
            {generating && (
              <div className="mt-4 space-y-2" aria-live="polite">
                <p className="text-sm font-medium">{t(GENERATION_STAGES[stageIndex])}</p>
                <div className="h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                    style={{ width: `${((stageIndex + 1) / GENERATION_STAGES.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {success && (
            <p className="flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> {success}
            </p>
          )}
          {error && <p className="text-sm text-rose-700">{error}</p>}

          <section>
            <h2 className="mb-2 text-lg font-semibold">{t("lesson.goals")}</h2>
            {lesson.goals.length ? (
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {lesson.goals.map((goal) => (
                  <li key={goal.id}>{goal.text}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t("lesson.startGeneration")}</p>
            )}
          </section>

          {lesson.sources?.length ? (
            <section className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
              <h2 className="mb-3 text-lg font-semibold">{t("lesson.sources")}</h2>
              <ul className="space-y-3 text-sm">
                {lesson.sources.map((source) => (
                  <li key={source.document_id}>
                    <p className="font-medium">{source.title}</p>
                    <p className="text-muted-foreground">
                      {t("lesson.selectedPages")}:{" "}
                      {source.page_ranges
                        .map((range) =>
                          range.from === range.to
                            ? String(range.from)
                            : `${range.from}–${range.to}`,
                        )
                        .join(", ")}
                    </p>
                    {source.citations.length ? (
                      <p className="text-muted-foreground">
                        {t("lesson.citations")}:{" "}
                        {source.citations
                          .map(
                            (citation) =>
                              `[${citation.marker}] ${t("lesson.page")} ${citation.page_number}`,
                          )
                          .join(", ")}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {lesson.sections
            .filter((section) => ["THEORY", "PRACTICE"].includes(section.kind))
            .map((section) => (
              <section key={section.id} className="rounded-xl border border-border p-4">
                <h2 className="mb-3 text-lg font-semibold">{section.title}</h2>
                {section.blocks.length ? (
                  <div className="space-y-3 text-sm leading-6">
                    {section.blocks.map((block) => (
                      <p key={block.id}>{block.text}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("lesson.emptySection")}</p>
                )}
              </section>
            ))}

          <section className="rounded-xl border border-border p-4">
            <h2 className="mb-3 text-lg font-semibold">{t("lesson.assessment")}</h2>
            {assessment?.questions.length ? (
              <div className="space-y-4">
                {assessment.questions.map((question, index) => (
                  <div key={question.id} className="text-sm">
                    <p className="font-medium">
                      {index + 1}. {question.text}
                    </p>
                    <ul className="mt-1 space-y-1 pl-4 text-muted-foreground">
                      {question.options.map((option) => (
                        <li key={option.id} className={option.is_correct ? "text-emerald-700" : ""}>
                          {option.is_correct ? "✓ " : "• "}
                          {option.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("lesson.noQuestions")}</p>
            )}
          </section>

          <section className="rounded-xl border border-border p-4">
            <h2 className="mb-3 text-lg font-semibold">{t("lesson.homework")}</h2>
            <p className="whitespace-pre-wrap text-sm">
              {homework?.instructions || t("lesson.noHomework")}
            </p>
            {homework?.instructions.trim() ? (
              <Button className="mt-4" size="sm" onClick={() => void openAssignment()}>
                {t("lesson.assignHomework")}
              </Button>
            ) : null}

            {assignOpen ? (
              <div className="mt-4 space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                <label className="block space-y-1 text-sm font-medium">
                  <span>{t("lesson.dueAt")}</span>
                  <input
                    className="h-10 w-full rounded-md border border-input bg-background px-3"
                    type="datetime-local"
                    value={dueAt}
                    onChange={(event) => setDueAt(event.target.value)}
                  />
                </label>
                <div>
                  <p className="mb-2 text-sm font-medium">{t("lesson.assignmentRecipients")}</p>
                  <p className="mb-2 text-xs text-muted-foreground">
                    {selectedStudentIds.length
                      ? t("lesson.selectedRecipients")
                      : t("lesson.allRecipients")}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {classStudents.map((student) => (
                      <label key={student.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={(event) =>
                            setSelectedStudentIds((current) =>
                              event.target.checked
                                ? [...current, student.id]
                                : current.filter((id) => id !== student.id),
                            )
                          }
                        />
                        {student.full_name}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={!dueAt || assigning || classStudents.length === 0}
                    onClick={() => void assignHomework()}
                  >
                    {assigning ? t("lesson.assigning") : t("lesson.publishHomework")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setAssignOpen(false)}>
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            ) : null}

            {assignmentLink ? (
              <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
                <p className="font-medium">{t("lesson.studentLink")}</p>
                <a className="break-all underline" href={assignmentLink}>
                  {assignmentLink}
                </a>
                <Button
                  className="mt-2"
                  size="sm"
                  variant="outline"
                  onClick={() => void navigator.clipboard.writeText(assignmentLink)}
                >
                  {t("lesson.copyLink")}
                </Button>
              </div>
            ) : null}
          </section>

          <div className="flex flex-wrap gap-3 border-t border-border pt-5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/lessons/${lesson.id}/workspace`)}
            >
              <Pencil className="mr-2 h-4 w-4" /> {t("lesson.edit")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busyAction !== null}
              onClick={() => void handleExport("docx")}
            >
              <FileText className="mr-2 h-4 w-4" />
              {busyAction === "docx" ? t("lesson.wordCreating") : t("lesson.word")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busyAction !== null}
              onClick={() => void handleExport("pptx")}
            >
              <PresentationIcon className="mr-2 h-4 w-4" />
              {busyAction === "pptx" ? t("lesson.powerPointCreating") : t("lesson.powerPoint")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={generating || busyAction !== null}
              onClick={async () => {
                if (!window.confirm(t("lesson.deleteConfirm"))) return;
                setBusyAction("delete");
                try {
                  await deleteLesson(accessToken, lesson.id);
                  router.push("/dashboard");
                } catch (caught) {
                  setError(caught instanceof ApiError ? caught.message : t("lesson.deleteError"));
                  setBusyAction(null);
                }
              }}
            >
              {t("lesson.deleteLesson")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
