import { test, expect } from "@playwright/test";
import { CHITTER_PROJECT_DIR } from "@/test";
import { HomeView, RootView } from "@/test/page_objects";

const { beforeEach, describe } = test;

let root: RootView;

beforeEach(async ({ page }) => {
  root = new RootView(page);

  await root.goto();
});

describe("Home", () => {
  let home: HomeView;

  beforeEach(async () => {
    home = await root.gotoHome();
  });

  test("has title", async ({ page }) => {
    await expect(page).toHaveTitle("chitter");
  });

  test("does not have alert that db is unencrypted", async () => {
    await home.expectDoesNotHaveDbNotEncryptedAlert();
  });

  test("has project cwd", async () => {
    await expect.soft(home.projectCwdText()).resolves.toBe(CHITTER_PROJECT_DIR);
    await expect
      .soft(home.projectCwdText())
      .resolves.not.toBe("{{join(cache_directory(), uuid())}}");
  });

  test("has alert that no requests have ran yet", async () => {
    /**
     * This ensures the alert will show up since the tests run in parallel
     */
    (async () => {
      const response = await fetch("http://[::1]:3123/api/history", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete history");
      }
    })();

    await home.expectHasLatestRunsAlert();
  });
});
