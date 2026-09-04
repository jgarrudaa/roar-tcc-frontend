import { audioService } from "../../services/audio-service.js";
import { createButton, createImage, shuffle } from "./activity-helpers.js";

export function createValidateActivity(context) {
    const { module, student, elements, onCorrect, onWrong } = context;
    let index = 0;

    function instruction(item) {
        if (student.supportLevel === 1) return `Selecione a imagem de ${item.pt}.`;
        return student.supportLevel === 3
            ? `Qual palavra em inglês representa ${item.pt} nesta situação?`
            : `Selecione a palavra que indica ${item.pt}.`;
    }

    function render() {
        const item = module.items[index];
        const optionCount = student.supportLevel === 1 ? 2 : student.supportLevel === 2 ? 3 : 4;
        const distractors = shuffle(module.items.filter((entry) => entry.id !== item.id)).slice(0, optionCount - 1);
        const options = shuffle([item, ...distractors]);
        elements.stage.replaceChildren();
        const content = document.createElement("div");
        content.className = "activity-content";
        content.append(createImage(item, student.supportLevel));
        const grid = document.createElement("div");
        grid.className = "choice-grid";
        options.forEach((option) => {
            const button = createButton(option.en);
            if (student.supportLevel === 1) {
                button.replaceChildren(createImage(option, 1));
                button.setAttribute("aria-label", `Selecionar imagem de ${option.pt}`);
            }
            button.addEventListener("click", () => {
                if (option.id === item.id) {
                    button.classList.add("is-correct");
                    elements.setMessage("Muito bem! Resposta correta.");
                    audioService.speak("Muito bem! Resposta correta.");
                    elements.nextButton.disabled = false;
                    elements.setProgress(index + 1, module.items.length);
                    onCorrect(item);
                    Array.from(grid.children).forEach((choice) => { choice.disabled = true; });
                    return;
                }
                button.classList.add("is-wrong");
                elements.setMessage(`Você errou. Tente novamente. Selecione a palavra que indica ${item.pt}.`);
                audioService.speak(`Você errou. Tente novamente. Selecione a palavra que indica ${item.pt}.`);
                onWrong(item);
                window.setTimeout(() => button.classList.remove("is-wrong"), 650);
            });
            grid.append(button);
        });
        content.append(grid);
        elements.stage.append(content);
        elements.setInstruction(instruction(item));
        elements.setProgress(index, module.items.length);
        if (student.supportLevel === 1) audioService.speak(instruction(item));
    }

    return {
        start: render,
        repeatInstruction: () => audioService.speak(instruction(module.items[index])),
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
