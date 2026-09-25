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
        .replace(/\s+/g, " ")
        .replace(/[.!?]+$/g, "")
        .toLocaleUpperCase("en-US");
}


function getCorrectAnswer(activity) {
    return normalizeAnswer(
        activity.answer ||
        activity.item?.en,
    );
}


function createOptions(
    correctItem,
    moduleItems,
) {
    const correctAnswer =
        normalizeAnswer(correctItem.en);

    const registeredAnswers =
        new Set([correctAnswer]);

    const distractors = [];

    moduleItems.forEach(
        (item) => {
            const answer =
                normalizeAnswer(item.en);

            if (
                !answer ||
                registeredAnswers.has(answer)
            ) {
                return;
            }

            registeredAnswers.add(answer);
            distractors.push(item);
        },
    );

    /*
     * Nível 3 utiliza no máximo três opções:
     * uma correta e dois distratores.
     */
    return shuffle([
        correctItem,

        ...shuffle(distractors).slice(
            0,
            2,
        ),
    ]);
}


export function createCompleteSentenceActivity(
    context,
) {
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
            "Complete a frase."
        );
    }


    function speakWord(word) {
        audioService.speak(
            word,
            "en-US",
        );
    }


    function handleImageClick() {
        speakWord(item.en);

        elements.setMessage(
            "Ouça a palavra. Depois, complete a frase.",
        );
    }


    function handleOptionClick(
        option,
        button,
    ) {
        /*
         * Toda opção fala a própria palavra.
         * Isso acontece independentemente de estar
         * correta ou incorreta.
         */
        speakWord(option.en);

        /*
         * Depois do acerto, os botões continuam
         * funcionando para repetir a pronúncia.
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
            getCorrectAnswer(activity);

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
                (
                    `Resposta correta: ${option.en}. ` +
                    "Clique para ouvir novamente."
                ),
            );

            elements.setMessage(
                `Muito bem! A frase é: This is my ${item.en}.`,
            );

            elements.setProgress(
                1,
                1,
            );

            elements.nextButton.disabled =
                false;

            onCorrect(item);

            return;
        }

        button.classList.add(
            "is-wrong",
        );

        elements.setMessage(
            (
                `Esta palavra é ${option.en}. ` +
                "Tente outra opção."
            ),
        );

        onWrong(item);

        window.setTimeout(
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
            "complete-sentence-image";

        button.title =
            "Clique para ouvir a palavra";

        button.setAttribute(
            "aria-label",
            (
                "Imagem da parte do corpo. " +
                "Clique para ouvir a palavra."
            ),
        );

        image.alt =
            `Imagem de ${item.pt}`;

        button.append(image);

        button.addEventListener(
            "click",
            handleImageClick,
        );

        return button;
    }


    function createSentence() {
        const sentence =
            document.createElement("p");

        const blank =
            document.createElement("span");

        sentence.className =
            "complete-sentence-text";

        blank.className =
            "complete-sentence-blank";

        blank.textContent =
            "_____";

        sentence.append(
            document.createTextNode(
                "This is my ",
            ),

            blank,

            document.createTextNode(
                ".",
            ),
        );

        return {
            sentence,
            blank,
        };
    }


    function render() {
        resolved = false;

        elements.stage.replaceChildren();

        elements.nextButton.disabled =
            true;

        const content =
            document.createElement("div");

        const imageArea =
            document.createElement("div");

        const sentenceArea =
            document.createElement("div");

        const optionsContainer =
            document.createElement("div");

        const {
            sentence,
            blank,
        } = createSentence();

        content.className =
            (
                "activity-content " +
                "complete-sentence-game"
            );

        imageArea.className =
            "complete-sentence-prompt";

        sentenceArea.className =
            "complete-sentence-area";

        optionsContainer.className =
            (
                "choice-grid " +
                "complete-sentence-options"
            );

        imageArea.append(
            createPromptButton(),
        );

        sentenceArea.append(
            sentence,
        );

        const options =
            createOptions(
                item,
                module.items,
            );

        options.forEach(
            (option) => {
                const button =
                    createButton(
                        option.en,
                    );

                button.classList.add(
                    "complete-sentence-option",
                );

                button.dataset.answer =
                    option.en;

                button.setAttribute(
                    "aria-label",
                    (
                        `Selecionar e ouvir ` +
                        `${option.en}`
                    ),
                );

                button.addEventListener(
                    "click",
                    () => {
                        handleOptionClick(
                            option,
                            button,
                        );

                        if (
                            normalizeAnswer(
                                option.en,
                            ) ===
                            getCorrectAnswer(
                                activity,
                            )
                        ) {
                            blank.textContent =
                                option.en;
                        }
                    },
                );

                optionsContainer.append(
                    button,
                );
            },
        );

        content.append(
            imageArea,
            sentenceArea,
            optionsContainer,
        );

        elements.stage.append(
            content,
        );

        elements.setInstruction(
            getInstruction(),
        );

        elements.setMessage(
            (
                "Observe a imagem e escolha " +
                "uma palavra para completar a frase."
            ),
        );

        elements.setProgress(
            0,
            1,
        );
    }


    return Object.freeze({
        start: render,

        repeatInstruction() {
            audioService.speak(
                getInstruction(),
                "pt-BR",
            );
        },

        next() {
            return resolved;
        },
    });
}