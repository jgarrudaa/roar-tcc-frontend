import {
    audioService,
} from "../../services/audio-service.js";

import {
    createImage,
    shuffle,
} from "./activity-helpers.js";


function createMemoryItems(
    currentItem,
    moduleItems,
) {
    const secondItem =
        shuffle(
            moduleItems.filter(
                (item) =>
                    String(item.id) !==
                    String(currentItem.id),
            ),
        )[0];

    if (!secondItem) {
        return [currentItem];
    }

    return [
        currentItem,
        secondItem,
    ];
}


export function createMemoryActivity(
    context,
) {
    const {
        activity,
        module,
        elements,
        onCorrect,
        onWrong,
    } = context;

    let firstCard = null;
    let lockBoard = false;
    let matchedPairs = 0;
    let totalPairs = 0;


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

        elements.setMessage(
            "Muito bem! Você encontrou um par.",
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
                "Parabéns! Todos os pares foram encontrados.",
            );
        }
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
            "Ainda não é o par. Observe e tente novamente.",
        );

        audioService.speak(
            "Tente novamente.",
        );

        window.setTimeout(() => {
            hideCard(firstCard);
            hideCard(secondCard);

            firstCard = null;
            lockBoard = false;
        }, 900);
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

        card.setAttribute(
            "aria-pressed",
            "false",
        );

        card.setAttribute(
            "aria-label",
            "Virar carta",
        );

        front.className =
            "memory-card-front";

        front.textContent = "?";

        back.className =
            "memory-card-back";

        if (cardType === "image") {
            back.append(
                createImage(item, 1),
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


    function render() {
        firstCard = null;
        lockBoard = false;
        matchedPairs = 0;

        elements.stage.replaceChildren();
        elements.nextButton.disabled = true;

        const items =
            createMemoryItems(
                activity.item,
                module.items,
            );

        totalPairs = items.length;

        const cards =
            shuffle(
                items.flatMap(
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
        elements.stage.append(content);

        elements.setInstruction(
            getInstruction(),
        );

        elements.setMessage(
            "Vire duas cartas para procurar um par.",
        );

        elements.setProgress(
            0,
            totalPairs,
        );

        audioService.speak(
            getInstruction(),
        );
    }


    return Object.freeze({
        start: render,

        repeatInstruction() {
            audioService.speak(
                getInstruction(),
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