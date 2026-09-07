import { audioService } from "../../services/audio-service.js";
import {
    createButton,
    createImage,
    shuffle,
} from "./activity-helpers.js";


const AUTO_ADVANCE_DELAY = 1200;
const MAXIMUM_OPTIONS = 4;


function normalizeAnswer(value) {
    return String(value ?? "")
        .trim()
        .toLocaleUpperCase("en-US");
}


function createOptions(currentItem, moduleItems) {
    const correctAnswer = normalizeAnswer(
        currentItem.en,
    );

    const uniqueOptions = new Map();

    uniqueOptions.set(
        correctAnswer,
        currentItem,
    );

    moduleItems.forEach((item) => {
        const answer = normalizeAnswer(item.en);

        if (
            answer &&
            answer !== correctAnswer &&
            !uniqueOptions.has(answer)
        ) {
            uniqueOptions.set(answer, item);
        }
    });

    return shuffle(
        Array.from(uniqueOptions.values())
            .slice(0, MAXIMUM_OPTIONS),
    );
}


export function createAssociateActivity(context) {
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
        return (
            activity.instruction ||
            "Associe a imagem à palavra correspondente."
        );
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


    function handleOption(
        option,
        button,
        optionsContainer,
    ) {
        if (resolved) {
            return;
        }

        const selectedAnswer =
            normalizeAnswer(option.en);

        const correctAnswer =
            normalizeAnswer(item.en);

        if (selectedAnswer === correctAnswer) {
            resolved = true;

            button.classList.add("is-correct");

            disableOptions(optionsContainer);

            elements.setMessage(
                "Muito bem! Você encontrou a associação correta.",
            );

            elements.setProgress(1, 1);
            elements.nextButton.disabled = false;

            audioService.speak(
                item.en,
                "en-US",
            );

            onCorrect(item);
            scheduleAutoAdvance();

            return;
        }

        button.classList.add("is-wrong");

        elements.setMessage(
            "Essa associação não está correta. Tente novamente.",
        );

        audioService.speak(
            "Tente novamente.",
        );

        onWrong(item);

        window.setTimeout(() => {
            button.classList.remove("is-wrong");
        }, 650);
    }


    function render() {
        resolved = false;
        clearAutoAdvance();

        elements.stage.replaceChildren();
        elements.nextButton.disabled = true;

        const content = document.createElement("div");
        const promptContainer =
            document.createElement("div");

        const optionsContainer =
            document.createElement("div");

        content.className = "activity-content";
        promptContainer.className =
            "association-prompt";

        optionsContainer.className =
            "choice-grid association-grid";

        const promptImage = createImage(
            item,
            student.supportLevel,
        );

        promptContainer.append(promptImage);

        const options = createOptions(
            item,
            module.items,
        );

        options.forEach((option) => {
            const button = createButton(
                option.en,
            );

            button.addEventListener("click", () => {
                handleOption(
                    option,
                    button,
                    optionsContainer,
                );
            });

            optionsContainer.append(button);
        });

        content.append(
            promptContainer,
            optionsContainer,
        );

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