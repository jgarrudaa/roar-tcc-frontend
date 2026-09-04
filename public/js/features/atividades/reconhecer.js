import { audioService } from "../../services/audio-service.js";
import { createImage } from "./activity-helpers.js";

export function createRecognizeActivity(context) {
    const { module, student, elements, onCorrect } = context;
    let index = 0;
    let autoAdvanceTimer = null;

    function instruction(item) {
        if (student.supportLevel === 1) return `Clique em ${item.pt}.`;
        if (student.supportLevel === 2) return `Observe a imagem e clique para descobrir a palavra em inglês.`;
        return `Observe a situação e identifique como dizemos ${item.pt} em inglês.`;
    }

    function render() {
        const item = module.items[index];
        elements.stage.replaceChildren();
        const content = document.createElement("div");
        content.className = "activity-content";
        const imageButton = document.createElement("button");
        imageButton.type = "button";
        imageButton.className = "choice-card";
        imageButton.setAttribute("aria-label", instruction(item));
        imageButton.append(createImage(item, student.supportLevel));
        const word = document.createElement("div");
        word.className = "revealed-word";
        word.hidden = true;
        word.textContent = item.en;
        imageButton.addEventListener("click", () => {
            word.hidden = false;
            imageButton.classList.add("is-correct");
            audioService.speak(item.en, "en-US");
            elements.setMessage(`Muito bem! ${item.pt} em inglês é ${item.en}.`);
            elements.nextButton.disabled = false;
            elements.setProgress(index + 1, module.items.length);
            onCorrect(item);
            // Auto-avanço automático após revelar a palavra
            clearTimeout(autoAdvanceTimer);
            autoAdvanceTimer = window.setTimeout(() => {
                elements.nextButton.click();
            }, 1400);
        }, { once: true });
        content.append(imageButton, word);
        elements.stage.append(content);
        elements.setInstruction(instruction(item));
        elements.setProgress(index, module.items.length);
        if (student.supportLevel === 1) audioService.speak(instruction(item));
    }

    return {
        start: render,
        repeatInstruction() {
            audioService.speak(instruction(module.items[index]));
        },
        next() {
            clearTimeout(autoAdvanceTimer);
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
