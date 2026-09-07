import { modulosApi } from "../api/modulos-api.js";

const MODULE_PRESENTATION = Object.freeze({
    "corpo humano": { icon: "fi fi-br-portrait", color: "a" },
    cores: { icon: "fi fi-br-palette", color: "b" },
    animais: { icon: "fi fi-br-paw", color: "a" },
    emoções: { icon: "fi fi-br-grin-alt", color: "b" },
    emocoes: { icon: "fi fi-br-grin-alt", color: "b" },
    comida: { icon: "fi fi-br-hamburger", color: "b" },
    família: { icon: "fi fi-br-users", color: "a" },
    familia: { icon: "fi fi-br-users", color: "a" },
    casa: { icon: "fi fi-br-house-chimney", color: "a" },
    escola: { icon: "fi fi-br-backpack", color: "b" },
});

const DEFAULT_PRESENTATION = Object.freeze({ icon: "fi fi-br-puzzle-pieces", color: "a" });

function normalizeModule(module) {
    const id = Number(module?.id);
    const title = String(module?.nome ?? "").trim();
    if (!Number.isInteger(id) || id <= 0 || !title) return null;

    const presentation = MODULE_PRESENTATION[title.toLocaleLowerCase("pt-BR")] ?? DEFAULT_PRESENTATION;
    return Object.freeze({
        id,
        title,
        active: module.ativo !== false,
        icon: presentation.icon,
        color: presentation.color,
        totalActivities: Math.max(0, Number(module.total_atividades) || 0),
        completedActivities: Math.max(0, Number(module.atividades_concluidas) || 0),
        progress: Math.min(100, Math.max(0, Number(module.progresso_pct) || 0)),
        status: ["available", "in_progress", "completed", "preparation"].includes(module.status)
            ? module.status
            : "preparation",
        nextStage: Number.isInteger(Number(module.proxima_etapa))
            ? Number(module.proxima_etapa)
            : null,
    });
}

export const moduloService = Object.freeze({
    async listJourney() {
        const payload = await modulosApi.list();
        if (!Array.isArray(payload)) {
            throw new Error("A API retornou uma lista de módulos inválida.");
        }
        return payload.map(normalizeModule).filter(Boolean).filter((module) => module.active);
    },
    async getActivities(moduleId, studentId) {
        const payload = await modulosApi.getActivities(moduleId, studentId);
        if (!payload || !Array.isArray(payload.atividades)) {
            throw new Error("A API retornou um módulo de atividades inválido.");
        }
        return payload.atividades;
    },
});
