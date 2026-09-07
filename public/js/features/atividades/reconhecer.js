import { audioService } from "../../services/audio-service.js";
import { createImage } from "./activity-helpers.js";


const AUTO_ADVANCE_DELAY = 1400;


export function createRecognizeActivity(context) {
    const {
        activity,
        student,
        elements,
        onCorrect,
    } = context;

    const item = activity.item;

    let resolved = false;
    let autoAdvanceTimer = null;


    function getInstruction() {
        if (activity.instruction) {
            return activity.instruction;
        }

        if (student.supportLevel === 1) {
            return `Toque na imagem para conhecer a palavra ${item.en}.`;
        }

        if (student.supportLevel === 2) {
            return "Observe a imagem e toque para descobrir a palavra em inglês.";
        }

        return "Observe a imagem e identifique a palavra em inglês.";
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


    function handleImageClick(
        imageButton,
        revealedWord,
    ) {
        if (resolved) {
            return;
        }

        resolved = true;

        imageButton.classList.add("is-correct");
        imageButton.disabled = true;

        revealedWord.hidden = false;

        elements.setMessage(
            `Muito bem! A resposta é ${item.en}.`,
        );

        elements.setProgress(1, 1);
        elements.nextButton.disabled = false;

        audioService.speak(item.en, "en-US");

        onCorrect(item);

        scheduleAutoAdvance();
    }


    function render() {
        resolved = false;
        clearAutoAdvance();

        elements.stage.replaceChildren();
        elements.nextButton.disabled = true;

        const content = document.createElement("div");
        const imageButton = document.createElement("button");
        const revealedWord = document.createElement("div");

        content.className = "activity-content";

        imageButton.type = "button";
        imageButton.className = "choice-card";
        imageButton.setAttribute(
            "aria-label",
            getInstruction(),
        );

        revealedWord.className = "revealed-word";
        revealedWord.textContent = item.en;
        revealedWord.hidden = true;

        imageButton.append(
            createImage(
                item,
                student.supportLevel,
            ),
        );

        imageButton.addEventListener(
            "click",
            () => {
                handleImageClick(
                    imageButton,
                    revealedWord,
                );
            },
            { once: true },
        );

        content.append(
            imageButton,
            revealedWord,
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