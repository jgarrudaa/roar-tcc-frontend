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

export const alunosApi = Object.freeze({
    getCurrent() {
        return apiClient.get("/alunos/me");
    },

    listByTeacher(teacherId) {
        const validTeacherId = requirePositiveInteger(
            teacherId,
            "teacherId",
        );

        return apiClient.get(
            `/professores/aluno/professor/${validTeacherId}`,
        );
    },

    create(studentData) {
        return apiClient.post(
            "/professores/cadastrar-aluno",
            studentData,
        );
    },

    getProfile(studentId) {
        const validStudentId = requirePositiveInteger(
            studentId,
            "studentId",
        );

        return apiClient.get(
            `/professores/alunos/perfil/${validStudentId}`,
        );
    },

    getPerformance(studentId) {
        const validStudentId = requirePositiveInteger(
            studentId,
            "studentId",
        );

        return apiClient.get(
            `/professores/desempenho/aluno/${validStudentId}`,
        );
    },

    update(studentId, studentData) {
        const validStudentId = requirePositiveInteger(
            studentId,
            "studentId",
        );

        return apiClient.put(
            `/professores/alunos/${validStudentId}`,
            studentData,
        );
    },

    remove(studentId) {
        const validStudentId = requirePositiveInteger(
            studentId,
            "studentId",
        );

        return apiClient.delete(
            `/professores/alunos/${validStudentId}`,
        );
    },
});