import { showToast } from "../../components/toast.js";
import { createActivityController } from "../../features/atividades/atividade-controller.js";

const parameters = new URLSearchParams(window.location.search);
const moduleId = parameters.get("modulo") || "corpo-humano";
const stage = Math.min(3, Math.max(1, Number(parameters.get("etapa")) || 1));

const elements = {
    title: document.querySelector("#activity-title"),
    instruction: document.querySelector("#activity-instruction"),
    levelBadge: document.querySelector("#level-badge"),
    stage: document.querySelector("#activity-stage"),
    message: document.querySelector("#lex-message"),
    nextButton: document.querySelector("#next-button"),
    repeatButton: document.querySelector("#repeat-instruction"),
    progress: document.querySelector("#activity-progress"),
    progressLabel: document.querySelector("#progress-label"),
    setInstruction(value) { this.instruction.textContent = value; },
    setMessage(value) { this.message.textContent = value; },
    setProgress(value, max) {
        this.progress.max = Math.max(1, max);
        this.progress.value = Math.min(max, value);
        this.progressLabel.textContent = `${Math.min(max, value)} de ${max}`;
    },
};

async function initialize() {
    try {
        const controller = await createActivityController({ moduleId, stage, elements });
        if (!controller) return;
        elements.repeatButton.addEventListener("click", controller.repeatInstruction);
        elements.nextButton.addEventListener("click", controller.next);
        controller.start();
    } catch (error) {
        elements.stage.innerHTML = `<div class="activity-error"><h2>Não foi possível abrir a atividade</h2><p>${error.message}</p></div>`;
        elements.setInstruction("Tente novamente em alguns instantes.");
        elements.setMessage("Não se preocupe. Seus dados continuam seguros.");
        showToast(error.message, "error");
    }
}

initialize();
