import { createActivityLifecycle } from "./activity-lifecycle.js";
import {
    audioService,
} from "../../services/audio-service.js";

import {
    createImage,
} from "./activity-helpers.js";


export function createRecognizeActivity(
    context,
) {
    const lifecycle = createActivityLifecycle();
    const {
        activity,
        student,
        elements,
        onCorrect,
    } = context;

    const item = activity.item;

    let resolved = false;


    function getInstruction() {
        if (student.supportLevel <= 2) {
            return `Toque na imagem: ${item.pt}.`;
        }

        if (activity.instruction) {
            return activity.instruction;
        }

        return (
            "Observe a imagem e identifique " +
            "a palavra em inglês."
        );
    }


    function revealAnswer(
        imageButton,
        revealedWord,
    ) {
        /*
         * A imagem sempre pronuncia a palavra,
         * inclusive depois de já ter sido revelada.
         */
        audioService.speak(
            item.en,
            "en-US",
        );

        /*
         * Depois da primeira revelação, os próximos
         * cliques servem somente para repetir o áudio.
         */
        if (resolved) {
            elements.setMessage(
                `Esta palavra é ${item.en}.`,
            );

            return;
        }

        resolved = true;

        imageButton.classList.add(
            "is-correct",
        );

        imageButton.setAttribute(
            "aria-pressed",
            "true",
        );

        imageButton.setAttribute(
            "aria-label",
            `Ouvir ${item.en} novamente`,
        );

        revealedWord.hidden = false;

        elements.setMessage(
            `Muito bem! Esta palavra é ${item.en}.`,
        );

        elements.setProgress(1, 1);

        elements.nextButton.disabled =
            false;

        onCorrect(item);
    }


    function render() {
        if (lifecycle.destroyed) return;
        resolved = false;

        elements.stage.replaceChildren();

        elements.nextButton.disabled =
            true;

        const content =
            document.createElement("div");

        const imageButton =
            document.createElement("button");

        const revealedWord =
            document.createElement("div");

        const supportText =
            document.createElement("p");

        content.className =
            "activity-content recognize-game";

        imageButton.type = "button";

        imageButton.className =
            "choice-card recognize-card";

        imageButton.setAttribute(
            "aria-label",
            getInstruction(),
        );

        imageButton.setAttribute(
            "aria-pressed",
            "false",
        );

        revealedWord.className =
            "revealed-word";

        revealedWord.textContent =
            item.en.toLocaleUpperCase("en-US");
        revealedWord.lang = "en";

        revealedWord.hidden = true;

        supportText.className =
            "recognize-support-text";

        supportText.textContent =
            "Toque na imagem quando estiver pronto.";

        imageButton.append(
            createImage(
                item,
                student.supportLevel,
            ),
        );

        lifecycle.listen(imageButton,
            "click",
            () => {
                revealAnswer(
                    imageButton,
                    revealedWord,
                );
            },
        );

        content.append(
            imageButton,
            revealedWord,
            supportText,
        );

        elements.stage.append(content);

        elements.setInstruction(
            getInstruction(),
        );

        elements.setMessage(
            "Observe com calma.",
        );

        elements.setProgress(0, 1);

        if (student.supportLevel <= 2) {
            audioService.speak(`Toque na imagem: ${item.pt}.`, "pt-BR");
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
            );
        },

        next() {
            return !lifecycle.destroyed && resolved;
        },
    });
}
