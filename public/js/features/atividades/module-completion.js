import { audioService } from "../../services/audio-service.js";

function makeElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function speakWord(word) {
    audioService.stop();
    audioService.speak(word, "en-US");
}

export function renderModuleCompletion({ module, elements }) {
    const words = Array.isArray(module?.items)
        ? module.items.filter(item => item?.en).filter((item, index, items) =>
            items.findIndex(candidate => candidate.en === item.en) === index)
        : [];

    elements.title.textContent = module?.title || "Módulo concluído";
    elements.setInstruction("Confira as palavras que você praticou neste módulo.");
    elements.setMessage(words.length
        ? `Módulo concluído! Você praticou ${words.length} ${words.length === 1 ? "palavra" : "palavras"}.`
        : "Muito bem! Você concluiu este módulo.");
    elements.nextButton.hidden = true;
    elements.nextButton.disabled = true;
    elements.repeatButton.hidden = true;
    const progressRegion = elements.progress.closest(".activity-progress");
    if (progressRegion) progressRegion.hidden = true;
    elements.backButton.href = "atividades.html";
    elements.backButton.setAttribute("aria-label", "Voltar aos módulos");
    elements.stage.inert = false;
    elements.stage.classList.remove("memory-stage", "practice-stage");
    elements.stage.classList.add("module-completion-stage");
    document.body.classList.add("activity-page--module-complete");

    const panel = makeElement("section", "module-completion");
    panel.setAttribute("aria-labelledby", "module-completion-title");

    const badge = makeElement("p", "module-completion__badge", "Módulo concluído");
    const heading = makeElement("h2", "module-completion__title", "Olha o que você praticou!");
    heading.id = "module-completion-title";
    heading.tabIndex = -1;
    const description = makeElement("p", "module-completion__description",
        `Você praticou ${words.length} ${words.length === 1 ? "palavra" : "palavras"} no módulo ${module?.title || ""}. Toque em uma palavra para ouvir novamente.`);

    const wordList = makeElement("ul", "module-completion__words");
    wordList.setAttribute("aria-label", `Palavras do módulo ${module?.title || ""}`);

    for (const item of words) {
        const card = makeElement("li", "module-completion__word");
        const imageFrame = makeElement("div", "module-completion__image-frame");
        const imageSource = item.vectorImage || item.realImage;

        if (imageSource) {
            const image = makeElement("img", "module-completion__image");
            image.src = imageSource;
            image.alt = item.pt ? `Imagem: ${item.pt}` : "";
            image.loading = "lazy";
            image.addEventListener("error", () => image.remove(), { once: true });
            imageFrame.append(image);
        }

        const english = makeElement("h3", "module-completion__english", item.en);
        english.lang = "en";
        const portuguese = makeElement("p", "module-completion__portuguese", item.pt || "");
        portuguese.lang = "pt-BR";
        const listen = makeElement("button", "module-completion__listen");
        listen.type = "button";
        listen.setAttribute("aria-label", `Ouvir ${item.en} em inglês`);
        listen.title = `Ouvir ${item.en}`;
        listen.innerHTML = '<i class="fi fi-br-volume" aria-hidden="true"></i><span>Ouvir</span>';
        listen.addEventListener("click", () => speakWord(item.en));

        card.append(imageFrame, english, portuguese, listen);
        wordList.append(card);
    }

    const actions = makeElement("div", "module-completion__actions");
    const listenAll = makeElement("button", "module-completion__listen-all", "Ouvir todas as palavras");
    listenAll.type = "button";
    listenAll.disabled = words.length === 0;
    listenAll.addEventListener("click", () => {
        audioService.stop();
        audioService.speakSequence(words.map(item => ({ text: item.en, language: "en-US" })));
    });

    const backToModules = makeElement("a", "module-completion__back", "Voltar aos módulos");
    backToModules.href = "atividades.html";
    actions.append(backToModules, listenAll);

    const helper = makeElement("p", "module-completion__helper",
        "Você pode ouvir as palavras novamente quando quiser.");

    panel.append(badge, heading, description);
    if (words.length) panel.append(wordList);
    else panel.append(makeElement("p", "module-completion__empty", "As palavras deste módulo ainda não estão disponíveis."));
    panel.append(actions, helper);
    elements.stage.replaceChildren(panel);

    const url = new URL(window.location.href);
    url.searchParams.set("modulo", String(module.id));
    url.searchParams.set("resumo", "1");
    url.searchParams.delete("etapa");
    url.searchParams.delete("retomar");
    window.history.replaceState(window.history.state, "", url);

    requestAnimationFrame(() => heading.focus({ preventScroll: true }));
    window.addEventListener("pagehide", () => audioService.stop(), { once: true });
}
