(function () {
    "use strict";

    const SESSION_KEY =
        "roarSession";

    const SIZES = {
        small: "15px",
        medium: "16px",
        large: "19px",
    };

    const DEFAULTS = {
        theme: "light",
        fontSize: "medium",
        highContrast: false,
        animationsEnabled: true,
        reducedStimuli: false,
    };

    function readJson(
        key,
        fallback = null,
    ) {
        try {
            const value =
                localStorage.getItem(key);

            return value
                ? JSON.parse(value)
                : fallback;
        } catch {
            return fallback;
        }
    }

    function getPreferenceScope() {
        const session =
            readJson(
                SESSION_KEY,
                null,
            );

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

    function normalizePreferences(value) {
        const source =
            value &&
                typeof value === "object"
                ? value
                : {};

        return {
            theme:
                source.theme === "dark"
                    ? "dark"
                    : DEFAULTS.theme,

            fontSize:
                Object.hasOwn(
                    SIZES,
                    source.fontSize,
                )
                    ? source.fontSize
                    : DEFAULTS.fontSize,

            highContrast:
                Boolean(
                    source.highContrast ??
                    DEFAULTS.highContrast,
                ),

            animationsEnabled:
                source.animationsEnabled !==
                false,

            reducedStimuli:
                Boolean(
                    source.reducedStimuli ??
                    DEFAULTS.reducedStimuli,
                ),
        };
    }

    function getPreferences() {
        return normalizePreferences(
            readJson(
                getPreferencesKey(),
                {},
            ),
        );
    }

    function savePreferences(
        preferences,
    ) {
        localStorage.setItem(
            getPreferencesKey(),
            JSON.stringify(
                normalizePreferences(
                    preferences,
                ),
            ),
        );
    }

    function installStyles() {
        if (
            document.getElementById(
                "roar-global-preferences",
            )
        ) {
            return;
        }

        const style =
            document.createElement(
                "style",
            );

        style.id =
            "roar-global-preferences";

        style.textContent = `
            html.roar-high-contrast,
            html.high-contrast {
                filter: contrast(1.18);
            }

            html.roar-reduced-motion,
            html.roar-reduced-motion *,
            html.roar-reduced-motion *::before,
            html.roar-reduced-motion *::after,
            html.reduced-motion,
            html.reduced-motion *,
            html.reduced-motion *::before,
            html.reduced-motion *::after {
                animation: none !important;
                animation-duration: 0s !important;
                animation-delay: 0s !important;
                animation-iteration-count: 1 !important;
                transition: none !important;
                transition-duration: 0s !important;
                transition-delay: 0s !important;
                scroll-behavior: auto !important;
            }

            html.roar-reduced-stimuli .card,
            html.reduced-stimuli .card,
            html.roar-reduced-stimuli .stat-card,
            html.reduced-stimuli .stat-card,
            html.roar-reduced-stimuli .profile-hero,
            html.reduced-stimuli .profile-hero {
                box-shadow: none !important;
            }

            html.roar-reduced-stimuli .fade-in,
            html.reduced-stimuli .fade-in {
                animation: none !important;
            }
        `;

        document.head.append(style);
    }

    function apply(
        preferences = getPreferences(),
    ) {
        installStyles();

        const normalized =
            normalizePreferences(
                preferences,
            );

        const root =
            document.documentElement;

        const dark =
            normalized.theme === "dark";

        if (dark) {
            root.setAttribute(
                "data-theme",
                "dark",
            );
        } else {
            root.removeAttribute(
                "data-theme",
            );
        }

        root.classList.toggle(
            "dark-theme",
            dark,
        );

        root.classList.toggle(
            "roar-high-contrast",
            normalized.highContrast,
        );

        root.classList.toggle(
            "high-contrast",
            normalized.highContrast,
        );

        root.classList.toggle(
            "roar-reduced-motion",
            !normalized.animationsEnabled,
        );

        root.classList.toggle(
            "reduced-motion",
            !normalized.animationsEnabled,
        );

        root.classList.toggle(
            "roar-reduced-stimuli",
            normalized.reducedStimuli,
        );

        root.classList.toggle(
            "reduced-stimuli",
            normalized.reducedStimuli,
        );

        root.dataset.fontSize =
            normalized.fontSize;

        root.style.fontSize =
            SIZES[normalized.fontSize] ??
            SIZES.medium;

        try {
            const collapsed =
                localStorage.getItem(
                    "sidebarCollapsed",
                ) === "true";

            root.classList.toggle(
                "sidebar-collapsed",
                collapsed,
            );
        } catch {
            // O layout continua mesmo sem localStorage.
        }

        return normalized;
    }

    function set(theme) {
        const normalizedTheme =
            theme === "dark"
                ? "dark"
                : "light";

        const preferences = {
            ...getPreferences(),
            theme: normalizedTheme,
        };

        savePreferences(
            preferences,
        );

        apply(
            preferences,
        );

        window.dispatchEvent(
            new CustomEvent(
                "roar-theme-changed",
                {
                    detail: {
                        theme:
                            normalizedTheme,
                    },
                },
            ),
        );

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
    }

    function refresh() {
        return apply(
            getPreferences(),
        );
    }

    /*
     * Aplica imediatamente para evitar que a
     * página apareça clara antes do tema escuro.
     */
    apply();

    document.addEventListener(
        "DOMContentLoaded",
        refresh,
    );

    window.addEventListener(
        "storage",
        (event) => {
            if (
                event.key ===
                getPreferencesKey()
            ) {
                refresh();
            }
        },
    );

    window.addEventListener(
        "roar-preferences-changed",
        refresh,
    );

    window.ROARTheme =
        Object.freeze({
            get() {
                return getPreferences()
                    .theme;
            },

            set,

            apply: refresh,

            applyPreferences:
                apply,

            toggle() {
                const next =
                    getPreferences()
                        .theme === "dark"
                        ? "light"
                        : "dark";

                set(next);

                return next;
            },
        });
})();