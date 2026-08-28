import { audioService } from "../../services/audio-service.js";
import { createButton, createImage, shuffle } from "./activity-helpers.js";

function guidedAssociation(context) {
    const { module, student, elements, onCorrect, onWrong } = context;
    let imageSelection = null;
    let wordSelection = null;
    const completed = new Set();

    function checkPair() {
        if (!imageSelection || !wordSelection) return;
        const isCorrect = imageSelection.dataset.id === wordSelection.dataset.id;
        if (isCorrect) {
            imageSelection.classList.add("is-correct");
            wordSelection.classList.add("is-correct");
            imageSelection.disabled = true;
            wordSelection.disabled = true;
            completed.add(imageSelection.dataset.id);
            elements.setMessage("Muito bem! Você encontrou a associação correta.");
            onCorrect({ id: imageSelection.dataset.id });
            elements.setProgress(completed.size, module.items.length);
            if (completed.size === module.items.length) elements.nextButton.disabled = false;
        } else {
            imageSelection.classList.add("is-wrong");
            wordSelection.classList.add("is-wrong");
            const item = module.items.find((entry) => entry.id === imageSelection.dataset.id);
            elements.setMessage(`Você errou. Tente novamente. Encontre a palavra de ${item.pt}.`);
            audioService.speak(`Você errou. Tente novamente. Encontre a palavra de ${item.pt}.`);
            onWrong(item);
            window.setTimeout(() => {
                imageSelection?.classList.remove("is-wrong", "is-selected");
                wordSelection?.classList.remove("is-wrong", "is-selected");
                imageSelection = null;
                wordSelection = null;
            }, 650);
            return;
        }
        imageSelection = null;
        wordSelection = null;
    }

    function render() {
        elements.stage.replaceChildren();
        const content = document.createElement("div");
        content.className = "activity-content";
        const images = document.createElement("div");
        const words = document.createElement("div");
        images.className = "choice-grid association-grid";
        words.className = "choice-grid association-grid";

        shuffle(module.items).forEach((item) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "choice-card";
            button.dataset.id = item.id;
            button.append(createImage(item, student.supportLevel));
            button.addEventListener("click", () => {
                imageSelection?.classList.remove("is-selected");
                imageSelection = button;
                button.classList.add("is-selected");
                audioService.speak(item.pt);
                checkPair();
            });
            images.append(button);
        });

        shuffle(module.items).forEach((item) => {
            const button = createButton(item.en);
            button.dataset.id = item.id;
            button.addEventListener("click", () => {
                wordSelection?.classList.remove("is-selected");
                wordSelection = button;
                button.classList.add("is-selected");
                checkPair();
            });
            words.append(button);
        });
        content.append(images, words);
        elements.stage.append(content);
        elements.setInstruction("Selecione uma imagem e depois a palavra correspondente.");
        elements.setProgress(0, module.items.length);
    }

    return { start: render, repeatInstruction: () => audioService.speak("Selecione uma imagem e depois a palavra correspondente."), next: () => true };
}

function contextualSentence(context) {
    const { module, elements, onCorrect, onWrong } = context;
    let index = 0;
    let selected = [];

    function render() {
        const item = module.items[index];
        selected = [];
        elements.stage.replaceChildren();
        const content = document.createElement("div");
        content.className = "activity-content";
        const builder = document.createElement("div");
        builder.className = "sentence-builder";
        const target = document.createElement("div");
        target.className = "sentence-target";
        target.textContent = "Monte a frase";
        const bank = document.createElement("div");
        bank.className = "word-bank";
        const expected = ["THIS", "IS", "MY", item.en];
        shuffle(expected).forEach((word) => {
            const button = createButton(word, "word-token");
            button.addEventListener("click", () => {
                selected.push(word);
                button.disabled = true;
                target.textContent = selected.join(" ");
                if (selected.length !== expected.length) return;
                if (selected.join(" ") === expected.join(" ")) {
                    elements.setMessage("Muito bem! A frase está correta.");
                    onCorrect(item);
                    elements.nextButton.disabled = false;
                } else {
                    elements.setMessage("Você errou. Tente novamente e observe a ordem da frase.");
                    audioService.speak("Você errou. Tente novamente.");
                    onWrong(item);
                    window.setTimeout(render, 700);
                }
            });
            bank.append(button);
        });
        builder.append(target, bank);
        content.append(createImage(item, 3), builder);
        elements.stage.append(content);
        elements.setInstruction(`Organize as palavras para formar uma frase sobre ${item.pt}.`);
        elements.setProgress(index, module.items.length);
    }

    return {
        start: render,
        repeatInstruction: () => audioService.speak("Organize as palavras para formar uma frase."),
        next() {
            if (index < module.items.length - 1) {
                index += 1;
                elements.nextButton.disabled = true;
                render();
                return false;
            }
            return true;
        },
    };
}

export function createAssociateActivity(context) {
    return context.student.supportLevel === 3 ? contextualSentence(context) : guidedAssociation(context);
}
