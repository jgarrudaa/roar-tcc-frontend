(() => {
    const SELECTORS = Object.freeze({
        secretInput: [
            "[data-auth-secret-input]",
            "#senha",
            "#pinInput",
        ].join(", "),

        secretToggle: [
            "[data-auth-secret-toggle]",
            "#toggleSenhaIcon",
        ].join(", "),

        mascot: "[data-dino-neutral]",
    });

    function getElements() {
        const secretInput = document.querySelector(
            SELECTORS.secretInput,
        );

        const secretToggle = document.querySelector(
            SELECTORS.secretToggle,
        );

        return {
            secretInput,
            secretToggle,
            secretIcon: secretToggle?.querySelector("i"),
            mascot: document.querySelector(SELECTORS.mascot),
        };
    }

    function hasRequiredElements(elements) {
        return Boolean(
            elements.secretInput &&
            elements.secretToggle &&
            elements.secretIcon &&
            elements.mascot,
        );
    }

    function getMascotSources(mascot) {
        return {
            neutral: mascot.dataset.dinoNeutral,
            hiding: mascot.dataset.dinoHiding,
            peeking: mascot.dataset.dinoPeeking,
        };
    }

    function getSecretLabel(secretInput) {
        if (secretInput.dataset.secretLabel) {
            return secretInput.dataset.secretLabel;
        }

        return secretInput.name === "pin"
            ? "PIN"
            : "senha";
    }

    function sanitizeNumericInput(secretInput) {
        if (secretInput.dataset.numeric !== "true") {
            return;
        }

        const maxLength =
            Number(secretInput.maxLength) > 0
                ? Number(secretInput.maxLength)
                : Infinity;

        secretInput.value = secretInput.value
            .replace(/\D/g, "")
            .slice(0, maxLength);
    }

    function updateMascot(elements, sources) {
        const hasValue =
            elements.secretInput.value.length > 0;

        const isVisible =
            elements.secretInput.type === "text";

        if (isVisible && sources.peeking) {
            elements.mascot.src = sources.peeking;
            return;
        }

        if (hasValue && sources.hiding) {
            elements.mascot.src = sources.hiding;
            return;
        }

        if (sources.neutral) {
            elements.mascot.src = sources.neutral;
        }
    }

    function updateToggle(elements) {
        const isVisible =
            elements.secretInput.type === "text";

        const secretLabel = getSecretLabel(
            elements.secretInput,
        );

        const accessibleLabel = isVisible
            ? `Ocultar ${secretLabel}`
            : `Mostrar ${secretLabel}`;

        elements.secretIcon.className = isVisible
            ? "fi fi-br-eye-crossed"
            : "fi fi-br-eye";

        elements.secretToggle.setAttribute(
            "aria-label",
            accessibleLabel,
        );

        elements.secretToggle.setAttribute(
            "aria-pressed",
            String(isVisible),
        );

        elements.secretToggle.title = accessibleLabel;
    }

    function handleSecretInput(elements, sources) {
        sanitizeNumericInput(elements.secretInput);
        updateMascot(elements, sources);
    }

    function handleSecretToggle(elements, sources) {
        const isHidden =
            elements.secretInput.type === "password";

        elements.secretInput.type = isHidden
            ? "text"
            : "password";

        updateToggle(elements);
        updateMascot(elements, sources);

        elements.secretInput.focus();

        const endPosition =
            elements.secretInput.value.length;

        elements.secretInput.setSelectionRange?.(
            endPosition,
            endPosition,
        );
    }

    function initializeAuthInteractions() {
        const elements = getElements();

        if (!hasRequiredElements(elements)) {
            return;
        }

        const mascotSources = getMascotSources(
            elements.mascot,
        );

        elements.secretInput.addEventListener(
            "input",
            () => handleSecretInput(
                elements,
                mascotSources,
            ),
        );

        elements.secretToggle.addEventListener(
            "click",
            () => handleSecretToggle(
                elements,
                mascotSources,
            ),
        );

        updateToggle(elements);
        updateMascot(elements, mascotSources);
    }

    initializeAuthInteractions();
})();