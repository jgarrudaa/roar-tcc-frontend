import {
    audioService,
} from "../../services/audio-service.js";

import {
    createButton,
    createImage,
    shuffle,
} from "./activity-helpers.js";


function normalizeSentence(value) {
    return String(value ?? "")
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[.!?]+$/g, "")
        .toLocaleUpperCase("en-US");
}


function getCorrectWord(activity) {
    return normalizeSentence(
        activity.answer ||
        activity.item?.en,
    );
}


function createSentenceTokens(activity) {
    const correctWord =
        getCorrectWord(activity);

    return [
        {
            id: "this",
            word: "THIS",
        },
        {
            id: "is",
            word: "IS",
        },
        {
            id: "my",
            word: "MY",
        },
        {
            id: "answer",
            word: correctWord,
        },
    ];
}


export function createOrderSentenceActivity(
    context,
) {
    const {
        activity,
        student,
        elements,
        onCorrect,
        onWrong,
    } = context;

    const item = activity.item;

    const expectedSentence =
        normalizeSentence(
            `THIS IS MY ${getCorrectWord(activity)}`,
        );

    let availableTokens = [];
    let selectedTokens = [];
    let resolved = false;

    let wordBank = null;
    let sentenceTarget = null;
    let checkButton = null;
    let clearButton = null;


    function getInstruction() {
        return (
            activity.instruction ||
            "Coloque as palavras na ordem correta."
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
            "Ouça a palavra. Depois, monte a frase.",
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
            "order-sentence-image";

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


    function updateControls() {
        const hasSelectedWords =
            selectedTokens.length > 0;

        const sentenceIsComplete =
            availableTokens.length === 0;

        clearButton.disabled =
            !hasSelectedWords ||
            resolved;

        checkButton.disabled =
            !sentenceIsComplete ||
            resolved;
    }


    function moveToSentence(token) {
        if (resolved) {
            speakWord(token.word);
            return;
        }

        speakWord(token.word);

        availableTokens =
            availableTokens.filter(
                (availableToken) =>
                    availableToken.id !==
                    token.id,
            );

        selectedTokens.push(token);

        renderTokens();
    }


    function moveToWordBank(token) {
        speakWord(token.word);

        if (resolved) {
            return;
        }

        selectedTokens =
            selectedTokens.filter(
                (selectedToken) =>
                    selectedToken.id !==
                    token.id,
            );

        availableTokens.push(token);

        renderTokens();

        elements.setMessage(
            "A palavra voltou para o banco.",
        );
    }


    function createAvailableToken(token) {
        const button =
            createButton(
                token.word,
                "word-token",
            );

        button.dataset.tokenId =
            token.id;

        button.setAttribute(
            "aria-label",
            (
                `Adicionar ${token.word} ` +
                "à frase"
            ),
        );

        button.addEventListener(
            "click",
            () => {
                moveToSentence(token);
            },
        );

        return button;
    }


    function createSelectedToken(token) {
        const button =
            createButton(
                token.word,
                (
                    "word-token " +
                    "selected-word-token"
                ),
            );

        button.dataset.tokenId =
            token.id;

        button.setAttribute(
            "aria-label",
            (
                `Remover ${token.word} ` +
                "da frase"
            ),
        );

        button.addEventListener(
            "click",
            () => {
                moveToWordBank(token);
            },
        );

        return button;
    }


    function renderWordBank() {
        wordBank.replaceChildren();

        if (availableTokens.length === 0) {
            const message =
                document.createElement("p");

            message.className =
                "order-sentence-empty";

            message.textContent =
                "Todas as palavras foram usadas.";

            wordBank.append(message);

            return;
        }

        availableTokens.forEach(
            (token) => {
                wordBank.append(
                    createAvailableToken(
                        token,
                    ),
                );
            },
        );
    }


    function renderSentenceTarget() {
        sentenceTarget.replaceChildren();

        if (selectedTokens.length === 0) {
            const placeholder =
                document.createElement("span");

            placeholder.className =
                "order-sentence-placeholder";

            placeholder.textContent =
                "Sua frase aparecerá aqui.";

            sentenceTarget.append(
                placeholder,
            );

            return;
        }

        selectedTokens.forEach(
            (token) => {
                sentenceTarget.append(
                    createSelectedToken(
                        token,
                    ),
                );
            },
        );

        const punctuation =
            document.createElement("span");

        punctuation.className =
            "order-sentence-punctuation";

        punctuation.textContent = ".";

        sentenceTarget.append(
            punctuation,
        );
    }


    function renderTokens() {
        renderWordBank();
        renderSentenceTarget();
        updateControls();
    }


    function clearSentence() {
        if (
            resolved ||
            selectedTokens.length === 0
        ) {
            return;
        }

        availableTokens = shuffle([
            ...availableTokens,
            ...selectedTokens,
        ]);

        selectedTokens = [];

        renderTokens();

        elements.setMessage(
            "A frase foi limpa. Tente novamente.",
        );
    }


    function checkAnswer() {
        if (resolved) {
            return;
        }

        if (availableTokens.length > 0) {
            elements.setMessage(
                "Use todas as palavras antes de conferir.",
            );

            return;
        }

        const studentSentence =
            normalizeSentence(
                selectedTokens
                    .map(
                        (token) =>
                            token.word,
                    )
                    .join(" "),
            );

        if (
            studentSentence ===
            expectedSentence
        ) {
            resolved = true;

            sentenceTarget.classList.add(
                "is-correct",
            );

            elements.setMessage(
                (
                    "Muito bem! A frase está correta: " +
                    `This is my ${item.en}.`
                ),
            );

            elements.setProgress(
                1,
                1,
            );

            elements.nextButton.disabled =
                false;

            checkButton.disabled =
                true;

            clearButton.disabled =
                true;

            onCorrect(item);

            audioService.speak(
                `This is my ${item.en}`,
                "en-US",
            );

            return;
        }

        sentenceTarget.classList.add(
            "is-wrong",
        );

        elements.setMessage(
            (
                "A ordem ainda não está correta. " +
                "Você pode mudar as palavras e tentar novamente."
            ),
        );

        onWrong(item);

        window.setTimeout(
            () => {
                sentenceTarget.classList.remove(
                    "is-wrong",
                );
            },
            650,
        );
    }


    function render() {
        resolved = false;

        availableTokens =
            shuffle(
                createSentenceTokens(
                    activity,
                ),
            );

        selectedTokens = [];

        elements.stage.replaceChildren();

        elements.nextButton.disabled =
            true;

        const content =
            document.createElement("div");

        const promptArea =
            document.createElement("div");

        const builder =
            document.createElement("div");

        const targetTitle =
            document.createElement("h2");

        const bankTitle =
            document.createElement("h2");

        const actions =
            document.createElement("div");

        content.className =
            (
                "activity-content " +
                "order-sentence-game"
            );

        promptArea.className =
            "order-sentence-prompt";

        builder.className =
            "sentence-builder";

        targetTitle.className =
            "order-sentence-title";

        targetTitle.textContent =
            "Monte a frase";

        bankTitle.className =
            "order-sentence-title";

        bankTitle.textContent =
            "Palavras disponíveis";

        sentenceTarget =
            document.createElement("div");

        sentenceTarget.className =
            "sentence-target";

        sentenceTarget.setAttribute(
            "aria-label",
            "Frase montada",
        );

        sentenceTarget.setAttribute(
            "aria-live",
            "polite",
        );

        wordBank =
            document.createElement("div");

        wordBank.className =
            "word-bank";

        wordBank.setAttribute(
            "aria-label",
            "Palavras disponíveis",
        );

        clearButton =
            createButton(
                "Limpar frase",
                "order-sentence-clear",
            );

        checkButton =
            createButton(
                "Conferir",
                "order-sentence-check",
            );

        actions.className =
            "order-sentence-actions";

        clearButton.addEventListener(
            "click",
            clearSentence,
        );

        checkButton.addEventListener(
            "click",
            checkAnswer,
        );

        promptArea.append(
            createPromptButton(),
        );

        actions.append(
            clearButton,
            checkButton,
        );

        builder.append(
            targetTitle,
            sentenceTarget,
            bankTitle,
            wordBank,
            actions,
        );

        content.append(
            promptArea,
            builder,
        );

        elements.stage.append(
            content,
        );

        elements.setInstruction(
            getInstruction(),
        );

        elements.setMessage(
            (
                "Toque nas palavras para montar " +
                "uma frase."
            ),
        );

        elements.setProgress(
            0,
            1,
        );

        renderTokens();
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