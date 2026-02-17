import { describe, expect, test } from "vitest";
import { screen } from "@testing-library/react";
import { App } from "../src/App";
import { renderComponentForTest } from "../src/testutils";
import "@testing-library/jest-dom/vitest";

describe("App", () => {
  test("renders", () => {
    renderComponentForTest(<App />);

    expect(screen.getByText("Home")).toBeVisible();
    expect(screen.getByText("Requests")).toBeVisible();
    expect(screen.getByText("Run History")).toBeVisible();
  });
});
