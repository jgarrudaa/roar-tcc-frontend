/* ============================================================
   ROAR — roar-page-transition.js
   Navegação suave e segura entre páginas HTML
   ============================================================ */

(function () {
    "use strict";

    const EXIT_DURATION_MS = 120;

    let navigationInProgress = false;
    let navigationTimer = null;


    /**
     * Verifica se o usuário prefere reduzir movimentos.
     */
    function prefersReducedMotion() {
        return Boolean(
            window.matchMedia &&
            window.matchMedia(
                "(prefers-reduced-motion: reduce)",
            ).matches
        );
    }


    /**
     * Remove o estado visual de saída.
     */
    function restorePage() {
        navigationInProgress = false;

        if (navigationTimer !== null) {
            window.clearTimeout(
                navigationTimer,
            );

            navigationTimer = null;
        }

        if (document.body) {
            document.body.classList.remove(
                "roar-page-exiting",
            );
        }
    }


    /**
     * Realiza a navegação nativa.
     */
    function performNavigation(url) {
        window.location.assign(url);
    }


    /**
     * Navega aplicando uma transição curta de saída.
     */
    window.roarNavigate = function (url) {
        if (
            !url ||
            typeof url !== "string"
        ) {
            return;
        }

        /*
         * Impede dois cliques rápidos de criarem
         * duas navegações simultâneas.
         */
        if (navigationInProgress) {
            return;
        }

        navigationInProgress = true;

        /*
         * Quando o usuário prefere redução de movimento,
         * a navegação acontece imediatamente.
         */
        if (
            prefersReducedMotion() ||
            !document.body
        ) {
            performNavigation(url);
            return;
        }

        document.body.classList.add(
            "roar-page-exiting",
        );

        navigationTimer =
            window.setTimeout(
                function () {
                    performNavigation(url);
                },
                EXIT_DURATION_MS,
            );
    };


    /**
     * Verifica se o clique deve manter
     * o comportamento normal do navegador.
     */
    function shouldIgnoreLink(
        event,
        link,
    ) {
        if (
            !link ||
            event.defaultPrevented
        ) {
            return true;
        }

        const href =
            link.getAttribute("href");

        if (!href) {
            return true;
        }

        if (
            href.startsWith("#") ||
            href.startsWith("javascript:") ||
            href.startsWith("mailto:") ||
            href.startsWith("tel:")
        ) {
            return true;
        }

        if (
            link.target === "_blank" ||
            link.hasAttribute("download") ||
            link.hasAttribute(
                "data-no-transition",
            )
        ) {
            return true;
        }

        if (
            event.button !== 0 ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return true;
        }

        return false;
    }


    /**
     * Intercepta somente links internos.
     */
    function handleLinkClick(event) {
        const link =
            event.target.closest("a");

        if (
            shouldIgnoreLink(
                event,
                link,
            )
        ) {
            return;
        }

        try {
            const destination =
                new URL(
                    link.href,
                    window.location.href,
                );

            /*
             * Links externos continuam usando
             * o comportamento normal.
             */
            if (
                destination.origin !==
                window.location.origin
            ) {
                return;
            }

            /*
             * Não intercepta âncora da própria página.
             */
            const isSameDocument =
                destination.pathname ===
                window.location.pathname &&
                destination.search ===
                window.location.search;

            if (
                isSameDocument &&
                destination.hash
            ) {
                return;
            }

            /*
             * Não faz nada ao clicar em um link
             * que representa exatamente a página atual.
             */
            if (
                destination.href ===
                window.location.href
            ) {
                event.preventDefault();
                return;
            }

            event.preventDefault();

            window.roarNavigate(
                destination.href,
            );
        } catch (error) {
            /*
             * Se a URL for inválida, o navegador
             * mantém seu comportamento padrão.
             */
        }
    }


    /**
     * Adapta redirecionamentos simples escritos
     * diretamente no atributo onclick.
     */
    function enhanceInlineRedirects(root) {
        const scope =
            root instanceof Element ||
                root instanceof Document
                ? root
                : document;

        const elements =
            scope.querySelectorAll(
                "[onclick]",
            );

        elements.forEach(
            function (element) {
                if (
                    element.dataset
                        .roarTransitionReady ===
                    "true"
                ) {
                    return;
                }

                const inlineCode =
                    element.getAttribute(
                        "onclick",
                    );

                if (!inlineCode) {
                    return;
                }

                const match =
                    inlineCode.match(
                        /(?:window\.)?location\.href\s*=\s*['"`]([^'"`]+)['"`]/,
                    );

                if (
                    !match ||
                    !match[1]
                ) {
                    return;
                }

                const destination =
                    match[1];

                element.dataset
                    .roarTransitionReady =
                    "true";

                element.removeAttribute(
                    "onclick",
                );

                element.addEventListener(
                    "click",
                    function (event) {
                        event.preventDefault();
                        event.stopPropagation();

                        window.roarNavigate(
                            destination,
                        );
                    },
                );
            },
        );
    }


    /**
     * Observa elementos inseridos dinamicamente.
     */
    function initializeObserver() {
        if (
            typeof MutationObserver !==
            "function" ||
            !document.body
        ) {
            return;
        }

        const observer =
            new MutationObserver(
                function (mutations) {
                    mutations.forEach(
                        function (mutation) {
                            mutation.addedNodes
                                .forEach(
                                    function (
                                        node,
                                    ) {
                                        if (
                                            !(
                                                node instanceof
                                                Element
                                            )
                                        ) {
                                            return;
                                        }

                                        if (
                                            node.matches(
                                                "[onclick]",
                                            )
                                        ) {
                                            enhanceInlineRedirects(
                                                node.parentElement ||
                                                document,
                                            );
                                            return;
                                        }

                                        enhanceInlineRedirects(
                                            node,
                                        );
                                    },
                                );
                        },
                    );
                },
            );

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true,
            },
        );
    }


    /**
     * Inicialização.
     */
    function initialize() {
        enhanceInlineRedirects(
            document,
        );

        initializeObserver();
    }


    document.addEventListener(
        "click",
        handleLinkClick,
    );

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once: true,
            },
        );
    } else {
        initialize();
    }


    /*
     * Restaura a página quando o navegador usa
     * o cache dos botões Voltar e Avançar.
     */
    window.addEventListener(
        "pageshow",
        restorePage,
    );

    window.addEventListener(
        "popstate",
        restorePage,
    );
})();