import { studentDataService } from '../services/student-data-service.js';

export function mountStudentDataManagement(container, studentId) {
    const listeners = new AbortController();
    let disposed = false;
    let busy = false;
    const section = document.createElement('section');
    section.className = 'student-data-management';
    section.innerHTML = `
        <h2>Gerenciar dados</h2>
        <p>Gere um relatório em PDF ou exporte o cadastro atual, o nível de suporte TEA e o histórico das atividades em JSON.
        Confirme a identidade de quem pediu os dados e, para responsáveis, o vínculo e a autorização.</p>
        <form>
            <label class="student-data-field">Quem solicitou a cópia?
                <select name="requester" required>
                    <option value="">Selecione</option>
                    <option value="titular">O próprio aluno</option>
                    <option value="responsavel">Responsável com vínculo verificado</option>
                </select>
            </label>
            <label class="student-data-confirmation">
                <input type="checkbox" name="verified" required>
                <span>Conferi a identidade do solicitante e sua autorização para receber os dados deste aluno.</span>
            </label>
            <p>O arquivo contém dados pessoais. Entregue-o somente ao solicitante verificado por um canal seguro.</p>
            <div class="student-data-actions">
                <button class="btn btn--primary" type="submit" name="format" value="json">Exportar cadastro e histórico</button>
                <button class="btn btn--primary" type="submit" name="format" value="pdf">Gerar relatório em PDF</button>
            </div>
            <p class="student-data-message" role="status" aria-live="polite"></p>
        </form>`;
    container.replaceChildren(section);
    const form = section.querySelector('form');
    const select = form.elements.requester;
    const verified = form.elements.verified;
    const buttons = [...form.querySelectorAll('button[type="submit"]')];
    const message = form.querySelector('[role="status"]');
    select.addEventListener('change', () => { verified.checked = false; }, { signal: listeners.signal });
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (disposed || busy || !form.reportValidity()) return;
        const pdf = event.submitter?.value === 'pdf';
        busy = true;
        buttons.forEach(button => { button.disabled = true; });
        select.disabled = true;
        verified.disabled = true;
        section.setAttribute('aria-busy', 'true');
        message.textContent = pdf ? 'Preparando o relatório em PDF...' : 'Preparando o arquivo...';
        try {
            const data = await (pdf ? studentDataService.exportPdfForStudent : studentDataService.exportForStudent)(studentId, select.value, verified.checked);
            if (disposed) return;
            const blob = pdf ? data : new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = pdf ? `roar-relatorio-aluno-${Number(studentId)}.pdf` : `roar-aluno-${Number(studentId)}.json`;
            document.body.append(link);
            try { link.click(); }
            finally {
                link.remove();
                window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            }
            verified.checked = false;
            message.textContent = `${pdf ? 'Relatório em PDF' : 'Arquivo'} gerado. Confira o download e entregue a cópia ao solicitante verificado.`;
        } catch (error) {
            if (!disposed) message.textContent = error?.message || 'Não foi possível exportar. Tente novamente.';
        } finally {
            busy = false;
            if (!disposed) {
                buttons.forEach(button => { button.disabled = false; });
                select.disabled = false;
                verified.disabled = false;
                section.removeAttribute('aria-busy');
            }
        }
    }, { signal: listeners.signal });
    return Object.freeze({
        destroy() { disposed = true; listeners.abort(); },
    });
}
