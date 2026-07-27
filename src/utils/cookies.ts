/**
 * Utility to get a cookie value from the browser.
 * Note: The chrome.cookies API is only available in Background Service Workers and Extension Pages (Popup/Options).
 * It cannot be used directly inside Content Scripts.
 */
export const getCookie = async (url: string, name: string): Promise<chrome.cookies.Cookie | null> => {
  try {
    const cookie = await chrome.cookies.get({ url, name });
    return cookie || null;
  } catch (error) {
    console.error(`[Cookie Helper] Failed to get cookie "${name}" for "${url}":`, error);
    return null;
  }
};
