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


export const desempenhoApi = Object.freeze({
    getStudentReport(studentId) {
        const validStudentId = requirePositiveInteger(
            studentId,
            "studentId",
        );

        return apiClient.get(
            `/relatorios/aluno/${validStudentId}`,
        );
    },
});