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
        if (student.supportLevel === 1) {
            return "Ouça a palavra em inglês e escolha a imagem correta.";
        }

        if (activity.instruction) {
            return activity.instruction;
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
        optionsContainer,
    ) {
        if (resolved && normalizeAnswer(option.en) !== normalizeAnswer(item.en)) {
            return;
        }
        /*
         * Cada alternativa fala a própria palavra.
         */
        speakWord(option.en);

        /*
         * Após o acerto, apenas a resposta correta
         * continua funcionando como botão de pronúncia.
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

        lifecycle.timeout(
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

        lifecycle.listen(button,
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
        if (lifecycle.destroyed) return;
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
        } else {
            const targetWord = document.createElement("p");
            targetWord.className = "revealed-word";
            targetWord.lang = "en";
            targetWord.textContent = normalizeAnswer(item.en);
            const playButton = createButton("Ouvir novamente", "listen-button");
            lifecycle.listen(playButton, "click", () => speakWord(item.en));
            promptArea.append(targetWord, playButton);
            content.append(promptArea);
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
        if (student.supportLevel <= 2) {
            speakWord(item.en);
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
            if (student.supportLevel === 1) {
                speakWord(item.en);
                return;
            }
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
