import { test, expect } from "@playwright/test";
import { DebugView, RootView } from "@/test/page_objects";

const { beforeEach, describe } = test;

let root: RootView;

beforeEach(async ({ page }) => {
  root = new RootView(page);

  await root.goto();
});

describe("Debug", () => {
  let debug: DebugView;

  beforeEach(async () => {
    debug = await root.gotoDebug();
  });

  test("has title", async ({ page }) => {
    await expect(page).toHaveTitle("chitter");
  });

  test("has db encryption", async ({ page }) => {
    await debug.expectDbEncryptionIs(true);
  });
});
