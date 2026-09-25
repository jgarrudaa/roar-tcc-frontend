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

    const distractors = [];
    const registeredAnswers =
        new Set([correctAnswer]);

    moduleItems.forEach(
        (moduleItem) => {
            const answer =
                normalizeAnswer(
                    moduleItem.en,
                );

            if (
                !answer ||
                registeredAnswers.has(answer)
            ) {
                return;
            }

            registeredAnswers.add(answer);
            distractors.push(moduleItem);
        },
    );

    return shuffle([
        currentItem,
        ...shuffle(distractors).slice(
            0,
            optionLimit - 1,
        ),
    ]);
}


export function createValidateActivity(
    context,
) {
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
        if (activity.instruction) {
            return activity.instruction;
        }

        if (student.supportLevel === 1) {
            return "Escolha a imagem correta.";
        }

        if (student.supportLevel === 2) {
            return "Observe a imagem. Escolha a palavra correta.";
        }

        return "Analise a imagem. Escolha a resposta correta.";
    }


    function speakWord(word) {
        audioService.speak(
            word,
            "en-US",
        );
    }


    function handlePromptImage() {
        speakWord(item.en);

        elements.setMessage(
            "Ouça a palavra. Depois, escolha uma alternativa.",
        );
    }


    function handleOption(
        option,
        button,
    ) {
        /*
         * Cada alternativa fala a própria palavra.
         */
        speakWord(option.en);

        /*
         * Após o acerto, as alternativas continuam
         * funcionando como botões de pronúncia.
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

            button.classList.add(
                "is-correct",
            );

            button.setAttribute(
                "aria-label",
                "Resposta correta. Ouvir novamente.",
            );

            elements.setMessage(
                "Muito bem! Você escolheu a palavra correta.",
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

        window.setTimeout(
            () => {
                button.classList.remove(
                    "is-wrong",
                );
            },
            650,
        );
    }


    function createPromptButton() {
        const button =
            document.createElement("button");

        const image =
            createImage(
                item,
                student.supportLevel,
            );

        button.type = "button";

        button.className =
            "validation-image-button";

        button.title =
            "Clique para ouvir";

        button.setAttribute(
            "aria-label",
            "Ouvir a palavra representada pela imagem",
        );

        image.alt =
            `Imagem de ${item.pt}`;

        button.append(image);

        button.addEventListener(
            "click",
            handlePromptImage,
        );

        return button;
    }


    function createTextOption(option) {
        const button =
            createButton(option.en);

        button.dataset.answer =
            option.en;

        button.setAttribute(
            "aria-label",
            `Selecionar e ouvir ${option.en}`,
        );

        return button;
    }


    function createImageOption(option) {
        const button =
            createButton("");

        const image =
            createImage(option, 1);

        button.dataset.answer =
            option.en;

        button.setAttribute(
            "aria-label",
            `Selecionar imagem de ${option.pt}`,
        );

        button.append(image);

        return button;
    }


    function render() {
        resolved = false;

        elements.stage.replaceChildren();

        elements.nextButton.disabled =
            true;

        const content =
            document.createElement("div");

        const promptArea =
            document.createElement("div");

        const promptHelp =
            document.createElement("span");

        const optionsContainer =
            document.createElement("div");

        content.className =
            "activity-content validation-game";

        promptArea.className =
            "validation-prompt";

        promptHelp.className =
            "validation-prompt-help";

        promptHelp.textContent =
            "Toque na imagem para ouvir.";

        optionsContainer.className =
            student.supportLevel === 1
                ? "choice-grid validation-options validation-image-options"
                : "choice-grid validation-options";

        if (student.supportLevel !== 1) {
            promptArea.append(
                createPromptButton(),
                promptHelp,
            );

            content.append(
                promptArea,
            );
        }

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
                const button =
                    student.supportLevel === 1
                        ? createImageOption(
                            option,
                        )
                        : createTextOption(
                            option,
                        );

                button.addEventListener(
                    "click",
                    () => {
                        handleOption(
                            option,
                            button,
                        );
                    },
                );

                optionsContainer.append(
                    button,
                );
            },
        );

        content.append(
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
    }


    return Object.freeze({
        start: render,

        repeatInstruction() {
            audioService.speak(
                getInstruction(),
                "pt-BR",
            );
        },

        next() {
            return resolved;
        },
    });
}