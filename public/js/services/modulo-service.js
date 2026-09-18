import { modulosApi } from "../api/modulos-api.js";


const MODULE_PRESENTATION = Object.freeze({
    "corpo humano": {
        icon: "fi fi-br-portrait",
        color: "a",
    },

    "animais da fazenda": {
        icon: "fi fi-br-paw",
        color: "b",
    },

    fazenda: {
        icon: "fi fi-br-paw",
        color: "b",
    },

    cores: {
        icon: "fi fi-br-palette",
        color: "b",
    },

    animais: {
        icon: "fi fi-br-paw",
        color: "a",
    },

    emoções: {
        icon: "fi fi-br-grin-alt",
        color: "b",
    },

    emocoes: {
        icon: "fi fi-br-grin-alt",
        color: "b",
    },

    comida: {
        icon: "fi fi-br-hamburger",
        color: "b",
    },

    família: {
        icon: "fi fi-br-users",
        color: "a",
    },

    familia: {
        icon: "fi fi-br-users",
        color: "a",
    },

    casa: {
        icon: "fi fi-br-house-chimney",
        color: "a",
    },

    escola: {
        icon: "fi fi-br-backpack",
        color: "b",
    },
});


const DEFAULT_PRESENTATION = Object.freeze({
    icon: "fi fi-br-puzzle-pieces",
    color: "a",
});


const VALID_MODULE_STATUS = new Set([
    "preparation",
    "available",
    "in_progress",
    "completed",
]);


function normalizeNonNegativeInteger(value) {
    const parsedValue = Number(value);

    if (
        !Number.isInteger(parsedValue) ||
        parsedValue < 0
    ) {
        return 0;
    }

    return parsedValue;
}


function normalizePositiveInteger(value, fallback = 1) {
    const parsedValue = Number(value);

    if (
        !Number.isInteger(parsedValue) ||
        parsedValue <= 0
    ) {
        return fallback;
    }

    return parsedValue;
}


function normalizePercentage(value) {
    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue)) {
        return 0;
    }

    return Math.min(
        100,
        Math.max(0, Math.round(parsedValue)),
    );
}


function normalizeStatus(value, total, completed) {
    const status = String(value ?? "").trim();

    if (VALID_MODULE_STATUS.has(status)) {
        return status;
    }

    if (total === 0) {
        return "preparation";
    }

    if (completed >= total) {
        return "completed";
    }

    if (completed > 0) {
        return "in_progress";
    }

    return "available";
}


function normalizeModule(module) {
    const id = Number(module?.id);
    const title = String(module?.nome ?? "").trim();

    if (
        !Number.isInteger(id) ||
        id <= 0 ||
        !title
    ) {
        return null;
    }

    const normalizedTitle =
        title.toLocaleLowerCase("pt-BR");

    const presentation =
        MODULE_PRESENTATION[normalizedTitle] ??
        DEFAULT_PRESENTATION;

    const totalActivities =
        normalizeNonNegativeInteger(
            module.total_atividades,
        );

    const completedActivities =
        Math.min(
            totalActivities,
            normalizeNonNegativeInteger(
                module.atividades_concluidas,
            ),
        );

    const status = normalizeStatus(
        module.status,
        totalActivities,
        completedActivities,
    );

    const calculatedProgress =
        totalActivities > 0
            ? (
                completedActivities /
                totalActivities
            ) * 100
            : 0;

    const progress = normalizePercentage(
        module.progresso_pct ??
        calculatedProgress,
    );

    const nextStage =
        module.proxima_etapa === null ||
            module.proxima_etapa === undefined
            ? null
            : normalizePositiveInteger(
                module.proxima_etapa,
                1,
            );

    return Object.freeze({
        id,
        title,

        active:
            module.ativo !== false,

        icon:
            presentation.icon,

        color:
            presentation.color,

        status,

        progress,

        totalActivities,

        completedActivities,

        nextStage:
            status === "preparation"
                ? null
                : nextStage ?? 1,
    });
}


function normalizeModules(payload) {
    if (!Array.isArray(payload)) {
        throw new Error(
            "A API retornou uma lista de módulos inválida.",
        );
    }

    return payload
        .map(normalizeModule)
        .filter(Boolean)
        .filter((module) => module.active);
}


export const moduloService = Object.freeze({
    async listJourney() {
        const payload =
            await modulosApi.list();

        return normalizeModules(payload);
    },

    async getActivities(
        moduleId,
        studentId,
    ) {
        const payload =
            await modulosApi.getActivities(
                moduleId,
                studentId,
            );

        if (!Array.isArray(payload)) {
            throw new Error(
                "A API retornou uma lista de atividades inválida.",
            );
        }

        return payload;
    },
});