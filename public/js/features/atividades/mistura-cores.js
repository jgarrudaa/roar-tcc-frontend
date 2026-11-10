import { createActivityLifecycle } from "./activity-lifecycle.js";
import { audioService } from "../../services/audio-service.js";
import {
    createButton,
    createImage,
    shuffle,
} from "./activity-helpers.js";

const RECIPES = [
    { first: "RED", second: "YELLOW", result: "ORANGE" },
    { first: "BLUE", second: "YELLOW", result: "GREEN" },
    { first: "RED", second: "BLUE", result: "PURPLE" },
];

function normalizeWord(value) {
    return String(value ?? "").trim().toUpperCase();
}

export function createColorMixActivity(context) {
    const lifecycle = createActivityLifecycle();
    const {
        activity,
        module,
        student,
        elements,
        onCorrect,
        onWrong,
        resumeState,
    } = context;

    const itemsByWord = new Map(
        module.items.map(item => [normalizeWord(item.en), item]),
    );

    const rounds = RECIPES.map(recipe => {
        const firstItem = itemsByWord.get(recipe.first);
        const secondItem = itemsByWord.get(recipe.second);
        const resultItem = itemsByWord.get(recipe.result);

        if (!firstItem || !secondItem || !resultItem) {
            throw new Error(
                `Não foi possível preparar a mistura ${recipe.first} + ${recipe.second}.`,
            );
        }

        return { ...recipe, firstItem, secondItem, resultItem };
    });

    const stateKey = JSON.stringify([
        activity.id,
        rounds.map(round => [
            round.first,
            round.second,
            round.result,
        ]),
    ]);

    const savedState =
        resumeState?.version === 1 &&
        resumeState.key === stateKey &&
        Number.isInteger(resumeState.index) &&
        resumeState.index >= 0 &&
        resumeState.index < rounds.length &&
        typeof resumeState.resolved === "boolean"
            ? resumeState
            : null;

    let index = savedState?.index ?? 0;
    let resolved = savedState?.resolved ?? false;

    function getState() {
        return {
            version: 1,
            key: stateKey,
            index,
            resolved,
        };
    }

    function speakRound() {
        const round = rounds[index];

        audioService.speakSequence([
            { text: "Misture as cores", language: "pt-BR" },
            { text: round.firstItem.en, language: "en-US" },
            { text: "e", language: "pt-BR" },
            { text: round.secondItem.en, language: "en-US" },
            { text: "Qual cor aparece?", language: "pt-BR" },
        ]);
    }

    function createColorTile(item, className) {
        const tile = document.createElement("div");
        tile.className = className;

        const image = createImage(item, student.supportLevel);
        image.alt = "";
        image.setAttribute("aria-hidden", "true");

        const label = document.createElement("strong");
        label.lang = "en";
        label.textContent = item.en;

        tile.append(image, label);
        return tile;
    }

    function render() {
        if (lifecycle.destroyed) return;

        const round = rounds[index];
        const content = document.createElement("section");
        content.className = "activity-content color-mix-game";

        const recipe = document.createElement("div");
        recipe.className = "color-mix-recipe";
        recipe.setAttribute("aria-label", "Mistura de duas cores");

        const firstTile = createColorTile(
            round.firstItem,
            "color-mix-tile",
        );

        const plus = document.createElement("span");
        plus.className = "color-mix-symbol";
        plus.textContent = "+";
        plus.setAttribute("aria-hidden", "true");

        const secondTile = createColorTile(
            round.secondItem,
            "color-mix-tile",
        );

        const arrow = document.createElement("span");
        arrow.className = "color-mix-symbol";
        arrow.textContent = "→";
        arrow.setAttribute("aria-hidden", "true");

        const resultSlot = document.createElement("div");
        resultSlot.className = "color-mix-result";
        resultSlot.setAttribute("aria-label", "Resultado da mistura");

        if (resolved) {
            const resultImage = createImage(
                round.resultItem,
                student.supportLevel,
            );
            resultImage.alt = `Resultado: ${round.resultItem.pt}`;
            resultSlot.replaceChildren(resultImage);
            resultSlot.classList.add("is-revealed");
        } else {
            resultSlot.textContent = "?";
        }

        recipe.append(firstTile, plus, secondTile, arrow, resultSlot);

        const options = document.createElement("div");
        options.className = "color-mix-options";
        options.setAttribute("role", "group");
        options.setAttribute("aria-label", "Cores possíveis");

        const answerItems = shuffle(
            RECIPES.map(recipe =>
                itemsByWord.get(recipe.result),
            ),
        );

        answerItems.forEach(item => {
            const button = createButton("", "color-mix-option");
            button.setAttribute(
                "aria-label",
                `${item.en}, ${item.pt}`,
            );

            const image = createImage(item, student.supportLevel);
            image.alt = "";

            const english = document.createElement("strong");
            english.lang = "en";
            english.textContent = item.en;

            const portuguese = document.createElement("span");
            portuguese.textContent = item.pt;

            button.append(image, english, portuguese);

            if (resolved) {
                button.disabled = true;

                if (normalizeWord(item.en) === round.result) {
                    button.classList.add("is-correct");
                    button.setAttribute("aria-pressed", "true");
                }
            } else {
                button.setAttribute("aria-pressed", "false");

                lifecycle.listen(button, "click", () => {
                    if (resolved || lifecycle.destroyed) return;

                    if (normalizeWord(item.en) === round.result) {
                        resolved = true;
                        button.classList.add("is-correct");
                        button.setAttribute("aria-pressed", "true");

                        options
                            .querySelectorAll("button")
                            .forEach(option => {
                                option.disabled = true;
                            });

                        const resultImage = createImage(
                            round.resultItem,
                            student.supportLevel,
                        );
                        resultImage.alt =
                            `Resultado: ${round.resultItem.pt}`;
                        resultSlot.replaceChildren(resultImage);
                        resultSlot.classList.add("is-revealed");

                        elements.setProgress(index + 1, rounds.length);
                        elements.setMessage(
                            `Isso! ${round.firstItem.pt} e ${round.secondItem.pt} formam ${round.resultItem.pt}.`,
                        );
                        elements.nextButton.disabled = false;

                        onCorrect(round.resultItem);
                        context.onStateChange?.();
                        return;
                    }

                    button.classList.add("is-wrong");
                    elements.setMessage("Quase! Tente outra cor.");
                    onWrong(round.resultItem);

                    lifecycle.timeout(
                        () => button.classList.remove("is-wrong"),
                        650,
                    );
                });
            }

            options.append(button);
        });

        content.append(recipe, options);
        elements.stage.replaceChildren(content);
        elements.nextButton.disabled = !resolved;
        elements.setProgress(
            index + Number(resolved),
            rounds.length,
        );
    }

    function advanceRound() {
        if (
            lifecycle.destroyed ||
            !resolved ||
            index >= rounds.length - 1
        ) {
            return false;
        }

        index += 1;
        resolved = false;
        render();
        speakRound();
        context.onStateChange?.();
        return true;
    }

    return Object.freeze({
        start() {
            render();
            if (!resolved) speakRound();
        },

        destroy() {
            lifecycle.destroy();
            audioService.stop();
        },

        getState,

        repeatInstruction() {
            if (!lifecycle.destroyed) speakRound();
        },

        isRoundComplete() {
            return resolved;
        },

        advanceRound,

        next() {
            return (
                !lifecycle.destroyed &&
                resolved &&
                index === rounds.length - 1
            );
        },
    });
}