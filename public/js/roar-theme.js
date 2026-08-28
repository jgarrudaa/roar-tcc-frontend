/* ============================================================
   ROAR — roar-theme.js
   Gerenciamento global de tema (Dark / Light) e acessibilidade
   ============================================================ */

(function () {
    const THEME_KEY = 'roarTheme';
    const FONT_SIZE_KEY = 'roarFontSize';

    function getStoredTheme() {
        try {
            return localStorage.getItem(THEME_KEY) || 'light';
        } catch (e) {
            return 'light';
        }
    }

    function applyTheme(theme) {
        const doc = document.documentElement;
        if (theme === 'dark') {
            doc.setAttribute('data-theme', 'dark');
            doc.classList.add('dark-theme');
        } else {
            doc.removeAttribute('data-theme');
            doc.classList.remove('dark-theme');
        }
    }

    function setTheme(theme) {
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (e) {
            console.warn('ROAR Theme: Erro ao salvar tema:', e);
        }
        applyTheme(theme);
        window.dispatchEvent(new CustomEvent('roar-theme-changed', { detail: { theme } }));
    }

    function applyStoredFontSize() {
        try {
            const fs = localStorage.getItem(FONT_SIZE_KEY);
            if (fs) {
                const sizes = { small: '17px', medium: '19px', large: '22px' };
                if (sizes[fs]) {
                    document.documentElement.style.fontSize = sizes[fs];
                }
            }
        } catch (e) {}
    }

    // Aplicação imediata
    const currentTheme = getStoredTheme();
    applyTheme(currentTheme);
    applyStoredFontSize();

    // Re-aplicar no DOMContentLoaded caso o body precise de ajustes
    document.addEventListener('DOMContentLoaded', () => {
        applyTheme(getStoredTheme());
        applyStoredFontSize();
    });

    // API Global
    window.ROARTheme = {
        get: getStoredTheme,
        set: setTheme,
        apply: applyTheme,
        toggle() {
            const next = getStoredTheme() === 'dark' ? 'light' : 'dark';
            setTheme(next);
            return next;
        }
    };
})();
