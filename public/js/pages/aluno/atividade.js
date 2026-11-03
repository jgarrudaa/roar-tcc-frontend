import { showToast } from "../../components/toast.js";
import { createActivityController } from "../../features/atividades/atividade-controller.js?v=4";
import { atividadeService } from "../../services/atividade-service.js"


let activeController = null;
let pageClosed = false;
let moduleContext = null;
let stageRequestId = 0;
window.addEventListener("pagehide", () => {
    pageClosed = true;
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


async function openStage(stageToOpen) {
    if (pageClosed) return;

    const requestId = ++stageRequestId;

    activeController?.destroy();
    activeController = null;

    const controller = await createActivityController({
        moduleId,
        stage: stageToOpen,
        elements,
        moduleContext,
        onStageChange: openStage,
    });

    if (
        pageClosed ||
        requestId !== stageRequestId
    ) {
        controller?.destroy();
        return;
    }

    if (!controller) return;

    activeController = controller;

    const url = new URL(window.location.href);
    url.searchParams.set("modulo", String(moduleId));
    url.searchParams.set("etapa", String(stageToOpen));

    window.history.replaceState(
        window.history.state,
        "",
        url,
    );

    controller.start();
}

async function initialize() {
    try {
        validateElements();

        elements.backButton?.addEventListener("click", (event) => {
            if (
                event.ctrlKey ||
                event.metaKey ||
                event.shiftKey ||
                event.altKey
            ) {
                return;
            }

            event.preventDefault();
            activeController?.previous();
        });

        elements.repeatButton.addEventListener("click", () => {
            activeController?.repeatInstruction();
        });

        elements.nextButton.addEventListener("click", () => {
            activeController?.next();
        });

        moduleContext =
            await atividadeService.loadModuleContext(moduleId);

        if (pageClosed) return;

        await openStage(stage);
    } catch (error) {
        if (pageClosed) return;
        console.error(
            "Erro ao abrir atividade:",
            error,
        );

        if (elements.stage) {
            const errorContainer =
                document.createElement("div");

            const errorTitle =
                document.createElement("h2");

            const errorDescription =
                document.createElement("p");

            errorContainer.className =
                "activity-error";

            errorTitle.textContent =
                "Não foi possível abrir a atividade";

            errorDescription.textContent =
                error?.message ||
                "Ocorreu um erro inesperado.";

            errorContainer.append(
                errorTitle,
                errorDescription,
            );

            elements.stage.replaceChildren(
                errorContainer,
            );
        }

        if (elements.instruction) {
            elements.setInstruction(
                "Tente novamente em alguns instantes.",
            );
        }

        if (elements.message) {
            elements.setMessage(
                "Não se preocupe. Seus dados continuam seguros.",
            );
        }

        showToast(
            error?.message ||
            "Não foi possível abrir a atividade.",
            "error",
        );
    }
}

initialize();
