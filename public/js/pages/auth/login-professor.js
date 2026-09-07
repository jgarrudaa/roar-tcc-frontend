import { APP_CONFIG } from "../../config/app-config.js";
import { showToast } from "../../components/toast.js";
import { authService } from "../../services/auth-service.js";
import { sessionService } from "../../services/session-service.js";

const SELECTORS = Object.freeze({
    form: "#teacher-login-form",
    email: "#emailInput",
    password: "#senha",
    submit: 'button[type="submit"]',
});

function getElements() {
    const form = document.querySelector(SELECTORS.form);

    if (!form) {
        return null;
    }

    return {
        form,
        emailInput: form.querySelector(SELECTORS.email),
        passwordInput: form.querySelector(SELECTORS.password),
        submitButton: form.querySelector(SELECTORS.submit),
    };
}

function setSubmitting(elements, isSubmitting) {
    const { form, submitButton } = elements;

    form.setAttribute(
        "aria-busy",
        String(isSubmitting),
    );

    if (!submitButton) {
        return;
    }

    submitButton.disabled = isSubmitting;
    submitButton.textContent = isSubmitting
        ? "Entrando..."
        : "Entrar";
}

function navigateToTeacherHome() {
    if (typeof window.roarNavigate === "function") {
        window.roarNavigate(APP_CONFIG.routes.teacherHome);
        return;
    }

    window.location.assign(APP_CONFIG.routes.teacherHome);
}

async function handleSubmit(event, elements) {
    event.preventDefault();

    if (
        !elements.emailInput ||
        !elements.passwordInput
    ) {
        showToast(
            "Não foi possível carregar o formulário de login.",
            "error",
        );
        return;
    }

    setSubmitting(elements, true);

    try {
        await authService.loginTeacher({
            email: elements.emailInput.value,
            password: elements.passwordInput.value,
        });

        navigateToTeacherHome();
    } catch (error) {
        showToast(
            error?.message ??
                "Não foi possível realizar o login.",
            "error",
        );

        elements.passwordInput.focus();
        elements.passwordInput.select();
    } finally {
        setSubmitting(elements, false);
    }
}

function redirectAuthenticatedTeacher() {
    if (
        sessionService.isAuthenticated() &&
        sessionService.hasRole("teacher")
    ) {
        navigateToTeacherHome();
        return true;
    }

    return false;
}

function initializeTeacherLogin() {
    if (redirectAuthenticatedTeacher()) {
        return;
    }

    const elements = getElements();

    if (!elements) {
        console.error(
            "Formulário de login do professor não encontrado.",
        );
        return;
    }

    elements.form.addEventListener("submit", (event) => {
        handleSubmit(event, elements);
    });
}

initializeTeacherLogin();