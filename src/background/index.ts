import { handleMessages } from "webext-msg";
import { BackendClient } from "../api/backendClient";
import "../utils/optionsStorage";
import { GitHubClient } from "../api/githubClient";

const isFirefoxLike =
  import.meta.env.EXTENSION_PUBLIC_BROWSER === "firefox" ||
  import.meta.env.EXTENSION_PUBLIC_BROWSER === "gecko-based";

if (isFirefoxLike) {
  browser.browserAction.onClicked.addListener(() => {
    browser.sidebarAction.open();
  });
} else {
  chrome.action.onClicked.addListener(() => {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  });
}

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      // Fallback for older browsers
      window.open(chrome.runtime.getURL("options/index.html"));
    }
  }
});

handleMessages({
  async ANALYZE_SUBMISSION(payload) {
    const data = await BackendClient.aiAnalyze(payload.submissionId);
    return data;
  },

  async GET_COMPANY_DATA(payload) {
    const data = await BackendClient.companyTags(payload.slug);
    return data;
  },

  async START_GITHUB_AUTH() {
    const data = await GitHubClient.completeOAuthFlow();
    return data;
  },

  async SETUP_GITHUB_REPO(payload) {
    try {
      const data = await BackendClient.setupGitHubRepo(
        payload.action,
        payload.repoName,
        payload.isPrivate,
      );
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "GitHub setup failed",
      };
    }
  },

  async PUSH_TO_GITHUB() {
    try {
      const data = await BackendClient.triggerSyncWorkflow();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "GitHub sync failed",
      };
    }
  },
});
