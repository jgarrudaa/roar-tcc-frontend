import { APP_CONFIG } from "../config/app-config.js";
import { atividadesApi } from "../api/atividades-api.js";
import { alunosApi } from "../api/alunos-api.js";
import { storage } from "../utils/storage.js";

async function readMock(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error("Não foi possível carregar os dados de demonstração.");
    return response.json();
}

async function getMockContext(moduleId, stage) {
    const [student, modulePayload] = await Promise.all([
        readMock("/public/mocks/aluno-atual.json"),
        readMock("/public/mocks/modulos.json"),
    ]);
    const module = modulePayload.modules.find((item) => item.id === moduleId);
    if (!module) throw new Error("Módulo não encontrado.");
    const activity = module.activities.find((item) => item.stage === stage);
    if (!activity) throw new Error("Etapa não encontrada.");
    return { student, module, activity };
}

export const atividadeService = Object.freeze({
    async getContext(moduleId, stage) {
        if (APP_CONFIG.useMocks) return getMockContext(moduleId, stage);
        const [student, activity] = await Promise.all([
            alunosApi.getCurrent(),
            atividadesApi.get(moduleId, stage),
        ]);
        return { student, module: activity.module, activity };
    },
    async registerAttempt(activityId, data) {
        if (APP_CONFIG.useMocks) return { accepted: true, ...data };
        return atividadesApi.saveAttempt(activityId, data);
    },
    async complete(activityId, data) {
        if (APP_CONFIG.useMocks) {
            const [moduleId, stageValue] = activityId.match(/^(.*)-(\d)$/)?.slice(1) ?? [];
            if (moduleId && stageValue) {
                const progress = storage.getMockProgress();
                const completedStages = new Set(progress[moduleId]?.completedStages ?? []);
                completedStages.add(Number(stageValue));
                progress[moduleId] = { completedStages: [...completedStages].sort() };
                storage.setMockProgress(progress);
            }
            return { completed: true, ...data };
        }
        return atividadesApi.complete(activityId, data);
    },
});
