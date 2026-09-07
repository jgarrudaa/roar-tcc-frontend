import { apiClient } from "./api-client.js";


async function getCurrentStudent() {
    return apiClient.get("/alunos/me");
}


export const perfilAlunoApi = Object.freeze({
    getCurrentStudent,
});