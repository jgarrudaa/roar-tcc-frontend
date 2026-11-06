import { relatoriosService } from "../services/relatorios-service.js";

function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

export function createStudentWordProgress(studentId) {
    const section = element("section", "word-learning-section");
    const heading = element("h2", null, "Aprendizagem por palavra");
    const description = element("p", "student-games-help", "Acompanhe os acertos, erros e dicas registrados nos jogos e escolha quais palavras revisar com o aluno.");
    const content = element("div");
    const status = element("p", "student-games-message");
    status.setAttribute("role", "status");
    const retry = element("button", "btn btn--secondary student-learning-retry", "Tentar novamente");
    retry.type = "button";
    retry.hidden = true;
    section.append(heading, description, content, status, retry);

    async function load() {
        content.replaceChildren();
        retry.hidden = true;
        section.setAttribute("aria-busy", "true");
        status.textContent = "Carregando palavras praticadas...";
        try {
            const report = await relatoriosService.getStudentWords(studentId);
            if (!section.isConnected) return;
            if (!report.words.length) {
                status.textContent = "Ainda não há registros por palavra. Eles aparecerão após novas atividades concluídas; o histórico antigo continua no detalhamento por atividade.";
                return;
            }
            status.textContent = "“—” indica uma medida que não foi registrada.";
            const withSuccess = report.words.filter(word => (word.correct ?? 0) > 0).length;
            const forReview = report.words.filter(word => word.needsReview).length;
            const summary = element("p", "word-learning-summary", `${withSuccess} ${withSuccess === 1 ? "palavra com acertos" : "palavras com acertos"} · ${forReview} ${forReview === 1 ? "palavra para revisar" : "palavras para revisar"}`);
            const wrap = element("div", "word-learning-table-wrap");
            wrap.tabIndex = 0;
            wrap.setAttribute("role", "region");
            wrap.setAttribute("aria-label", "Tabela de aprendizagem por palavra");
            const table = element("table", "word-learning-table");
            const caption = element("caption", null, "Resultados por palavra nas atividades concluídas");
            const head = element("thead");
            const row = element("tr");
            ["Palavra", "Acertos", "Erros", "Dicas", "Sessões", "Próximo passo", "Última prática"].forEach(label => {
                const cell = element("th", null, label);
                cell.scope = "col";
                row.append(cell);
            });
            head.append(row);
            const body = element("tbody");
            report.words.forEach(word => {
                const line = element("tr");
                const recommendation = word.needsReview ? "Revisar com apoio" :
                    (word.correct ?? 0) > 0 ? "Continuar praticando" : "Observar na próxima prática";
                const date = word.lastPractice ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(word.lastPractice) : "—";
                [word.word, word.correct ?? "—", word.errors ?? "—", word.hints ?? "—", word.sessions ?? "—", recommendation, date].forEach(value => {
                    line.append(element("td", null, String(value)));
                });
                line.firstChild.lang = "en";
                body.append(line);
            });
            table.append(caption, head, body);
            wrap.append(table);
            content.append(summary, wrap);
        } catch (error) {
            if (!section.isConnected) return;
            status.textContent = error?.message || "Não foi possível carregar as palavras. O restante do relatório continua disponível.";
            retry.hidden = false;
        } finally {
            if (section.isConnected) section.removeAttribute("aria-busy");
        }
    }
    retry.addEventListener("click", load);
    // The containing report is appended synchronously before this request resolves.
    void load();
    return section;
}
