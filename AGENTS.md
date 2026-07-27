# 🤖 AI Agent & Developer Guidelines for LeetCode+ Extension

## 📌 Project Overview
**LeetCode+** is a powerful Manifest V3 browser extension designed to enhance the LeetCode experience. It provides premium features such as Company Tags, Live Contest Ratings, AI-powered submission analysis, and seamless GitHub synchronization for LeetCode solutions.

## 🛠️ Tech Stack
- **Framework/UI:** React 18, functional components, Hooks.
- **Language:** TypeScript (Strict mode enabled).
- **Styling:** Tailwind CSS (Dark theme optimized, GitHub-inspired palette).
- **Validation:** Zod (for schema validation, especially extension options).
- **Extension API:** Manifest V3 (Chrome/Firefox compatible).
- **Messaging:** `webext-msg` for seamless communication between Content Scripts, UI, and the Background Service Worker.
- **Package:** Using pnpm for package management.
## 📂 Architecture & Mental Model
The extension is built following Manifest V3 security and architecture guidelines:
1. **Background Worker (`src/background/index.ts`):** 
   - Acts as the central hub. 
   - Handles external API calls (Backend API, GitHub OAuth).
   - Manages message listeners using `webext-msg` (e.g., `START_GITHUB_AUTH`, `ANALYZE_SUBMISSION`).
2. **Content Scripts (`src/content/scripts.tsx`):**
   - Injected directly into `leetcode.com`.
   - Modifies the DOM to add Company Tags, AI Analysis buttons, etc.
   - Listens to storage changes (e.g., `chrome.storage.onChanged`) to dynamically update the UI without page reloads.
3. **UI Pages (`Options` / `Popup` / `Welcome`):**
   - Built with React and Tailwind.
   - Communicates with the background script for auth and heavy lifting.
   - Reads/writes user preferences using a unified `optionsStorage` module.

## 🔐 Key Core Modules (Do not alter their core logic without permission)
- **`optionsStorage.ts`**: Uses `Zod`. It is the single source of truth for user preferences (GitHub tokens, LLM API keys, boolean toggles).
- **`GitHubClient.ts`**: Handles the end-to-end OAuth flow using `chrome.tabs`, token exchange via backend proxy, and GitHub API interactions.
- **`BackendClient.ts`**: Handles fetching company tags and AI analysis requests.

## 🧠 Instructions for AI Agents (Cursor / Copilot)

When generating code for this repository, you MUST adhere to the following rules:
### 0. This is not the framework and code you are thinking 
- Always look for the respective modules to check if you are using the correct version of the code.

### 1. Code Style & TypeScript
- Write clean, modular, and modern React code (Functional components only).
- Try to cope with the current coding style used in the codebase.
- Avoid `any` types. Define explicit interfaces or infer types using Zod (`z.infer<typeof schema>`).
- Do not use jQuery or legacy DOM manipulation libraries. Use standard React state (`useState`, `useEffect`) and refs if DOM manipulation is strictly required outside React's scope.

### 2. Extension Specific Rules (Manifest V3)
- **No external inline scripts:** Manifest V3 strictly prohibits inline scripts and `eval()`.
- **Background Context:** Remember that the Service Worker (`background.ts`) does not have access to the DOM or `window` object.
- **Message Passing:** Always use the `webext-msg` library (`messageRuntime`, `handleMessages`) for cross-context communication instead of raw `chrome.runtime.sendMessage`.

### 3. Styling Guidelines
- Use Tailwind CSS utility classes exclusively. 
- Stick to the established dark mode color palette (Backgrounds: `#0d1117`, `#161b22`, Text: `#c9d1d9`, `#8b949e`, Accents: `#58a6ff`, `#238636`).
- Ensure UI components are responsive and accessible.

### 4. GitHub Sync & Error Handling
- Never expose sensitive tokens in logs (`console.log`).
- Always implement graceful error handling with `try/catch` blocks.
- Network calls should provide visual feedback (Loading states, Success/Error toasts) to the user.

### 5. AI/LLM Integration
- When dealing with user API keys (OpenAI, Anthropic, Gemini), ensure they are fetched directly from hooks and class right before the API call. Do not cache them in memory for longer than necessary.


## 🚀 Common Workflows

**Adding a new Option/Setting:**
1. Update `src/features/options/options-schema.ts`
2. Update the UI in `src/welcome/WelcomeApp.tsx` (Add the Tailwind toggle/input).
3. The `src/utils/optionsStorage.ts` will automatically handle validation and persistence.

**Adding a new Background Task:**
1. Add the handler function in `src/background/index.ts` inside `handleMessages`.
2. Call it from the UI or Content Script using `await messageRuntime("TASK_NAME", payload)`.
