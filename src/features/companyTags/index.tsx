// src/features/companyTags/index.tsx
import { QuestionResponse } from '@/src/schema/backendClient.schema';
import { ProblemTagsElementModifier } from './ProblemTagsModifier';
import { messageRuntime } from 'webext-msg';
export const include = (): boolean => {
	const path = window.location.pathname;
	return /^\/problems\/[^/]+(?:\/|\/description\/?)?$/.test(path);
};

export const init = async (): Promise<void> => {
	console.log('[LC Analyzer] 🚀 Initializing Company Tags...');

	const modifier = new ProblemTagsElementModifier();
	modifier.addTagButtonOnClickListener(async (container: HTMLElement) => {
		const slug = window.location.pathname.split('/')[2];
		container.innerHTML = `<span style="color: gray; font-size: 12px;">Fetching companies...</span>`;
		try {
			const response = (await messageRuntime({
				GET_COMPANY_DATA: { slug }
			})) as any;

			// Yahan type cast kar diya taaki VS Code auto-complete de
			const data = (response?.data || response) as QuestionResponse;
			container.innerHTML = '';

			// Agar DB me question nahi mila
			if (!data || !data.companies) {
				container.innerHTML = `<span style="color: var(--text-secondary); font-size: 12px;">No company data found.</span>`;
				return;
			}

			const flexBox = document.createElement('div');
			flexBox.style.display = 'flex';
			flexBox.style.flexWrap = 'wrap';
			flexBox.style.gap = '8px';

			// FIX: Iterating over data.companies
			Object.keys(data.companies).forEach(companyName => {
				const tag = document.createElement('div');
				tag.style.padding = '4px 12px';
				tag.style.borderRadius = '9999px';
				tag.style.fontSize = '12px';
				tag.style.backgroundColor = 'var(--fill-secondary, #282828)';
				tag.style.color = 'var(--text-secondary, #a8a8a8)';
				tag.style.cursor = 'default';
				tag.innerText = companyName;

				flexBox.appendChild(tag);
			});

			container.appendChild(flexBox);

		} catch (error) {
			console.error("[LC Analyzer] API Error:", error);
			container.innerHTML = `<span style="color: red; font-size: 12px;">Failed to load data.</span>`;
		}
	});

	await modifier.modifyCompaniesTagButton();
};
