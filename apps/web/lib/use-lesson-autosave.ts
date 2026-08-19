"use client";

import type { LessonDetail } from "@mentora/shared-types";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export type SaveState = "idle" | "saving" | "saved" | "error";

interface PendingBlockSave {
  blockId: string;
  sectionId: string;
  text: string;
  revision: number;
}

interface UseLessonAutosaveOptions {
  lesson: LessonDetail | null;
  setLesson: Dispatch<SetStateAction<LessonDetail | null>>;
  saveBlock: (change: PendingBlockSave) => Promise<LessonDetail>;
  debounceMs?: number;
  fallbackError?: string;
}

function localBlockText(lesson: LessonDetail | null, blockId: string): string | null {
  if (!lesson) return null;
  for (const section of lesson.sections) {
    const block = section.blocks.find((item) => item.id === blockId);
    if (block) return block.text;
  }
  return null;
}

function mergeServerLesson(
  server: LessonDetail,
  local: LessonDetail | null,
  pendingBlockIds: Set<string>,
): LessonDetail {
  if (!local || pendingBlockIds.size === 0) return server;
  return {
    ...server,
    sections: server.sections.map((section) => ({
      ...section,
      blocks: section.blocks.map((block) => {
        if (!pendingBlockIds.has(block.id)) return block;
        const text = localBlockText(local, block.id);
        return text === null ? block : { ...block, text };
      }),
    })),
  };
}

export function useLessonAutosave({
  lesson,
  setLesson,
  saveBlock,
  debounceMs = 700,
  fallbackError = "Could not save changes.",
}: UseLessonAutosaveOptions) {
  const lessonRef = useRef(lesson);
  const pendingRef = useRef(new Map<string, PendingBlockSave>());
  const revisionRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const runningRef = useRef<Promise<void> | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    lessonRef.current = lesson;
  }, [lesson]);

  const applyServerLesson = useCallback(
    (server: LessonDetail) => {
      const pendingIds = new Set(pendingRef.current.keys());
      setLesson((local) => mergeServerLesson(server, local, pendingIds));
    },
    [setLesson],
  );

  const drain = useCallback(async (): Promise<void> => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (runningRef.current) return runningRef.current;

    const work = (async () => {
      while (pendingRef.current.size > 0) {
        const change = pendingRef.current.values().next().value as PendingBlockSave;
        setSaveState("saving");
        setSaveError(null);
        try {
          const server = await saveBlock(change);
          const current = pendingRef.current.get(change.blockId);
          if (current?.revision === change.revision) {
            pendingRef.current.delete(change.blockId);
          }
          applyServerLesson(server);
        } catch (error) {
          setSaveState("error");
          setSaveError(error instanceof Error ? error.message : fallbackError);
          return;
        }
      }
      setSaveState("saved");
    })().finally(() => {
      runningRef.current = null;
    });

    runningRef.current = work;
    return work;
  }, [applyServerLesson, fallbackError, saveBlock]);

  const schedule = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      void drain();
    }, debounceMs);
  }, [debounceMs, drain]);

  const changeBlockText = useCallback(
    (sectionId: string, blockId: string, text: string) => {
      revisionRef.current += 1;
      pendingRef.current.set(blockId, {
        blockId,
        sectionId,
        text,
        revision: revisionRef.current,
      });
      setSaveState("idle");
      setSaveError(null);
      setLesson((current) =>
        current
          ? {
              ...current,
              sections: current.sections.map((section) =>
                section.id === sectionId
                  ? {
                      ...section,
                      blocks: section.blocks.map((block) =>
                        block.id === blockId ? { ...block, text } : block,
                      ),
                    }
                  : section,
              ),
            }
          : current,
      );
      schedule();
    },
    [schedule, setLesson],
  );

  const runMutation = useCallback(
    async (operation: Promise<LessonDetail>): Promise<LessonDetail | null> => {
      setSaveState("saving");
      setSaveError(null);
      try {
        const server = await operation;
        applyServerLesson(server);
        if (pendingRef.current.size === 0) setSaveState("saved");
        return server;
      } catch (error) {
        setSaveState("error");
        setSaveError(error instanceof Error ? error.message : fallbackError);
        return null;
      }
    },
    [applyServerLesson, fallbackError],
  );

  useEffect(() => {
    const warnIfUnsaved = (event: BeforeUnloadEvent) => {
      if (pendingRef.current.size === 0 && !runningRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnIfUnsaved);
    return () => {
      window.removeEventListener("beforeunload", warnIfUnsaved);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  return {
    saveState,
    saveError,
    changeBlockText,
    flush: drain,
    retry: drain,
    runMutation,
    applyServerLesson,
  };
}
