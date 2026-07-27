import React from "react";

const controlBase =
	"rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] text-[#201d1d] outline-none transition-colors placeholder:text-[#9a9898] focus:border-[#201d1d] focus:bg-[#fdfcfc]";

export const Label = ({
	children,
	className = "",
	...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
	<label
		className={`mb-1.5 block text-[13px] font-medium leading-5 text-[#201d1d] ${className}`}
		{...props}
	>
		{children}
	</label>
);

export const Input = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
	<input
		className={`w-full px-3 py-2 text-[13px] leading-5 ${controlBase} ${className}`}
		{...props}
	/>
);

export const Select = ({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
	<select
		className={`w-full cursor-pointer px-3 py-2 text-[13px] leading-5 ${controlBase} ${className}`}
		{...props}
	/>
);

export function Spinner() {
	return <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full border border-[#9a9898] border-t-[#201d1d] animate-spin" />;
}

export const Button = ({
	children,
	variant = "primary",
	className = "",
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) => {
	const baseStyle =
		"inline-flex w-full items-center justify-center gap-2 rounded-sm border px-4 py-2 text-[13px] font-medium leading-5 transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-55";
	const variants = {
		primary: "border-transparent bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c]",
		secondary: "border-[#646262] bg-transparent text-[#201d1d] hover:bg-[#f1eeee]",
		danger: "border-[#ff3b30] bg-transparent text-[#ff3b30] hover:bg-[#ff3b30]/10",
	};
	return (
		<button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
			{children}
		</button>
	);
};

export function StatusDot({ tone }: { tone: "success" | "danger" | "warning" }) {
	const toneClass = {
		success: "bg-[#30d158]",
		danger: "bg-[#ff3b30]",
		warning: "bg-[#b26a00]",
	}[tone];

	return <span className={`h-2 w-2 shrink-0 rounded-full ${toneClass}`} />;
}

export function StatusRow({
	label,
	value,
	tone,
	action
}: {
	label: string;
	value: React.ReactNode;
	tone: "success" | "danger" | "warning";
	action?: React.ReactNode;
}) {
	return (
		<div className="flex items-center justify-between gap-3 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] px-3 py-2.5">
			<div className="min-w-0">
				<p className="text-[12px] leading-4 text-[#646262]">{label}</p>
				<div className="mt-1 flex min-w-0 items-center gap-2 text-[13px] font-medium leading-5 text-[#201d1d]">
					<StatusDot tone={tone} />
					<span className="truncate">{value}</span>
				</div>
			</div>
			{action}
		</div>
	);
}

export function ToggleRow({
	label,
	description,
	checked,
	onChange,
	disabled = false
}: {
	label: string;
	description?: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
}) {
	return (
		<label className={`flex items-center justify-between gap-4 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] px-3 py-2.5 ${disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer"}`}>
			<span className="min-w-0">
				<span className="block text-[13px] font-medium leading-5 text-[#201d1d]">{label}</span>
				{description && <span className="mt-0.5 block text-[12px] leading-4 text-[#646262]">{description}</span>}
			</span>
			<span className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-[rgba(15,0,0,0.12)] bg-[#f1eeee] transition-colors has-[:checked]:bg-[#201d1d]">
				<input
					type="checkbox"
					checked={checked}
					disabled={disabled}
					onChange={(event) => onChange(event.target.checked)}
					className="peer sr-only"
				/>
				<span className="ml-0.5 h-4 w-4 rounded-full bg-[#9a9898] transition-transform peer-checked:translate-x-4 peer-checked:bg-[#fdfcfc]" />
			</span>
		</label>
	);
}

export function InlineMessage({ tone = "muted", children }: { tone?: "muted" | "success" | "error"; children: React.ReactNode }) {
	const toneClass = {
		muted: "text-[#646262]",
		success: "text-[#1f8f3a]",
		error: "text-[#ff3b30]",
	}[tone];

	return <p className={`text-[12px] leading-4 ${toneClass}`}>{children}</p>;
}
