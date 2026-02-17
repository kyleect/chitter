import { expect, Locator, Page } from "@playwright/test";
import { PageObject } from ".";
import { RequestsView } from "./pom/request_page";

export class RootView extends PageObject {
  readonly nav: Locator;
  readonly homeLink: Locator;
  readonly requestLink: Locator;
  readonly runHistoryLink: Locator;
  readonly debugLink: Locator;

  constructor(page: Page) {
    super(page, page.getByTestId("root"));

    this.nav = this.root.getByRole("navigation");
    this.homeLink = this.nav.getByRole("link", { name: "Home" });
    this.requestLink = this.nav.getByRole("link", { name: "Request" });
    this.runHistoryLink = this.nav.getByRole("link", { name: "Run History" });
    this.debugLink = this.nav.getByRole("link", { name: "Debug" });
  }

  public async goto(): Promise<RootView> {
    await this.page.goto("/");

    await expect(this.root).toBeVisible();

    return this;
  }

  public async gotoHome(): Promise<HomeView> {
    await this.homeLink.click();

    return new HomeView(this.page);
  }

  public async gotoRequests(): Promise<RequestsView> {
    await this.requestLink.click();

    return new RequestsView(this.page);
  }

  public async gotoDebug(): Promise<DebugView> {
    await this.debugLink.click();

    return new DebugView(this.page);
  }
}

export class DebugView extends PageObject {
  readonly dbIsEncryptedRow: Locator;
  readonly dbIsEncryptedHeader: Locator;
  readonly dbIsEncryptedValue: Locator;

  constructor(page: Page) {
    super(page, page.getByTestId("debug-view"));

    this.dbIsEncryptedRow = this.root.getByTestId("database-is-encrypted");
    this.dbIsEncryptedHeader = this.dbIsEncryptedRow.locator("th");
    this.dbIsEncryptedValue = this.dbIsEncryptedRow.locator("td");
  }

  public async expectDbEncryptionIs(isEncrypted: boolean) {
    await expect(this.dbIsEncryptedValue).toHaveText(
      isEncrypted ? "Yes" : "No",
    );
  }
}

export class HomeView extends PageObject {
  readonly dbIsNotEncryptedAlert: Locator;

  readonly projectHeader: Locator;

  /**
   * Displays the absolute path to the project
   */
  private readonly projectCwd: Locator;

  /**
   * Advises user there hasn't been able request runs yet
   */
  readonly latestRunsAlert: Locator;

  readonly doclinks: Locator;

  constructor(page: Page) {
    super(page, page.getByTestId("home-view"));

    this.dbIsNotEncryptedAlert = this.root.getByRole("alert", {
      name: "Database Is Not Encrypted",
    });

    this.projectHeader = this.root.getByRole("heading", {
      name: "Project",
    });
    this.projectCwd = this.root.getByTestId("project-cwd");
    this.latestRunsAlert = this.root.getByTestId("latest-runs-alert");
    this.doclinks = this.root
      .getByTestId("doclinks")
      .getByRole("listitem")
      .getByRole("link");
  }

  async projectCwdText(): Promise<string> {
    return this.projectCwd.textContent();
  }

  async docLinkUrls(): Promise<string[]> {
    return await Promise.all(
      (await this.doclinks.all()).map((link) => link.getAttribute("href")),
    );
  }

  async expectDoesNotHaveDbNotEncryptedAlert() {
    await expect(this.dbIsNotEncryptedAlert).not.toBeVisible();
  }

  async expectHasLatestRunsAlert() {
    await expect(this.latestRunsAlert).toBeVisible();
  }

  async expectHasDocLinks(expected: Record<string, string>) {
    await expect.soft(this.doclinks).toHaveText(Object.keys(expected));

    await expect
      .soft(this.docLinkUrls())
      .resolves.toStrictEqual(Object.values(expected));
  }
}
