export const PROVIDERS = [
  "openai",
  "gemini",
  "anthropic",
  "groq",
  "custom",
] as const;

export const BACKEND_BASE_URL =
  "https://leetcode-premium.sid385.duckdns.org/api";
export type ProviderName = (typeof PROVIDERS)[number];

// GITHUB CONSTANTS

export const GITHUB_CLIENT_ID = "Ov23lieyKfqwc7f1MUrF";
export const GITHUB_REDIRECT_URL = "https://github.com";
export const SCOPES = ["repo", "workflow"];
export const AUTHORIZATION_URL = "https://github.com/login/oauth/authorize";
