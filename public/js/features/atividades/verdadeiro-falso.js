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

        const yesButton = document.createElement("button");
        yesButton.type = "button";
        yesButton.className = "truth-button truth-yes";
        yesButton.setAttribute("aria-label", "Yes");
        yesButton.innerHTML = `
            <svg class="truth-icon" viewBox="0 0 24 24" width="28" height="28" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M7 10v12"/>
                <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>
            </svg>
            <span class="truth-label">Yes</span>
        `;

        const noButton = document.createElement("button");
        noButton.type = "button";
        noButton.className = "truth-button truth-no";
        noButton.setAttribute("aria-label", "Not");
        noButton.innerHTML = `
            <svg class="truth-icon" viewBox="0 0 24 24" width="28" height="28" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M17 14V2"/>
                <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/>
            </svg>
            <span class="truth-label">Not</span>
        `;

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

        const imageButton =
            createButton(
                "",
                "true-false-image-button",
            );

        imageButton.setAttribute(
            "aria-label",
            `Ouvir a palavra ${displayedItem.en}`,
        );

        imageButton.append(
            createImage(
                displayedItem,
                1,
            ),
        );

        imageButton.addEventListener(
            "click",
            () => {
                audioService.speak(
                    displayedItem.en,
                    "en-US",
                );

                elements.setMessage(
                    `Esta imagem representa ${displayedItem.en}.`,
                );
            },
        );

        content.append(
            question,
            imageButton,
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