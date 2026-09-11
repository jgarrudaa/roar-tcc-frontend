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
    const {
        activity,
        module,
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
) {
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

    window.setTimeout(() =>
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

        button.addEventListener(
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
        resolved = false;

        elements.stage.replaceChildren();
        elements.nextButton.disabled = true;

        const content =
            document.createElement("div");

        const playButton =
            createButton(
                "Ouvir palavra",
                "listen-button",
            );

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

        playButton.addEventListener(
            "click",
            playWord,
        );

        content.append(
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


    }


    return Object.freeze({
        start: render,

        repeatInstruction() {
            playWord();
        },

        next() {
            return resolved;
        },
    });
}