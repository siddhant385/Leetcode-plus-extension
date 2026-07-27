import React, { useState } from 'react';
import { messageRuntime } from 'webext-msg';

interface GitHubButtonProps {
    dashboardTarget: Element; // unused, kept for consistency with aiAnalyze pattern
}

export function GitHubButton({ dashboardTarget }: GitHubButtonProps) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSync = async () => {
        if (status === 'loading') return;

        const match = window.location.href.match(/\/submissions\/(\d+)/);
        const submissionId = match ? match[1] : null;

        if (!submissionId) {
            setStatus('error');
            setErrorMsg('ID not found');
            setTimeout(() => setStatus('idle'), 5000);
            return;
        }

        setStatus('loading');
        try {
            const result = (await messageRuntime({ PUSH_TO_GITHUB: { submissionId } })) as any;
            if (result && result.success) {
                setStatus('success');
                setTimeout(() => setStatus('idle'), 3000);
            } else {
                setStatus('error');
                setErrorMsg(result?.error || 'Failed');
                setTimeout(() => setStatus('idle'), 5000);
            }
        } catch (error: any) {
            setStatus('error');
            setErrorMsg(error.message || 'Failed');
            setTimeout(() => setStatus('idle'), 5000);
        }
    };

    let buttonText = 'Sync to GitHub';
    let borderColor = '#238636'; // success/idle green
    let icon = (
        <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
        </svg>
    );
    let bgClass = '';

    if (status === 'loading') {
        buttonText = 'Syncing...';
        borderColor = '#58a6ff'; // loading blue
        icon = <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>;
    } else if (status === 'success') {
        buttonText = 'Synced!';
        bgClass = 'lc-gh-bg-flash-success';
    } else if (status === 'error') {
        buttonText = errorMsg || 'Failed';
        borderColor = '#f85149'; // error red
        bgClass = 'lc-gh-bg-flash-error';
        icon = <span>✗</span>;
    }

    return (
        <>
            <style>{`
                .lc-gh-btn-wrapper {
                    display: inline-flex;
                    align-items: center;
                }
                .lc-gh-sync-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 10px;
                    border-radius: 6px;
                    background-color: rgba(255, 255, 255, 0.05);
                    color: #c9d1d9;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s ease;
                    border-left: 3px solid ${borderColor};
                }
                .lc-gh-sync-btn:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                }
                .lc-gh-sync-btn:disabled {
                    cursor: not-allowed;
                    opacity: 0.7;
                }
                @keyframes lcGhSuccessBg {
                    0% { background-color: rgba(35, 134, 54, 0.4); }
                    100% { background-color: rgba(255, 255, 255, 0.05); }
                }
                @keyframes lcGhErrorBg {
                    0% { background-color: rgba(248, 81, 73, 0.4); }
                    100% { background-color: rgba(255, 255, 255, 0.05); }
                }
                .lc-gh-bg-flash-success {
                    animation: lcGhSuccessBg 1.5s ease-out;
                }
                .lc-gh-bg-flash-error {
                    animation: lcGhErrorBg 1.5s ease-out;
                }
                .lc-gh-icon {
                    display: flex;
                    align-items: center;
                }
            `}</style>
            <div className="lc-gh-btn-wrapper">
                <button
                    className={`lc-gh-sync-btn ${bgClass}`}
                    onClick={handleSync}
                    disabled={status === 'loading'}
                >
                    <div className="lc-gh-icon">{icon}</div>
                    <span className="lc-gh-btn-text">{buttonText}</span>
                </button>
            </div>
        </>
    );
}
