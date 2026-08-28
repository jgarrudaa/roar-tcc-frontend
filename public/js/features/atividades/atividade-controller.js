import { atividadeService } from "../../services/atividade-service.js";
import { createAssociateActivity } from "./associar.js";
import { createRecognizeActivity } from "./reconhecer.js";
import { createValidateActivity } from "./validar.js";

const FACTORIES = Object.freeze({
    recognize: createRecognizeActivity,
    associate: createAssociateActivity,
    validate: createValidateActivity,
});

export async function createActivityController({ moduleId, stage, elements }) {
    const context = await atividadeService.getContext(moduleId, stage);
    const { activity, module, student } = context;
    elements.title.textContent = module.title;
    elements.levelBadge.textContent = student.supportMode;

    if (activity.status !== "active") {
        elements.stage.innerHTML = '<div class="activity-blocked"><h2>Atividade bloqueada</h2><p>Seu professor ainda não liberou esta atividade.</p></div>';
        elements.setInstruction("Escolha outra atividade disponível.");
        elements.setMessage("Quando ela for liberada, você poderá continuar daqui.");
        return null;
    }

    const stats = { correct: 0, wrong: 0 };
    const factory = FACTORIES[activity.type];
    if (!factory) throw new Error("Tipo de atividade não suportado.");
    const engine = factory({
        ...context,
        elements,
        onCorrect: async (item) => {
            stats.correct += 1;
            await atividadeService.registerAttempt(activity.id, { itemId: item.id, correct: true });
        },
        onWrong: async (item) => {
            stats.wrong += 1;
            await atividadeService.registerAttempt(activity.id, { itemId: item.id, correct: false });
        },
    });

    return {
        start: engine.start,
        repeatInstruction: engine.repeatInstruction,
        async next() {
            const completed = engine.next();
            if (!completed) return;
            await atividadeService.complete(activity.id, stats);
            if (stage < 3) {
                window.location.href = `atividade.html?modulo=${encodeURIComponent(moduleId)}&etapa=${stage + 1}`;
            } else {
                window.location.href = "atividades.html";
            }
        },
    };
}
