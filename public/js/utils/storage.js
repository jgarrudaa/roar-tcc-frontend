const SESSION_KEY = "roarSession";
const MOCK_PROGRESS_KEY = "roarMockModuleProgress";

function readJson(key, fallback = null) {
    try {
        const value = localStorage.getItem(key);

        return value
            ? JSON.parse(value)
            : fallback;
    } catch {
        return fallback;
    }
}

function writeJson(key, value) {
    localStorage.setItem(
        key,
        JSON.stringify(value),
    );
}

function getPreferenceScope() {
    const session =
        readJson(SESSION_KEY, null);

    if (!session) {
        return "anonymous";
    }

    const role =
        String(
            session.role ??
            session.tipo ??
            "user",
        )
            .trim()
            .toLowerCase();

    const user =
        session.user ?? {};

    const identifier =
        user.id ??
        user.aluno_id ??
        user.professor_id ??
        session.aluno_id ??
        session.professor_id ??
        user.email ??
        "current";

    return `${role}:${String(identifier).toLowerCase()}`;
}

function getPreferencesKey() {
    return `roarPreferences:${getPreferenceScope()}`;
}

export const storage = Object.freeze({
    getSession() {
        return readJson(
            SESSION_KEY,
            null,
        );
    },

    setSession(session) {
        writeJson(
            SESSION_KEY,
            session,
        );
    },

    clearSession() {
        localStorage.removeItem(
            SESSION_KEY,
        );
    },

    getPreferences() {
        return readJson(
            getPreferencesKey(),
            {},
        );
    },

    setPreferences(preferences) {
        writeJson(
            getPreferencesKey(),
            preferences,
        );

        /*
         * Avisa os arquivos globais que as
         * preferências foram alteradas.
         */
        window.dispatchEvent(
            new CustomEvent(
                "roar-preferences-changed",
                {
                    detail: {
                        preferences,
                    },
                },
            ),
        );
    },

    getMockProgress() {
        return readJson(
            MOCK_PROGRESS_KEY,
            {},
        );
    },

    setMockProgress(progress) {
        writeJson(
            MOCK_PROGRESS_KEY,
            progress,
        );
    },
});