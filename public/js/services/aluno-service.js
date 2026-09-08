import { alunosApi } from "../api/alunos-api.js";
import { APP_CONFIG } from "../config/app-config.js";
import {
    isValidCpf,
    isValidEmail,
    required,
} from "../utils/validators.js";

const TRIAGE_OPTIONS = Object.freeze({
    communication: Object.freeze([
        "A1",
        "A2",
        "A3",
    ]),

    reading: Object.freeze([
        "B1",
        "B2",
        "B3",
    ]),
});

const LEVEL_BY_MODE = Object.freeze({
    "visual guiado": 1,
    "suporte visual puro": 1,

    "interativo visual": 2,
    "aprendiz guiado": 2,

    verbal: 3,
    "autonomia contextual": 3,
    "autonomia contextural": 3,
});

function normalizeEmail(email) {
    return String(email ?? "")
        .trim()
        .toLowerCase();
}

function normalizeText(value) {
    return String(value ?? "").trim();
}

function normalizePin(pin) {
    return String(pin ?? "")
        .replace(/\D/g, "")
        .slice(0, 4);
}

function generatePin() {
    if (
        window.crypto &&
        typeof window.crypto.getRandomValues === "function"
    ) {
        const randomValue = new Uint32Array(1);
        window.crypto.getRandomValues(randomValue);

        return String(
            1000 + (randomValue[0] % 9000),
        );
    }

    return String(
        Math.floor(1000 + Math.random() * 9000),
    );
}

function validateTriage(communication, reading) {
    const validCommunication =
        TRIAGE_OPTIONS.communication.includes(
            communication,
        );

    const validReading =
        TRIAGE_OPTIONS.reading.includes(reading);

    if (!validCommunication || !validReading) {
        throw new Error(
            "As respostas da triagem são inválidas.",
        );
    }
}

function calculateLevel(communication, reading) {
    validateTriage(communication, reading);

    if (
        communication === "A1" ||
        reading === "B1"
    ) {
        return 1;
    }

    if (
        communication === "A3" &&
        reading === "B3"
    ) {
        return 3;
    }

    return 2;
}

function validateStudentData(data) {
    if (!required(data.name)) {
        throw new Error(
            "Informe o nome do aluno.",
        );
    }

    if (!isValidCpf(data.cpf)) {
        throw new Error(
            "Informe um CPF válido para o aluno.",
        );
    }

    if (!isValidEmail(data.email)) {
        throw new Error(
            "Informe um e-mail válido para o aluno.",
        );
    }

    if (!required(data.schoolYear)) {
        throw new Error(
            "Selecione o ano escolar.",
        );
    }

    if (!data.teacherId) {
        throw new Error(
            "Não foi possível identificar o professor.",
        );
    }

    validateTriage(
        data.communication,
        data.reading,
    );
}

function mapStudentCreationPayload(data, pin) {
    return {
        professor_id: Number(data.teacherId),
        nome: normalizeText(data.name),
        email: normalizeEmail(data.email),
        cpf_aluno: normalizeText(data.cpf),
        ano_escolar: normalizeText(data.schoolYear),
        pergunta_a: data.communication,
        pergunta_b: data.reading,
        suporte_audio: Boolean(data.audioSupport),
        pin_acesso: pin,
    };
}

function normalizeCreatedStudent(
    response,
    originalData,
    pin,
) {
    if (response?.erro) {
        throw new Error(response.erro);
    }

    const studentId =
        response?.aluno_id ?? response?.id;

    if (!studentId) {
        throw new Error(
            "O servidor não confirmou o cadastro do aluno.",
        );
    }

    const calculatedLevel =
        response?.nivel_identificado ??
        calculateLevel(
            originalData.communication,
            originalData.reading,
        );

    return {
        id: Number(studentId),
        name: normalizeText(originalData.name),
        email: normalizeEmail(originalData.email),
        schoolYear: normalizeText(
            originalData.schoolYear,
        ),
        level: Number(calculatedLevel),
        mode: response?.modo_definido ?? null,
        pin: normalizePin(
            response?.pin ?? pin,
        ),
    };
}

