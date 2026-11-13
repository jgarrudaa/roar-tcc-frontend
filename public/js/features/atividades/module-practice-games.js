import { createActivityLifecycle } from "./activity-lifecycle.js";
import { audioService } from "../../services/audio-service.js";
import { createButton, createImage, shuffle } from "./activity-helpers.js";
import { categoryPictogram, itemPictogram, armHighlight } from "./practice-pictograms.js?v=2";
import { createSceneDrag } from "./scene-drag.js";

// Both activities use native buttons for touch, mouse, Enter and Space.
// The module controller owns the one-second delay for rounds and phases alike.
function createPracticeActivity(context, kind) {
    const lifecycle = createActivityLifecycle();
    const { activity, student, elements, onCorrect, onWrong } = context;
    const dragToCategory = kind === "categories" && activity.dragToCategory === true;
    const requiresCardSelection = kind === "scene" || dragToCategory;
    const rounds = kind === "categories" ? activity.cards : [
        { item: activity.item, destination: "in" },
        { item: activity.item, destination: "on" },
    ];
    const stateKey = JSON.stringify([kind, dragToCategory, student.supportLevel, student.teaSupportLevel,
        rounds.map(round => [round.item.itemId ?? round.item.id ?? round.item.en,
        round.item.vectorImage || round.item.realImage, round.category || round.destination])]);
    const candidate = context.resumeState;
    const savedState = candidate?.version === 1 && candidate.key === stateKey &&
        Number.isInteger(candidate.index) && candidate.index >= 0 && candidate.index < rounds.length &&
        typeof candidate.answered === "boolean" ? candidate : null;

    const isAnimalClassification =
        kind === "categories" &&
        activity.groups?.some(group =>
            ["birds", "mammals"].includes(group.id)
        );

    const classifiedAnimalsByGroup = new Map(
        (activity.groups || []).map(group => [group.id, []])
    );


    let index = savedState?.index ?? 0;
    const placedByCategory = new Map();

    if (isAnimalClassification && savedState) {
        const completedRounds = Math.min(
            rounds.length,
            savedState.index + (savedState.answered ? 1 : 0),
        );

        for (const previousRound of rounds.slice(0, completedRounds)) {
            const items = classifiedAnimalsByGroup.get(previousRound.category);

            if (items && previousRound.item) {
                items.push(previousRound.item);
            }
        }
    }

    if (dragToCategory && savedState) {
        const completedRounds = Math.min(
            rounds.length,
            savedState.index + (savedState.answered ? 1 : 0),
        );

        for (const previousRound of rounds.slice(0, completedRounds)) {
            if (previousRound.category) {
                placedByCategory.set(
                    previousRound.category,
                    previousRound.item,
                );
            }
        }
    }
    let answered = false;
    let completed = false;
    let selectedButton;
    let dragController;

    function instruction() {
        const round = rounds[index];
        if (dragToCategory) return `Arraste ${round.item.en} até a cor correspondente.`;
        if (kind === "categories") return `A qual grupo pertence ${round.item.en}?`;
        return `Put the ${round.item.en.toLowerCase()} card ${round.destination === "in" ? "in the box" : "on the table"}.`;
    }

    function repeatInstruction() {
        if (lifecycle.destroyed) return;
        audioService.speakSequence(kind === "categories" ? [
            { text: dragToCategory ? "Arraste o cartão para o cesto da cor correspondente." : "Escolha o grupo deste cartão.", language: "pt-BR" },
            { text: rounds[index].item.en.toLowerCase(), language: "en-US" },
            ...activity.groups.map(group => ({ text: group.en, language: "en-US" })),
        ] : [
            { text: "Arraste o cartão até o lugar indicado. Você também pode selecionar o cartão e depois o destino.", language: "pt-BR" },
            { text: instruction(), language: "en-US" },
        ]);
    }

    function createClassifiedAnimal(item) {
        const chip = document.createElement("span");
        chip.className = "practice-classified-animal";

        const image = createImage(item, student.supportLevel);
        image.alt = "";
        image.setAttribute("aria-hidden", "true");

        const label = document.createElement("span");
        label.textContent = item.pt || item.en;

        chip.append(image, label);
        return chip;
    }

    function render() {
        if (lifecycle.destroyed) return;
        dragController?.destroy();
        document.body.classList.add("is-practice");
        elements.stage.classList.add("practice-stage");
        answered = savedState?.index === index && savedState.answered;
        completed = answered && index === rounds.length - 1;
        let selected = false;
        const round = rounds[index];
        const content = document.createElement("section");
        content.className = `activity-content module-practice${dragToCategory ? " module-practice--color-sort" : ""}`;
        const heading = document.createElement("h2");
        heading.textContent = activity.title || (kind === "categories" ? "Separe por categorias" : "Complete a cena");
        const card = createButton("", "practice-card");
        selectedButton = card;
        card.setAttribute("aria-label", `Ouvir ${round.item.en}`);
        function selectCard(value) {
            if (answered || completed) return;
            selected = value;
            card.classList.toggle("is-selected", value);
            card.setAttribute("aria-pressed", String(value));
        }
        if (requiresCardSelection) {
            card.classList.add("practice-draggable");
            card.setAttribute("aria-label", `Selecionar e ouvir ${round.item.en}. Arraste até o destino ou selecione e toque no destino.`);
            card.setAttribute("aria-pressed", "false");
        }
        // The original LEG image crops both feet. Use a complete vector diagram
        // for this practice card, keeping the source vocabulary and other games intact.
        const isLeg = round.item.en.trim().toUpperCase() === "LEG";
        const legImage = "/public/assets/imagens/modulos/corpo_humano/leg-complete.svg";
        const image = createImage({
            ...round.item,
            realImage: isLeg ? legImage : round.item.realImage || round.item.vectorImage,
            vectorImage: isLeg ? legImage : round.item.vectorImage
        }, student.supportLevel);
        if (isLeg) image.alt = "Perna destacada por um contorno, com pernas e pés inteiros.";
        const caption = document.createElement("span");
        caption.className = "practice-word";
        caption.lang = "en";
        caption.textContent = round.item.en;
        const illustration = document.createElement("span");
        illustration.className = "practice-illustration";
        illustration.append(image);
        const highlight = armHighlight(image.src);
        if (highlight && context.gameSettings?.showHints !== false) illustration.append(highlight);
        const bodyGuide = isLeg ? null : itemPictogram(round.item.en);
        if (bodyGuide && context.gameSettings?.showHints !== false) {
            bodyGuide.classList.add("practice-body-guide");
            illustration.append(bodyGuide);
        }
        card.append(illustration, caption);
        lifecycle.listen(card, "click", () => {
            if (answered || completed) return;
            if (requiresCardSelection) {
                selectCard(true);
                elements.setMessage(dragToCategory
                    ? "Cartão selecionado. Arraste até o cesto da cor correspondente ou toque nele e depois no cesto."
                    : "Cartão selecionado. Arraste ou escolha o destino. Escape cancela a seleção.");
            }
            audioService.speak(round.item.en.toLowerCase(), "en-US");
        });
        if (requiresCardSelection) {
            const cue = document.createElement("span");
            cue.className = "practice-drag-cue";
            cue.textContent = dragToCategory ? "↕ Arraste para o cesto da cor" : "↕ Arraste o cartão";
            card.append(cue);
        }
        const help = document.createElement("p");
        help.className = "practice-help";
        help.textContent = dragToCategory
            ? "Arraste o cartão até o cesto da cor correspondente. Também pode selecionar o cartão e tocar no cesto."
            : kind === "categories" ? "Toque no cartão para ouvir. Depois escolha um grupo." :
                `Arraste o cartão ${round.destination === "in" ? "para dentro da caixa" : "para cima da mesa"}. Ou selecione o cartão e depois o destino.`;
        const choices = document.createElement("div");
        choices.className = "practice-choices";
        const options = kind === "categories" ? shuffle(activity.groups) : [
            { id: "in", en: "In the box", pt: "Dentro da caixa" },
            { id: "on", en: "On the table", pt: "Sobre a mesa" },
        ];
        const buttons = [];
        options.forEach(option => {
            const optionContainer = document.createElement("div");
            optionContainer.className = "practice-option";
            const button = createButton("", "practice-choice");
            button.dataset.choice = option.id;
            button.setAttribute("aria-label", option.en);
            button.lang = "en";
            if (kind === "scene") {
                button.classList.add("practice-drop-target");
                const place = document.createElement("span");
                place.className = `practice-place practice-place--${option.id}`;
                place.setAttribute("aria-hidden", "true");
                button.append(place);
            } else {
                if (dragToCategory) button.classList.add("practice-drop-target");
                button.append(categoryPictogram(option.id));
            }
            const english = document.createElement("strong");
            english.textContent = option.en;

            const placedItem = dragToCategory
                ? placedByCategory.get(option.id)
                : null;

            if (placedItem) {
                const placedImage = createImage(
                    placedItem,
                    student.supportLevel,
                );

                placedImage.alt = "";
                placedImage.setAttribute("aria-hidden", "true");
                placedImage.className = "practice-placed-object";

                button.classList.add("is-filled", "is-correct");
                button.disabled = true;
                button.setAttribute(
                    "aria-label",
                    `${option.en}. ${placedItem.pt} associado.`,
                );
                button.append(placedImage);
            }

            button.append(english);
            if (isAnimalClassification) {
                const translation = document.createElement("span");
                translation.className = "practice-category-translation";
                translation.textContent = option.pt;
                button.append(translation);

                const animalTray = document.createElement("span");
                animalTray.className = "practice-classified-animals";
                animalTray.setAttribute("aria-label", `${option.pt} classificados`);

                for (const animal of classifiedAnimalsByGroup.get(option.id) || []) {
                    animalTray.append(createClassifiedAnimal(animal));
                }

                button.append(animalTray);
            }




            buttons.push(button);
            lifecycle.listen(button, "click", () => {
                if (answered || completed) return;
                if (requiresCardSelection && !selected) {
                    elements.setMessage("Selecione o cartão primeiro e depois arraste ou toque no destino.");
                    return;
                }
                const correct = option.id === (round.category || round.destination);
                if (!correct) {
                    if (requiresCardSelection) selectCard(false);
                    button.classList.add("is-wrong");
                    elements.setMessage("Vamos tentar de novo, com calma. Você pode ouvir a instrução novamente.");
                    onWrong(round.item);
                    lifecycle.timeout(() => button.classList.remove("is-wrong"), 650);
                    return;
                }
                answered = true;
                button.classList.add("is-correct");
                buttons.forEach(candidate => { candidate.disabled = true; });
                if (kind === "scene") {
                    card.classList.remove("is-selected");
                    card.classList.add("is-placed");
                    card.setAttribute("aria-pressed", "false");
                    const placed = image.cloneNode(true);
                    placed.alt = "";
                    placed.className = "practice-placed-card";
                    button.querySelector(".practice-place").append(placed);
                }

                if (isAnimalClassification) {
                    const items = classifiedAnimalsByGroup.get(option.id) || [];
                    items.push(round.item);
                    classifiedAnimalsByGroup.set(option.id, items);

                    button.querySelector(".practice-classified-animals")
                        ?.append(createClassifiedAnimal(round.item));

                    button.setAttribute(
                        "aria-label",
                        `${option.en}. ${round.item.pt} classificado.`,
                    );
                }

                else if (dragToCategory) {
                    card.classList.remove("is-selected");
                    card.classList.add("is-placed");
                    card.setAttribute("aria-pressed", "false");

                    placedByCategory.set(option.id, round.item);

                    const placedImage = image.cloneNode(true);
                    placedImage.alt = "";
                    placedImage.setAttribute("aria-hidden", "true");
                    placedImage.className = "practice-placed-object";

                    button.classList.add("is-filled");
                    button.setAttribute(
                        "aria-label",
                        `${option.en}.${round.item.pt} associado.`,
                    );
                    button.insertBefore(placedImage, english);
                }
                completed = index === rounds.length - 1;
                elements.setProgress(index + 1, rounds.length);
                elements.setMessage(completed ? "Muito bem! Você completou o jogo." : "Isso! Você encontrou o lugar certo.");
                elements.nextButton.disabled = false;
                elements.nextButton.focus?.({ preventScroll: true });
                context.onStateChange?.();
                onCorrect({
                    ...round.item, id: `${kind}: ${index}: ${round.item.id}`,
                    itemId: `${kind}: ${index}: ${round.item.itemId}`
                });
            });
            optionContainer.append(button);
            choices.append(optionContainer);
        });
        content.append(card, choices);
        elements.stage.replaceChildren(content);
        if (requiresCardSelection) {
            dragController = createSceneDrag({
                card, targets: buttons,
                enabled: () => !lifecycle.destroyed && !answered && !completed,
                onSelect: selectCard,
                onDrop: target => target.click(),
                onCancel: () => elements.setMessage(dragToCategory
                    ? "O cartão voltou ao início. Tente arrastá-lo até o cesto da cor correta."
                    : "O cartão voltou ao início. Arraste novamente até a caixa ou a mesa."),
            });
        }
        elements.stage.scrollTop = 0;
        elements.nextButton.disabled = !answered;
        elements.setInstruction(instruction());
        elements.setProgress(index + (answered ? 1 : 0), rounds.length);
        elements.setMessage(answered ? "Vamos continuar de onde você parou." : "Sem pressa. Você pode ouvir e tentar novamente.");
        if (answered) {
            const correct = buttons.find(button => button.dataset.choice === (round.category || round.destination));
            correct?.classList.add("is-correct");
            buttons.forEach(button => { button.disabled = true; });
            if (dragToCategory && correct) {
                card.classList.add("is-placed");
                card.setAttribute("aria-pressed", "false");
            } else if (kind === "scene" && correct) {
                card.classList.add("is-placed");
                const placed = image.cloneNode(true);
                placed.alt = "";
                placed.className = "practice-placed-card";
                correct.querySelector(".practice-place").append(placed);
            }
        }
        context.onStateChange?.();
    }

    return Object.freeze({
        start: render,
        getState: () => ({ version: 1, key: stateKey, index, answered: Boolean(answered) }),
        repeatInstruction,
        next: () => !lifecycle.destroyed && completed,
        isRoundComplete: () => !lifecycle.destroyed && answered,
        advanceRound() {
            if (lifecycle.destroyed || !answered || completed) return false;
            audioService.stop();
            index += 1;
            render();
            selectedButton.focus?.({ preventScroll: true });
            return true;
        },
        destroy() {
            document.body.classList.remove("is-practice");
            elements.stage.classList.remove("practice-stage");
            dragController?.destroy();
            lifecycle.destroy();
            audioService.stop();
        },
    });
}

export function createCategoriesActivity(context) { return createPracticeActivity(context, "categories"); }
export function createSceneActivity(context) { return createPracticeActivity(context, "scene"); }
