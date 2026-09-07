import { apiClient } from "./api-client.js";

export const passwordRecoveryApi = Object.freeze({
    requestCode(email) {
        return apiClient.post("/professores/senha/solicitar-recuperacao", { email });
    },
    validateCode(email, code) {
        return apiClient.post("/professores/senha/validar-codigo", { email, codigo: code });
    },
    resetPassword(email, code, password, confirmation) {
        return apiClient.post("/professores/senha/redefinir", {
            email,
            codigo: code,
            nova_senha: password,
            confirmacao_senha: confirmation,
        });
    },
});
