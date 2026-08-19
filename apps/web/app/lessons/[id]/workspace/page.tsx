"use client";

import type { AISuggestion, LessonDetail, VersionSummary } from "@mentora/shared-types";
import { Button, Input } from "@mentora/ui";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  History,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  ApiError,
  addBlock,
  applySuggestion,
  createVersion,
  deleteBlock,
  dismissSuggestion,
  generateContent,
  generatePlan,
  getLesson,
  listVersions,
  reorderBlocks,
  restoreVersion,
  suggestBlockEdit,
  suggestGoals,
  updateBlock,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useLessonAutosave } from "@/lib/use-lesson-autosave";

export default function WorkspacePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { isAuthenticated, accessToken } = useAuth();
  const { t } = useI18n();

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [versionLabel, setVersionLabel] = useState("");
  const [proposal, setProposal] = useState<AISuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [edit, setEdit] = useState<{
    blockId: string;
    instruction: string;
    proposal: AISuggestion | null;
    loading: boolean;
  } | null>(null);

  const saveBlock = useCallback(
    (change: { sectionId: string; blockId: string; text: string }) => {
      if (!accessToken || !lesson)
        return Promise.reject(new Error(t("workspace.sessionUnavailable")));
      return updateBlock(accessToken, lesson.id, change.sectionId, change.blockId, change.text);
    },
    [accessToken, lesson, t],
  );

  const { saveState, saveError, changeBlockText, flush, retry, runMutation, applyServerLesson } =
    useLessonAutosave({
      lesson,
      setLesson,
      saveBlock,
      fallbackError: t("workspace.saveChangesError"),
    });

  const refreshVersions = useCallback(async () => {
    if (!accessToken) return;
    setVersions((await listVersions(accessToken, params.id)).items);
  }, [accessToken, params.id]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await getLesson(accessToken, params.id);
      setLesson(data);
      setActiveSectionId((prev) => prev ?? data.sections[0]?.id ?? null);
      await refreshVersions();
    } catch {
      router.replace("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [accessToken, params.id, router, refreshVersions]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.replace("/login");
      return;
    }
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated, accessToken, router, load]);

  const persist = async (op: Promise<LessonDetail>) => {
    await runMutation(op);
  };

  if (loading || !lesson || !accessToken) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">{t("workspace.loading")}</p>
      </main>
    );
  }

  const active = lesson.sections.find((s) => s.id === activeSectionId) ?? lesson.sections[0];

  const move = async (index: number, delta: number) => {
    const ids = active.blocks.map((b) => b.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await persist(reorderBlocks(accessToken, lesson.id, active.id, ids));
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
        <button
          type="button"
          onClick={() => router.push(`/lessons/${lesson.id}`)}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {t("workspace.toLesson")}
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            {lesson.title} · {t("workspace.title")}
          </span>
          <span
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground"
          >
            {saveState === "saving" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("commonActions.saving")}
              </>
            ) : saveState === "saved" ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" /> {t("commonActions.saved")}
              </>
            ) : saveState === "error" ? (
              <>
                <span className="text-rose-700">{t("commonActions.saveError")}</span>
                <button
                  type="button"
                  className="underline hover:text-rose-900"
                  onClick={() => void retry()}
                >
                  {t("commonActions.retry")}
                </button>
              </>
            ) : null}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {t("commonActions.version")} {lesson.version}
        </span>
      </header>

      <div className="grid flex-1 grid-cols-1 md:grid-cols-[220px_1fr_300px]">
        <aside className="border-r border-border bg-card p-3">
          <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("workspace.structure")}
          </div>
          <nav className="flex flex-col gap-1">
            {lesson.sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSectionId(s.id)}
                className={`rounded-md px-3 py-2 text-left text-sm ${
                  s.id === active.id
                    ? "bg-accent font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.title}
                <span className="ml-1 text-xs text-muted-foreground">({s.blocks.length})</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 px-6 py-5">
          <h2 className="mb-4 text-lg font-semibold">{active.title}</h2>
          <div className="space-y-3">
            {active.blocks.map((block, index) => (
              <div key={block.id} className="rounded-lg border border-border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("workspace.block")} {index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={t("workspace.improveAi")}
                      className="rounded p-1 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setEdit(
                          edit?.blockId === block.id
                            ? null
                            : {
                                blockId: block.id,
                                instruction: "",
                                proposal: null,
                                loading: false,
                              },
                        )
                      }
                    >
                      <Wand2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={t("commonActions.up")}
                      className="rounded p-1 text-muted-foreground hover:text-foreground"
                      onClick={() => void move(index, -1)}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={t("commonActions.down")}
                      className="rounded p-1 text-muted-foreground hover:text-foreground"
                      onClick={() => void move(index, 1)}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={t("workspace.deleteBlock")}
                      className="rounded p-1 text-muted-foreground hover:text-rose-600"
                      onClick={() =>
                        void persist(deleteBlock(accessToken, lesson.id, active.id, block.id))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <textarea
                  value={block.text}
                  onChange={(e) => changeBlockText(active.id, block.id, e.target.value)}
                  onBlur={() => void flush()}
                  rows={3}
                  placeholder={t("workspace.contentPlaceholder")}
                  className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />

                {edit?.blockId === block.id && (
                  <div className="mt-2 space-y-2 rounded-md border border-border bg-accent/40 p-2">
                    {edit.proposal ? (
                      <>
                        <div className="text-xs font-medium">{t("workspace.aiProposal")}</div>
                        <p className="rounded bg-background p-2 text-sm">
                          {edit.proposal.payload.after}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={async () => {
                              applyServerLesson(
                                await applySuggestion(accessToken, edit.proposal!.id),
                              );
                              await refreshVersions();
                              setEdit(null);
                            }}
                          >
                            {t("commonActions.apply")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              await dismissSuggestion(accessToken, edit.proposal!.id);
                              setEdit(null);
                            }}
                          >
                            {t("commonActions.reject")}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={edit.instruction}
                          onChange={(e) =>
                            setEdit((prev) =>
                              prev ? { ...prev, instruction: e.target.value } : prev,
                            )
                          }
                          placeholder={t("workspace.instructionPlaceholder")}
                          className="h-9"
                        />
                        <Button
                          size="sm"
                          disabled={!edit.instruction.trim() || edit.loading}
                          onClick={async () => {
                            setEdit((prev) => (prev ? { ...prev, loading: true } : prev));
                            try {
                              const p = await suggestBlockEdit(
                                accessToken,
                                block.id,
                                edit.instruction.trim(),
                              );
                              setEdit((prev) =>
                                prev ? { ...prev, proposal: p, loading: false } : prev,
                              );
                            } catch {
                              setEdit((prev) => (prev ? { ...prev, loading: false } : prev));
                            }
                          }}
                        >
                          {t("workspace.improve")}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {active.blocks.length === 0 && (
              <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                {t("workspace.empty")}
              </p>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => void persist(addBlock(accessToken, lesson.id, active.id, ""))}
            >
              <Plus className="h-4 w-4" /> {t("workspace.addBlock")}
            </Button>
          </div>
        </section>

        <aside className="space-y-6 border-l border-border bg-card p-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <History className="h-4 w-4" /> {t("workspace.history")}
            </div>
            <div className="mb-3 flex gap-2">
              <Input
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
                placeholder={t("workspace.versionName")}
                className="h-9"
              />
              <Button
                size="sm"
                disabled={!versionLabel.trim()}
                onClick={async () => {
                  await createVersion(accessToken, lesson.id, versionLabel.trim());
                  setVersionLabel("");
                  await refreshVersions();
                }}
              >
                {t("common.save")}
              </Button>
            </div>
            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("workspace.noVersions")}</p>
            ) : (
              <ul className="space-y-2">
                {versions.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm">
                        {v.is_autosave ? t("workspace.autosave") : v.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        v{v.lesson_version_number} ·{" "}
                        {new Date(v.created_at).toLocaleString("ru-RU", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={t("workspace.restoreVersion")}
                      className="rounded p-1 text-muted-foreground hover:text-foreground"
                      onClick={async () => {
                        applyServerLesson(await restoreVersion(accessToken, lesson.id, v.id));
                        await refreshVersions();
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4" /> Mentora AI
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              {t("workspace.goalsCount")}: {lesson.goals.length}. {t("workspace.aiHint")}
            </p>

            {proposal ? (
              <div className="space-y-2 rounded-lg border border-border p-3">
                <div className="text-xs font-medium">
                  {proposal.kind === "lesson_plan"
                    ? t("workspace.suggestedPlan")
                    : t("workspace.suggestedGoals")}
                </div>
                {(proposal.payload.goals ?? []).length > 0 && (
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {(proposal.payload.goals ?? []).map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                )}
                {proposal.payload.sections && proposal.payload.sections.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {t("workspace.sections")}
                    </div>
                    {proposal.payload.sections.map((s, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{s.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {s.blocks.length} {t("workspace.blocks")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        applyServerLesson(await applySuggestion(accessToken, proposal.id));
                        setProposal(null);
                      } catch (err) {
                        setAiError(
                          err instanceof ApiError ? err.message : t("workspace.applyError"),
                        );
                      }
                    }}
                  >
                    {t("commonActions.apply")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await dismissSuggestion(accessToken, proposal.id);
                      setProposal(null);
                    }}
                  >
                    {t("commonActions.reject")}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">{t("workspace.noChangeHint")}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={aiLoading}
                  onClick={async () => {
                    setAiLoading(true);
                    setAiError(null);
                    try {
                      setProposal(await suggestGoals(accessToken, lesson.id));
                    } catch (err) {
                      setAiError(err instanceof ApiError ? err.message : t("workspace.aiError"));
                    } finally {
                      setAiLoading(false);
                    }
                  }}
                >
                  {aiLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  {t("workspace.suggestGoals")}
                </Button>
                <Button
                  size="sm"
                  disabled={aiLoading}
                  onClick={async () => {
                    setAiLoading(true);
                    setAiError(null);
                    try {
                      setProposal(await generatePlan(accessToken, lesson.id));
                    } catch (err) {
                      setAiError(
                        err instanceof ApiError ? err.message : t("workspace.generationError"),
                      );
                    } finally {
                      setAiLoading(false);
                    }
                  }}
                >
                  {aiLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {t("workspace.generatePlan")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={aiLoading}
                  onClick={async () => {
                    setAiLoading(true);
                    setAiError(null);
                    try {
                      setProposal(await generateContent(accessToken, lesson.id));
                    } catch (err) {
                      setAiError(
                        err instanceof ApiError ? err.message : t("workspace.generationError"),
                      );
                    } finally {
                      setAiLoading(false);
                    }
                  }}
                >
                  {aiLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  {t("workspace.generateContent")}
                </Button>
              </div>
            )}

            {aiError && <p className="mt-2 text-xs text-rose-700">{aiError}</p>}
          </div>
        </aside>
      </div>
      {saveError && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800 shadow">
          {saveError}
        </div>
      )}
    </div>
  );
}
