import {
    audioService,
} from "../../services/audio-service.js";

import {
    createImage,
} from "./activity-helpers.js";


export function createRecognizeActivity(
    context,
) {
    const {
        activity,
        student,
        elements,
        onCorrect,
    } = context;

    const item = activity.item;

    let resolved = false;


    function getInstruction() {
        if (activity.instruction) {
            return activity.instruction;
        }

        if (student.supportLevel === 1) {
            return "Toque na imagem para conhecer a palavra.";
        }

        if (student.supportLevel === 2) {
            return (
                "Observe a imagem e toque para " +
                "descobrir a palavra em inglês."
            );
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
            item.en;

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

        imageButton.addEventListener(
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

        /*
         * Não existe áudio automático.
         * O aluno pode usar o botão de áudio
         * quando quiser.
         */
    }


    return Object.freeze({
        start: render,

        repeatInstruction() {
            audioService.speak(
                getInstruction(),
            );
        },

        next() {
            return resolved;
        },
    });
}