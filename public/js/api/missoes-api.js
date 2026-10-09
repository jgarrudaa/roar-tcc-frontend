import { apiClient } from "./api-client.js";

export const missoesApi = Object.freeze({
    getDailyMissions() {
        return apiClient.get(
            "/alunos/missoes-do-dia",
        );
    },

    claimReward(missionCode) {
        return apiClient.post(
            "/alunos/missoes-do-dia/resgatar",
            {
                missao_codigo: missionCode,
            },
        );
    },
});