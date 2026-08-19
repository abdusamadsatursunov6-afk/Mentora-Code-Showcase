import type { LessonDetail } from "@mentora/shared-types";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";

import { useLessonAutosave } from "@/lib/use-lesson-autosave";

function lesson(text: string, version = 1): LessonDetail {
  return {
    id: "lesson-1",
    title: "Lesson",
    subject: "Math",
    topic: null,
    grade_level: "5",
    duration_minutes: 45,
    status: "DRAFT",
    version,
    schema_version: "1",
    classroom_id: null,
    lesson_language: "ru",
    presentation_language: "ru",
    assignment_language: "ru",
    updated_at: "2026-01-01T00:00:00Z",
    goals: [],
    sections: [
      {
        id: "section-1",
        kind: "THEORY",
        title: "Theory",
        order_index: 0,
        blocks: [{ id: "block-1", kind: "TEXT", text, order_index: 0 }],
      },
    ],
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function useHarness(saveBlock: Parameters<typeof useLessonAutosave>[0]["saveBlock"]) {
  const [value, setValue] = useState<LessonDetail | null>(() => lesson("initial"));
  const autosave = useLessonAutosave({
    lesson: value,
    setLesson: setValue,
    saveBlock,
    debounceMs: 500,
  });
  return { lesson: value, ...autosave };
}

function blockText(value: LessonDetail | null): string {
  if (!value) return "";
  return value.sections[0]?.blocks[0]?.text ?? "";
}

describe("lesson autosave", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("serializes fast changes in the correct order", async () => {
    const first = deferred<LessonDetail>();
    const second = deferred<LessonDetail>();
    const save = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useHarness(save));

    act(() => result.current.changeBlockText("section-1", "block-1", "first"));
    await act(async () => vi.advanceTimersByTimeAsync(500));
    act(() => result.current.changeBlockText("section-1", "block-1", "second"));
    expect(save).toHaveBeenCalledTimes(1);

    await act(async () => first.resolve(lesson("first", 2)));
    expect(save.mock.calls.map(([change]) => change.text)).toEqual(["first", "second"]);
    await act(async () => second.resolve(lesson("second", 3)));
    expect(result.current.saveState).toBe("saved");
  });

  it("does not let an old response replace newer local text", async () => {
    const first = deferred<LessonDetail>();
    const second = deferred<LessonDetail>();
    const save = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useHarness(save));

    act(() => result.current.changeBlockText("section-1", "block-1", "old"));
    await act(async () => vi.advanceTimersByTimeAsync(500));
    act(() => result.current.changeBlockText("section-1", "block-1", "new"));
    await act(async () => first.resolve(lesson("old", 2)));

    expect(blockText(result.current.lesson)).toBe("new");
    await act(async () => second.resolve(lesson("new", 3)));
  });

  it("keeps local text when the API fails", async () => {
    const save = vi.fn().mockRejectedValue(new Error("Network unavailable"));
    const { result } = renderHook(() => useHarness(save));

    act(() => result.current.changeBlockText("section-1", "block-1", "draft"));
    await act(async () => result.current.flush());

    expect(blockText(result.current.lesson)).toBe("draft");
    expect(result.current.saveState).toBe("error");
    expect(result.current.saveError).toBe("Network unavailable");
  });

  it("retries a failed save", async () => {
    const save = vi
      .fn()
      .mockRejectedValueOnce(new Error("Temporary failure"))
      .mockResolvedValueOnce(lesson("saved", 2));
    const { result } = renderHook(() => useHarness(save));

    act(() => result.current.changeBlockText("section-1", "block-1", "saved"));
    await act(async () => result.current.flush());
    await act(async () => result.current.retry());

    expect(save).toHaveBeenCalledTimes(2);
    expect(result.current.saveState).toBe("saved");
    expect(blockText(result.current.lesson)).toBe("saved");
  });

  it("flushes a pending change immediately on blur", async () => {
    const save = vi.fn().mockResolvedValue(lesson("blurred", 2));
    const { result } = renderHook(() => useHarness(save));

    act(() => result.current.changeBlockText("section-1", "block-1", "blurred"));
    expect(save).not.toHaveBeenCalled();
    await act(async () => result.current.flush());

    expect(save).toHaveBeenCalledTimes(1);
  });
});
