import {
  AUTHORIZATION_URL,
  BACKEND_BASE_URL,
  GITHUB_CLIENT_ID,
  GITHUB_REDIRECT_URL,
  SCOPES,
} from "../utils/constants";
import { appConfigManager } from "../utils/optionsStorage";

export class GitHubClient {
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Universal request method with Header support
  private static async request<TResponse>(
    endpoint: string,
    options: RequestInit,
  ): Promise<TResponse> {
    const response = await fetch(endpoint, options);

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        if (errorData.message) errorMessage = errorData.message; // GitHub errors typically use \'message\' rather than \'error\'
      } catch (e) {
        // Fallback
      }
      throw new Error(
        `GitHub API Error (${response.status}) for ${endpoint}: ${errorMessage}`,
      );
    }

    const responseText = await response.text();
    if (!responseText) {
      return undefined as TResponse;
    }

    return JSON.parse(responseText);
  }

  // Universal get request method
  protected static get<TResponse>(endpoint: string, headers?: HeadersInit) {
    return this.request<TResponse>(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...headers,
      },
    });
  }

  // Universal post request method
  protected static post<TResponse, TBody>(
    endpoint: string,
    body: TBody,
    headers?: HeadersInit,
  ) {
    return this.request<TResponse>(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
        ...headers,
      },
      body: JSON.stringify(body),
    });
  }

  // Universal put request method
  protected static put<TResponse, TBody>(
    endpoint: string,
    body: TBody,
    headers?: HeadersInit,
  ) {
    return this.request<TResponse>(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
        ...headers,
      },
      body: JSON.stringify(body),
    });
  }

  // Auth Request Url method (Fixed with URLSearchParams)
  public static getOAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: GITHUB_REDIRECT_URL,
      scope: SCOPES.join(" "),
    });

    return `${AUTHORIZATION_URL}?${params.toString()}`;
  }

  // Next.js Proxy for getting access token
  public static async exchangeCodeForToken(code: string): Promise<string> {
    const response = await fetch(`${BACKEND_BASE_URL}/auth/github`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) throw new Error("Failed to exchange token via proxy");

    const data = await response.json();
    return data.accessToken;
  }

  // Username after getting token
  public static async getUserProfile(token: string): Promise<any> {
    return this.get<any>("https://api.github.com/user", {
      Authorization: `token ${token}`,
    });
  }

  // Create a repository
  public static async createRepo(token: string, name: string, isPrivate: boolean, description: string = "Collection of LeetCode solutions synced by LeetCode+ Extension"): Promise<any> {
    return this.post<any, { name: string; private: boolean; auto_init: boolean; description: string }>(
      "https://api.github.com/user/repos",
      {
        name,
        private: isPrivate,
        auto_init: true,
        description,
      },
      {
        Authorization: `token ${token}`,
      }
    );
  }

  // Link/Check an existing repository
  public static async getRepo(token: string, owner: string, repoName: string): Promise<any> {
    return this.get<any>(
      `https://api.github.com/repos/${owner}/${repoName}`,
      {
        Authorization: `token ${token}`,
      }
    );
  }

  // Get file SHA if it exists (useful for updating files)
  public static async getFileSha(token: string, owner: string, repo: string, path: string): Promise<string | null> {
    const file = await this.getFileContent(token, owner, repo, path);
    return file ? file.sha : null;
  }

  // Get repository public key for secrets encryption
  public static async getRepoPublicKey(token: string, owner: string, repo: string): Promise<{ key_id: string; key: string }> {
    return this.get<{ key_id: string; key: string }>(
      `https://api.github.com/repos/${owner}/${repo}/actions/secrets/public-key`,
      { Authorization: `token ${token}` }
    );
  }

  // Create or update a repository secret
  // IMPORTANT: `encryptedValue` MUST be encrypted using libsodium and the repo's public key.
  public static async setRepoSecret(
    token: string,
    owner: string,
    repo: string,
    secretName: string,
    encryptedValue: string,
    keyId: string
  ): Promise<any> {
    return this.put<any, { encrypted_value: string; key_id: string }>(
      `https://api.github.com/repos/${owner}/${repo}/actions/secrets/${secretName}`,
      {
        encrypted_value: encryptedValue,
        key_id: keyId,
      },
      { Authorization: `token ${token}` }
    );
  }

  public static async getWorkflow(
    token: string,
    owner: string,
    repo: string,
    workflowId: string,
  ): Promise<{ id: number; name: string; path: string; state: string }> {
    return this.get<{ id: number; name: string; path: string; state: string }>(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}`,
      { Authorization: `token ${token}` },
    );
  }

  public static async waitForWorkflow(
    token: string,
    owner: string,
    repo: string,
    workflowId: string,
  ): Promise<{ id: number; name: string; path: string; state: string }> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        return await this.getWorkflow(token, owner, repo, workflowId);
      } catch (error) {
        lastError = error;
        await this.sleep(1000 * attempt);
      }
    }

    throw lastError;
  }

  // Get full file content and SHA
  public static async getFileContent(token: string, owner: string, repo: string, path: string): Promise<{ sha: string, content: string } | null> {
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: "GET",
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        }
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch file info: ${response.statusText}`);
      }

      const data = await response.json();
      
      let content = "";
      if (data.content && data.encoding === "base64") {
        content = decodeURIComponent(escape(atob(data.content)));
      }

      return {
        sha: data.sha,
        content: content
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  // Upload or update a file on GitHub
  public static async uploadFile(
    token: string,
    owner: string,
    repo: string,
    path: string,
    base64Content: string,
    commitMessage: string,
    sha?: string | null
  ): Promise<any> {
    const body: any = {
      message: commitMessage,
      content: base64Content,
    };

    if (sha) {
      body.sha = sha;
    }

    return this.put<any, any>(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      body,
      {
        Authorization: `token ${token}`,
      }
    );
  }

  // Trigger a repository workflow dispatch
  public static async triggerWorkflow(token: string, owner: string, repo: string, workflowId: string): Promise<any> {
    // Fetch the default branch dynamically to avoid 'main' vs 'master' dispatch errors
    let defaultBranch = "main";
    try {
      const repoData = await this.getRepo(token, owner, repo);
      defaultBranch = repoData.default_branch || "main";
    } catch (e) {
      // Fall back to main if the default branch lookup fails.
    }

    return this.post<any, { ref: string }>(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
      { ref: defaultBranch },
      { Authorization: `token ${token}` }
    );
  }

  // (E2E OAuth Flow)
  public static async completeOAuthFlow(): Promise<{
    success: boolean;
    username?: string;
    error?: string;
  }> {
    return new Promise((resolve) => {
      chrome.tabs.create(
        { url: this.getOAuthUrl(), active: true },
        (authTab) => {
          if (!authTab.id)
            return resolve({ success: false, error: "Failed to create tab" });

          const listener = async (
            tabId: number,
            changeInfo: { url?: string; status?: string },
          ) => {
            if (tabId === authTab.id && changeInfo.url) {
              const urlObj = new URL(changeInfo.url);
              const code = urlObj.searchParams.get("code");
              const error = urlObj.searchParams.get("error");

              if (code || error) {
                // Remove listener and close tab
                chrome.tabs.onUpdated.removeListener(listener);
                chrome.tabs.remove(tabId);

                if (error) {
                  return resolve({ success: false, error });
                }

                if (code) {
                  try {
                    const token = await this.exchangeCodeForToken(code);
                    const user = await this.getUserProfile(token);

                    await appConfigManager.save({
                      github: {
                        phase: "auth_complete",
                        enableGitHubSync: true,
                        githubToken: token,
                        githubUserName: user.login,
                      },
                    });
                    return resolve({ success: true, username: user.login });
                  } catch (err: any) {
                    return resolve({ success: false, error: err.message });
                  }
                }
              }
            }
          };

          // Attach listener
          chrome.tabs.onUpdated.addListener(listener);
        },
      );
    });
  }
}
