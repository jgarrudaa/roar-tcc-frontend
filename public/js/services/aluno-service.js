import { alunosApi } from "../api/alunos-api.js";
import { APP_CONFIG } from "../config/app-config.js";
import { isValidCpf, isValidEmail, required } from "../utils/validators.js";

function generateMockPin() {
    return String(Math.floor(1000 + Math.random() * 9000));
}

export const alunoService = Object.freeze({
    async create(data) {
        if (!required(data.name) || !isValidCpf(data.cpf) || !isValidEmail(data.email) || !required(data.schoolYear)) {
            throw new Error("Preencha nome, CPF, email e ano escolar corretamente.");
        }
        if (![1, 2, 3].includes(data.supportLevel)) {
            throw new Error("O resultado da triagem é inválido.");
        }
        if (APP_CONFIG.useMocks) return { id: Date.now(), pin: generateMockPin(), ...data };
        return alunosApi.create(data);
    },
});
