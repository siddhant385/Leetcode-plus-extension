import React, { useEffect, useRef, useState } from "react";
import { messageRuntime } from "webext-msg";
import { useConfig } from "../hooks/useStorage.hook";
import { Config } from "../schema/options.schema";
import { PROVIDERS } from "../utils/constants";

type StatusMsg = { type: "success" | "error" | "saving"; text: string } | null;
type RepoAction = "new" | "link";

type GitHubAuthResponse = {
	success: boolean;
	username?: string;
	error?: string;
};

type GitHubRepoResponse = {
	success: boolean;
	repo?: {
		full_name?: string;
		private?: boolean;
	};
	error?: string;
};

const pageFont = "font-['Berkeley_Mono','Inter',system-ui,sans-serif]";

const inputClassName =
	"w-full rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] px-3.5 py-2.5 text-[15px] leading-6 text-[#201d1d] outline-none transition-colors placeholder:text-[#9a9898] focus:border-[#201d1d] focus:bg-[#fdfcfc]";

const selectClassName = `${inputClassName} appearance-none`;

function Spinner() {
	return <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full border border-[#9a9898] border-t-[#201d1d] animate-spin" />;
}

function Button({
	children,
	onClick,
	variant = "primary",
	loading = false,
	disabled = false,
	className = ""
}: {
	children: React.ReactNode;
	onClick?: () => void;
	variant?: "primary" | "secondary" | "danger";
	loading?: boolean;
	disabled?: boolean;
	className?: string;
}) {
	const variantClass = {
		primary: "border-transparent bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c]",
		secondary: "border-[#646262] bg-transparent text-[#201d1d] hover:bg-[#f1eeee]",
		danger: "border-[#ff3b30] bg-transparent text-[#ff3b30] hover:bg-[#ff3b30]/10"
	}[variant];

	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled || loading}
			className={`inline-flex items-center justify-center gap-2 rounded-sm border px-6 py-1.5 text-sm font-medium leading-7 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variantClass} ${className}`}
		>
			{loading && <Spinner />}
			{children}
		</button>
	);
}

function Section({
	title,
	description,
	children
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
}) {
	return (
		<section className="border-b border-[rgba(15,0,0,0.12)] pb-24">
			<div className="mb-8">
				<h2 className="text-lg font-semibold leading-7 text-[#201d1d]">{title}</h2>
				{description && <p className="mt-2 text-[15px] leading-6 text-[#646262]">{description}</p>}
			</div>
			<div className="space-y-6">{children}</div>
		</section>
	);
}

function Field({
	label,
	help,
	children
}: {
	label: string;
	help?: string;
	children: React.ReactNode;
}) {
	return (
		<div>
			<label className="block text-[15px] font-medium leading-6 text-[#201d1d]">{label}</label>
			{help && <p className="mb-2 mt-1 text-[13px] leading-5 text-[#646262]">{help}</p>}
			{children}
		</div>
	);
}