function getLevelFromMode(mode) {
    const normalizedMode = normalizeText(mode)
        .toLowerCase();

    return LEVEL_BY_MODE[normalizedMode] ?? 1;
}

function normalizeStudent(student) {
    return {
        id: Number(student?.id),
        teacherId: Number(student?.professor_id),
        name: student?.nome ?? "Aluno sem nome",
        email: student?.email ?? "",
        cpf: student?.cpf_aluno ?? "",
        schoolYear:
            student?.ano_escolar ?? "Não informado",
        mode:
            student?.modo_aprendizagem ??
            "Não informado",
        level: getLevelFromMode(
            student?.modo_aprendizagem,
        ),
        xp: Number(student?.xp_total ?? 0),
        createdAt: student?.criado_em ?? null,
    };
}

async function create(data) {
    const normalizedData = {
        teacherId: Number(data?.teacherId),
        name: normalizeText(data?.name),
        cpf: normalizeText(data?.cpf),
        email: normalizeEmail(data?.email),
        schoolYear: normalizeText(
            data?.schoolYear,
        ),
        communication: data?.communication,
        reading: data?.reading,
        audioSupport: Boolean(
            data?.audioSupport,
        ),
    };

    validateStudentData(normalizedData);

    const pin = generatePin();

    if (APP_CONFIG.useMocks) {
        return {
            id: Date.now(),
            ...normalizedData,
            level: calculateLevel(
                normalizedData.communication,
                normalizedData.reading,
            ),
            pin,
        };
    }

    const payload = mapStudentCreationPayload(
        normalizedData,
        pin,
    );

    const response = await alunosApi.create(payload);

    return normalizeCreatedStudent(
        response,
        normalizedData,
        pin,
    );
}

async function listByTeacher(teacherId) {
    if (!teacherId) {
        throw new Error(
            "Não foi possível identificar o professor.",
        );
    }

    const response =
        await alunosApi.listByTeacher(teacherId);

    if (!Array.isArray(response)) {
        throw new Error(
            "O servidor retornou uma lista de alunos inválida.",
        );
    }

    return response.map(normalizeStudent);
}

async function getPerformance(studentId) {
    if (!studentId) {
        throw new Error(
            "Selecione um aluno válido.",
        );
    }

    const response =
        await alunosApi.getPerformance(studentId);

    return Array.isArray(response)
        ? response
        : [];
}

async function update(studentId, data) {
    if (!studentId) {
        throw new Error(
            "Selecione um aluno válido.",
        );
    }

    return alunosApi.update(studentId, data);
}



async function resetPin(
    studentId,
    newPin,
    pinConfirmation,
) {
    if (!studentId) {
        throw new Error(
            "Selecione um aluno válido.",
        );
    }

    const normalizedPin =
        normalizePin(newPin);

    const normalizedConfirmation =
        normalizePin(pinConfirmation);

    if (
        !/^\d{4}$/.test(normalizedPin)
    ) {
        throw new Error(
            "O novo PIN deve possuir exatamente 4 números.",
        );
    }

    if (
        normalizedPin !==
        normalizedConfirmation
    ) {
        throw new Error(
            "A confirmação do PIN não corresponde ao novo PIN.",
        );
    }

    return alunosApi.resetPin(
        studentId,
        {
            novo_pin: normalizedPin,

            confirmacao_pin:
                normalizedConfirmation,
        },
    );
}

async function remove(studentId) {
    if (!studentId) {
        throw new Error(
            "Selecione um aluno válido.",
        );
    }

    return alunosApi.remove(studentId);
}

export const alunoService = Object.freeze({
    calculateLevel,
    create,
    listByTeacher,
    getPerformance,
    update,
    resetPin,
    remove,
});
