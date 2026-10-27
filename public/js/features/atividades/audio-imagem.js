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


function createOptions(
    currentItem,
    moduleItems,
) {
    const correctAnswer =
        normalizeAnswer(currentItem.en);

    const distractors =
        moduleItems.filter(
            (item) =>
                normalizeAnswer(item.en) !==
                correctAnswer,
        );

    return shuffle([
        currentItem,
        ...shuffle(distractors).slice(0, 1),
    ]);
}


export function createAudioImageActivity(
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
            "Ouça a palavra e escolha a imagem correta."
        );
    }


    function playWord() {
        audioService.speak(
            item.en,
            "en-US",
        );
    }

    function disableWrongOptions(
        optionsContainer,
        correctButton,
    ) {
        optionsContainer
            .querySelectorAll("button")
            .forEach((button) => {
                /*
                 * A imagem correta permanece ativa
                 * para repetir a pronúncia.
                 */
                if (button === correctButton) {
                    button.disabled = false;

                    button.setAttribute(
                        "aria-label",
                        `Ouvir ${button.dataset.answer} novamente`,
                    );

                    return;
                }

                /*
                 * As alternativas incorretas são
                 * desativadas depois da conclusão.
                 */
                button.disabled = true;
            });
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
     * Toda imagem funciona como um botão
     * de vocabulário o tempo inteiro.
     */
    audioService.speak(
        option.en,
        "en-US",
    );

    /*
     * Depois que a atividade foi concluída,
     * os cliques continuam reproduzindo o áudio,
     * mas não alteram mais o resultado.
     */
    if (resolved) {
        elements.setMessage(
            `Esta imagem representa ${option.en}.`,
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
        disableWrongOptions(optionsContainer, button);

        button.classList.add(
            "is-correct",
        );

        button.setAttribute(
            "aria-label",
            `Ouvir ${option.en} novamente`,
        );

        elements.setMessage(
            `Muito bem! Esta imagem representa ${item.en}.`,
        );

        elements.setProgress(1,1);

        elements.nextButton.disabled =
            false;

        onCorrect(item);

        return;
    }

    button.classList.add(
        "is-wrong",
    );

    elements.setMessage(
        `Esta imagem representa ${option.en}. Procure ${item.en}.`,
    );

    onWrong(item);

    lifecycle.timeout(() =>
        button.classList.remove(
            "is-wrong",
        ), 650);
}


    function createImageOption(
        option,
        optionsContainer,
    ) {
        const button =
            createButton("");

        button.dataset.answer =
            option.en;

        button.setAttribute(
            "aria-label",
            `Selecionar imagem de ${option.pt}`,
        );

        button.append(
            createImage(option, 1),
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
        elements.nextButton.disabled = true;

        const content =
            document.createElement("div");

        const playButton =
            createButton(
                "Ouvir novamente",
                "listen-button",
            );

        const targetWord = document.createElement("p");
        targetWord.className = "revealed-word";
        targetWord.lang = "en";
        targetWord.textContent = normalizeAnswer(item.en);

        const playIcon =
            document.createElement("i");

        const optionsContainer =
            document.createElement("div");

        content.className =
            "activity-content audio-image-game";

        playIcon.className =
            "fi fi-br-volume";

        playIcon.setAttribute(
            "aria-hidden",
            "true",
        );

        playButton.prepend(playIcon);

        optionsContainer.className =
            "choice-grid audio-image-options";

        const options =
            createOptions(
                item,
                module.items,
            );

        options.forEach((option) => {
            optionsContainer.append(
                createImageOption(
                    option,
                    optionsContainer,
                ),
            );
        });

        lifecycle.listen(playButton,
            "click",
            playWord,
        );

        content.append(
            targetWord,
            playButton,
            optionsContainer,
        );

        elements.stage.append(content);

        elements.setInstruction(
            getInstruction(),
        );

        elements.setMessage(
            "Toque no botão para ouvir quantas vezes precisar.",
        );

        elements.setProgress(0, 1);
        if (student?.supportLevel !== 3) {
            playWord();
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
            playWord();
        },

        next() {
            return !lifecycle.destroyed && resolved;
        },
    });
}
