import { showToast } from "../../components/toast.js";
import { createActivityController } from "../../features/atividades/atividade-controller.js";

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
        "levelBadge",
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

async function initialize() {
    try {
        validateElements();

        const controller =
            await createActivityController({
                moduleId,
                stage,
                elements,
            });

        if (!controller) {
            return;
        }

        elements.repeatButton
            .addEventListener(
                "click",
                controller.repeatInstruction,
            );

        elements.nextButton
            .addEventListener(
                "click",
                controller.next,
            );

        controller.start();
    } catch (error) {
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