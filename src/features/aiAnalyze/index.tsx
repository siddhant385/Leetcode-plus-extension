import React from 'react';
import { createRoot } from 'react-dom/client';
import elementReady from 'element-ready';
import { $ as select, elementExists } from 'select-dom';
import AIContainer from './AIContainer';

export function include(): boolean {
	return /\/problems\/[^/]+\/submissions\/\d+/.test(window.location.href);
}

export async function init() {
	const resultAnchor = await elementReady('[data-e2e-locator="submission-result"]', { stopOnDomReady: false });
	if (!resultAnchor) return;

	const mainHeader = resultAnchor.closest('.flex.w-full');
	const buttonContainer = mainHeader ? select('.flex.flex-none.gap-2', mainHeader as HTMLElement) : null;

	if (!mainHeader || !buttonContainer || elementExists('#lc-ai-btn-wrapper')) return;

	const btnWrapper = document.createElement('div');
	btnWrapper.id = 'lc-ai-btn-wrapper';
	buttonContainer.insertAdjacentElement('afterbegin', btnWrapper);

	const dashboardPanel = document.createElement('div');
	dashboardPanel.id = 'lc-ai-dashboard-panel';
	dashboardPanel.className = 'w-full mt-4';
	mainHeader.insertAdjacentElement('afterend', dashboardPanel);

	const root = createRoot(btnWrapper);
	root.render(<AIContainer dashboardTarget={dashboardPanel} />);
}
