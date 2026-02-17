import { describe, test, expect } from "vitest";
import { ACHIEVEMENT_KEYS } from "@/queries/achievement";

describe("ACHIEVEMENT_KEYS", () => {
  describe("all", () => {
    test("equals", () => {
      expect(ACHIEVEMENT_KEYS.all).toStrictEqual(["achievements"]);
    });
  });
});
