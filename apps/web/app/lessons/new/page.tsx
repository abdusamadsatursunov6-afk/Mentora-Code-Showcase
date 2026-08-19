"use client";

import type {
  ClassroomData,
  CurriculumCountry,
  CurriculumNode,
  CurriculumProgram,
  LanguageCode,
  MaterialData,
} from "@mentora/shared-types";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@mentora/ui";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import {
  ApiError,
  createLesson,
  ingestUrlMaterial,
  listClassrooms,
  listCurriculumCountries,
  listCurriculumNodes,
  listCurriculumPrograms,
  uploadMaterial,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";

const languages: LanguageCode[] = ["ru", "uz", "en"];

export default function NewLessonPage() {
  const router = useRouter();
  const { isAuthenticated, accessToken } = useAuth();
  const { t, language } = useI18n();
  const [classes, setClasses] = useState<ClassroomData[]>([]);
  const [mode, setMode] = useState<"quick" | "curriculum">("quick");
  const [countries, setCountries] = useState<CurriculumCountry[]>([]);
  const [programs, setPrograms] = useState<CurriculumProgram[]>([]);
  const [curriculum, setCurriculum] = useState<Record<string, CurriculumNode[]>>({});
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [fillingMessage, setFillingMessage] = useState<string | null>(null);
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [lessonType, setLessonType] = useState("MIXED");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [duration, setDuration] = useState(45);
  const [goals, setGoals] = useState("");
  const [lessonLanguage, setLessonLanguage] = useState<LanguageCode>(language);
  const [presentationLanguage, setPresentationLanguage] = useState<LanguageCode | "same">("same");
  const [assignmentLanguage, setAssignmentLanguage] = useState<LanguageCode | "same">("same");
  const [useSources, setUseSources] = useState(false);
  const [material, setMaterial] = useState<MaterialData | null>(null);
  const [materialUrl, setMaterialUrl] = useState("");
  const [pageRanges, setPageRanges] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.replace("/login");
      return;
    }
    Promise.all([listClassrooms(accessToken), listCurriculumCountries(accessToken, language)]).then(
      ([classResult, countryResult]) => {
        setClasses(classResult.items);
        setCountries(countryResult.items);
      },
    );
  }, [accessToken, isAuthenticated, language, router]);

  async function chooseCountry(countryId: string) {
    if (!accessToken) return;
    setSelection({ country: countryId });
    setCurriculum({});
    setCurriculumLoading(true);
    try {
      const result = await listCurriculumPrograms(accessToken, countryId);
      setPrograms(result.items);
      setFillingMessage(result.filling_message);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : t("lessonForm.curriculumError"));
    } finally {
      setCurriculumLoading(false);
    }
  }

  async function chooseNode(
    key: "program" | "subject" | "grade" | "period" | "unit",
    id: string,
    nextPath: string,
    nextKey: string,
  ) {
    if (!accessToken) return;
    const order = ["program", "subject", "grade", "period", "unit", "objective"];
    const index = order.indexOf(key);
    const nextSelection = Object.fromEntries(
      Object.entries(selection).filter(
        ([name]) => name === "country" || order.indexOf(name) <= index,
      ),
    );
    nextSelection[key] = id;
    setSelection(nextSelection);
    setCurriculum((current) =>
      Object.fromEntries(Object.entries(current).filter(([name]) => order.indexOf(name) <= index)),
    );
    if (!id) return;
    setCurriculumLoading(true);
    try {
      const result = await listCurriculumNodes(accessToken, nextPath.replace("{id}", id));
      setCurriculum((current) => ({ ...current, [nextKey]: result.items }));
      setFillingMessage(result.items.length === 0 ? t("lessonForm.programFilling") : null);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : t("lessonForm.curriculumError"));
    } finally {
      setCurriculumLoading(false);
    }
  }

  function chooseObjective(id: string) {
    setSelection((current) => ({ ...current, objective: id }));
    const objective = curriculum.objective?.find((item) => item.id === id);
    const selectedSubject = curriculum.subject?.find((item) => item.id === selection.subject);
    const selectedGrade = curriculum.grade?.find((item) => item.id === selection.grade);
    if (objective) {
      setTopic(objective.label);
      setGoals(objective.description || objective.label);
      if (!title) setTitle(objective.label);
    }
    if (selectedSubject) setSubject(selectedSubject.label);
    if (selectedGrade) setGrade(selectedGrade.label);
  }

  function chooseClass(id: string) {
    setClassroomId(id);
    const classroom = classes.find((item) => item.id === id);
    if (classroom) {
      setGrade(classroom.grade);
      if (classroom.subject_name) setSubject(classroom.subject_name);
      setLessonLanguage(classroom.instruction_language);
    }
  }

  async function uploadSource(file: File) {
    if (!accessToken) return;
    setError(null);
    setUploading(true);
    try {
      setMaterial(await uploadMaterial(accessToken, file));
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : t("lessonForm.materialError"));
    } finally {
      setUploading(false);
    }
  }

  async function addUrlSource() {
    if (!accessToken || !materialUrl.trim()) return;
    setError(null);
    setUploading(true);
    try {
      setMaterial(await ingestUrlMaterial(accessToken, materialUrl.trim()));
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : t("lessonForm.materialError"));
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setError(null);
    setSaving(true);
    try {
      const lesson = await createLesson(accessToken, {
        title,
        subject,
        topic: topic || null,
        grade_level: grade,
        duration_minutes: duration,
        goals: goals
          .split("\n")
          .map((goal) => goal.trim())
          .filter(Boolean),
        classroom_id: classroomId || null,
        lesson_language: lessonLanguage,
        presentation_language:
          presentationLanguage === "same" ? lessonLanguage : presentationLanguage,
        assignment_language: assignmentLanguage === "same" ? lessonLanguage : assignmentLanguage,
        curriculum_objective_id: mode === "curriculum" ? selection.objective || null : null,
        lesson_type: lessonType,
        generation_mode: useSources
          ? mode === "curriculum"
            ? "CURRICULUM_AND_SOURCE"
            : "SOURCE_GROUNDED"
          : mode === "curriculum"
            ? "CURRICULUM_ALIGNED"
            : "STANDARD_AI",
        source_documents:
          useSources && material
            ? [{ document_id: material.id, pages: pageRanges.trim() || null }]
            : [],
      });
      router.push(`/lessons/${lesson.id}`);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : t("lessonForm.error"));
    } finally {
      setSaving(false);
    }
  }

  function languageOptions() {
    return languages.map((code) => (
      <option key={code} value={code}>
        {t(code === "ru" ? "common.russian" : code === "uz" ? "common.uzbek" : "common.english")}
      </option>
    ));
  }

  if (!isAuthenticated || !accessToken) {
    return <main className="grid min-h-screen place-items-center">{t("common.redirecting")}</main>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Mentora · {t("lessonForm.new")}
          </p>
          <CardTitle className="text-2xl">{t("lessonForm.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("lessonForm.hint")}</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
              <Button
                type="button"
                variant={mode === "quick" ? "default" : "ghost"}
                onClick={() => setMode("quick")}
              >
                {t("lessonForm.quickMode")}
              </Button>
              <Button
                type="button"
                variant={mode === "curriculum" ? "default" : "ghost"}
                onClick={() => setMode("curriculum")}
              >
                {t("lessonForm.curriculumMode")}
              </Button>
            </div>
            {mode === "curriculum" && (
              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-sm font-medium">{t("lessonForm.curriculumHint")}</p>
                <CurriculumSelect
                  label={t("lessonForm.country")}
                  value={selection.country || ""}
                  items={countries.map((item) => ({ id: item.id, label: item.name }))}
                  onChange={chooseCountry}
                />
                {selection.country && (
                  <CurriculumSelect
                    label={t("lessonForm.program")}
                    value={selection.program || ""}
                    items={programs.map((item) => ({
                      id: item.id,
                      label: `${item.name} (${item.version})`,
                    }))}
                    onChange={(id) =>
                      chooseNode("program", id, "programs/{id}/subjects", "subject")
                    }
                  />
                )}
                {selection.program && (
                  <CurriculumSelect
                    label={t("lessonForm.curriculumSubject")}
                    value={selection.subject || ""}
                    items={curriculum.subject || []}
                    onChange={(id) => chooseNode("subject", id, "subjects/{id}/grades", "grade")}
                  />
                )}
                {selection.subject && (
                  <CurriculumSelect
                    label={t("lessonForm.curriculumGrade")}
                    value={selection.grade || ""}
                    items={curriculum.grade || []}
                    onChange={(id) => chooseNode("grade", id, "grades/{id}/periods", "period")}
                  />
                )}
                {selection.grade && (
                  <CurriculumSelect
                    label={t("lessonForm.period")}
                    value={selection.period || ""}
                    items={curriculum.period || []}
                    onChange={(id) => chooseNode("period", id, "periods/{id}/units", "unit")}
                  />
                )}
                {selection.period && (
                  <CurriculumSelect
                    label={t("lessonForm.unit")}
                    value={selection.unit || ""}
                    items={curriculum.unit || []}
                    onChange={(id) => chooseNode("unit", id, "units/{id}/objectives", "objective")}
                  />
                )}
                {selection.unit && (
                  <CurriculumSelect
                    label={t("lessonForm.objective")}
                    value={selection.objective || ""}
                    items={curriculum.objective || []}
                    onChange={chooseObjective}
                  />
                )}
                {selection.objective && (
                  <div className="space-y-1.5">
                    <Label htmlFor="lesson-type">{t("lessonForm.lessonType")}</Label>
                    <select
                      id="lesson-type"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={lessonType}
                      onChange={(event) => setLessonType(event.target.value)}
                    >
                      <option value="MIXED">{t("lessonForm.lessonTypeMixed")}</option>
                      <option value="INTRODUCTION">{t("lessonForm.lessonTypeIntroduction")}</option>
                      <option value="PRACTICE">{t("lessonForm.lessonTypePractice")}</option>
                      <option value="ASSESSMENT">{t("lessonForm.lessonTypeAssessment")}</option>
                    </select>
                  </div>
                )}
                {curriculumLoading && <p className="text-sm">{t("common.loading")}</p>}
                {fillingMessage && (
                  <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {t("lessonForm.programFilling")}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-3 rounded-lg border p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={useSources}
                  onChange={(event) => {
                    setUseSources(event.target.checked);
                    if (!event.target.checked) {
                      setMaterial(null);
                      setPageRanges("");
                    }
                  }}
                />
                <span>
                  <span className="block text-sm font-medium">{t("lessonForm.sourceMode")}</span>
                  <span className="block text-sm text-muted-foreground">
                    {t("lessonForm.sourceHint")}
                  </span>
                </span>
              </label>
              {useSources && (
                <div className="space-y-3 border-t pt-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="source-file">{t("lessonForm.uploadMaterial")}</Label>
                    <Input
                      id="source-file"
                      type="file"
                      accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      disabled={uploading}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void uploadSource(file);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("lessonForm.materialFormats")}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="source-url">{t("lessonForm.materialUrl")}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="source-url"
                        type="url"
                        placeholder="https://example.org/material"
                        value={materialUrl}
                        onChange={(event) => setMaterialUrl(event.target.value)}
                        disabled={uploading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void addUrlSource()}
                        disabled={uploading || !materialUrl.trim()}
                      >
                        {t("lessonForm.addUrl")}
                      </Button>
                    </div>
                  </div>
                  {uploading && <p className="text-sm">{t("lessonForm.uploading")}</p>}
                  {material && (
                    <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">
                      <p className="font-medium">{material.title}</p>
                      <p>
                        {t("lessonForm.materialReady")} · {t("lessonForm.pageCount")}:{" "}
                        {material.page_count}
                      </p>
                    </div>
                  )}
                  {material && material.page_count > 1 && (
                    <div className="space-y-1.5">
                      <Label htmlFor="page-ranges">{t("lessonForm.pages")}</Label>
                      <Input
                        id="page-ranges"
                        value={pageRanges}
                        onChange={(event) => setPageRanges(event.target.value)}
                        placeholder="24-31, 44-46"
                      />
                      <p className="text-xs text-muted-foreground">{t("lessonForm.pagesHint")}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">{t("lessonForm.name")}</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="classroom">{t("lessonForm.classroom")}</Label>
              <select
                id="classroom"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={classroomId}
                onChange={(e) => chooseClass(e.target.value)}
              >
                <option value="">{t("lessonForm.noClassroom")}</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.grade}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="subject">{t("lessonForm.subject")}</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="grade">{t("lessonForm.grade")}</Label>
                <Input
                  id="grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="topic">{t("lessonForm.topic")}</Label>
              <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration">{t("lessonForm.duration")}</Label>
              <Input
                id="duration"
                type="number"
                min={5}
                max={240}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="lesson-language">{t("lessonForm.lessonLanguage")}</Label>
                <select
                  id="lesson-language"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={lessonLanguage}
                  onChange={(e) => setLessonLanguage(e.target.value as LanguageCode)}
                >
                  {languageOptions()}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="presentation-language">
                  {t("lessonForm.presentationLanguage")}
                </Label>
                <select
                  id="presentation-language"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={presentationLanguage}
                  onChange={(e) => setPresentationLanguage(e.target.value as LanguageCode | "same")}
                >
                  <option value="same">{t("lessonForm.sameAsLesson")}</option>
                  {languageOptions()}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="assignment-language">{t("lessonForm.assignmentLanguage")}</Label>
                <select
                  id="assignment-language"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={assignmentLanguage}
                  onChange={(e) => setAssignmentLanguage(e.target.value as LanguageCode | "same")}
                >
                  <option value="same">{t("lessonForm.sameAsLesson")}</option>
                  {languageOptions()}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goals">{t("lessonForm.goals")}</Label>
              <textarea
                id="goals"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            {error && (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/dashboard")}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={
                  saving ||
                  uploading ||
                  (mode === "curriculum" && !selection.objective) ||
                  (useSources && material?.status !== "READY")
                }
              >
                {saving ? t("lessonForm.creating") : t("lessonForm.create")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

interface CurriculumSelectProps {
  label: string;
  value: string;
  items: Array<{ id: string; label: string }>;
  onChange: (value: string) => void;
}

function CurriculumSelect({ label, value, items, onChange }: CurriculumSelectProps) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <select
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">—</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}
