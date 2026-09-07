import { apiClient } from "./api-client.js";

function requirePositiveInteger(value, fieldName) {
    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
        throw new TypeError(
            `${fieldName} deve ser um número inteiro positivo.`,
        );
    }

    return parsedValue;
}

function requireObject(value, fieldName) {
    if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
        throw new TypeError(
            `${fieldName} deve ser um objeto válido.`,
        );
    }

    return value;
}

export const atividadesApi = Object.freeze({
    getModuleForStudent(moduleId, studentId) {
        const validModuleId = requirePositiveInteger(
            moduleId,
            "moduleId",
        );

        const validStudentId = requirePositiveInteger(
            studentId,
            "studentId",
        );

        return apiClient.get(
            `/atividades/modulo/${validModuleId}/aluno/${validStudentId}`,
        );
    },

    saveProgress(progressData) {
        const validProgressData = requireObject(
            progressData,
            "progressData",
        );

        return apiClient.post(
            "/atividades/progresso",
            validProgressData,
        );
    },
});