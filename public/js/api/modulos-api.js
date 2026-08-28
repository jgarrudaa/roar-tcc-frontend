import { request } from "./api-client.js";

export const modulosApi = Object.freeze({
    list: () => request("/modulos"),
    getById: (moduleId) => request(`/modulos/${moduleId}`),
    getProgress: () => request("/alunos/me/modulos"),
});
