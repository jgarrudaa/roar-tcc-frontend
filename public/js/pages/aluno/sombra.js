import { createShadowActivity } from "../../features/atividades/sombra.js";
import { audioService } from "../../services/audio-service.js";
import { storage } from "../../utils/storage.js";

const imageRoot = "../../public/assets/imagens/modulos/fazenda/";
const animals = Object.freeze([
    { id: "cow", en: "COW", pt: "Vaca" },
    { id: "horse", en: "HORSE", pt: "Cavalo" },
    { id: "pig", en: "PIG", pt: "Porco" },
    { id: "sheep", en: "SHEEP", pt: "Ovelha" },
    { id: "duck", en: "DUCK", pt: "Pato" },
    { id: "hen", en: "HEN", pt: "Galinha" },
].map(item => Object.freeze({
    ...item,
    realImage: imageRoot + item.id + ".png",
    vectorImage: imageRoot + item.id + ".png",
})));

const stage = document.querySelector("#activity-stage");
const nextButton = document.querySelector("#next-button");
const message = document.querySelector("#lex-message");
const instruction = document.querySelector("#activity-instruction");
const progress = document.querySelector("#activity-progress");
const progressLabel = document.querySelector("#progress-label");
const roundLabel = document.querySelector("#shadow-round");
const difficulty = document.querySelector("#shadow-difficulty");
const soundButton = document.querySelector("#shadow-sound");
let engine = null;
let round = 0;
let completed = 0;
let soundsEnabled = storage.getPreferences().soundsEnabled !== false;

function speak(text, language = "pt-BR") {
    if (soundsEnabled) audioService.speak(text, language);
}

function updateSoundButton() {
    soundButton.setAttribute("aria-pressed", String(soundsEnabled));
    soundButton.textContent = soundsEnabled ? "Som ligado" : "Som desligado";
}
updateSoundButton();

function updateProgress() {
    progress.value = completed;
    progressLabel.textContent = `${completed} de ${animals.length} animais`;
}

function startRound() {
    engine?.destroy?.();
    audioService.stop();
    nextButton.hidden = false;
    nextButton.disabled = true;
    nextButton.textContent = round === animals.length - 1 ? "Ver minhas palavras →" : "Próximo animal →";
    roundLabel.textContent = `Animal ${round + 1} de ${animals.length}`;
    stage.setAttribute("aria-busy", "true");
    const item = animals[round];
    engine = createShadowActivity({
        activity: { id: "practice-" + item.id, item },
        student: { supportLevel: 1 },
        pieceCount: Number(difficulty.value),
        onSpeak: speak,
        elements: {
            stage,
            nextButton,
            setInstruction(value) { instruction.textContent = value; },
            setMessage(value) { message.textContent = value; },
            setProgress() { updateProgress(); },
        },
        onCorrect() {
            completed = Math.max(completed, round + 1);
            updateProgress();
        },
        onWrong() {},
    });
    engine.start();
}

function showSummary() {
    engine?.destroy?.();
    engine = null;
    audioService.stop();
    stage.removeAttribute("aria-busy");
    instruction.textContent = "Toque em uma palavra para ouvir de novo.";
    roundLabel.textContent = "Os 6 animais estão completos!";
    difficulty.disabled = true;
    nextButton.hidden = true;
    message.textContent = "Muito bem! Você montou todos os animais. Vamos lembrar as palavras?";
    const panel = document.createElement("section");
    panel.className = "shadow-summary";
    const title = document.createElement("h2");
    title.textContent = "Olha o que você aprendeu!";
    const words = document.createElement("div");
    words.className = "shadow-summary-words";
    animals.forEach(item => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "shadow-summary-word";
        button.setAttribute("aria-label", `Ouvir ${item.en}, ${item.pt}`);
        const image = document.createElement("img");
        image.src = item.realImage;
        image.alt = "";
        const english = document.createElement("strong");
        english.textContent = item.en;
        const portuguese = document.createElement("span");
        portuguese.textContent = item.pt;
        button.append(image, english, portuguese);
        button.addEventListener("click", () => speak(item.en, "en-US"));
        words.append(button);
    });
    const restart = document.createElement("button");
    restart.className = "shadow-next";
    restart.type = "button";
    restart.textContent = "Jogar novamente";
    restart.addEventListener("click", () => {
        round = 0;
        completed = 0;
        difficulty.disabled = false;
        startRound();
        roundLabel.scrollIntoView({ block: "nearest" });
    });
    panel.append(title, words, restart);
    stage.replaceChildren(panel);
    title.tabIndex = -1;
    title.focus();
}

nextButton.addEventListener("click", () => {
    if (!engine?.next()) return;
    if (round === animals.length - 1) {
        showSummary();
        return;
    }
    round += 1;
    startRound();
    stage.querySelector(".shadow-listen-button")?.focus();
    instruction.scrollIntoView({ block: "nearest" });
});

difficulty.addEventListener("change", () => {
    completed = round;
    startRound();
});

soundButton.addEventListener("click", () => {
    soundsEnabled = !soundsEnabled;
    storage.setPreferences({ ...storage.getPreferences(), soundsEnabled });
    if (!soundsEnabled) audioService.stop();
    updateSoundButton();
    message.textContent = soundsEnabled
        ? "Som ligado. Toque em Ouvir palavra para escutar."
        : "Som desligado. Vamos continuar pelas imagens.";
});

window.addEventListener("pagehide", () => {
    engine?.destroy?.();
    audioService.stop();
});
startRound();
