import { showToast } from "../../components/toast.js";
import { passwordRecoveryService } from "../../services/password-recovery-service.js";

const elements = {
    title: document.getElementById("stepTitle"), description: document.getElementById("stepDescription"),
    emailStep: document.getElementById("emailStep"), codeStep: document.getElementById("codeStep"),
    passwordStep: document.getElementById("passwordStep"), email: document.getElementById("emailInput"),
    code: document.getElementById("codeInput"), password: document.getElementById("passwordInput"),
    confirmation: document.getElementById("confirmationInput"), send: document.getElementById("sendCodeButton"),
    validate: document.getElementById("validateCodeButton"), reset: document.getElementById("resetPasswordButton"),
    resend: document.getElementById("resendCodeButton"), changeEmail: document.getElementById("changeEmailButton"),
};

const state = { email: "", code: "", busy: false, countdown: 0, timer: null };

function showStep(step) {
    elements.emailStep.hidden = step !== "email";
    elements.codeStep.hidden = step !== "code";
    elements.passwordStep.hidden = step !== "password";
    const content = {
        email: ["Esqueci minha senha", "Informe o e-mail da conta do professor."],
        code: ["Digite o código", `Enviamos um código para ${state.email}.`],
        password: ["Crie uma nova senha", "O código foi confirmado. Defina sua nova senha."],
    }[step];
    [elements.title.textContent, elements.description.textContent] = content;
    ({ email: elements.email, code: elements.code, password: elements.password }[step])?.focus();
}

function setBusy(button, busy, busyText, normalText) {
    state.busy = busy;
    button.disabled = busy;
    button.textContent = busy ? busyText : normalText;
}

function startCountdown() {
    clearInterval(state.timer);
    state.countdown = 60;
    elements.resend.disabled = true;
    elements.resend.textContent = "Reenviar em 60s";
    state.timer = setInterval(() => {
        state.countdown -= 1;
        elements.resend.textContent = state.countdown > 0 ? `Reenviar em ${state.countdown}s` : "Reenviar código";
        if (state.countdown <= 0) { clearInterval(state.timer); elements.resend.disabled = false; }
    }, 1000);
}

async function requestCode(event) {
    event?.preventDefault();
    if (state.busy) return;
    setBusy(elements.send, true, "Enviando...", "Enviar código");
    try {
        const result = await passwordRecoveryService.requestCode(elements.email.value);
        state.email = result.email;
        showToast(result.message, "success");
        showStep("code");
        startCountdown();
    } catch (error) {
        showToast(error?.message ?? "Não foi possível enviar o código.", "error");
    } finally { setBusy(elements.send, false, "Enviando...", "Enviar código"); }
}

async function validateCode(event) {
    event.preventDefault();
    if (state.busy) return;
    setBusy(elements.validate, true, "Validando...", "Validar código");
    try {
        const result = await passwordRecoveryService.validateCode(state.email, elements.code.value);
        state.code = result.code;
        showToast(result.message, "success");
        showStep("password");
    } catch (error) { showToast(error?.message ?? "Código inválido ou expirado.", "error"); }
    finally { setBusy(elements.validate, false, "Validando...", "Validar código"); }
}

async function resetPassword(event) {
    event.preventDefault();
    if (state.busy) return;
    setBusy(elements.reset, true, "Redefinindo...", "Redefinir senha");
    try {
        const message = await passwordRecoveryService.resetPassword(state.email, state.code, elements.password.value, elements.confirmation.value);
        showToast(message, "success");
        setTimeout(() => window.location.replace("login-professor.html"), 1200);
    } catch (error) { showToast(error?.message ?? "Não foi possível redefinir a senha.", "error"); }
    finally { setBusy(elements.reset, false, "Redefinindo...", "Redefinir senha"); }
}

elements.emailStep.addEventListener("submit", requestCode);
elements.codeStep.addEventListener("submit", validateCode);
elements.passwordStep.addEventListener("submit", resetPassword);
elements.resend.addEventListener("click", requestCode);
elements.changeEmail.addEventListener("click", () => { clearInterval(state.timer); state.email = ""; state.code = ""; elements.code.value = ""; showStep("email"); });
elements.code.addEventListener("input", () => { elements.code.value = elements.code.value.replace(/\D/g, "").slice(0, 6); });
showStep("email");
