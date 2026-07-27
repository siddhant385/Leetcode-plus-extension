import { useEffect, useState } from "react";
import { messageRuntime } from "webext-msg";
import { useConfig } from "../hooks/useStorage.hook";
import { Button, InlineMessage, Spinner, StatusRow, ToggleRow } from "./components/ui";

type MessageState = {
	tone: "muted" | "success" | "error";
	text: string;
} | null;

const popupFont = "font-['Berkeley_Mono','Inter',system-ui,sans-serif]";

function isProblemPage(url?: string) {
	if (!url) return false;

	try {
		const activeUrl = new URL(url);
		return activeUrl.hostname.endsWith("leetcode.com") && /^\/problems\/[^/]+/.test(activeUrl.pathname);
	} catch {
		return false;
	}
}

function LoadingPopup() {
	return (
		<main className={`flex h-[420px] w-[320px] items-center justify-center bg-[#fdfcfc] text-[#201d1d] ${popupFont}`}>
			<div className="flex items-center gap-2 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] px-4 py-3 text-[13px] leading-5">
				<Spinner />
				Loading popup...
			</div>
		</main>
	);
}

export default function PopupApp() {
	const { config, updateConfig, isLoading } = useConfig();
	const [isProblemActive, setIsProblemActive] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);
	const [isAuthenticating, setIsAuthenticating] = useState(false);
	const [message, setMessage] = useState<MessageState>(null);

	useEffect(() => {
		chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
			setIsProblemActive(isProblemPage(tab?.url));
		});
	}, []);

	if (isLoading) {
		return <LoadingPopup />;
	}

	const githubAuthenticated = Boolean(config.github.githubUserName);
	const githubConnected = config.github.enableGitHubSync && githubAuthenticated;
	const aiReady = Boolean(config.llm.userAPIKey.trim() && config.llm.modelId.trim());
	const canSync = githubConnected && isProblemActive && !isSyncing;
	const githubStatusTone = githubConnected ? "success" : githubAuthenticated ? "warning" : "danger";
	const githubStatusValue = githubConnected ? `@${config.github.githubUserName}` : githubAuthenticated ? "Setup needed" : "Not connected";

	const handleOpenSettings = () => {
		chrome.runtime.openOptionsPage();
		window.close();
	};

	const handleGitHubAuth = async () => {
		try {
			setIsAuthenticating(true);
			setMessage(null);
			const response = (await messageRuntime({ START_GITHUB_AUTH: true })) as {
				success: boolean;
				username?: string;
				error?: string;
			};

			if (response.success && response.username) {
				await updateConfig({
					github: {
						phase: "auth_complete",
						githubUserName: response.username
					}
				});
				setMessage({ tone: "success", text: "GitHub connected. Finish repository setup in settings." });
			} else {
				setMessage({ tone: "error", text: response.error || "GitHub authentication failed." });
			}
		} catch {
			setMessage({ tone: "error", text: "Could not start GitHub authentication." });
		} finally {
			setIsAuthenticating(false);
		}
	};

	const handleManualSync = async () => {
		try {
			setIsSyncing(true);
			setMessage({ tone: "muted", text: "Starting GitHub sync..." });
			const response = (await messageRuntime({ PUSH_TO_GITHUB: true })) as { success: boolean; error?: string };

			if (response.success) {
				setMessage({ tone: "success", text: "Sync workflow started on GitHub." });
			} else {
				setMessage({ tone: "error", text: response.error || "GitHub sync failed." });
			}
		} catch {
			setMessage({ tone: "error", text: "Could not communicate with the background worker." });
		} finally {
			setIsSyncing(false);
		}
	};

	const handleToggleTags = async (checked: boolean) => {
		await updateConfig({ extension: { enableCompanyTags: checked } });
		setMessage({ tone: "success", text: checked ? "Company tags enabled." : "Company tags hidden." });
	};

	const syncHint = !githubAuthenticated
		? "Connect GitHub first."
		: !githubConnected
			? "Finish repository setup in settings."
			: !isProblemActive
				? "Open a LeetCode problem page to sync."
				: "Push the latest accepted solution to GitHub.";

	return (
		<main className={`flex h-[420px] w-[320px] flex-col overflow-hidden bg-[#fdfcfc] text-[#424245] ${popupFont}`}>
			<header className="shrink-0 border-b border-[rgba(15,0,0,0.12)] px-4 py-4">
				<div className="flex items-center justify-between gap-3">
					<div>
						<h1 className="text-[15px] font-semibold leading-6 text-[#201d1d]">LeetCode+</h1>
						<p className="text-[12px] leading-4 text-[#646262]">Quick dashboard</p>
					</div>
					<span className="text-[12px] leading-4 text-[#646262]">v1.0.0</span>
				</div>
			</header>

			<section className="min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-4">
				<div className="space-y-2">
					<StatusRow
						label="GitHub Sync"
						value={githubStatusValue}
						tone={githubStatusTone}
						action={
							!githubAuthenticated ? (
								<button
									type="button"
									onClick={handleGitHubAuth}
									disabled={isAuthenticating}
									className="shrink-0 rounded-sm border border-[#646262] px-2.5 py-1 text-[12px] font-medium leading-4 text-[#201d1d] transition-colors hover:bg-[#f1eeee] disabled:cursor-not-allowed disabled:opacity-55"
								>
									{isAuthenticating ? "Connecting" : "Connect"}
								</button>
							) : !githubConnected ? (
								<button
									type="button"
									onClick={handleOpenSettings}
									className="shrink-0 rounded-sm border border-[#646262] px-2.5 py-1 text-[12px] font-medium leading-4 text-[#201d1d] transition-colors hover:bg-[#f1eeee]"
								>
									Setup
								</button>
							) : undefined
						}
					/>
					<StatusRow label="AI Assistant" value={aiReady ? "Ready" : "Missing API key"} tone={aiReady ? "success" : "warning"} />
				</div>

				<div>
					<Button onClick={handleManualSync} disabled={!canSync}>
						{isSyncing && <Spinner />}
						Push Current Solution
					</Button>
					<p className="mt-1.5 text-[12px] leading-4 text-[#646262]">{syncHint}</p>
				</div>

				<ToggleRow
					label="Show Company Tags"
					description="Display company data on problem pages."
					checked={config.extension.enableCompanyTags}
					onChange={handleToggleTags}
				/>

				{message && <InlineMessage tone={message.tone}>{message.text}</InlineMessage>}
			</section>

			<footer className="shrink-0 border-t border-[rgba(15,0,0,0.12)] p-4">
				<Button variant="secondary" onClick={handleOpenSettings}>
					Open Full Settings
				</Button>
			</footer>
		</main>
	);
}
