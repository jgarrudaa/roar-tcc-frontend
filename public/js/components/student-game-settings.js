import { gameSettingsService } from "../services/game-settings-service.js";

function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

export function mountStudentGameSettings(container, studentId, { onSaving = () => {} } = {}) {
    let disposed = false;
    let saving = false;
    const section = element("section", "student-game-settings");
    const title = element("h2", null, "Ajustes dos jogos");
    const help = element("p", "student-games-help", "Escolha o apoio para este aluno. Estes ajustes não alteram o nível de suporte TEA nem o nível de aprendizagem.");
    const form = element("form");
    const fields = element("fieldset", "student-games-grid");
    const legend = element("legend", "sr-only", "Preferências dos jogos deste aluno");
    fields.append(legend);
    const inputs = {};
    const definitions = [
        ["pieceCount", "Peças do quebra-cabeça", [["", "Conforme o perfil"], [2, "2 peças"], [4, "4 peças"], [6, "6 peças"]]],
        ["showHints", "Dicas de encaixe", [["true", "Disponíveis"], ["false", "Ocultas"]]],
        ["memoryPreviewSeconds", "Tempo para observar a memória", [3, 5, 8, 10].map(value => [value, `${value} segundos`])],
        ["advanceDelaySeconds", "Tempo antes de avançar", [1, 2, 3, 5].map(value => [value, `${value} segundo${value > 1 ? "s" : ""}`])],
    ];
    definitions.forEach(([key, label, choices]) => {
        const field = element("label", "student-games-field");
        const select = element("select");
        select.name = key;
        select.setAttribute("aria-label", label);
        choices.forEach(([value, text]) => {
            const option = element("option", null, text);
            option.value = String(value);
            select.append(option);
        });
        field.append(element("span", null, label), select);
        fields.append(field);
        inputs[key] = select;
    });
    const note = element("p", "student-games-help", "O aluno pode desligar o avanço automático em Configurações. Os novos ajustes valem ao abrir uma atividade.");
    const message = element("p", "student-games-message", "Carregando ajustes dos jogos...");
    message.setAttribute("role", "status");
    const actions = element("div", "student-games-actions");
    const save = element("button", "btn btn--primary", "Salvar ajustes dos jogos");
    save.type = "submit";
    const retry = element("button", "btn btn--secondary", "Tentar novamente");
    retry.type = "button";
    retry.hidden = true;
    actions.append(save, retry);
    form.append(fields, note, message, actions);
    section.append(title, help, form);
    container.replaceChildren(section);

    function setValues(settings) {
        Object.entries(inputs).forEach(([key, input]) => { input.value = String(settings[key] ?? ""); });
    }
    async function load() {
        fields.disabled = true;
        save.disabled = true;
        retry.hidden = true;
        section.setAttribute("aria-busy", "true");
        message.textContent = "Carregando ajustes dos jogos...";
        try {
            const settings = await gameSettingsService.getForStudent(studentId);
            if (disposed) return;
            setValues(settings);
            fields.disabled = false;
            save.disabled = false;
            message.textContent = "Ajustes atuais deste aluno.";
        } catch (error) {
            if (disposed) return;
            message.textContent = error?.message || "Não foi possível carregar os ajustes.";
            retry.hidden = false;
        } finally {
            if (!disposed) section.removeAttribute("aria-busy");
        }
    }
    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (disposed || saving || save.disabled) return;
        saving = true;
        onSaving(true);
        fields.disabled = true;
        save.disabled = true;
        message.textContent = "Salvando ajustes...";
        try {
            const settings = await gameSettingsService.saveForStudent(studentId, {
                pieceCount: inputs.pieceCount.value === "" ? null : Number(inputs.pieceCount.value),
                showHints: inputs.showHints.value === "true",
                memoryPreviewSeconds: Number(inputs.memoryPreviewSeconds.value),
                advanceDelaySeconds: Number(inputs.advanceDelaySeconds.value),
            });
            if (disposed) return;
            setValues(settings);
            message.textContent = "Ajustes salvos. Serão usados ao abrir a próxima atividade.";
        } catch (error) {
            if (!disposed) message.textContent = error?.message || "Não foi possível salvar. Tente novamente.";
        } finally {
            saving = false;
            onSaving(false);
            if (!disposed) {
                fields.disabled = false;
                save.disabled = false;
            }
        }
    });
    retry.addEventListener("click", load);
    void load();
    return Object.freeze({ destroy() { disposed = true; } });
}
