import { perfilAlunoApi } from "../api/perfil-aluno-api.js";


const LEARNING_MODES = Object.freeze({
    "nível 1 - suporte visual puro": Object.freeze({
        number: 1,
        name: "Suporte Visual Puro",
        label: "Nível 1 — Suporte Visual Puro",
        className: "nivel-1",
    }),

    "suporte visual puro": Object.freeze({
        number: 1,
        name: "Suporte Visual Puro",
        label: "Nível 1 — Suporte Visual Puro",
        className: "nivel-1",
    }),

    "visual guiado": Object.freeze({
        number: 1,
        name: "Suporte Visual Puro",
        label: "Nível 1 — Suporte Visual Puro",
        className: "nivel-1",
    }),

    "nível 2 - aprendiz guiado": Object.freeze({
        number: 2,
        name: "Aprendiz Guiado",
        label: "Nível 2 — Aprendiz Guiado",
        className: "nivel-2",
    }),

    "aprendiz guiado": Object.freeze({
        number: 2,
        name: "Aprendiz Guiado",
        label: "Nível 2 — Aprendiz Guiado",
        className: "nivel-2",
    }),

    "interativo visual": Object.freeze({
        number: 2,
        name: "Aprendiz Guiado",
        label: "Nível 2 — Aprendiz Guiado",
        className: "nivel-2",
    }),

    "nível 3 - autonomia contextual": Object.freeze({
        number: 3,
        name: "Autonomia Contextual",
        label: "Nível 3 — Autonomia Contextual",
        className: "nivel-3",
    }),

    "autonomia contextual": Object.freeze({
        number: 3,
        name: "Autonomia Contextual",
        label: "Nível 3 — Autonomia Contextual",
        className: "nivel-3",
    }),

    verbal: Object.freeze({
        number: 3,
        name: "Autonomia Contextual",
        label: "Nível 3 — Autonomia Contextual",
        className: "nivel-3",
    }),
});


const DEFAULT_LEARNING_MODE = Object.freeze({
    number: 1,
    name: "Suporte Visual Puro",
    label: "Nível 1 — Suporte Visual Puro",
    className: "nivel-1",
});


function normalizeText(value, fallback = "") {
    const normalizedValue =
        String(value ?? "").trim();

    return normalizedValue || fallback;
}


function toSafeInteger(value, fallback = 0) {
    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue)) {
        return fallback;
    }

    return Math.max(
        0,
        Math.round(parsedValue),
    );
}


function createInitials(name) {
    const words = normalizeText(name)
        .split(/\s+/)
        .filter(Boolean);

    if (!words.length) {
        return "A";
    }

    const firstInitial =
        words[0].charAt(0);

    const lastInitial =
        words.length > 1
            ? words.at(-1).charAt(0)
            : "";

    return (
        firstInitial +
        lastInitial
    ).toLocaleUpperCase("pt-BR");
}


function getLearningMode(value) {
    const normalizedMode =
        normalizeText(value)
            .toLocaleLowerCase("pt-BR");

    return (
        LEARNING_MODES[normalizedMode] ??
        DEFAULT_LEARNING_MODE
    );
}


function normalizeStudent(payload) {
    if (
        !payload ||
        typeof payload !== "object" ||
        Array.isArray(payload)
    ) {
        throw new Error(
            "O servidor retornou um perfil de aluno inválido.",
        );
    }

    const id = Number(payload.id);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        throw new Error(
            "O servidor não identificou o aluno.",
        );
    }

    const name = normalizeText(
        payload.name ??
        payload.nome,
        "Aluno",
    );

    const email = normalizeText(
        payload.email,
        "Não informado",
    );

    const schoolYear = normalizeText(
        payload.schoolYear ??
        payload.ano_escolar,
        "Não informado",
    );

    const rawLearningMode =
        payload.supportLevel ??
        payload.modo_aprendizagem;

    const learningMode =
        getLearningMode(rawLearningMode);

    const xp = toSafeInteger(
        payload.xpTotal ??
        payload.xp_total,
    );

    return Object.freeze({
        id,
        name,
        firstName:
            name.split(/\s+/)[0] ||
            "Aluno",

        initials:
            createInitials(name),

        email,
        schoolYear,
        learningMode,
        xp,
    });
}


async function getCurrentStudent() {
    const response =
        await perfilAlunoApi.getCurrentStudent();

    return normalizeStudent(response);
}


export const perfilAlunoService = Object.freeze({
    getCurrentStudent,
});