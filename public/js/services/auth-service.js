import { authApi } from "../api/auth-api.js";
import { APP_CONFIG } from "../config/app-config.js";
import { sessionService } from "./session-service.js";
import { isValidEmail, isValidPin, required } from "../utils/validators.js";

export const authService = Object.freeze({
    async loginStudent({ email, pin }) {
        if (!isValidEmail(email) || !isValidPin(pin)) {
            throw new Error("Informe um email válido e um PIN de quatro dígitos.");
        }
        if (APP_CONFIG.useMocks) {
            return sessionService.start({ token: "mock-student-token", role: "student", user: { email } });
        }
        return sessionService.start(await authApi.loginStudent({ email, pin }));
    },
    async loginTeacher({ email, password }) {
        if (!isValidEmail(email) || !required(password)) {
            throw new Error("Informe email e senha válidos.");
        }
        if (APP_CONFIG.useMocks) {
            return sessionService.start({ token: "mock-teacher-token", role: "teacher", user: { email } });
        }
        return sessionService.start(await authApi.loginTeacher({ email, password }));
    },
    async registerTeacher(data) {
        if (!required(data.name) || !isValidEmail(data.email) || !required(data.cpf) || !required(data.password)) {
            throw new Error("Preencha todos os dados do professor.");
        }
        if (APP_CONFIG.useMocks) return { id: 1, ...data };
        return authApi.registerTeacher(data);
    },
});
