import { apiClient } from "../api/api-client.js";

export const DEFAULT_GAME_SETTINGS = Object.freeze({
    pieceCount: null,
    showHints: true,
    memoryPreviewSeconds: 5,
    advanceDelaySeconds: 1,
});

export function normalizeGameSettings(value = {}) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("O servidor retornou ajustes de jogos inválidos.");
    }
    const settings = { ...DEFAULT_GAME_SETTINGS, ...value };
    if (![null, 2, 4, 6].includes(settings.pieceCount) ||
        typeof settings.showHints !== "boolean" ||
        ![3, 5, 8, 10].includes(settings.memoryPreviewSeconds) ||
        ![1, 2, 3, 5].includes(settings.advanceDelaySeconds)) {
        throw new Error("Confira os valores dos ajustes dos jogos.");
    }
    return Object.freeze({
        pieceCount: settings.pieceCount,
        showHints: settings.showHints,
        memoryPreviewSeconds: settings.memoryPreviewSeconds,
        advanceDelaySeconds: settings.advanceDelaySeconds,
    });
}

function requireStudentId(value) {
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Selecione um aluno válido.");
    return id;
}

export const gameSettingsService = Object.freeze({
    async getCurrent() {
        return normalizeGameSettings(await apiClient.get("/alunos/preferencias-jogos"));
    },
    async getForStudent(studentId) {
        const id = requireStudentId(studentId);
        return normalizeGameSettings(await apiClient.get(`/professores/alunos/${id}/preferencias-jogos`));
    },
    async saveForStudent(studentId, settings) {
        const id = requireStudentId(studentId);
        const payload = normalizeGameSettings(settings);
        return normalizeGameSettings(await apiClient.patch(`/professores/alunos/${id}/preferencias-jogos`, payload));
    },
});
