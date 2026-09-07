import { showToast } from "../../components/toast.js";
import { authService } from "../../services/auth-service.js";
import { formatCpf } from "../../utils/formatters.js";

const LOGIN_PAGE = "login-professor.html";

const elements = {
    registerForm: document.getElementById("teacher-register-form"),
    verificationForm: document.getElementById(
        "teacher-verification-form",
    ),
    name: document.getElementById("nomeInput"),
    email: document.getElementById("emailInput"),
    cpf: document.getElementById("cpfInput"),
    password: document.getElementById("senha"),
    registerButton: document.querySelector(
        '#teacher-register-form button[type="submit"]',
    ),
    description: document.getElementById(
        "verificationDescription",
    ),
    code: document.getElementById("verificationCodeInput"),
    confirmButton: document.getElementById(
        "confirmEmailButton",
    ),
    resendButton: document.getElementById(
        "resendEmailCodeButton",
    ),
};

const state = {
    email: "",
    busy: false,
    seconds: 0,
    timer: null,
};

function validateElements() {
    const missingElements = Object.entries(elements)
        .filter(([, element]) => !element)
        .map(([name]) => name);

    if (missingElements.length > 0) {
        throw new Error(
            `Elementos ausentes no cadastro: ${missingElements.join(", ")}.`,
        );
    }
}

function navigateToLogin() {
    if (typeof window.roarNavigate === "function") {
        window.roarNavigate(LOGIN_PAGE);
        return;
    }

    window.location.assign(LOGIN_PAGE);
}

function setButtonState(
    button,
    busy,
    busyText,
    normalText,
) {
    state.busy = busy;
    button.disabled = busy;
    button.textContent = busy ? busyText : normalText;
}

function showVerificationStep(email) {
    state.email = email;

    elements.registerForm.hidden = true;

    elements.verificationForm.hidden = false;
    elements.verificationForm.style.removeProperty("display");

    elements.description.textContent =
        `Digite o código de 6 números enviado para ${email}.`;

    elements.code.focus();
}

function startResendCountdown() {
    window.clearInterval(state.timer);

    state.seconds = 60;
    elements.resendButton.disabled = true;
    elements.resendButton.textContent = "Reenviar em 60s";

    state.timer = window.setInterval(() => {
        state.seconds -= 1;

        elements.resendButton.textContent =
            state.seconds > 0
                ? `Reenviar em ${state.seconds}s`
                : "Reenviar código";

       if (state.seconds <= 0) {
            window.clearInterval(state.timer);
            elements.resendButton.disabled = false;
        }
    }, 1000);
}

async function registerTeacher(event) {
    event.preventDefault();

    if (
        state.busy ||
        !elements.registerForm.reportValidity()
    ) {
        return;
    }

    setButtonState(
        elements.registerButton,
        true,
        "Cadastrando...",
        "Cadastrar",
    );

    try {
        const registration =
            await authService.registerTeacher({
                name: elements.name.value,
                email: elements.email.value,
                cpf: elements.cpf.value,
                password: elements.password.value,
            });

        showVerificationStep(registration.email);
        startResendCountdown();

        showToast(
            registration.message,
            registration.emailSent
                ? "success"
                : "warning",
        );
    } catch (error) {
        showToast(
            error?.message ??
                "Não foi possível realizar o cadastro.",
            "error",
        );
    } finally {
        setButtonState(
            elements.registerButton,
            false,
            "Cadastrando...",
            "Cadastrar",
        );
    }
}

async function confirmEmail(event) {
    event.preventDefault();

    if (
        state.busy ||
        !elements.verificationForm.reportValidity()
    ) {
        return;
    }

    setButtonState(
        elements.confirmButton,
        true,
        "Confirmando...",
        "Confirmar e-mail",
    );

    try {
        const message =
            await authService.confirmTeacherEmail(
                state.email,
                elements.code.value,
            );

        window.clearInterval(state.timer);
        showToast(message, "success");

        window.setTimeout(navigateToLogin, 900);
    } catch (error) {
        showToast(
            error?.message ??
                "Código inválido ou expirado.",
            "error",
        );
    } finally {
        setButtonState(
            elements.confirmButton,
            false,
            "Confirmando...",
            "Confirmar e-mail",
        );
    }
}

async function resendCode() {
    if (
        state.busy ||
        elements.resendButton.disabled
    ) {
        return;
    }

    state.busy = true;
    elements.resendButton.disabled = true;
    elements.resendButton.textContent = "Enviando...";

    try {
        const message =
            await authService.resendTeacherEmailCode(
                state.email,
            );

        showToast(message, "success");
        startResendCountdown();
    } catch (error) {
        elements.resendButton.disabled = false;
        elements.resendButton.textContent =
            "Reenviar código";

        showToast(
            error?.message ??
                "Não foi possível reenviar o código.",
            "error",
        );
    } finally {
        state.busy = false;
    }
}

function initialize() {
    try {
        validateElements();

        // Garante que apenas o cadastro apareça inicialmente.
        elements.registerForm.hidden = false;
        elements.registerForm.style.removeProperty(
            "display",
        );

        elements.verificationForm.hidden = true;

        elements.cpf.addEventListener(
            "input",
            (event) => {
                event.currentTarget.value = formatCpf(
                    event.currentTarget.value,
                );
            },
        );

        elements.code.addEventListener("input", () => {
            elements.code.value = elements.code.value
                .replace(/\D/g, "")
                .slice(0, 6);
        });

        elements.registerForm.addEventListener(
            "submit",
            registerTeacher,
        );

        elements.verificationForm.addEventListener(
            "submit",
            confirmEmail,
        );

        elements.resendButton.addEventListener(
            "click",
            resendCode,
        );
    } catch (error) {
        console.error(
            "Não foi possível inicializar o cadastro:",
            error,
        );
    }
}

initialize();