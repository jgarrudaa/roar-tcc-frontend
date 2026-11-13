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

    const correctItem =
        module.items.find(
            moduleItem =>
                normalizeAnswer(moduleItem.en) ===
                getCorrectAnswer(activity),
        ) || item;

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
        const inicioDaFrase = String(
            activity.sentenceTemplate || "",
        ).split("___")[0].trim();

        speakWord(inicioDaFrase || item.en);

        elements.setMessage(
            "Ouça a frase. Depois, complete com a cor correta.",
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

            const fraseCompleta = String(
                activity.sentenceTemplate || "This is my ___.",
            ).replace("___", correctAnswer);

            elements.setMessage(
                `Muito bem! A frase é: ${fraseCompleta}`,
            );

            elements.setProgress(
                1,
                1,
            );

            elements.nextButton.disabled =
                false;

            onCorrect(correctItem);

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

        onWrong(correctItem);

        lifecycle.timeout(
            () => {
                button.classList.remove(
                    "is-wrong",
                );
            },
            650,
        );
    }


    function createPromptButton() {
        const button = document.createElement("button");

        const promptItem = activity.promptImage
            ? {
                ...item,
                realImage: activity.promptImage,
                vectorImage: activity.promptImage,
            }
            : item;

        const image = createImage(
            promptItem,
            student.supportLevel,
        );

        button.type = "button";
        button.className = "complete-sentence-image";
        button.title = "Clique para ouvir a palavra";

        button.setAttribute(
            "aria-label",
            "Imagem da atividade. Clique para ouvir a palavra.",
        );

        image.alt = activity.promptImage
            ? "Imagem de apoio para completar a frase."
            : `Imagem de ${item.pt}`;

        button.append(image);

        lifecycle.listen(button, "click", handleImageClick);

        return button;
    }


    function createSentence(template) {
        const sentence = document.createElement("p");
        const blank = document.createElement("span");
        const marker = "___";
        const phrase = String(template || "This is my ___.");
        const markerIndex = phrase.indexOf(marker);

        sentence.className = "complete-sentence-text";
        blank.className = "complete-sentence-blank";
        blank.textContent = "_____";

        if (markerIndex < 0) {
            sentence.textContent = phrase;
            sentence.append(document.createTextNode(" "));
            sentence.append(blank);
        } else {
            sentence.append(
                document.createTextNode(phrase.slice(0, markerIndex)),
                blank,
                document.createTextNode(
                    phrase.slice(markerIndex + marker.length),
                ),
            );
        }

        return { sentence, blank };
    }


    function render() {
        if (lifecycle.destroyed) return;
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

        const { sentence, blank } = createSentence(
            activity.sentenceTemplate,
        );



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

        const options = createOptions(
            correctItem,
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

                lifecycle.listen(button,
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
        destroy() {
            lifecycle.destroy();
            audioService.stop();
        },
        start: render,

        repeatInstruction() {
            if (lifecycle.destroyed) return;
            audioService.speak(
                getInstruction(),
                "pt-BR",
            );
        },

        next() {
            return !lifecycle.destroyed && resolved;
        },
    });
}