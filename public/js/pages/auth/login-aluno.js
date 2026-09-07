import { APP_CONFIG } from "../../config/app-config.js";
import { showToast } from "../../components/toast.js";
import { authService } from "../../services/auth-service.js";
import { sessionService } from "../../services/session-service.js";

const SELECTORS = Object.freeze({
    form: "#student-login-form",
    email: "#emailInput",
    pin: "#pinInput",
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
        pinInput: form.querySelector(SELECTORS.pin),
        submitButton: form.querySelector(SELECTORS.submit),
    };
}

function hasRequiredElements(elements) {
    return Boolean(
        elements?.form &&
        elements?.emailInput &&
        elements?.pinInput &&
        elements?.submitButton,
    );
}

function setSubmitting(elements, isSubmitting) {
    elements.form.setAttribute(
        "aria-busy",
        String(isSubmitting),
    );

    elements.submitButton.disabled = isSubmitting;
    elements.submitButton.textContent = isSubmitting
        ? "Entrando..."
        : "Entrar";
}

function sanitizePin(value) {
    return String(value ?? "")
        .replace(/\D/g, "")
        .slice(0, 4);
}

function handlePinInput(event) {
    event.currentTarget.value = sanitizePin(
        event.currentTarget.value,
    );
}

function navigateTo(path) {
    if (typeof window.roarNavigate === "function") {
        window.roarNavigate(path);
        return;
    }

    window.location.assign(path);
}

function redirectExistingSession() {
    const session = sessionService.get();

    if (!session) {
        return false;
    }

    if (session.role === "student") {
        navigateTo(APP_CONFIG.routes.studentHome);
        return true;
    }

    if (session.role === "teacher") {
        navigateTo(APP_CONFIG.routes.teacherHome);
        return true;
    }

    sessionService.end();
    return false;
}

function getCredentials(elements) {
    return {
        email: elements.emailInput.value.trim(),
        pin: sanitizePin(elements.pinInput.value),
    };
}

async function handleSubmit(event, elements) {
    event.preventDefault();

    if (!elements.form.reportValidity()) {
        return;
    }

    setSubmitting(elements, true);

    try {
        await authService.loginStudent(
            getCredentials(elements),
        );

        navigateTo(APP_CONFIG.routes.studentHome);
    } catch (error) {
        showToast(
            error?.message ??
                "Não foi possível realizar o login.",
            "error",
        );

        elements.pinInput.focus();
        elements.pinInput.select();

        setSubmitting(elements, false);
    }
}

function initializeStudentLogin() {
    if (redirectExistingSession()) {
        return;
    }

    const elements = getElements();

    if (!hasRequiredElements(elements)) {
        console.error(
            "Não foi possível inicializar o login do aluno: elementos obrigatórios ausentes.",
        );
        return;
    }

    elements.pinInput.addEventListener(
        "input",
        handlePinInput,
    );

    elements.form.addEventListener(
        "submit",
        (event) => handleSubmit(event, elements),
    );
}

initializeStudentLogin();