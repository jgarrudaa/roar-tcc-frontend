import { showToast } from "../../components/toast.js";
import { createActivityController } from "../../features/atividades/atividade-controller.js?v=5";
import { atividadeService } from "../../services/atividade-service.js";
import { activityProgressService, activityFingerprint } from "../../services/activity-progress-service.js?v=2";


let activeController = null;
let pageClosed = false;
let moduleContext = null;
let stageRequestId = 0;
window.addEventListener("pagehide", () => {
    pageClosed = true;
    stageRequestId += 1;
    activeController?.destroy();
});
window.addEventListener("pageshow", (event) => {
    if (event.persisted) window.location.reload();
});

const parameters =
    new URLSearchParams(
        window.location.search,
    );

const moduleId =
    parameters.get("modulo") || "1";

const stage = Math.max(
    1,
    Number(
        parameters.get("etapa"),
    ) || 1,
);

const elements = {
    backButton: document.querySelector(".activity-back"),
    title: document.querySelector(
        "#activity-title",
    ),

    instruction: document.querySelector(
        "#activity-instruction",
    ),

    levelBadge: document.querySelector(
        "#level-badge",
    ),

    stage: document.querySelector(
        "#activity-stage",
    ),

    message: document.querySelector(
        "#lex-message",
    ),

    nextButton: document.querySelector(
        "#next-button",
    ),

    repeatButton: document.querySelector(
        "#repeat-instruction",
    ),

    progress: document.querySelector(
        "#activity-progress",
    ),

    progressLabel: document.querySelector(
        "#progress-label",
    ),

    setInstruction(value) {
        this.instruction.textContent =
            String(value ?? "");
    },

    setMessage(value) {
        this.message.textContent =
            String(value ?? "");
    },

    setProgress(value, max) {
        const safeMax = Math.max(
            1,
            Number(max) || 1,
        );

        const safeValue = Math.min(
            safeMax,
            Math.max(
                0,
                Number(value) || 0,
            ),
        );

        this.progress.max = safeMax;
        this.progress.value = safeValue;

        this.progressLabel.textContent =
            `${safeValue} de ${safeMax}`;
    },
};

function validateElements() {
    const requiredElements = [
        "title",
        "instruction",
        "stage",
        "message",
        "nextButton",
        "repeatButton",
        "progress",
        "progressLabel",
    ];

    const missingElements =
        requiredElements.filter(
            (name) => !elements[name],
        );

    if (missingElements.length > 0) {
        throw new Error(
            `Elementos ausentes na página: ${missingElements.join(", ")}.`,
        );
    }
}


function requestIsCurrent(requestId) {
    return !pageClosed && requestId === stageRequestId;
}

function activityErrorMessage(error) {
    if (error?.code === "NETWORK_ERROR") {
        return "O serviço de atividades não respondeu. Tente novamente ou volte aos módulos.";
    }
    if (error?.code === "REQUEST_TIMEOUT" || error?.status === 408) {
        return "O serviço de atividades demorou para responder. Tente novamente.";
    }
    if (error?.status === 503 || error?.status === 502 || error?.status === 404) {
        return "O serviço de atividades está temporariamente indisponível. Tente novamente ou volte aos módulos.";
    }
    if (error?.status === 401) {
        return "Sua sessão expirou. Entre novamente para continuar.";
    }
    return "Não foi possível abrir esta atividade. Tente novamente ou escolha outro módulo.";
}

function showLoading() {
    elements.title.textContent = "Carregando atividade";
    elements.setInstruction("Preparando a próxima atividade.");
    elements.setMessage("Aguarde um momento.");
    elements.nextButton.disabled = true;
    elements.repeatButton.disabled = true;
    elements.stage.inert = false;
    elements.stage.classList.remove("memory-stage", "practice-stage");
    document.body.classList.remove("is-practice");
    const status = document.createElement("p");
    status.className = "activity-loading";
    status.setAttribute("role", "status");
    status.textContent = "Carregando atividade...";
    elements.stage.replaceChildren(status);
    if (elements.backButton) {
        elements.backButton.href = "atividades.html";
        elements.backButton.setAttribute("aria-label", "Voltar aos módulos");
    }
}

