/* ============================================================
   ROAR — roar-page-transition.js
   Controle inteligente de transição suave entre páginas HTML
   ============================================================ */

(function () {
    'use strict';

    /**
     * Verifica se o usuário prefere redução de movimento (acessibilidade)
     */
    function isReducedMotion() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Navegação programática suave entre páginas
     * @param {string} url - Destino da página
     */
    window.roarNavigate = function (url) {
        if (!url || typeof url !== 'string') return;

        // Se o usuário tem preferência por reduzir movimento, navega diretamente
        if (isReducedMotion()) {
            window.location.href = url;
            return;
        }

        // Adiciona classe de saída suave ao body
        if (document.body) {
            document.body.classList.add('roar-page-exiting');
        }

        // Executa a transição antes de alterar a URL
        window.setTimeout(function () {
            window.location.href = url;
        }, 120);

        // Trava de segurança: remove a classe se a página não descarregar em 2.5s
        window.setTimeout(function () {
            if (document.body) {
                document.body.classList.remove('roar-page-exiting');
            }
        }, 2500);
    };

    /**
     * Intercepta cliques em links internos para aplicar a transição suave
     */
    function handleLinkClicks(event) {
        const link = event.target.closest('a');
        if (!link) return;

        if (event.defaultPrevented) return;

        const href = link.getAttribute('href');
        if (!href) return;

        // Ignora âncoras locais da mesma página (#topo, #como-funciona, etc.)
        if (href.startsWith('#')) return;

        // Ignora protocolos especiais
        if (
            href.startsWith('javascript:') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:')
        ) {
            return;
        }

        // Ignora novas abas, downloads ou teclas de atalho (Ctrl, Shift, Cmd)
        if (
            link.target === '_blank' ||
            link.hasAttribute('download') ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return;
        }

        // Ignora se o elemento tiver atributo data-no-transition
        if (link.dataset.noTransition !== undefined) return;

        try {
            const targetUrl = new URL(link.href, window.location.href);

            // Ignora links externos (domínio diferente)
            if (targetUrl.origin !== window.location.origin) return;

            // Ignora se for a mesma página com apenas uma âncora
            if (
                targetUrl.pathname === window.location.pathname &&
                targetUrl.search === window.location.search &&
                targetUrl.hash
            ) {
                return;
            }

            // Cancela o carregamento abrupto nativo e aplica a transição suave
            event.preventDefault();
            window.roarNavigate(targetUrl.href);
        } catch (e) {
            // Se falhar o parse da URL, permite comportamento padrão
        }
    }

    /**
     * Converte elementos com onclick inline de redirecionamento para transição suave
     */
    function enhanceInlineRedirects() {
        const elementsWithClick = document.querySelectorAll('*[onclick]');
        elementsWithClick.forEach(function (el) {
            const onclickAttr = el.getAttribute('onclick');
            if (!onclickAttr) return;

            const match = onclickAttr.match(/(?:window\.)?location\.href\s*=\s*['"`]([^'"`]+)['"`]/);
            if (match && match[1]) {
                const targetUrl = match[1];
                el.removeAttribute('onclick');
                el.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.roarNavigate(targetUrl);
                });
            }
        });
    }

    // Inicialização quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            enhanceInlineRedirects();
            initObserver();
        });
    } else {
        enhanceInlineRedirects();
        initObserver();
    }

    function initObserver() {
        if (!window.MutationObserver || !document.body) return;
        var observer = new MutationObserver(function () {
            enhanceInlineRedirects();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Escuta cliques em links
    document.addEventListener('click', handleLinkClicks);

    // Restaura a página visível se restaurada do bfcache do navegador (Back / Forward)
    window.addEventListener('pageshow', function (event) {
        if (document.body) {
            document.body.classList.remove('roar-page-exiting');
        }
    });

    window.addEventListener('popstate', function () {
        if (document.body) {
            document.body.classList.remove('roar-page-exiting');
        }
    });
})();
