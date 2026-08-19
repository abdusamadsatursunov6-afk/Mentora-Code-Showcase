import { describe, expect, it } from "vitest";

import { isErrorResponse } from "@mentora/shared-types";

describe("isErrorResponse", () => {
  it("narrows an error envelope", () => {
    expect(
      isErrorResponse({
        error: { code: "NOT_FOUND", message: "нет", details: {}, request_id: "r" },
      }),
    ).toBe(true);
  });

  it("returns false for a success envelope", () => {
    expect(isErrorResponse({ data: { ok: true }, meta: { request_id: "r" } })).toBe(false);
  });
});
