import { createActivityLifecycle } from "./activity-lifecycle.js";
import { audioService } from "../../services/audio-service.js";
import { createButton, createImage, shuffle } from "./activity-helpers.js";
import { categoryPictogram, itemPictogram, armHighlight } from "./practice-pictograms.js";
import { createSceneDrag } from "./scene-drag.js";

// Both activities use native buttons for touch, mouse, Enter and Space.
// The module controller owns the one-second delay for rounds and phases alike.
function createPracticeActivity(context, kind) {
    const lifecycle = createActivityLifecycle();
    const { activity, student, elements, onCorrect, onWrong } = context;
    const rounds = kind === "categories" ? activity.cards : [
        { item: activity.item, destination: "in" },
        { item: activity.item, destination: "on" },
    ];
    let index = 0;
    let answered = false;
    let completed = false;
    let selectedButton;
    let dragController;

    function instruction() {
        const round = rounds[index];
        if (kind === "categories") return `A qual grupo pertence ${round.item.en}?`;
        return `Put the ${round.item.en.toLowerCase()} card ${round.destination === "in" ? "in the box" : "on the table"}.`;
    }

    function repeatInstruction() {
        if (lifecycle.destroyed) return;
        audioService.speakSequence(kind === "categories" ? [
            { text: "Escolha o grupo deste cartão.", language: "pt-BR" },
            { text: rounds[index].item.en.toLowerCase(), language: "en-US" },
            ...activity.groups.map(group => ({ text: group.en, language: "en-US" })),
        ] : [
            { text: "Arraste o cartão até o lugar indicado. Você também pode selecionar o cartão e depois o destino.", language: "pt-BR" },
            { text: instruction(), language: "en-US" },
        ]);
    }

    function render() {
        if (lifecycle.destroyed || completed) return;
        dragController?.destroy();
        answered = false;
        let selected = false;
        const round = rounds[index];
        const content = document.createElement("section");
        content.className = "activity-content module-practice";
        const heading = document.createElement("h2");
        heading.textContent = kind === "categories" ? "Separe por categorias" : "Complete a cena";
        const counter = document.createElement("p");
        counter.textContent = `Cartão ${index + 1} de ${rounds.length}`;
        const card = createButton("", "practice-card");
        selectedButton = card;
        card.setAttribute("aria-label", `Ouvir ${round.item.en}`);
        function selectCard(value) {
            if (answered || completed) return;
            selected = value;
            card.classList.toggle("is-selected", value);
            card.setAttribute("aria-pressed", String(value));
        }
        if (kind === "scene") {
            card.classList.add("practice-draggable");
            card.setAttribute("aria-label", `Selecionar e ouvir ${round.item.en}. Arraste até o destino ou selecione com Enter.`);
            card.setAttribute("aria-pressed", "false");
        }
        // The original LEG image crops both feet. Use a complete vector diagram
        // for this practice card, keeping the source vocabulary and other games intact.
        const isLeg = round.item.en.trim().toUpperCase() === "LEG";
        const legImage = "/public/assets/imagens/modulos/corpo_humano/leg-complete.svg";
        const image = createImage({ ...round.item,
            realImage: isLeg ? legImage : round.item.realImage || round.item.vectorImage,
            vectorImage: isLeg ? legImage : round.item.vectorImage }, student.supportLevel);
        if (isLeg) image.alt = "Perna destacada por um contorno, com pernas e pés inteiros.";
        const caption = document.createElement("span");
        caption.className = "practice-word";
        caption.lang = "en";
        caption.textContent = round.item.en;
        const illustration = document.createElement("span");
        illustration.className = "practice-illustration";
        illustration.append(image);
        const highlight = armHighlight(image.src);
        if (highlight) illustration.append(highlight);
        const bodyGuide = isLeg ? null : itemPictogram(round.item.en);
        if (bodyGuide) {
            bodyGuide.classList.add("practice-body-guide");
            illustration.append(bodyGuide);
        }
        card.append(illustration, caption);
        lifecycle.listen(card, "click", () => {
            if (answered || completed) return;
            if (kind === "scene") {
                selectCard(true);
                elements.setMessage("Cartão selecionado. Arraste ou escolha o destino. Escape cancela a seleção.");
            }
            audioService.speak(round.item.en.toLowerCase(), "en-US");
        });
        if (kind === "scene") {
            const cue = document.createElement("span");
            cue.className = "practice-drag-cue";
            cue.textContent = "↕ Arraste o cartão";
            card.append(cue);
        }
        const help = document.createElement("p");
        help.className = "practice-help";
        help.textContent = kind === "categories" ? "Toque no cartão para ouvir. Depois escolha um grupo." :
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
            } else button.append(categoryPictogram(option.id));
            const english = document.createElement("strong");
            english.textContent = option.en;
            button.append(english);
            const dictionary = document.createElement("details");
            dictionary.className = "practice-dictionary";
            const summary = document.createElement("summary");
            summary.textContent = "? Ajuda";
            summary.setAttribute("aria-label", `Tradução de ${option.en}`);
            const portuguese = document.createElement("p");
            portuguese.textContent = option.pt;
            const listen = createButton("Ouvir em inglês", "practice-listen");
            lifecycle.listen(listen, "click", () => audioService.speak(option.en, "en-US"));
            dictionary.append(summary, portuguese, listen);
            buttons.push(button);
            lifecycle.listen(button, "click", () => {
                if (answered || completed) return;
                if (kind === "scene" && !selected) {
                    elements.setMessage("Pegue o cartão primeiro: arraste ou selecione o cartão e depois o destino.");
                    return;
                }
                const correct = option.id === (round.category || round.destination);
                if (!correct) {
                    if (kind === "scene") selectCard(false);
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
                completed = index === rounds.length - 1;
                elements.setProgress(index + 1, rounds.length);
                elements.setMessage(completed ? "Muito bem! Você completou o jogo." : "Isso! Você encontrou o lugar certo.");
                elements.nextButton.disabled = false;
                elements.nextButton.focus?.({ preventScroll: true });
                onCorrect({ ...round.item, id: `${kind}:${index}:${round.item.id}`,
                    itemId: `${kind}:${index}:${round.item.itemId}` });
            });
            optionContainer.append(button, dictionary);
            choices.append(optionContainer);
        });
        content.append(heading, counter, card, help, choices);
        elements.stage.replaceChildren(content);
        if (kind === "scene") {
            dragController = createSceneDrag({ card, targets: buttons,
                enabled: () => !lifecycle.destroyed && !answered && !completed,
                onSelect: selectCard,
                onDrop: target => target.click(),
                onCancel: () => elements.setMessage("O cartão voltou ao início. Arraste novamente até a caixa ou a mesa."),
            });
        }
        elements.stage.scrollTop = 0;
        elements.nextButton.disabled = true;
        elements.setInstruction(instruction());
        elements.setProgress(index, rounds.length);
        elements.setMessage("Sem pressa. Você pode ouvir e tentar novamente.");
    }

    return Object.freeze({
        start: render,
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
        destroy() { dragController?.destroy(); lifecycle.destroy(); audioService.stop(); },
    });
}

export function createCategoriesActivity(context) { return createPracticeActivity(context, "categories"); }
export function createSceneActivity(context) { return createPracticeActivity(context, "scene"); }
