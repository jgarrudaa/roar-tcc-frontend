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
    getModuleForStudent(moduleId, studentId, stage = null) {
        const validModuleId = requirePositiveInteger(
            moduleId,
            "moduleId",
        );

        const validStudentId = requirePositiveInteger(
            studentId,
            "studentId",
        );

        const query = stage === null || stage === undefined
            ? ""
            : "?etapa=" + requirePositiveInteger(stage, "stage");
        const endpoint =
            "/atividades/modulo/" + validModuleId +
            "/aluno/" + validStudentId + query;

        return apiClient.get(endpoint);
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
