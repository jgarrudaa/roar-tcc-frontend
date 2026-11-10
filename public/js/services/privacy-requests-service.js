import { apiClient } from '../api/api-client.js';

function teacherPath(studentId) {
    const id = Number(studentId);
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Selecione um aluno válido.');
    return `/professores/alunos/${id}/solicitacoes-dados`;
}

export const privacyRequestsService = Object.freeze({
    settings: () => apiClient.get('/privacidade/atendimento'),
    async list(studentId, cursor = null) {
        const path = studentId == null ? '/alunos/solicitacoes-dados' : teacherPath(studentId);
        const result = await apiClient.get(path + (cursor == null ? '' : `?antes=${encodeURIComponent(cursor)}`));
        if (!Array.isArray(result?.solicitacoes)) throw new Error('O servidor retornou uma lista de solicitações inválida.');
        return result;
    },
    create: (studentId, body) => apiClient.post(teacherPath(studentId), body),
    update: (studentId, id, body) => apiClient.patch(`${teacherPath(studentId)}/${encodeURIComponent(id)}`, body),
});
