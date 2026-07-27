export function showToast(message: string, type: 'loading' | 'success' | 'error', existingId?: string): string {
    const containerId = 'lc-github-toast-container';
    let container = document.getElementById(containerId);

    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        Object.assign(container.style, {
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: '10000',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        });
        document.body.appendChild(container);
    }

    const toastId = existingId || `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let toast = document.getElementById(toastId);

    if (!toast) {
        toast = document.createElement('div');
        toast.id = toastId;
        container.appendChild(toast);
    }

    let borderColor = '#58a6ff'; // loading (blue)
    let icon = '⟳';
    if (type === 'success') {
        borderColor = '#238636'; // green
        icon = '✓';
    } else if (type === 'error') {
        borderColor = '#f85149'; // red
        icon = '✗';
    }

    Object.assign(toast.style, {
        backgroundColor: '#161b22',
        borderLeft: `4px solid ${borderColor}`,
        color: '#c9d1d9',
        padding: '12px 16px',
        borderRadius: '8px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        transition: 'opacity 0.3s ease-in-out',
        opacity: '0',
    });

    const iconElement = type === 'loading'
        ? `<span style="display: inline-block; animation: spin 1s linear infinite;">${icon}</span>`
        : `<span>${icon}</span>`;

    // Add keyframes if not exists
    if (!document.getElementById('lc-github-toast-keyframes')) {
        const style = document.createElement('style');
        style.id = 'lc-github-toast-keyframes';
        style.textContent = `
            @keyframes spin { 100% { transform: rotate(360deg); } }
        `;
        document.head.appendChild(style);
    }

    toast.innerHTML = `${iconElement} <span>${message}</span>`;

    // Trigger fade in
    requestAnimationFrame(() => {
        if (toast) toast.style.opacity = '1';
    });

    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            if (toast) {
                toast.style.opacity = '0';
                setTimeout(() => toast?.remove(), 300);
            }
        }, 3000);
    }

    return toastId;
}
