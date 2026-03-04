import { describe, expect, test } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  test.each([
    { input: "Hello World", expected: "hello-world" },
    { input: "Hello  World", expected: "hello-world" },
    { input: "HELLO WORLD", expected: "hello-world" },
    { input: "hello-world", expected: "hello-world" },
    { input: "hello - world", expected: "hello-world" },
    { input: "hello--world", expected: "hello-world" },
    { input: "hello.world", expected: "hello-world" },
    { input: "hello, world", expected: "hello-world" },
    { input: "hello@world#test", expected: "hello-world-test" },
    { input: "Version 2.0.1", expected: "version-2-0-1" },
    { input: "Crème brûlée", expected: "creme-brulee" },
    { input: "¿Qué tal?", expected: "que-tal" },
    { input: "中文測試", expected: "" },
    { input: "Русский текст", expected: "" },
    { input: "emoji 😀 test", expected: "emoji-test" },
    { input: "---Hello---World---", expected: "hello-world" },
    { input: null, expected: "" },
    { input: undefined, expected: "" },
    { input: "", expected: "" },
    { input: " ", expected: "" },
  ])("should slugify", ({ input, expected }) => {
    expect(slugify(input)).toBe(expected);
  });
});
