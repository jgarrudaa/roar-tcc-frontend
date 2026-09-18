import {
    audioService,
} from "../../services/audio-service.js";

import {
    createButton,
    createImage,
    shuffle,
} from "./activity-helpers.js";


function getPairLimit(supportLevel) {
    if (supportLevel === 1) {
        return 2;
    }

    if (supportLevel === 2) {
        return 3;
    }

    return 4;
}


function createMemoryItems(
    currentItem,
    moduleItems,
    pairLimit,
) {
    const otherItems =
        shuffle(
            moduleItems.filter(
                (item) =>
                    String(item.id) !==
                    String(currentItem.id),
            ),
        );

    return [
        currentItem,
        ...otherItems.slice(
            0,
            Math.max(
                0,
                pairLimit - 1,
            ),
        ),
    ];
}


export function createMemoryActivity(
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

    let firstCard = null;
    let lockBoard = false;
    let matchedPairs = 0;
    let totalPairs = 0;
    let memoryItems = [];


    function getInstruction() {
        return (
            activity.instruction ||
            "Encontre os pares de imagem e palavra."
        );
    }


    function revealCard(card) {
        card.classList.add(
            "is-revealed",
        );

        card.setAttribute(
            "aria-pressed",
            "true",
        );

        const word =
            card.dataset.word;

        const type =
            card.dataset.cardType;

        card.setAttribute(
            "aria-label",
            type === "image"
                ? `Imagem de ${word}`
                : `Palavra ${word}`,
        );
    }


    function hideCard(card) {
        if (!card) {
            return;
        }

        card.classList.remove(
            "is-revealed",
        );

        card.setAttribute(
            "aria-pressed",
            "false",
        );

        card.setAttribute(
            "aria-label",
            "Carta fechada",
        );
    }


    function findMatchedItem(card) {
        return (
            module.items.find(
                (item) =>
                    String(item.id) ===
                    card.dataset.pair,
            ) ||
            activity.item
        );
    }


    function markPairAsMatched(
        first,
        second,
    ) {
        first.classList.add(
            "is-matched",
        );

        second.classList.add(
            "is-matched",
        );

        first.disabled = true;
        second.disabled = true;

        matchedPairs += 1;

        const matchedItem =
            findMatchedItem(first);

        onCorrect(matchedItem);

        elements.setProgress(
            matchedPairs,
            totalPairs,
        );

        audioService.speak(
            matchedItem.en,
            "en-US",
        );

        if (
            matchedPairs ===
            totalPairs
        ) {
            elements.nextButton.disabled =
                false;

            elements.setMessage(
                "Muito bem! Todos os pares foram encontrados.",
            );

            return;
        }

        elements.setMessage(
            "Muito bem! Você encontrou um par.",
        );
    }


    function handleCard(card) {
        if (
            lockBoard ||
            card === firstCard ||
            card.classList.contains(
                "is-matched",
            )
        ) {
            return;
        }

        revealCard(card);

        if (!firstCard) {
            firstCard = card;
            return;
        }

        const secondCard = card;

        const cardsMatch =
            firstCard.dataset.pair ===
            secondCard.dataset.pair;

        if (cardsMatch) {
            markPairAsMatched(
                firstCard,
                secondCard,
            );

            firstCard = null;
            return;
        }

        lockBoard = true;

        onWrong(activity.item);

        elements.setMessage(
            "Essas cartas são diferentes. Observe e tente novamente.",
        );

        window.setTimeout(
            () => {
                hideCard(firstCard);
                hideCard(secondCard);

                firstCard = null;
                lockBoard = false;
            },
            1000,
        );
    }


    function createCard(
        item,
        cardType,
    ) {
        const card =
            document.createElement("button");

        const front =
            document.createElement("span");

        const back =
            document.createElement("span");

        card.type = "button";

        card.className =
            "memory-card";

        card.dataset.pair =
            String(item.id);

        card.dataset.word =
            item.en;

        card.dataset.cardType =
            cardType;

        card.setAttribute(
            "aria-pressed",
            "false",
        );

        card.setAttribute(
            "aria-label",
            "Carta fechada",
        );

        front.className =
            "memory-card-front";

        front.textContent = "?";

        back.className =
            "memory-card-back";

        if (cardType === "image") {
            back.append(
                createImage(
                    item,
                    student.supportLevel,
                ),
            );
        } else {
            back.textContent =
                item.en;
        }

        card.append(
            front,
            back,
        );

        card.addEventListener(
            "click",
            () => {
                handleCard(card);
            },
        );

        return card;
    }


    function renderGame() {
        firstCard = null;
        lockBoard = false;
        matchedPairs = 0;

        elements.stage.replaceChildren();

        elements.nextButton.disabled =
            true;

        totalPairs =
            memoryItems.length;

        const cards =
            shuffle(
                memoryItems.flatMap(
                    (item) => [
                        createCard(
                            item,
                            "image",
                        ),

                        createCard(
                            item,
                            "word",
                        ),
                    ],
                ),
            );

        const content =
            document.createElement("div");

        const grid =
            document.createElement("div");

        content.className =
            "activity-content memory-game";

        grid.className =
            "memory-grid";

        grid.append(...cards);
        content.append(grid);

        elements.stage.append(
            content,
        );

        elements.setInstruction(
            getInstruction(),
        );

        elements.setMessage(
            "Vire duas cartas para encontrar um par.",
        );

        elements.setProgress(
            0,
            totalPairs,
        );
    }


    function renderPreview() {
        elements.stage.replaceChildren();

        elements.nextButton.disabled =
            true;

        const content =
            document.createElement("div");

        const title =
            document.createElement("h2");

        const previewGrid =
            document.createElement("div");

        const startButton =
            createButton(
                "Começar jogo",
                "btn btn--primary",
            );

        content.className =
            "activity-content memory-preview";

        title.textContent =
            "Conheça os pares";

        previewGrid.className =
            "memory-preview-grid";

        memoryItems.forEach(
            (item) => {
                const pair =
                    document.createElement(
                        "div",
                    );

                const image =
                    createImage(
                        item,
                        student.supportLevel,
                    );

                const wordButton =
                    createButton(
                        item.en,
                        "memory-preview-word",
                    );

                pair.className =
                    "memory-preview-pair";

                wordButton.setAttribute(
                    "aria-label",
                    `Ouvir ${item.en}`,
                );

                wordButton.addEventListener(
                    "click",
                    () => {
                        audioService.speak(
                            item.en,
                            "en-US",
                        );
                    },
                );

                pair.append(
                    image,
                    wordButton,
                );

                previewGrid.append(
                    pair,
                );
            },
        );

        startButton.addEventListener(
            "click",
            renderGame,
        );

        content.append(
            title,
            previewGrid,
            startButton,
        );

        elements.stage.append(
            content,
        );

        elements.setInstruction(
            "Observe os pares antes de começar.",
        );

        elements.setMessage(
            "Quando estiver pronto, pressione Começar jogo.",
        );

        elements.setProgress(
            0,
            memoryItems.length,
        );
    }


    function render() {
        memoryItems =
            createMemoryItems(
                activity.item,
                module.items,
                getPairLimit(
                    student.supportLevel,
                ),
            );

        /*
         * O Nível 2 recebe apresentação prévia.
         * Os demais níveis iniciam diretamente no jogo.
         */
        if (student.supportLevel === 2) {
            renderPreview();
            return;
        }

        renderGame();
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
            return (
                totalPairs > 0 &&
                matchedPairs ===
                    totalPairs
            );
        },
    });
}