import React from 'react';
import { createRoot } from 'react-dom/client';
import elementReady from 'element-ready';
import { $, elementExists } from 'select-dom';
import { appConfigManager } from '../../utils/optionsStorage';
import { setupAutoSync } from './autoSync';
import { GitHubButton } from './GitHubButton';

export function include(): boolean {
    const path = window.location.pathname;
    const included = /^\/problems\/[^/]+/.test(path);
    return included;
}

async function renderManualButton(): Promise<void> {
    const config = await appConfigManager.load();
    if (config.github.phase !== 'connected' || !config.github.enableGitHubSync) {
        return;
    }

    const resultElement = await elementReady('[data-e2e-locator="submission-result"]', { stopOnDomReady: false });
    if (!resultElement) {
        return;
    }

    const mainHeader = resultElement.closest('.flex.w-full');
    if (!mainHeader) {
        return;
    }

    const buttonContainer = $('.flex.flex-none.gap-2', mainHeader);
    if (!buttonContainer) {
        return;
    }

    if (elementExists('#lc-gh-btn-wrapper')) {
        return;
    }

    const mountPoint = document.createElement('div');
    mountPoint.id = 'lc-gh-btn-wrapper';
    buttonContainer.insertAdjacentElement('afterbegin', mountPoint);

    const root = createRoot(mountPoint);
    root.render(<GitHubButton dashboardTarget={buttonContainer} />);
}

export async function init(): Promise<void> {
    setupAutoSync();

    const isSubmissionPage = /\/problems\/[^/]+\/submissions\/\d+/.test(window.location.href);
    if (isSubmissionPage) {
        await renderManualButton();
    }
}
