const SESSION_KEY = "roarSession";
const PREFERENCES_KEY = "roarPreferences";
const MOCK_PROGRESS_KEY = "roarMockModuleProgress";

function readJson(key, fallback = null) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

export const storage = Object.freeze({
    getSession: () => readJson(SESSION_KEY),
    setSession: (session) => writeJson(SESSION_KEY, session),
    clearSession: () => localStorage.removeItem(SESSION_KEY),
    getPreferences: () => readJson(PREFERENCES_KEY, {}),
    setPreferences: (preferences) => writeJson(PREFERENCES_KEY, preferences),
    getMockProgress: () => readJson(MOCK_PROGRESS_KEY, {}),
    setMockProgress: (progress) => writeJson(MOCK_PROGRESS_KEY, progress),
});
