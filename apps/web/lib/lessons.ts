import type { LessonStatus } from "@mentora/shared-types";

/** Localization key for every lesson status. */
export const LESSON_STATUS_KEYS: Record<LessonStatus, string> = {
  DRAFT: "lesson.draft",
  GENERATING: "lesson.generating",
  READY: "lesson.ready",
  CONDUCTED: "lesson.conducted",
  ARCHIVED: "lesson.archived",
  GENERATION_FAILED: "lesson.generationFailed",
};

/** Tailwind classes for a status badge. */
export function statusBadgeClass(status: LessonStatus): string {
  switch (status) {
    case "READY":
      return "bg-emerald-50 text-emerald-700";
    case "CONDUCTED":
      return "bg-blue-50 text-blue-700";
    case "ARCHIVED":
      return "bg-slate-100 text-slate-600";
    case "GENERATION_FAILED":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-amber-50 text-amber-700";
  }
}
