import { createActivityLifecycle } from "./activity-lifecycle.js";
import {
    audioService,
} from "../../services/audio-service.js";

import {
    createButton,
    createImage,
    shuffle,
} from "./activity-helpers.js";


function normalizeAnswer(value) {
    return String(value ?? "")
        .trim()
        .toLocaleUpperCase("en-US");
}


function getOptionLimit(supportLevel) {
    if (supportLevel === 1) {
        return 2;
    }

    if (supportLevel === 2) {
        return 3;
    }

    return 4;
}


function createOptions(
    currentItem,
    moduleItems,
    optionLimit,
) {
    const correctAnswer =
        normalizeAnswer(currentItem.en);

    const distractors =
        moduleItems.filter(
            (moduleItem) =>
                normalizeAnswer(
                    moduleItem.en,
                ) !== correctAnswer,
        );

    return shuffle([
        currentItem,
        ...shuffle(distractors).slice(
            0,
            optionLimit - 1,
        ),
    ]);
}


export function createAssociateActivity(
    context,
) {
    const lifecycle = createActivityLifecycle();
    const {
        activity,
        module,
        student,
        elements,
        onCorrect,
        onWrong,
    } = context;

    const item = activity.item;

    let resolved = false;


    function getInstruction() {
        return (
            activity.instruction ||
            "Observe a imagem. Escolha a palavra correta."
        );
    }


    function speakEnglishWord(word) {
        audioService.speak(
            word,
            "en-US",
        );
    }


    function handlePromptImage() {
        speakEnglishWord(item.en);

        elements.setMessage(
            "Ouça novamente. Depois, escolha a palavra.",
        );
    }


    function handleOption(
        option,
        button,
        optionsContainer,
    ) {
        if (resolved && normalizeAnswer(option.en) !== normalizeAnswer(item.en)) {
            return;
        }
        /*
         * Toda alternativa pronuncia sua própria
         * palavra quando for selecionada.
         */
        speakEnglishWord(option.en);

        /*
         * Após a conclusão, apenas a resposta correta
         * permanece disponível para repetir a palavra.
         */
        if (resolved) {
            elements.setMessage(
                `Esta palavra é ${option.en}.`,
            );

            return;
        }

        const selectedAnswer =
            normalizeAnswer(option.en);

        const correctAnswer =
            normalizeAnswer(item.en);

        if (
            selectedAnswer ===
            correctAnswer
        ) {
            resolved = true;
            optionsContainer.querySelectorAll("button").forEach((candidate) => {
                candidate.disabled = candidate !== button;
            });

            button.classList.add(
                "is-correct",
            );

            button.setAttribute(
                "aria-label",
                "Resposta correta. Ouvir novamente.",
            );

            elements.setMessage(
                "Muito bem! Você encontrou a palavra correta.",
            );

            elements.setProgress(1, 1);

            elements.nextButton.disabled =
                false;

            onCorrect(item);

            return;
        }

        button.classList.add(
            "is-wrong",
        );

        elements.setMessage(
            "Esta não é a palavra da imagem. Tente novamente.",
        );

        onWrong(item);

        lifecycle.timeout(
            () => {
                button.classList.remove(
                    "is-wrong",
                );
            },
            650,
        );
    }


    function createPromptImageButton() {
        const button =
            document.createElement("button");

        const image =
            createImage(
                item,
                student.supportLevel,
            );

        button.type = "button";

        button.className =
            "association-prompt-button";

        button.setAttribute(
            "aria-label",
            "Ouvir a palavra representada pela imagem",
        );

        button.title =
            "Clique para ouvir";

        image.alt =
            `Imagem de ${item.pt}`;

        button.append(image);

        lifecycle.listen(button,
            "click",
            handlePromptImage,
        );

        return button;
    }


    function createWordButton(option, optionsContainer) {
        const button =
            createButton(option.en);

        button.dataset.answer =
            option.en;

        button.setAttribute(
            "aria-label",
            `Selecionar e ouvir ${option.en}`,
        );

        lifecycle.listen(button,
            "click",
            () => {
                handleOption(
                    option,
                    button,
                    optionsContainer,
                );
            },
        );

        return button;
    }


    function render() {
        if (lifecycle.destroyed) return;
        resolved = false;

        elements.stage.replaceChildren();

        elements.nextButton.disabled =
            true;

        const content =
            document.createElement("div");

        const promptContainer =
            document.createElement("div");

        const promptHelp =
            document.createElement("span");

        const optionsContainer =
            document.createElement("div");

        content.className =
            "activity-content association-game";

        promptContainer.className =
            "association-prompt";

        promptHelp.className =
            "association-prompt-help";

        promptHelp.textContent =
            "Toque na imagem para ouvir.";

        optionsContainer.className =
            "choice-grid association-grid";

        promptContainer.append(
            createPromptImageButton(),
            promptHelp,
        );

        const options =
            createOptions(
                item,
                module.items,
                getOptionLimit(
                    student.supportLevel,
                ),
            );

        options.forEach(
            (option) => {
                optionsContainer.append(
                    createWordButton(option, optionsContainer),
                );
            },
        );

        content.append(
            promptContainer,
            optionsContainer,
        );

        elements.stage.append(
            content,
        );

        elements.setInstruction(
            getInstruction(),
        );

        elements.setMessage(
            "Observe com calma. Você pode tentar novamente.",
        );

        elements.setProgress(0, 1);
        if (student.supportLevel <= 2) {
            speakEnglishWord(item.en);
        }
    }


    return Object.freeze({
        destroy() {
            lifecycle.destroy();
            audioService.stop();
        },
        start: render,

        repeatInstruction() {
            if (lifecycle.destroyed) return;
            audioService.speak(
                getInstruction(),
                "pt-BR",
            );
        },

        next() {
            return !lifecycle.destroyed && resolved;
        },
    });
}
