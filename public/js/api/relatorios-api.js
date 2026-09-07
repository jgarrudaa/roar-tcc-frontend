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


export const relatoriosApi = Object.freeze({
    getTeacherStatistics(teacherId) {
        const validTeacherId = requirePositiveInteger(
            teacherId,
            "teacherId",
        );

        return apiClient.get(
            `/professores/dashboard/estatisticas/${validTeacherId}`,
        );
    },

    getTeacherReport(teacherId) {
        const validTeacherId = requirePositiveInteger(
            teacherId,
            "teacherId",
        );

        return apiClient.get(
            `/relatorios/professor/${validTeacherId}`,
        );
    },

    getStudentReport(studentId) {
        const validStudentId = requirePositiveInteger(
            studentId,
            "studentId",
        );

        return apiClient.get(
            `/relatorios/aluno/${validStudentId}`,
        );
    },

    getModuleReport(moduleId) {
        const validModuleId = requirePositiveInteger(
            moduleId,
            "moduleId",
        );

        return apiClient.get(
            `/relatorios/modulo/${validModuleId}`,
        );
    },
});
