import { request } from "./api-client.js";

export const atividadesApi = Object.freeze({
    get: (moduleId, stage) => request(`/modulos/${moduleId}/atividades/${stage}`),
    saveAttempt: (activityId, data) => request(`/atividades/${activityId}/tentativas`, {
        method: "POST",
        body: JSON.stringify(data),
    }),
    complete: (activityId, data) => request(`/atividades/${activityId}/conclusao`, {
        method: "POST",
        body: JSON.stringify(data),
    }),
    setStatus: (activityId, status) => request(`/professor/atividades/${activityId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    }),
});
