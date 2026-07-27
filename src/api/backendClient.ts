import { leetcodeClient } from "./leetcodeClient";
import { GitHubClient } from "./githubClient";
import {
  AnalysisRequest,
  QuestionResponse,
  analysisRequestSchema,
} from "../schema/backendClient.schema";
import { BACKEND_BASE_URL } from "../utils/constants";
import { appConfigManager } from "../utils/optionsStorage";
import { getCookie } from "../utils/cookies";

export class BackendClient {
  private static BASE_URL = BACKEND_BASE_URL;

  private static async getAIConfig(): Promise<any> {
    const config = await appConfigManager.load();
    const options = config.llm;
    return {
      baseUrl: options.baseUrl,
      provider: options.provider,
      modelId: options.modelId,
      userAPIKey: options.userAPIKey,
    };
  }

  private static async request<TResponse>(
    endpoint: string,
    options: RequestInit,
  ): Promise<TResponse> {
    const response = await fetch(`${this.BASE_URL}/${endpoint}`, options);

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        if (errorData.error) errorMessage = errorData.error;
      } catch (e) {
        // Fallback to default statusText if response is not JSON
      }
      throw new Error(`Backend Error (${response.status}): ${errorMessage}`);
    }

    return response.json();
  }

  protected static get<TResponse>(endpoint: string) {
    return this.request<TResponse>(endpoint, { method: "GET" });
  }

  protected static post<TResponse, TBody>(endpoint: string, body: TBody) {
    return this.request<TResponse>(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  public static async encryptSecret(secret: string, key: string) {
    return await this.post<any, any>("encrypt-secret", { secret, key });
  }

  private static getEncryptedSecret(response: unknown): string {
    const encryptedSecretKeys = [
      "encryptedSecret",
      "encrypted_secret",
      "encryptedValue",
      "encrypted_value",
      "ciphertext",
      "sealedBox",
      "secret",
    ];

    if (typeof response === "string") {
      return response;
    }

    if (!response || typeof response !== "object") {
      return "";
    }

    const data = response as Record<string, unknown>;

    for (const key of encryptedSecretKeys) {
      const value = data[key];
      if (typeof value === "string" && value.length > 0) {
        return value;
      }
    }

    const nestedResponse = data.data || data.result;
    if (nestedResponse && typeof nestedResponse === "object") {
      const nestedEncryptedSecret = this.getEncryptedSecret(nestedResponse);
      if (nestedEncryptedSecret) {
        return nestedEncryptedSecret;
      }
    }

    return "";
  }

  private static getResponseKeys(response: unknown): string[] {
    if (!response || typeof response !== "object") {
      return [];
    }

    return Object.keys(response as Record<string, unknown>);
  }

  public static async aiAnalyze(submissionId: number) {
    const rawData = await leetcodeClient.getSubmissionDetail(submissionId);
    const aiConfig = await this.getAIConfig();
    const finalPayload = analysisRequestSchema.parse({
      submission: rawData,
      config: aiConfig,
    });
    return await this.post<any, AnalysisRequest>("analyze", finalPayload);
  }

  public static async companyTags(slug: string) {
    return await this.get<QuestionResponse>(`problems/${slug}`);
  }

  public static async fetchAndLogCookies() {
    const sessionCookie = await getCookie(
      "https://leetcode.com",
      "LEETCODE_SESSION",
    );
    const csrfCookie = await getCookie("https://leetcode.com", "csrftoken");

    return {
      leetcodeSession: sessionCookie?.value,
      csrfToken: csrfCookie?.value,
    };
  }

  public static async syncSecretsIfNeeded(
    token: string,
    owner: string,
    name: string,
    force: boolean = false,
  ): Promise<boolean> {
    const cookies = await this.fetchAndLogCookies();
    const config = await appConfigManager.load();

    const lastSession = config.github.lastLeetCodeSession;
    const lastCsrf = config.github.lastCsrfToken;

    if (
      force ||
      cookies.leetcodeSession !== lastSession ||
      cookies.csrfToken !== lastCsrf
    ) {
      if (cookies.leetcodeSession && cookies.csrfToken) {
        const publicKeyData = await GitHubClient.getRepoPublicKey(
          token,
          owner,
          name,
        );

        const sessionEncRes = await this.encryptSecret(
          cookies.leetcodeSession,
          publicKeyData.key,
        );
        const csrfEncRes = await this.encryptSecret(
          cookies.csrfToken,
          publicKeyData.key,
        );
        const encryptedSession = this.getEncryptedSecret(sessionEncRes);
        const encryptedCsrf = this.getEncryptedSecret(csrfEncRes);

        if (!encryptedSession || !encryptedCsrf) {
          throw new Error(
            `Failed to encrypt LeetCode cookies before creating GitHub secrets. Response keys: session=[${this.getResponseKeys(sessionEncRes).join(", ")}], csrf=[${this.getResponseKeys(csrfEncRes).join(", ")}].`,
          );
        }

        await GitHubClient.setRepoSecret(
          token,
          owner,
          name,
          "LEETCODE_SESSION",
          encryptedSession,
          publicKeyData.key_id,
        );

        await GitHubClient.setRepoSecret(
          token,
          owner,
          name,
          "LEETCODE_CSRF_TOKEN",
          encryptedCsrf,
          publicKeyData.key_id,
        );

        await appConfigManager.save({
          github: {
            ...config.github,
            lastLeetCodeSession: cookies.leetcodeSession,
            lastCsrfToken: cookies.csrfToken,
          },
        });
        return true;
      } else {
        if (force) {
          throw new Error(
            "LeetCode cookies are missing. Open leetcode.com, sign in, then retry GitHub setup.",
          );
        }
      }
    }

    return false;
  }

  public static async triggerSyncWorkflow() {
    const config = await appConfigManager.load();
    const { githubToken, githubUserName, githubRepoName, enableGitHubSync } =
      config.github;

    if (
      !enableGitHubSync ||
      !githubToken ||
      !githubUserName ||
      !githubRepoName
    ) {
      throw new Error(
        "GitHub synchronization is disabled or not configured properly.",
      );
    }

    let owner = githubUserName;
    let repo = githubRepoName;
    if (githubRepoName.includes("/")) {
      [owner, repo] = githubRepoName.split("/");
    }

    // Ensure secrets are up to date before triggering
    await this.syncSecretsIfNeeded(githubToken, owner, repo);

    // Trigger workflow
    await GitHubClient.triggerWorkflow(
      githubToken,
      owner,
      repo,
      "leetcode-sync.yml",
    );
    return { success: true, message: "Sync workflow triggered successfully" };
  }

  public static async setupGitHubRepo(
    action: "new" | "link",
    repoName: string,
    isPrivate: boolean = false,
  ) {
    const config = await appConfigManager.load();
    const token = config.github.githubToken;
    const username = config.github.githubUserName;

    if (!token || !username) throw new Error("GitHub not authenticated");

    let repoData;
    let owner = username;
    let name = repoName;

    if (action === "new") {
      repoData = await GitHubClient.createRepo(token, repoName, isPrivate);

      owner = repoData.owner?.login || owner;
      name = repoData.name || name;
    } else {
      if (repoName.includes("/")) {
        [owner, name] = repoName.split("/");
      }

      repoData = await GitHubClient.getRepo(token, owner, name);
    }

    await this.syncSecretsIfNeeded(token, owner, name, true);

    // Push the workflow file
    const workflowContent = `name: LeetCode+ Sync
on:
  workflow_dispatch:
  schedule:
    - cron: "0 0 * * *" # Runs every day at midnight

permissions:
  contents: write

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Sync LeetCode Submissions
        uses: siddhant385/leetcode-sync-action@main # Update this if you host the action elsewhere
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          leetcode_csrf_token: \${{ secrets.LEETCODE_CSRF_TOKEN }}
          leetcode_session: \${{ secrets.LEETCODE_SESSION }}
          generate_badge: "true"
          badge_folder: ".badges"
`;

    const workflowPath = ".github/workflows/leetcode-sync.yml";
    const workflowBase64 = btoa(workflowContent);

    const workflowSha = await GitHubClient.getFileSha(
      token,
      owner,
      name,
      workflowPath,
    );

    await GitHubClient.uploadFile(
      token,
      owner,
      name,
      workflowPath,
      workflowBase64,
      workflowSha
        ? "Update LeetCode Sync workflow"
        : "Create LeetCode Sync workflow",
      workflowSha,
    );

    await GitHubClient.waitForWorkflow(
      token,
      owner,
      name,
      "leetcode-sync.yml",
    );

    await GitHubClient.triggerWorkflow(token, owner, name, "leetcode-sync.yml");

    await appConfigManager.save({
      github: {
        ...config.github,
        phase: "connected",
        enableGitHubSync: true,
        autoSync: true,
        githubRepoName: repoData.full_name || `${owner}/${name}`,
        githubRepoPrivate: repoData.private ?? isPrivate,
      },
    });

    return { success: true, repo: repoData };
  }
}
