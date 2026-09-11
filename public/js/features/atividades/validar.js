import { audioService } from "../../services/audio-service.js";
import {
    createButton,
    createImage,
    shuffle,
} from "./activity-helpers.js";


const AUTO_ADVANCE_DELAY = 1200;


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
    const correctAnswer = normalizeAnswer(
        currentItem.en,
    );

    const distractors = [];
    const registeredAnswers = new Set([
        correctAnswer,
    ]);

    moduleItems.forEach((item) => {
        const answer = normalizeAnswer(item.en);

        if (
            !answer ||
            registeredAnswers.has(answer)
        ) {
            return;
        }

        registeredAnswers.add(answer);
        distractors.push(item);
    });

    return shuffle([
        currentItem,
        ...shuffle(distractors).slice(
            0,
            optionLimit - 1,
        ),
    ]);
}


export function createValidateActivity(context) {
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
    let autoAdvanceTimer = null;


    function getInstruction() {
        if (activity.instruction) {
            return activity.instruction;
        }

        if (student.supportLevel === 1) {
            return "Selecione a imagem correta.";
        }

        if (student.supportLevel === 2) {
            return "Selecione a palavra correspondente à imagem.";
        }

        return "Analise o contexto e selecione a resposta correta.";
    }


    function clearAutoAdvance() {
        if (!autoAdvanceTimer) {
            return;
        }

        window.clearTimeout(autoAdvanceTimer);
        autoAdvanceTimer = null;
    }


    function scheduleAutoAdvance() {
        clearAutoAdvance();

        autoAdvanceTimer = window.setTimeout(() => {
            elements.nextButton.click();
        }, AUTO_ADVANCE_DELAY);
    }


    function disableOptions(optionsContainer) {
        optionsContainer
            .querySelectorAll("button")
            .forEach((button) => {
                button.disabled = true;
            });
    }


    function markCorrectOption(
        optionsContainer,
        correctAnswer,
    ) {
        optionsContainer
            .querySelectorAll("button")
            .forEach((button) => {
                if (
                    normalizeAnswer(
                        button.dataset.answer,
                    ) === correctAnswer
                ) {
                    button.classList.add(
                        "is-correct",
                    );
                }
            });
    }


    function handleOption(
        option,
        button,
        optionsContainer,
    ) {
        if (resolved) {
            return;
        }

        if (student.supportLevel === 1) {
            audioService.speak(
                option.en,
                "en-US",
            );
        }

        const selectedAnswer =
            normalizeAnswer(option.en);

        const correctAnswer =
            normalizeAnswer(item.en);

        if (selectedAnswer === correctAnswer) {
            resolved = true;

            button.classList.add("is-correct");
            disableOptions(optionsContainer);

            if (student.supportLevel !== 1) {
                audioService.speak(
                    "Muito bem! Resposta correta.",
                );
            }

            elements.setProgress(1, 1);
            elements.nextButton.disabled = false;

            audioService.speak(
                "Muito bem! Resposta correta.",
            );

            onCorrect(item);
            scheduleAutoAdvance();

            return;
        }

        button.classList.add("is-wrong");

        elements.setMessage(
            student.supportLevel === 1
                ? `Esta imagem representa ${option.en}. Vamos observar novamente.`
                : "Essa não é a resposta. Tente novamente.",
        );

        if (student.supportLevel !== 1) {
            audioService.speak(
                "Tente novamente.",
            );
        }

        onWrong(item);

        window.setTimeout(() => {
            button.classList.remove("is-wrong");

            markCorrectOption(
                optionsContainer,
                correctAnswer,
            );

            window.setTimeout(() => {
                optionsContainer
                    .querySelectorAll(".is-correct")
                    .forEach((correctButton) => {
                        correctButton.classList.remove(
                            "is-correct",
                        );
                    });
            }, 650);
        }, 500);
    }


    function createTextOption(option) {
        const button = createButton(option.en);

        button.dataset.answer = option.en;

        return button;
    }


    function createImageOption(option) {
        const button = createButton("");

        button.dataset.answer = option.en;
        button.setAttribute(
            "aria-label",
            `Selecionar imagem de ${option.pt}`,
        );

        button.replaceChildren(
            createImage(option, 1),
        );

        return button;
    }


    function render() {
        resolved = false;
        clearAutoAdvance();

        elements.stage.replaceChildren();
        elements.nextButton.disabled = true;

        const content = document.createElement("div");
        const optionsContainer =
            document.createElement("div");

        content.className = "activity-content";
        optionsContainer.className = "choice-grid";

        /*
         * Nos níveis 2 e 3 a imagem atual funciona como
         * enunciado e as palavras são as alternativas.
         *
         * No nível 1, as próprias imagens são utilizadas
         * como alternativas para aumentar o suporte visual.
         */
        if (student.supportLevel !== 1) {
            content.append(
                createImage(
                    item,
                    student.supportLevel,
                ),
            );
        }

        const optionLimit = getOptionLimit(
            student.supportLevel,
        );

        const options = createOptions(
            item,
            module.items,
            optionLimit,
        );

        options.forEach((option) => {
            const button =
                student.supportLevel === 1
                    ? createImageOption(option)
                    : createTextOption(option);

            button.addEventListener("click", () => {
                handleOption(
                    option,
                    button,
                    optionsContainer,
                );
            });

            optionsContainer.append(button);
        });

        content.append(optionsContainer);

        elements.stage.append(content);
        elements.setInstruction(getInstruction());
        elements.setProgress(0, 1);

        if (student.supportLevel === 1) {
            audioService.speak(getInstruction());
        }
    }


    return Object.freeze({
        start: render,

        repeatInstruction() {
            audioService.speak(getInstruction());
        },

        next() {
            clearAutoAdvance();

            return resolved;
        },
    });
}