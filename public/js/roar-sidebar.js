/* ============================================================
   ROAR — roar-sidebar.js
   Sidebar, logout e toast compartilhados entre páginas
   ============================================================ */

function initSidebar() {
    const sidebar =
        document.getElementById("sidebar");

    const toggle =
        document.getElementById("sidebarToggle");

    const backdrop =
        document.getElementById("sidebarBackdrop");

    const mobileButton =
        document.getElementById("mobileMenuBtn");

    const savedCollapsed =
        localStorage.getItem("sidebarCollapsed") === "true";

    if (savedCollapsed) {
        document.documentElement.classList.add("sidebar-collapsed");
        if (sidebar) {
            sidebar.classList.add("sidebar--collapsed");
        }
    } else {
        document.documentElement.classList.remove("sidebar-collapsed");
        if (sidebar) {
            sidebar.classList.remove("sidebar--collapsed");
        }
    }

    // Libera transições da sidebar apenas após o layout inicial estar pronto
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.documentElement.classList.add("sidebar-ready");
        });
    });

    if (toggle && sidebar) {
        toggle.addEventListener("click", () => {
            const isNowCollapsed =
                sidebar.classList.toggle("sidebar--collapsed");

            document.documentElement.classList.toggle(
                "sidebar-collapsed",
                isNowCollapsed,
            );

            localStorage.setItem(
                "sidebarCollapsed",
                String(isNowCollapsed),
            );
        });
    }

    if (
        mobileButton &&
        sidebar &&
        backdrop
    ) {
        mobileButton.addEventListener(
            "click",
            () => {
                sidebar.classList.add("open");
                backdrop.classList.add("open");
            },
        );
    }

    if (backdrop && sidebar) {
        backdrop.addEventListener(
            "click",
            () => {
                sidebar.classList.remove("open");
                backdrop.classList.remove("open");
            },
        );
    }

    initLogout();
}

function getCurrentSession() {
    try {
        const rawSession =
            localStorage.getItem(
                "roarSession",
            );

        return rawSession
            ? JSON.parse(rawSession)
            : null;
    } catch (error) {
        console.warn(
            "Não foi possível ler a sessão atual.",
            error,
        );

        return null;
    }
}

function getLoginUrl(
    session,
    logoutLink,
) {
    /*
     * Se o próprio link já aponta para uma
     * página de login, utiliza esse endereço.
     */
    const declaredUrl =
        logoutLink.getAttribute("href");

    if (
        declaredUrl &&
        declaredUrl.includes("login-")
    ) {
        return declaredUrl;
    }

    const pageRole =
        document.body.dataset.authRole;

    const sessionRole = String(
        session?.role ??
        session?.tipo ??
        "",
    ).toLocaleLowerCase("pt-BR");

    const isTeacher =
        pageRole === "teacher" ||
        pageRole === "professor" ||
        sessionRole === "teacher" ||
        sessionRole === "professor";

    return isTeacher
        ? "../auth/login-professor.html"
        : "../auth/login-aluno.html";
}

function initLogout() {
    /*
     * Reconhece as diferentes identificações de
     * logout que já existem nas páginas do projeto.
     */
    const logoutLinks =
        document.querySelectorAll(
            [
                '[data-action="logout"]',
                "#logoutButton",
                "#nav-logout",
            ].join(", "),
        );

    logoutLinks.forEach((logoutLink) => {
        /*
         * Impede o registro duplicado do evento
         * caso a sidebar seja inicializada novamente.
         */
        if (
            logoutLink.dataset.logoutReady ===
            "true"
        ) {
            return;
        }

        logoutLink.dataset.logoutReady = "true";

        logoutLink.addEventListener(
            "click",
            (event) => {
                /*
                 * Impede que o href leve primeiro
                 * para a home ou para outra página.
                 */
                event.preventDefault();
                event.stopPropagation();

                const session =
                    getCurrentSession();

                const loginUrl =
                    getLoginUrl(
                        session,
                        logoutLink,
                    );

                /*
                 * Encerra efetivamente a sessão.
                 */
                localStorage.removeItem(
                    "roarSession",
                );

                /*
                 * replace evita que o botão Voltar
                 * restaure a página protegida.
                 */
                window.location.replace(
                    loginUrl,
                );
            },
        );
    });
}

function showToast(
    message,
    type,
) {
    const container =
        document.getElementById(
            "toast-container",
        );

    if (!container) {
        return;
    }

    const toast =
        document.createElement("div");

    toast.className =
        "toast" +
        (type ? ` toast--${type}` : "");

    const icon =
        document.createElement("i");

    icon.className =
        "fi fi-br-info";

    icon.setAttribute(
        "aria-hidden",
        "true",
    );

    const text =
        document.createElement("span");

    text.textContent =
        String(message ?? "");

    toast.append(
        icon,
        document.createTextNode(" "),
        text,
    );

    container.appendChild(toast);

    window.setTimeout(() => {
        toast.remove();
    }, 3000);
}

/*
 * Inicializa mesmo se o arquivo for carregado
 * depois do evento DOMContentLoaded.
 */
if (
    document.readyState === "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initSidebar,
        { once: true },
    );
} else {
    initSidebar();
}

/*
 * Mantém compatibilidade com páginas antigas
 * que utilizem window.showToast.
 */
window.showToast =
    window.showToast || showToast;