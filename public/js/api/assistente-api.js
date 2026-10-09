import { apiClient } from "./api-client.js";

function normalizeStudentId(studentId) {
    const parsedId = Number.parseInt(studentId, 10);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
        throw new TypeError(
            "O identificador do aluno é inválido.",
        );
    }

    return parsedId;
}

export const assistenteApi = Object.freeze({
    async generateStudentAnalysis(studentId) {
        const normalizedId = normalizeStudentId(studentId);

        return apiClient.post(
            `/relatorios/aluno/${normalizedId}/analise-ia`,
            {},
        );
    },
});