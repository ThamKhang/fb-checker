chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ windowId: tab.windowId });
});

// Passive capture: intercept Graph API requests and store any page tokens found in URLs
chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        try {
            const url = new URL(details.url);
            const token = url.searchParams.get('access_token');
            // Page tokens are longer than user tokens (typically 150+ chars)
            if (!token || !token.startsWith('EAAB') || token.length < 150) return;

            chrome.storage.local.get('capturedPageTokens', (data) => {
                const existing = data.capturedPageTokens || {};

                // Try to extract page ID from path like /123456789/posts or /me/...
                const pathMatch = details.url.match(/graph\.facebook\.com\/v\d+\.\d+\/(\d{10,})\//);
                if (pathMatch) {
                    existing[pathMatch[1]] = token;
                }
                // Always keep the latest long token as fallback
                existing['_latest'] = token;

                chrome.storage.local.set({ capturedPageTokens: existing });
            });
        } catch (_) {}
    },
    { urls: ['https://graph.facebook.com/*'] },
    ['requestHeaders']
);
