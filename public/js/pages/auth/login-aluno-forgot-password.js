import { showToast } from "../../components/toast.js";

const FORGOT_ACCESS_SELECTOR = "#forgot-student-password";

function handleForgotAccess(event) {
    event.preventDefault();

    showToast(
        "Solicite um novo PIN ao professor responsável.",
        "info",
        5000,
    );
}

function initializeForgotAccess() {
    const forgotAccessButton = document.querySelector(
        FORGOT_ACCESS_SELECTOR,
    );

    forgotAccessButton?.addEventListener(
        "click",
        handleForgotAccess,
    );
}

initializeForgotAccess();