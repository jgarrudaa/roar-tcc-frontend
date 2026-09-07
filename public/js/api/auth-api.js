import { apiClient } from "./api-client.js";

function mapTeacherCredentials({ email, password }) {
    return {
        email: email.trim().toLowerCase(),
        senha: password,
    };
}

function mapTeacherRegistration({
    name,
    cpf,
    email,
    password,
}) {
    return {
        nome: name.trim(),
        cpf: cpf.trim(),
        email: email.trim().toLowerCase(),
        senha: password,
    };
}

function mapStudentCredentials({ email, pin }) {
    return {
        email: email.trim().toLowerCase(),
        pin: String(pin).trim(),
    };
}

export const authApi = Object.freeze({
    loginStudent(credentials) {
        return apiClient.post(
            "/alunos/login",
            mapStudentCredentials(credentials),
        );
    },

    loginTeacher(credentials) {
        return apiClient.post(
            "/professores/login",
            mapTeacherCredentials(credentials),
        );
    },

    registerTeacher(data) {
        return apiClient.post(
            "/professores/cadastro",
            mapTeacherRegistration(data),
        );
    },

    confirmTeacherEmail(email, code) {
        return apiClient.post(
            "/professores/email/confirmar",
            {
                email: String(email).trim().toLowerCase(),
                codigo: String(code).replace(/\D/g, ""),
            },
        );
    },

    resendTeacherEmailCode(email) {
        return apiClient.post(
            "/professores/email/reenviar-codigo",
            {
                email: String(email).trim().toLowerCase(),
            },
        );
    },
});
