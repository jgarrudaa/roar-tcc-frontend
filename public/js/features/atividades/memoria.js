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
    let previewing = false;
    let destroyed = false;
    const timers = new Set();

    function schedule(callback, delay) {
        const timer = window.setTimeout(() => {
            timers.delete(timer);
            if (!destroyed) callback();
        }, delay);
        timers.add(timer);
        return timer;
    }

    function clearTimers() {
        timers.forEach((timer) => window.clearTimeout(timer));
        timers.clear();
    }

    function destroy() {
        destroyed = true;
        lockBoard = true;
        clearTimers();
        window.removeEventListener("pagehide", destroy);
        elements.stage.classList.remove("memory-stage");
        audioService.stop();
    }


    function getInstruction() {
        if (previewing) return "Observe as cartas e memorize onde está cada par.";
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
            destroyed || lockBoard || card.disabled ||
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

        schedule(
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
        front.setAttribute("aria-hidden", "true");
        back.setAttribute("aria-hidden", "true");

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
        lockBoard = previewing;
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

        grid.dataset.pairs = String(totalPairs);
        grid.append(...cards);
        const controls = document.createElement("div");
        const previewText = document.createElement("p");
        const startButton = createButton("Começar agora", "memory-start-button");
        controls.className = "memory-preview-controls";
        previewText.textContent = "Observe os pares. As cartas viram em 5 segundos.";
        controls.append(previewText, startButton);
        controls.hidden = !previewing;
        content.append(controls, grid);
        elements.stage.classList.add("memory-stage");

        function finishPreview() {
            if (destroyed || !previewing) return;
            clearTimers();
            const restoreFocus = document.activeElement === startButton;
            previewing = false;
            cards.forEach((card) => {
                hideCard(card);
                card.disabled = false;
            });
            controls.hidden = true;
            lockBoard = false;
            elements.setInstruction(getInstruction());
            elements.setMessage("Vire duas cartas para encontrar um par.");
            if (restoreFocus) cards[0]?.focus();
            audioService.speak(getInstruction(), "pt-BR");
        }
        if (previewing) {
            cards.forEach((card) => {
                revealCard(card);
                card.disabled = true;
            });
            startButton.addEventListener("click", finishPreview);
            schedule(finishPreview, 5000);
        }

        elements.stage.append(
            content,
        );

        elements.setInstruction(
            getInstruction(),
        );

        elements.setMessage(
            previewing ? "Memorize a posição de cada imagem e palavra."
                : "Vire duas cartas para encontrar um par.",
        );

        elements.setProgress(
            0,
            totalPairs,
        );
    }


    function render() {
        clearTimers();
        destroyed = false;
        previewing = [1, 2].includes(Number(student.supportLevel));
        window.addEventListener("pagehide", destroy);
        memoryItems =
            createMemoryItems(
                activity.item,
                module.items,
                getPairLimit(
                    Number(student.supportLevel),
                ),
            );

        renderGame();
        audioService.speak(getInstruction(), "pt-BR");
    }


    return Object.freeze({
        start: render,
        destroy,

        repeatInstruction() {
            audioService.speak(
                getInstruction(),
                "pt-BR",
            );
        },

        next() {
            return (
                !destroyed && totalPairs > 0 &&
                matchedPairs ===
                    totalPairs
            );
        },
    });
}