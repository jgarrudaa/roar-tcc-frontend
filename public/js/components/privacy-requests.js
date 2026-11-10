import { privacyRequestsService as service } from '../services/privacy-requests-service.js';

const STATUS = { recebida: 'Recebida', em_analise: 'Em análise', respondida: 'Respondida' };
const TYPE = { correcao: 'Correção de dados', exclusao: 'Avaliação de exclusão' };
const node = (tag, text, className) => {
    const element = document.createElement(tag);
    if (text != null) element.textContent = text;
    if (className) element.className = className;
    return element;
};
const date = value => {
    const parsed = new Date(value);
    return value && Number.isFinite(parsed.getTime()) ? parsed.toLocaleString('pt-BR') : 'Data indisponível';
};

export function mountPrivacyRequests(container, { studentId = null } = {}) {
    const teacher = studentId != null;
    const listeners = new AbortController();
    const signal = listeners.signal;
    let disposed = false;
    let busy = false;
    let generation = 0;
    let settings = null;
    let entries = [];
    let cursor = null;
    let creationId = null;
    let creationPayload = null;
    const section = node('section', null, 'privacy-requests');
    section.append(node('h2', teacher ? 'Solicitações de dados' : 'Acompanhe seus pedidos'));
    section.append(node('p', teacher
        ? 'Registre pedidos de correção ou exclusão após conferir a identidade e, quando necessário, o vínculo do responsável. O registro não altera nem exclui dados automaticamente.'
        : 'Os pedidos registrados pelo professor aparecem aqui. Para pedir uma correção ou a avaliação de exclusão, fale com o professor da sua turma.'));
    const availability = node('p', 'Consultando o atendimento...', 'privacy-requests__notice');
    const feedback = node('p', '', 'privacy-requests__message');
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    const refresh = node('button', 'Atualizar pedidos', 'btn btn--secondary');
    refresh.type = 'button';
    const formContainer = node('div');
    const list = node('div', null, 'privacy-requests__list');
    const more = node('button', 'Carregar pedidos anteriores', 'btn btn--secondary');
    more.type = 'button';
    more.hidden = true;
    section.append(availability, formContainer, refresh, feedback, list, more);
    container.replaceChildren(section);

    function setBusy(value) {
        busy = value;
        section.setAttribute('aria-busy', String(value));
        refresh.disabled = value;
        more.disabled = value;
        for (const fieldset of section.querySelectorAll('fieldset')) fieldset.disabled = value;
    }

    function renderAvailability() {
        availability.textContent = settings?.disponivel
            ? `Responsável pelo atendimento: ${settings.responsavel}. Canal oficial: ${settings.contato}.`
            : 'Atendimento em configuração. Novos pedidos e respostas serão liberados quando a instituição definir o responsável e o canal oficial. Pedidos existentes continuam disponíveis para consulta.';
        formContainer.replaceChildren();
        if (teacher && settings?.disponivel) renderCreateForm();
    }

    function renderCreateForm() {
        const form = node('form', null, 'privacy-requests__form');
        form.innerHTML = `<fieldset>
            <legend>Registrar pedido</legend>
            <label>Tipo de pedido<select name="type" required>
                <option value="correcao">Correção de dados</option>
                <option value="exclusao">Avaliação de exclusão</option>
            </select></label>
            <label>Quem fez o pedido?<select name="requester" required>
                <option value="">Selecione</option>
                <option value="titular">O próprio aluno</option>
                <option value="responsavel">Responsável com vínculo verificado</option>
            </select></label>
            <label>Descrição do pedido<textarea name="description" rows="3" minlength="10" maxlength="2000" required></textarea></label>
            <p class="privacy-requests__hint">Descreva somente o necessário. Não inclua documentos, senhas ou informações clínicas. O aluno poderá ler este pedido e a resposta.</p>
            <label class="privacy-requests__confirmation"><input type="checkbox" name="verified" required>
                <span>Conferi a identidade, o vínculo quando necessário e a autorização de quem fez o pedido.</span></label>
            <button class="btn btn--primary" type="submit">Registrar pedido verificado</button>
        </fieldset>`;
        form.elements.requester.addEventListener('change', () => { form.elements.verified.checked = false; }, { signal });
        form.addEventListener('submit', async event => {
            event.preventDefault();
            if (busy || disposed || !form.reportValidity()) return;
            const body = { tipo: form.elements.type.value, descricao: form.elements.description.value.trim(),
                solicitante: form.elements.requester.value, verificacao_confirmada: form.elements.verified.checked };
            // Reuse one identifier after a lost response, including after an intervening list refresh.
            const fingerprint = JSON.stringify(body);
            if (!creationId || fingerprint !== creationPayload) {
                creationId = crypto.randomUUID();
                creationPayload = fingerprint;
            }
            setBusy(true);
            feedback.textContent = 'Registrando o pedido...';
            try {
                const result = await service.create(studentId, { ...body, id: creationId });
                if (disposed) return;
                creationId = null;
                creationPayload = null;
                form.reset();
                const refreshed = await reload(false);
                if (!disposed) feedback.textContent = `Pedido registrado. Protocolo ${result.solicitacao.protocolo}.${refreshed ? '' : ' Não foi possível atualizar a lista. Use Atualizar pedidos.'}`;
            } catch (error) {
                if (!disposed) feedback.textContent = `${error.message || 'Não foi possível registrar.'} Você pode tentar novamente.`;
            } finally { if (!disposed) setBusy(false); }
        }, { signal });
        formContainer.append(form);
    }

    function renderList() {
        list.replaceChildren();
        if (!entries.length) list.append(node('p', 'Nenhum pedido registrado para este aluno.'));
        for (const entry of entries) {
            const details = node('details', null, 'privacy-requests__entry');
            const summary = node('summary', `${TYPE[entry.tipo] || 'Solicitação'} — ${STATUS[entry.status] || 'Status indisponível'}`);
            details.append(summary, node('p', entry.protocolo, 'privacy-requests__protocol'),
                node('p', `Registrado em ${date(entry.criado_em)}`), node('p', entry.descricao, 'privacy-requests__text'));
            details.append(node('p', `Solicitante: ${entry.solicitante === 'responsavel' ? 'responsável com vínculo verificado' : 'o próprio aluno'}.`));
            if (entry.resposta) details.append(node('h3', 'Resposta ao solicitante'), node('p', entry.resposta, 'privacy-requests__text'));
            const history = node('ol', null, 'privacy-requests__history');
            for (const event of entry.eventos || []) {
                history.append(node('li', `${STATUS[event.status] || event.status} — ${date(event.criado_em)} — ${event.nome_professor || 'Professor responsável'}`));
            }
            if (history.childElementCount) details.append(node('h3', 'Histórico do atendimento'), history);
            if (teacher && settings?.disponivel && entry.status !== 'respondida') {
                if (entry.status === 'recebida') {
                    const begin = node('button', 'Iniciar análise', 'btn btn--secondary');
                    begin.type = 'button';
                    begin.addEventListener('click', () => update(entry, 'em_analise', '', details), { signal });
                    // Keep operational controls inside a fieldset for the shared busy state.
                    const controls = node('fieldset', null, 'privacy-requests__controls');
                    controls.append(begin);
                    details.append(controls);
                }
                const form = node('form', null, 'privacy-requests__reply');
                form.innerHTML = `<fieldset><legend>Concluir atendimento</legend>
                    <label>Resposta ao solicitante (visível ao aluno)<textarea name="answer" rows="3" minlength="10" maxlength="2000" required></textarea></label>
                    <p class="privacy-requests__hint">Registre a decisão da instituição e o que foi realizado. Envie somente informações que o solicitante pode receber.</p>
                    <button class="btn btn--primary" type="submit">Registrar resposta e concluir</button></fieldset>`;
                form.addEventListener('submit', event => {
                    event.preventDefault();
                    if (form.reportValidity()) update(entry, 'respondida', form.elements.answer.value.trim(), details);
                }, { signal });
                details.append(form);
            }
            list.append(details);
        }
        more.hidden = cursor == null;
    }

    async function update(entry, status, answer, details) {
        if (busy || disposed) return;
        setBusy(true);
        feedback.textContent = 'Salvando o atendimento...';
        try {
            const result = await service.update(studentId, entry.id, { status, resposta: answer, versao: entry.versao });
            if (disposed) return;
            entries = entries.map(item => item.id === entry.id ? result.solicitacao : item);
            renderList();
            feedback.textContent = `Pedido ${status === 'respondida' ? 'respondido' : 'em análise'}.`;
            const next = [...list.querySelectorAll('details')][entries.findIndex(item => item.id === entry.id)];
            if (next) { next.open = true; next.querySelector('summary').focus(); }
        } catch (error) {
            if (!disposed) {
                feedback.textContent = `${error.message || 'Não foi possível salvar.'} Use Atualizar pedidos para conferir o status antes de tentar novamente.`;
                details.open = true;
            }
        } finally { if (!disposed) setBusy(false); }
    }

    async function reload(announce = true, append = false) {
        const current = ++generation;
        setBusy(true);
        if (announce) feedback.textContent = 'Carregando os pedidos...';
        try {
            const [configuration, result] = await Promise.all([service.settings(), service.list(studentId, append ? cursor : null)]);
            if (disposed || current !== generation) return;
            const changed = settings?.disponivel !== configuration.disponivel;
            settings = configuration;
            entries = append ? [...entries, ...result.solicitacoes] : result.solicitacoes;
            cursor = result.proximo_cursor;
            // Preserve an unsent draft when only refreshing the list.
            if (changed || !formContainer.childElementCount) renderAvailability();
            renderList();
            if (announce) feedback.textContent = 'Pedidos atualizados.';
            return true;
        } catch (error) {
            if (!disposed && current === generation) {
                feedback.textContent = error.message || 'Não foi possível carregar. Use Atualizar pedidos para tentar novamente.';
                if (!settings) availability.textContent = 'Não foi possível consultar o atendimento. Tente atualizar os pedidos.';
            }
            return false;
        } finally { if (!disposed && current === generation) setBusy(false); }
    }
    refresh.addEventListener('click', () => { if (!busy) reload(); }, { signal });
    more.addEventListener('click', () => { if (!busy && cursor != null) reload(true, true); }, { signal });
    reload();
    return Object.freeze({ destroy() { disposed = true; generation++; listeners.abort(); container.replaceChildren(); } });
}
