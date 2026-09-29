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

export const modulosApi = Object.freeze({
    list() {
        return apiClient.get("/atividades/modulos");
    },

    setAvailability(moduleId, active) {
        const validModuleId =
            requirePositiveInteger(
                moduleId,
                "moduleId",
            );

        if (typeof active !== "boolean") {
            throw new TypeError(
                "O status do módulo deve ser booleano.",
            );
        }

        return apiClient.patch(
            `/atividades/professor/modulos/${validModuleId}`,
            {
                ativo: active,
            },
        );
    },

    getActivities(moduleId, studentId) {
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
        return apiClient.post(
            "/atividades/progresso",
            progressData,
        );
    },


});