(() => {
    const passwordInput = document.querySelector("#senha");
    const passwordToggle = document.querySelector("#toggleSenhaIcon");
    const passwordIcon = passwordToggle?.querySelector("i");
    const mascot = document.querySelector("[data-dino-neutral]");

    if (!passwordInput || !passwordToggle || !passwordIcon || !mascot) return;

    const mascotSources = {
        neutral: mascot.dataset.dinoNeutral,
        hiding: mascot.dataset.dinoHiding,
        peeking: mascot.dataset.dinoPeeking,
    };

    function updateMascot() {
        const hasValue = passwordInput.value.length > 0;
        const isVisible = passwordInput.type === "text";

        mascot.src = isVisible
            ? mascotSources.peeking
            : hasValue
                ? mascotSources.hiding
                : mascotSources.neutral;
    }

    function updatePasswordToggle() {
        const isVisible = passwordInput.type === "text";
        const label = isVisible ? "Ocultar senha" : "Mostrar senha";

        passwordIcon.className = isVisible ? "fi fi-br-eye-crossed" : "fi fi-br-eye";
        passwordToggle.setAttribute("aria-label", label);
        passwordToggle.setAttribute("aria-pressed", String(isVisible));
        passwordToggle.title = label;
    }

    passwordInput.addEventListener("input", () => {
        if (passwordInput.dataset.numeric === "true") {
            passwordInput.value = passwordInput.value.replace(/\D/g, "");
        }

        updateMascot();
    });

    passwordInput.addEventListener("blur", updateMascot);
    passwordToggle.addEventListener("click", () => {
        passwordInput.type = passwordInput.type === "password" ? "text" : "password";
        updatePasswordToggle();
        updateMascot();
    });

    updatePasswordToggle();
    updateMascot();
})();
