import { modulosApi } from "../api/modulos-api.js";
import { APP_CONFIG } from "../config/app-config.js";
import { storage } from "../utils/storage.js";

async function readMockModules() {
    const response = await fetch("/public/mocks/modulos.json");
    if (!response.ok) throw new Error("Não foi possível carregar os módulos.");
    const payload = await response.json();
    const savedProgress = storage.getMockProgress();
    return payload.modules.map((module) => ({
        ...module,
        completedStages: savedProgress[module.id]?.completedStages ?? [],
    }));
}

function withJourney(module) {
    const completedStages = [...new Set(module.completedStages ?? [])];
    const totalStages = module.activities?.length || 3;
    return {
        ...module,
        completedStages,
        progress: Math.round((completedStages.length / totalStages) * 100),
        nextStage: Math.min(totalStages, completedStages.length + 1),
    };
}

export const moduloService = Object.freeze({
    async listJourney() {
        const modules = APP_CONFIG.useMocks ? await readMockModules() : await modulosApi.getProgress();
        const displayOrder = ["corpo-humano", "cores", "animais-fazenda", "emocoes", "comida", "familia", "casa", "escola"];
        const position = (module) => {
            const index = displayOrder.indexOf(module.id);
            return index === -1 ? displayOrder.length : index;
        };
        return modules
            .map(withJourney)
            .sort((first, second) => position(first) - position(second));
    },
});
