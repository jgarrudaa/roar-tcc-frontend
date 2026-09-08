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


export function createTrueFalseActivity(
    context,
) {
    const {
        activity,
        module,
        elements,
        onCorrect,
        onWrong,
    } = context;

    const item = activity.item;

    let resolved = false;
    let displayedItem = item;


    function getInstruction() {
        return (
            activity.instruction ||
            `Esta imagem representa ${item.en}?`
        );
    }


    function chooseDisplayedItem() {
        const distractors =
            module.items.filter(
                (candidate) =>
                    normalizeAnswer(
                        candidate.en,
                    ) !==
                    normalizeAnswer(
                        item.en,
                    ),
            );

        if (
            distractors.length === 0 ||
            Math.random() >= 0.5
        ) {
            return item;
        }

        return shuffle(distractors)[0];
    }


    function disableOptions(
        optionsContainer,
    ) {
        optionsContainer
            .querySelectorAll("button")
            .forEach((button) => {
                button.disabled = true;
            });
    }


    function handleAnswer(
        selectedAnswer,
        button,
        optionsContainer,
    ) {
        if (resolved) {
            return;
        }

        const imageMatches =
            normalizeAnswer(
                displayedItem.en,
            ) ===
            normalizeAnswer(
                item.en,
            );

        const isCorrect =
            selectedAnswer ===
            imageMatches;

        if (isCorrect) {
            resolved = true;

            button.classList.add(
                "is-correct",
            );

            disableOptions(
                optionsContainer,
            );

            elements.setMessage(
                "Muito bem! Você observou corretamente.",
            );

            elements.setProgress(1, 1);

            elements.nextButton.disabled =
                false;

            audioService.speak(
                "Muito bem!",
            );

            onCorrect(item);
            return;
        }

        button.classList.add(
            "is-wrong",
        );

        elements.setMessage(
            "Olhe novamente e tente outra resposta.",
        );

        audioService.speak(
            "Tente novamente.",
        );

        onWrong(item);

        window.setTimeout(() => {
            button.classList.remove(
                "is-wrong",
            );
        }, 650);
    }


    function render() {
        resolved = false;

        displayedItem =
            chooseDisplayedItem();

        elements.stage.replaceChildren();
        elements.nextButton.disabled = true;

        const content =
            document.createElement("div");

        const question =
            document.createElement("p");

        const optionsContainer =
            document.createElement("div");

        const yesButton =
            createButton(
                "Sim",
                "truth-button truth-yes",
            );

        const noButton =
            createButton(
                "Não",
                "truth-button truth-no",
            );

        content.className =
            "activity-content true-false-game";

        question.className =
            "true-false-question";

        question.textContent =
            `Esta imagem é ${item.en}?`;

        optionsContainer.className =
            "true-false-options";

        yesButton.addEventListener(
            "click",
            () => {
                handleAnswer(
                    true,
                    yesButton,
                    optionsContainer,
                );
            },
        );

        noButton.addEventListener(
            "click",
            () => {
                handleAnswer(
                    false,
                    noButton,
                    optionsContainer,
                );
            },
        );

        optionsContainer.append(
            yesButton,
            noButton,
        );

        content.append(
            question,
            createImage(
                displayedItem,
                1,
            ),
            optionsContainer,
        );

        elements.stage.append(content);

        elements.setInstruction(
            getInstruction(),
        );

        elements.setMessage(
            "Observe a imagem antes de responder.",
        );

        elements.setProgress(0, 1);

     
    }


    return Object.freeze({
        start: render,

        repeatInstruction() {
            audioService.speak(
                `Esta imagem é ${item.en}?`,
            );
        },

        next() {
            return resolved;
        },
    });
}