function Toggle({
	label,
	description,
	checked,
	onChange
}: {
	label: string;
	description?: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}) {
	return (
		<label className="flex cursor-pointer items-center justify-between gap-5 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] px-4 py-3">
			<span>
				<span className="block text-[15px] font-medium leading-6 text-[#201d1d]">{label}</span>
				{description && <span className="mt-1 block text-[13px] leading-5 text-[#646262]">{description}</span>}
			</span>
			<span className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-[rgba(15,0,0,0.12)] bg-[#f1eeee] transition-colors has-[:checked]:bg-[#201d1d]">
				<input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
				<span className="ml-0.5 h-5 w-5 rounded-full bg-[#9a9898] transition-transform peer-checked:translate-x-5 peer-checked:bg-[#fdfcfc]" />
			</span>
		</label>
	);
}

function StatusBadge({ username }: { username: string }) {
	return (
		<span className="inline-flex items-center gap-2 rounded-full border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] px-3 py-1 text-[13px] leading-5 text-[#201d1d]">
			<span className="h-2 w-2 rounded-full bg-[#30d158]" />
			@{username}
		</span>
	);
}

function AutoSaveIndicator({ statusMsg }: { statusMsg: StatusMsg }) {
	if (statusMsg?.type === "error") {
		return <p className="text-center text-[13px] leading-5 text-[#ff3b30]">{statusMsg.text}</p>;
	}

	if (statusMsg?.type === "saving") {
		return (
			<p className="flex items-center justify-center gap-2 text-[13px] leading-5 text-[#646262]">
				<Spinner />
				{statusMsg.text}
			</p>
		);
	}

	return <p className="text-center text-[13px] leading-5 text-[#646262]">✓ Changes are saved automatically.</p>;
}

function LoadingScreen() {
	return (
		<div className={`flex min-h-screen items-center justify-center bg-[#fdfcfc] p-6 text-[#201d1d] ${pageFont}`}>
			<div className="flex items-center gap-3 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] px-5 py-4 text-[15px] leading-6">
				<Spinner />
				Loading preferences...
			</div>
		</div>
	);
}

export function WelcomeApp() {
	const { config, updateConfig, isLoading } = useConfig();
	const [formData, setFormData] = useState<Config>(config);
	const [statusMsg, setStatusMsg] = useState<StatusMsg>(null);
	const [isAuthenticating, setIsAuthenticating] = useState(false);
	const [isRepoSettingUp, setIsRepoSettingUp] = useState(false);
	const [showApiKey, setShowApiKey] = useState(false);
	const [repoAction, setRepoAction] = useState<RepoAction>("new");
	const hasHydrated = useRef(false);
	const currentPhase = formData.github?.phase || "not_auth";

	useEffect(() => {
		if (!isLoading) {
			setFormData(config);
		}
	}, [isLoading, config]);

	useEffect(() => {
		if (isLoading) return;

		if (!hasHydrated.current) {
			hasHydrated.current = true;
			return;
		}

		setStatusMsg({ type: "saving", text: "Saving changes..." });

		const timeoutId = window.setTimeout(async () => {
			try {
				await updateConfig(formData);
				setStatusMsg({ type: "success", text: "Changes saved." });
				window.setTimeout(() => setStatusMsg(null), 1600);
			} catch (error) {
				setStatusMsg({ type: "error", text: "Could not save changes automatically." });
			}
		}, 700);

		return () => window.clearTimeout(timeoutId);
	}, [formData, isLoading, updateConfig]);

	const handleChange = <Category extends keyof Config, Name extends keyof Config[Category]>(
		category: Category,
		name: Name,
		value: Config[Category][Name]
	) => {
		setFormData((prev) => ({
			...prev,
			[category]: {
				...prev[category],
				[name]: value
			}
		}));
	};

	const handleAuth = async () => {
		try {
			setIsAuthenticating(true);
			setStatusMsg(null);
			const response = (await messageRuntime({ START_GITHUB_AUTH: true })) as GitHubAuthResponse;

			if (response.success && response.username) {
				setFormData((prev) => ({
					...prev,
					github: {
						...prev.github,
						phase: "auth_complete",
						githubUserName: response.username || ""
					}
				}));
			} else {
				setStatusMsg({ type: "error", text: response.error || "Authentication failed." });
			}
		} catch (error) {
			console.error("Error during GitHub auth:", error);
			setStatusMsg({ type: "error", text: "Failed to communicate with background script during authentication." });
		} finally {
			setIsAuthenticating(false);
		}
	};

	const handleRepoSetup = async () => {
		try {
			setIsRepoSettingUp(true);
			setStatusMsg(null);
			const repoName = formData.github.githubRepoName || "LeetCode-Solutions";

			const response = (await messageRuntime({
				SETUP_GITHUB_REPO: {
					action: repoAction,
					repoName,
					isPrivate: formData.github.githubRepoPrivate
				}
			})) as GitHubRepoResponse;

			if (response.success) {
				setFormData((prev) => ({
					...prev,
					github: {
						...prev.github,
						phase: "connected",
						enableGitHubSync: true,
						autoSync: true,
						githubRepoName: response.repo?.full_name || prev.github.githubRepoName || "LeetCode-Solutions",
						githubRepoPrivate: response.repo?.private ?? prev.github.githubRepoPrivate
					}
				}));
			} else {
				setStatusMsg({ type: "error", text: response.error || "Failed to setup repository." });
			}
		} catch (error) {
			console.error("Error setting up repo:", error);
			setStatusMsg({ type: "error", text: "Failed to communicate with background script." });
		} finally {
			setIsRepoSettingUp(false);
		}
	};

	const handleUnlink = () => {
		setFormData((prev) => ({
			...prev,
			github: {
				...prev.github,
				phase: "not_auth",
				githubUserName: "",
				githubRepoName: "",
				githubToken: "",
				enableGitHubSync: false,
				autoSync: false
			}
		}));
	};

	if (isLoading) {
		return <LoadingScreen />;
	}

	return (
		<div className={`min-h-screen bg-[#fdfcfc] px-6 py-16 text-[#424245] sm:py-24 ${pageFont}`}>
			<main className="mx-auto w-full max-w-[650px]">
				<header className="mb-24">
					<h1 className="text-[32px] font-bold leading-[1.5] tracking-[-0.01em] text-[#201d1d]">LeetCode+ Settings</h1>
					<p className="mt-3 text-[15px] leading-6 text-[#646262]">Manage your GitHub connection, AI models, and extension behavior.</p>
				</header>

				<div className="space-y-24">
					<Section title="GitHub Integration" description="Sync accepted submissions to a repository you control.">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<p className="text-[15px] font-medium leading-6 text-[#201d1d]">Connection status</p>
								<p className="mt-1 text-[13px] leading-5 text-[#646262]">
									{currentPhase === "not_auth" ? "Connect GitHub before choosing a repository." : "GitHub is ready for repository setup."}
								</p>
							</div>
							{currentPhase === "not_auth" ? (
								<Button onClick={handleAuth} loading={isAuthenticating}>Connect GitHub</Button>
							) : (
								<StatusBadge username={formData.github.githubUserName} />
							)}
						</div>

						{currentPhase === "auth_complete" && (
							<div className="space-y-5">
								<div className="grid grid-cols-2 gap-3">
									<Button variant={repoAction === "link" ? "secondary" : "primary"} onClick={() => setRepoAction("new")} className="w-full">
										New Repo
									</Button>
									<Button variant={repoAction === "link" ? "primary" : "secondary"} onClick={() => setRepoAction("link")} className="w-full">
										Existing Repo
									</Button>
								</div>

								<Field label="Target Repository" help="Select where to sync your solutions.">
									<input
										type="text"
										name="githubRepoName"
										value={formData.github.githubRepoName}
										onChange={(event) => handleChange("github", "githubRepoName", event.target.value)}
										placeholder={repoAction === "new" ? "LeetCode-Solutions" : "username/repo"}
										className={inputClassName}
									/>
								</Field>

								{repoAction === "new" && (
									<Toggle
										label="Private repository"
										description="Only you and invited collaborators can access it."
										checked={formData.github.githubRepoPrivate}
										onChange={(checked) => handleChange("github", "githubRepoPrivate", checked)}
									/>
								)}

								<div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
									<Button variant="secondary" onClick={handleUnlink}>Cancel</Button>
									<Button onClick={handleRepoSetup} loading={isRepoSettingUp}>
										{repoAction === "new" ? "Create Repository" : "Link Repository"}
									</Button>
								</div>
							</div>
						)}

						{(currentPhase === "repo_setup" || currentPhase === "connected") && (
							<div className="space-y-5">
								<div className="rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-4">
									<p className="text-[15px] font-medium leading-6 text-[#201d1d]">{formData.github.githubRepoName || "No repository selected"}</p>
									<p className="mt-1 text-[13px] leading-5 text-[#646262]">
										{formData.github.githubRepoPrivate ? "Private repository" : "Public repository"}
									</p>
								</div>
								<Toggle
									label="Enable GitHub sync"
									checked={formData.github.enableGitHubSync}
									onChange={(checked) => handleChange("github", "enableGitHubSync", checked)}
								/>
								<Toggle
									label="Auto-sync solutions on submission"
									checked={formData.github.autoSync}
									onChange={(checked) => handleChange("github", "autoSync", checked)}
								/>
								<Button variant="danger" onClick={handleUnlink}>Unlink GitHub</Button>
							</div>
						)}
					</Section>

					<Section title="AI Assistant Configuration" description="Choose the model used for submission analysis.">
						<Field label="Model API Key">
							<div className="relative">
								<input
									type={showApiKey ? "text" : "password"}
									name="userAPIKey"
									value={formData.llm.userAPIKey || ""}
									onChange={(event) => handleChange("llm", "userAPIKey", event.target.value)}
									placeholder="Enter your API key"
									className={`${inputClassName} pr-20`}
								/>
								<button
									type="button"
									onClick={() => setShowApiKey((value) => !value)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] leading-5 text-[#646262] hover:text-[#201d1d]"
								>
									{showApiKey ? "Hide" : "Show"}
								</button>
							</div>
						</Field>

						<div className="grid gap-5 sm:grid-cols-2">
							<Field label="Provider">
								<select
									name="provider"
									value={formData.llm.provider || ""}
									onChange={(event) => handleChange("llm", "provider", event.target.value as Config["llm"]["provider"])}
									className={selectClassName}
								>
									{PROVIDERS.map((provider) => (
										<option key={provider} value={provider}>
											{provider.charAt(0).toUpperCase() + provider.slice(1)}
										</option>
									))}
								</select>
							</Field>

							<Field label="Model ID">
								<input
									type="text"
									name="modelId"
									value={formData.llm.modelId || ""}
									onChange={(event) => handleChange("llm", "modelId", event.target.value)}
									placeholder="gemini-2.5-flash"
									className={inputClassName}
								/>
							</Field>
						</div>

						<Field label="Base URL" help="Optional. Leave empty to use the provider default.">
							<input
								type="text"
								name="baseUrl"
								value={formData.llm.baseUrl || ""}
								onChange={(event) => handleChange("llm", "baseUrl", event.target.value)}
								placeholder="Default"
								className={inputClassName}
							/>
						</Field>
					</Section>

					<Section title="Company Tags">
						<Toggle
							label="Enable company tags"
							description="Automatically display top company tags on problem pages. No additional setup required."
							checked={formData.extension.enableCompanyTags}
							onChange={(checked) => handleChange("extension", "enableCompanyTags", checked)}
						/>
						<Toggle
							label="Enable live contest rating"
							description="Show live contest rating information where supported."
							checked={formData.extension.enableLiveContestRating}
							onChange={(checked) => handleChange("extension", "enableLiveContestRating", checked)}
						/>
					</Section>
				</div>

				<footer className="pt-12">
					<AutoSaveIndicator statusMsg={statusMsg} />
				</footer>
			</main>
		</div>
	);
}
