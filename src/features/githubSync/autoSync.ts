import elementReady from 'element-ready';
import { messageRuntime } from 'webext-msg';
import { appConfigManager } from '../../utils/optionsStorage';
import { showToast } from './toast';

let isAutoSyncSetup = false;

// Polling approach is much more robust against SPA race conditions than event listeners
function waitForSubmissionUrl(oldUrl: string): Promise<string | null> {
    return new Promise((resolve) => {
        let attempts = 0;
        
        const interval = setInterval(() => {
            attempts++;
            const currentUrl = window.location.href;
            
            // Wait for the URL to change to a submission URL
            if (currentUrl !== oldUrl && currentUrl.includes('/submissions/')) {
                const match = currentUrl.match(/\/submissions\/(\d+)/);
                if (match && match[1]) {
                    clearInterval(interval);
                    resolve(match[1]);
                    return;
                }
            }
            
            // Timeout after 30 seconds (60 attempts * 500ms)
            if (attempts >= 60) {
                clearInterval(interval);
                resolve(null);
            }
        }, 500);
    });
}

async function waitForAccepted(): Promise<boolean> {
    
    return new Promise((resolve) => {
        let attempts = 0;
        const interval = setInterval(async () => {
            attempts++;
            const resultElement = document.querySelector('[data-e2e-locator="submission-result"]');
            
            if (resultElement) {
                const text = resultElement.textContent?.toLowerCase() || '';
                
                if (text.includes('accepted')) {
                    clearInterval(interval);
                    resolve(true);
                    return;
                }
                
                if (
                    text.includes('wrong answer') || 
                    text.includes('time limit exceeded') || 
                    text.includes('runtime error') || 
                    text.includes('compile error') ||
                    text.includes('memory limit exceeded')
                ) {
                    clearInterval(interval);
                    resolve(false);
                    return;
                }
            }

            // Timeout after 30 seconds
            if (attempts >= 60) {
                clearInterval(interval);
                resolve(false);
            }
        }, 500);
    });
}

async function handlePostSubmit(clickUrl: string) {
    
    const submissionId = await waitForSubmissionUrl(clickUrl);
    if (!submissionId) return;

    const isAccepted = await waitForAccepted();
    if (!isAccepted) {
        return;
    }

    const config = await appConfigManager.load();

    if (config.github.autoSync && config.github.enableGitHubSync && config.github.phase === 'connected') {
        const toastId = showToast('Syncing to GitHub...', 'loading');
        try {
            const result = (await messageRuntime({ PUSH_TO_GITHUB: { submissionId } })) as any;
            if (result && result.success) {
                showToast('Pushed to GitHub!', 'success', toastId);
            } else {
                showToast(result?.error || 'Failed to sync', 'error', toastId);
            }
        } catch (error: any) {
            console.error('[GitHub Sync] Push error:', error);
            showToast(error.message || 'Failed to sync', 'error', toastId);
        }
    }
}

export function setupAutoSync() {
    if (isAutoSyncSetup) {
        return;
    }
    
    isAutoSyncSetup = true;

    // Use capture phase (true) to ensure we intercept the click before React can stop propagation
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        
        // 1. Check for LeetCode's exact data attribute on the clicked element or its parents
        const submitBtnAttr = target.closest('[data-e2e-locator="console-submit-button"]');
        
        // 2. Fallback: check if they clicked a button containing "Submit"
        const button = target.closest('button');
        const isSubmitText = button && button.textContent?.trim().toLowerCase() === 'submit';
                         
        if (submitBtnAttr || isSubmitText) {
            // Pass the current URL so we know when it changes
            handlePostSubmit(window.location.href);
        }
    }, { capture: true });
}

export function teardownAutoSync() {
    // Intentionally empty. The global click listener persists across SPA navigations.
}