function renderFailure(error, failedStage, requestId) {
    if (!requestIsCurrent(requestId)) return;
    activeController?.destroy();
    activeController = null;
    // A retry obtains fresh profile/module/settings instead of reusing bad context.
    moduleContext = null;
    console.error("Erro ao abrir atividade:", error);
    const message = activityErrorMessage(error);
    elements.title.textContent = "Atividade indisponível";
    elements.setInstruction("Você pode tentar novamente ou voltar aos módulos.");
    elements.setMessage("Vamos continuar assim que a atividade estiver disponível.");
    elements.nextButton.disabled = true;
    elements.repeatButton.disabled = true;
    elements.stage.inert = false;
    elements.stage.classList.remove("memory-stage", "practice-stage");
    document.body.classList.remove("is-practice");
    if (elements.backButton) {
        elements.backButton.href = "atividades.html";
        elements.backButton.setAttribute("aria-label", "Voltar aos módulos");
    }
    const panel = document.createElement("section");
    panel.className = "activity-error activity-error-recovery";
    const heading = document.createElement("h2");
    heading.textContent = "Não foi possível abrir a atividade";
    const description = document.createElement("p");
    description.textContent = message;
    const actions = document.createElement("div");
    actions.className = "activity-error-actions";
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "next-button";
    retry.textContent = "Tentar novamente";
    retry.addEventListener("click", () => {
        if (!requestIsCurrent(requestId) || retry.disabled) return;
        retry.disabled = true;
        void openStage(failedStage);
    });
    const back = document.createElement("a");
    back.href = "atividades.html";
    back.className = "activity-error-back";
    back.textContent = "Voltar aos módulos";
    actions.append(retry, back);
    panel.append(heading, description, actions);
    elements.stage.replaceChildren(panel);
    showToast(message, "error");
}

async function openStage(stageToOpen, { resumeRequested = false } = {}) {
    if (pageClosed) return false;
    const requestId = ++stageRequestId;
    let targetStage = stageToOpen;
    let controller = null;
    activeController?.destroy();
    activeController = null;
    if (!moduleContext) {
        showLoading();
    }
    try {
        if (!moduleContext) {
            const loaded = await atividadeService.loadModuleContext(moduleId);
            if (!requestIsCurrent(requestId)) return false;
            moduleContext = loaded;
        }
        if (resumeRequested) {
            const draft = activityProgressService.read(moduleContext.student.id, moduleContext.module.id,
                activityFingerprint(moduleContext));
            const requestedStageExists = moduleContext.module.activities.some(item => item.order === stageToOpen);
            targetStage = draft && moduleContext.module.activities.some(item => item.order === draft.stage)
                ? draft.stage : (!requestedStageExists ? moduleContext.module.activities[0].order : stageToOpen);
        }
        controller = await createActivityController({
            moduleId,
            stage: targetStage,
            elements,
            moduleContext,
            onStageChange: nextStage => openStage(nextStage),
        });
        if (!requestIsCurrent(requestId)) {
            controller?.destroy();
            return false;
        }
        if (!controller) return false;
        activeController = controller;
        const url = new URL(window.location.href);
        url.searchParams.set("modulo", String(moduleId));
        url.searchParams.set("etapa", String(targetStage));
        window.history.replaceState(window.history.state, "", url);
        controller.start();
        return true;
    } catch (error) {
        if (!requestIsCurrent(requestId)) {
            controller?.destroy();
            return false;
        }
        renderFailure(error, targetStage, requestId);
        return false;
    }
}

async function initialize() {
    validateElements();
    elements.backButton?.addEventListener("click", event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !activeController) return;
        event.preventDefault();
        activeController.previous();
    });
    elements.repeatButton.addEventListener("click", () => activeController?.repeatInstruction());
    elements.nextButton.addEventListener("click", () => activeController?.next());
    await openStage(stage, { resumeRequested: parameters.get("retomar") === "1" });
}

void initialize();
