(function () {
    "use strict";
    const KEYS = { theme: "roarTheme", font: "roarFontSize", preferences: "roarPreferences" };
    const SIZES = { small: "15px", medium: "16px", large: "19px" };

    // Restaura o estado da sidebar no <html> antes do primeiro frame de pintura
    try {
        if (localStorage.getItem("sidebarCollapsed") === "true") {
            document.documentElement.classList.add("sidebar-collapsed");
        }
    } catch (e) {}

    function readJson(key) {
        try { return JSON.parse(localStorage.getItem(key) || "null"); }
        catch { return null; }
    }

    function getPreferences() {
        const stored = readJson(KEYS.preferences);
        const source = stored && typeof stored === "object" ? stored : {};
        const legacyTheme = localStorage.getItem(KEYS.theme);
        const legacyFont = localStorage.getItem(KEYS.font);
        return {
            theme: source.theme === "dark" || legacyTheme === "dark" ? "dark" : "light",
            fontSize: SIZES[source.fontSize] ? source.fontSize : SIZES[legacyFont] ? legacyFont : "medium",
            highContrast: Boolean(source.highContrast ?? false),
            animationsEnabled: Boolean(source.animationsEnabled ?? true),
            reducedStimuli: Boolean(source.reducedStimuli ?? false),
        };
    }

    function installStyles() {
        if (document.getElementById("roar-global-preferences")) return;
        const style = document.createElement("style");
        style.id = "roar-global-preferences";
        style.textContent = `
            html.roar-high-contrast, html.high-contrast { filter: contrast(1.18); }
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
            html.reduced-stimuli .profile-hero { box-shadow: none !important; }
            html.roar-reduced-stimuli .fade-in,
            html.reduced-stimuli .fade-in { animation: none !important; }
        `;
        document.head.append(style);
    }

    function apply(preferences = getPreferences()) {
        installStyles();
        const root = document.documentElement;
        const dark = preferences.theme === "dark";
        if (dark) root.setAttribute("data-theme", "dark");
        else root.removeAttribute("data-theme");
        root.classList.toggle("dark-theme", dark);
        root.classList.toggle("roar-high-contrast", preferences.highContrast);
        root.classList.toggle("high-contrast", preferences.highContrast);
        root.classList.toggle("roar-reduced-motion", !preferences.animationsEnabled);
        root.classList.toggle("reduced-motion", !preferences.animationsEnabled);
        root.classList.toggle("roar-reduced-stimuli", preferences.reducedStimuli);
        root.classList.toggle("reduced-stimuli", preferences.reducedStimuli);
        root.dataset.fontSize = preferences.fontSize;
        root.style.fontSize = SIZES[preferences.fontSize] || SIZES.medium;

        try {
            const isSidebarCollapsed = localStorage.getItem("sidebarCollapsed") === "true";
            root.classList.toggle("sidebar-collapsed", isSidebarCollapsed);
        } catch (e) {}

        return preferences;
    }

    function set(theme) {
        const normalized = theme === "dark" ? "dark" : "light";
        localStorage.setItem(KEYS.theme, normalized);
        apply({ ...getPreferences(), theme: normalized });
        window.dispatchEvent(new CustomEvent("roar-theme-changed", { detail: { theme: normalized } }));
    }

    function refresh() { return apply(getPreferences()); }

    apply();
    document.addEventListener("DOMContentLoaded", refresh);
    window.addEventListener("storage", (event) => {
        if (Object.values(KEYS).includes(event.key)) refresh();
    });
    window.addEventListener("roar-preferences-changed", refresh);

    window.ROARTheme = Object.freeze({
        get: () => getPreferences().theme,
        set,
        apply: refresh,
        applyPreferences: apply,
        toggle() {
            const next = getPreferences().theme === "dark" ? "light" : "dark";
            set(next);
            return next;
        },
    });
})();
