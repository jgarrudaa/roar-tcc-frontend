import { request } from "./api-client.js";

export const alunosApi = Object.freeze({
    getCurrent: () => request("/alunos/me"),
    list: () => request("/professor/alunos"),
    create: (data) => request("/professor/alunos", { method: "POST", body: JSON.stringify(data) }),
    getById: (studentId) => request(`/professor/alunos/${studentId}`),
});
