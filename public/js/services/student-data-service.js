import { ApiError, apiClient } from '../api/api-client.js';
import { APP_CONFIG } from '../config/app-config.js';

async function explainExportError(error, path, pdf) {
    const updateRequiredMessage = `${pdf ? 'O relatório PDF ainda não está disponível' : 'A exportação ainda não está disponível'} no servidor. É necessário publicar a atualização da API.`;
    if (error instanceof ApiError && error.status === 404) return new Error(updateRequiredMessage);
    if (!(error instanceof ApiError) || error.code !== 'NETWORK_ERROR') return error;

    // A failed CORS preflight hides an old server's 404 from the POST request.
    // An anonymous GET can distinguish it without sending credentials or exporting data.
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3000);
    try {
        const response = await fetch(`${APP_CONFIG.apiBaseUrl.replace(/\/+$/, '')}${path}`, {
            method: 'GET', credentials: 'omit', cache: 'no-store', signal: controller.signal,
        });
        if (response.status === 404) return new Error(updateRequiredMessage);
        if (response.status === 405) {
            return new Error('O servidor está online, mas não foi possível acessar a exportação. Tente novamente; se persistir, informe o problema ao suporte do projeto.');
        }
    } catch {
        // Keep the original connection error when the server cannot be reached.
    } finally {
        window.clearTimeout(timeout);
    }
    return error;
}

async function requestExport(studentId, requester, verified, pdf = false) {
    const id = Number(studentId);
    if (!Number.isInteger(id) || id <= 0) throw new Error('Selecione um aluno válido.');
    if (!['titular', 'responsavel'].includes(requester) || verified !== true) {
        throw new Error('Confirme a identidade e a autorização do solicitante.');
    }
    const path = `/professores/alunos/${id}/${pdf ? 'relatorio-dados.pdf' : 'exportacao-dados'}`;
    let result;
    try {
        result = await apiClient.post(path, {
            solicitante: requester,
            verificacao_confirmada: true,
        }, pdf ? { responseType: 'blob', timeoutMs: 30000, headers: { Accept: 'application/pdf' } } : {});
    } catch (error) {
        throw await explainExportError(error, path, pdf);
    }
    return { id, result };
}

export const studentDataService = Object.freeze({
    async exportForStudent(studentId, requester, verified) {
        const { id, result } = await requestExport(studentId, requester, verified);
        if (result?.versao !== 1 || result.cadastro?.id !== id ||
            !result.exportacao?.id || !Array.isArray(result.historico_atividades)) {
            throw new Error('A exportação retornou dados inválidos. Tente novamente.');
        }
        return result;
    },
    async exportPdfForStudent(studentId, requester, verified) {
        const { result } = await requestExport(studentId, requester, verified, true);
        if (!(result instanceof Blob) || result.type.split(';')[0] !== 'application/pdf' ||
            await result.slice(0, 5).text() !== '%PDF-') {
            throw new Error('O servidor não retornou um PDF válido. Tente novamente.');
        }
        return result;
    },
});
