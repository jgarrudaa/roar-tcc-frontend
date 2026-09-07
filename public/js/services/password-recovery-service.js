import { passwordRecoveryApi } from "../api/password-recovery-api.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function normalizeEmail(value) {
    const email = String(value ?? "").trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) throw new TypeError("Informe um e-mail válido.");
    return email;
}

function normalizeCode(value) {
    const code = String(value ?? "").replace(/\D/g, "");
    if (code.length !== 6) throw new TypeError("O código deve possuir 6 números.");
    return code;
}

function validatePassword(password, confirmation) {
    const value = String(password ?? "");
    if (!PASSWORD_PATTERN.test(value)) {
        throw new TypeError("A senha deve ter 8 caracteres, uma letra maiúscula, uma minúscula e um número.");
    }
    if (value !== String(confirmation ?? "")) throw new TypeError("As senhas não coincidem.");
    return value;
}

export const passwordRecoveryService = Object.freeze({
    async requestCode(email) {
        const normalizedEmail = normalizeEmail(email);
        const response = await passwordRecoveryApi.requestCode(normalizedEmail);
        return { email: normalizedEmail, message: response?.mensagem ?? "Se o e-mail estiver cadastrado, enviaremos um código." };
    },
    async validateCode(email, code) {
        const normalizedEmail = normalizeEmail(email);
        const normalizedCode = normalizeCode(code);
        const response = await passwordRecoveryApi.validateCode(normalizedEmail, normalizedCode);
        return { email: normalizedEmail, code: normalizedCode, message: response?.mensagem ?? "Código validado." };
    },
    async resetPassword(email, code, password, confirmation) {
        const normalizedEmail = normalizeEmail(email);
        const normalizedCode = normalizeCode(code);
        const validPassword = validatePassword(password, confirmation);
        const response = await passwordRecoveryApi.resetPassword(normalizedEmail, normalizedCode, validPassword, validPassword);
        return response?.mensagem ?? "Senha redefinida com sucesso.";
    },
});
