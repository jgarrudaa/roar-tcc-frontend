import {
    audioService,
} from "../../services/audio-service.js";

import {
    createButton,
    createImage,
    shuffle,
} from "./activity-helpers.js";


const SENTENCE_CONTEXTS = Object.freeze({
    HEAD: Object.freeze({
        beginning: "I nod my",
        ending: ".",
    }),

    ARM: Object.freeze({
        beginning: "I raise my",
        ending: ".",
    }),

    LEG: Object.freeze({
        beginning: "I move my",
        ending: ".",
    }),

    FOOT: Object.freeze({
        beginning: "I stand on my",
        ending: ".",
    }),

    BELLY: Object.freeze({
        beginning: "I touch my",
        ending: ".",
    }),
});


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


function getSentenceContext(activity) {
    const correctAnswer =
        getCorrectAnswer(activity);

    return (
        SENTENCE_CONTEXTS[
        correctAnswer
        ] ||
        {
            beginning: "This is my",
            ending: ".",
        }
    );
}


function createWordOptions(
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
     * O banco utiliza no máximo cinco palavras.
     * Uma correta e até quatro distratores.
     */
    return shuffle([
        correctItem,

        ...shuffle(distractors).slice(
            0,
            4,
        ),
    ]);
}


export function createWordBankActivity(
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

    let selectedOption = null;
    let resolved = false;

    let sentenceBlank = null;
    let checkButton = null;
    let wordBank = null;


    function getInstruction() {
        return (
            activity.instruction ||
            (
                "Escolha uma palavra para " +
                "completar a frase."
            )
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
            (
                "Ouça a palavra. Depois, " +
                "complete a frase."
            ),
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
            "word-bank-image";

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
        const sentenceContext =
            getSentenceContext(
                activity,
            );

        const sentence =
            document.createElement("p");

        const beginning =
            document.createElement("span");

        const ending =
            document.createElement("span");

        sentenceBlank =
            document.createElement("span");

        sentence.className =
            "word-bank-sentence";

        beginning.textContent =
            `${sentenceContext.beginning} `;

        sentenceBlank.className =
            "word-bank-blank";

        sentenceBlank.textContent =
            "_____";

        sentenceBlank.setAttribute(
            "aria-live",
            "polite",
        );

        ending.textContent =
            sentenceContext.ending;

        sentence.append(
            beginning,
            sentenceBlank,
            ending,
        );

        return sentence;
    }


    function updateSelectedButton(
        selectedButton,
    ) {
        wordBank
            .querySelectorAll(
                ".word-bank-option",
            )
            .forEach(
                (button) => {
                    const isSelected =
                        button ===
                        selectedButton;

                    button.classList.toggle(
                        "is-selected",
                        isSelected,
                    );

                    button.setAttribute(
                        "aria-pressed",
                        String(isSelected),
                    );
                },
            );
    }


    function selectWord(
        option,
        button,
    ) {
        /*
         * Todos os botões continuam reproduzindo
         * a pronúncia, mesmo depois do acerto.
         */
        speakWord(option.en);

        if (resolved) {
            elements.setMessage(
                `Esta palavra é ${option.en}.`,
            );

            return;
        }

        selectedOption = option;

        sentenceBlank.textContent =
            option.en;

        updateSelectedButton(
            button,
        );

        checkButton.disabled =
            false;

        elements.setMessage(
            (
                `Você escolheu ${option.en}. ` +
                "Pressione Conferir."
            ),
        );
    }


    function handleCorrectAnswer() {
        resolved = true;

        sentenceBlank.classList.add(
            "is-correct",
        );

        checkButton.disabled =
            true;

        wordBank
            .querySelectorAll(
                ".word-bank-option",
            )
            .forEach(
                (button) => {
                    button.classList.remove(
                        "is-wrong",
                    );
                },
            );

        elements.setMessage(
            (
                "Muito bem! Você completou " +
                "a frase corretamente."
            ),
        );

        elements.setProgress(
            1,
            1,
        );

        elements.nextButton.disabled =
            false;

        onCorrect(item);

        const sentenceContext =
            getSentenceContext(
                activity,
            );

        audioService.speak(
            (
                `${sentenceContext.beginning} ` +
                `${item.en}`
            ),
            "en-US",
        );
    }


    function handleWrongAnswer() {
        const selectedButton =
            wordBank.querySelector(
                (
                    `[data-answer="` +
                    `${selectedOption.en}"]`
                ),
            );

        if (selectedButton) {
            selectedButton.classList.add(
                "is-wrong",
            );

            window.setTimeout(
                () => {
                    selectedButton.classList.remove(
                        "is-wrong",
                    );
                },
                650,
            );
        }

        elements.setMessage(
            (
                "Essa palavra ainda não completa " +
                "a frase corretamente. Tente outra."
            ),
        );

        onWrong(item);
    }


    function checkAnswer() {
        if (resolved) {
            return;
        }

        if (!selectedOption) {
            elements.setMessage(
                (
                    "Escolha uma palavra antes " +
                    "de conferir."
                ),
            );

            return;
        }

        const selectedAnswer =
            normalizeAnswer(
                selectedOption.en,
            );

        const correctAnswer =
            getCorrectAnswer(
                activity,
            );

        if (
            selectedAnswer ===
            correctAnswer
        ) {
            handleCorrectAnswer();
            return;
        }

        handleWrongAnswer();
    }


    function createWordBank() {
        const container =
            document.createElement("div");

        const options =
            createWordOptions(
                item,
                module.items,
            );

        container.className =
            "word-bank-options";

        container.setAttribute(
            "aria-label",
            "Banco de palavras",
        );

        options.forEach(
            (option) => {
                const button =
                    createButton(
                        option.en,
                        "word-bank-option",
                    );

                button.dataset.answer =
                    option.en;

                button.setAttribute(
                    "aria-pressed",
                    "false",
                );

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
                        selectWord(
                            option,
                            button,
                        );
                    },
                );

                container.append(
                    button,
                );
            },
        );

        return container;
    }


    function render() {
        resolved = false;
        selectedOption = null;

        elements.stage.replaceChildren();

        elements.nextButton.disabled =
            true;

        const content =
            document.createElement("div");

        const promptArea =
            document.createElement("div");

        const sentenceArea =
            document.createElement("div");

        const bankTitle =
            document.createElement("h2");

        content.className =
            (
                "activity-content " +
                "word-bank-game"
            );

        promptArea.className =
            "word-bank-prompt";

        sentenceArea.className =
            "word-bank-sentence-area";

        bankTitle.className =
            "word-bank-title";

        bankTitle.textContent =
            "Escolha uma palavra";

        promptArea.append(
            createPromptButton(),
        );

        sentenceArea.append(
            createSentence(),
        );

        wordBank =
            createWordBank();

        checkButton =
            createButton(
                "Conferir",
                "word-bank-check",
            );

        checkButton.disabled =
            true;

        checkButton.addEventListener(
            "click",
            checkAnswer,
        );

        content.append(
            promptArea,
            sentenceArea,
            bankTitle,
            wordBank,
            checkButton,
        );

        elements.stage.append(
            content,
        );

        elements.setInstruction(
            getInstruction(),
        );

        elements.setMessage(
            (
                "Escolha uma palavra do banco " +
                "para completar a frase."
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