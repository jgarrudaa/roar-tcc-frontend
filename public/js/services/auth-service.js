import { authApi } from "../api/auth-api.js";
import { APP_CONFIG } from "../config/app-config.js";
import {
    isValidEmail,
    isValidPin,
    required,
} from "../utils/validators.js";
import { sessionService } from "./session-service.js";

function normalizeEmail(email) {
    return String(email ?? "").trim().toLowerCase();
}

function normalizeTeacherSession(response) {
    const teacher = response?.professor;

    if (!response?.token || !teacher?.id) {
        throw new Error(
            "O servidor retornou uma sessão de professor inválida.",
        );
    }

    return {
        token: response.token,
        role: "teacher",
        user: {
            id: teacher.id,
            name: teacher.nome,
            email: teacher.email,
        },
    };
}

function normalizeStudentSession(response) {
    if (!response?.token || !response?.user?.id) {
        throw new Error(
            "O servidor retornou uma sessão de aluno inválida.",
        );
    }

    return {
        token: response.token,
        role: response.role ?? "student",
        user: {
            id: response.user.id,
            name: response.user.name,
            email: response.user.email,
            schoolYear: response.user.schoolYear,
            supportLevel: response.user.supportLevel,
        },
    };
}

function normalizeTeacherRegistration(response) {
    if (response?.erro) {
        throw new Error(response.erro);
    }

    const teacher = response?.professor;

    if (!teacher?.id) {
        throw new Error(
            "O servidor não confirmou o cadastro do professor.",
        );
    }

    return {
        id: teacher.id,
        name: teacher.nome,
        email: teacher.email,
        cpf: teacher.cpf,
        emailVerified: Boolean(response?.email_verificado),
        emailSent: response?.email_enviado !== false,
        message: response?.mensagem ?? "Cadastro realizado.",
    };
}

function normalizeVerificationCode(value) {
    const code = String(value ?? "").replace(/\D/g, "");
    if (code.length !== 6) {
        throw new Error("O código deve possuir 6 números.");
    }
    return code;
}

function createMockTeacherSession(email) {
    return {
        token: "mock-teacher-token",
        role: "teacher",
        user: {
            id: 1,
            name: "Professor demonstrativo",
            email,
        },
    };
}

function createMockStudentSession(email) {
    return {
        token: "mock-student-token",
        role: "student",
        user: {
            id: 1,
            name: "Aluno demonstrativo",
            email,
        },
    };
}

async function loginTeacher({ email, password }) {
    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail) || !required(password)) {
        throw new Error(
            "Informe um e-mail e uma senha válidos.",
        );
    }

    if (APP_CONFIG.useMocks) {
        return sessionService.start(
            createMockTeacherSession(normalizedEmail),
        );
    }

    const response = await authApi.loginTeacher({
        email: normalizedEmail,
        password,
    });

    return sessionService.start(
        normalizeTeacherSession(response),
    );
}

async function loginStudent({ email, pin }) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedPin = String(pin ?? "").trim();

    if (
        !isValidEmail(normalizedEmail) ||
        !isValidPin(normalizedPin)
    ) {
        throw new Error(
            "Informe um e-mail válido e um PIN de quatro dígitos.",
        );
    }

    if (APP_CONFIG.useMocks) {
        return sessionService.start(
            createMockStudentSession(normalizedEmail),
        );
    }

    const response = await authApi.loginStudent({
        email: normalizedEmail,
        pin: normalizedPin,
    });

    return sessionService.start(
        normalizeStudentSession(response),
    );
}

async function registerTeacher(data) {
    const normalizedData = {
        name: String(data?.name ?? "").trim(),
        cpf: String(data?.cpf ?? "").trim(),
        email: normalizeEmail(data?.email),
        password: String(data?.password ?? ""),
    };

    const isInvalid =
        !required(normalizedData.name) ||
        !required(normalizedData.cpf) ||
        !isValidEmail(normalizedData.email) ||
        !required(normalizedData.password);

    if (isInvalid) {
        throw new Error(
            "Preencha corretamente todos os dados do professor.",
        );
    }

    if (APP_CONFIG.useMocks) {
        return {
            id: 1,
            name: normalizedData.name,
            cpf: normalizedData.cpf,
            email: normalizedData.email,
            emailVerified: false,
            emailSent: true,
            message: "Cadastro demonstrativo realizado.",
        };
    }

    const response = await authApi.registerTeacher(
        normalizedData,
    );

    return normalizeTeacherRegistration(response);
}

async function confirmTeacherEmail(email, code) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedCode = normalizeVerificationCode(code);

    if (!isValidEmail(normalizedEmail)) {
        throw new Error("Informe um e-mail válido.");
    }

    const response = await authApi.confirmTeacherEmail(
        normalizedEmail,
        normalizedCode,
    );

    return response?.mensagem ?? "E-mail confirmado com sucesso.";
}

async function resendTeacherEmailCode(email) {
    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
        throw new Error("Informe um e-mail válido.");
    }

    const response = await authApi.resendTeacherEmailCode(normalizedEmail);
    return response?.mensagem ?? "Se o cadastro estiver pendente, enviaremos um novo código.";
}

export const authService = Object.freeze({
    loginTeacher,
    loginStudent,
    registerTeacher,
    confirmTeacherEmail,
    resendTeacherEmailCode,
});
