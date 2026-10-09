import { missoesApi } from "../api/missoes-api.js";

function normalizeText(value, fallback = "") {
    const normalized = String(value ?? "").trim();

    return normalized || fallback;
}

function normalizeNonNegativeNumber(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return Math.max(0, number);
}

function normalizeMission(rawMission) {
    const code = normalizeText(
        rawMission?.codigo,
    );

    if (!code) {
        throw new Error(
            "Uma missão foi recebida sem código.",
        );
    }

    const goal = normalizeNonNegativeNumber(
        rawMission?.meta,
    );

    const progress = Math.min(
        normalizeNonNegativeNumber(
            rawMission?.progresso,
        ),
        goal,
    );

    return Object.freeze({
        code,

        name: normalizeText(
            rawMission?.nome,
            "Missão do dia",
        ),

        description: normalizeText(
            rawMission?.descricao,
            "Complete esta missão.",
        ),

        icon: normalizeText(
            rawMission?.icone,
            "fi fi-br-star",
        ),

        color: normalizeText(
            rawMission?.cor,
            "blue",
        ),

        type: normalizeText(
            rawMission?.tipo,
        ),

        xp: normalizeNonNegativeNumber(
            rawMission?.xp,
        ),

        progress,
        goal,

        completed: Boolean(
            rawMission?.concluida,
        ),

        rewardClaimed: Boolean(
            rawMission?.recompensa_recebida,
        ),

        rewardAvailable: Boolean(
            rawMission?.recompensa_disponivel,
        ),

        claimedAt:
            rawMission?.recebido_em ?? null,
    });
}

function normalizeSummary(rawSummary, missions) {
    const total = missions.length;

    const completed = missions.filter(
        mission => mission.completed,
    ).length;

    const rewardsClaimed = missions.filter(
        mission => mission.rewardClaimed,
    ).length;

    const progressPercentage = total
        ? Math.round((completed / total) * 100)
        : 0;

    return Object.freeze({
        completed:
            normalizeNonNegativeNumber(
                rawSummary?.concluidas,
            ) || completed,

        total:
            normalizeNonNegativeNumber(
                rawSummary?.total,
            ) || total,

        progressPercentage:
            normalizeNonNegativeNumber(
                rawSummary?.progresso_pct,
            ) || progressPercentage,

        rewardsClaimed:
            normalizeNonNegativeNumber(
                rawSummary?.recompensas_recebidas,
            ) || rewardsClaimed,

        xpClaimed:
            normalizeNonNegativeNumber(
                rawSummary?.xp_recebido,
            ),

        xpAvailable:
            normalizeNonNegativeNumber(
                rawSummary?.xp_disponivel,
            ),

        totalPossibleXp:
            normalizeNonNegativeNumber(
                rawSummary?.xp_total_possivel,
            ),
    });
}

function normalizeDailyMissions(response) {
    if (!response || typeof response !== "object") {
        throw new Error(
            "O servidor retornou missões inválidas.",
        );
    }

    const missions = Array.isArray(response.missoes)
        ? response.missoes.map(normalizeMission)
        : [];

    return Object.freeze({
        date: normalizeText(response.data),

        timezone: normalizeText(
            response.fuso_horario,
            "America/Sao_Paulo",
        ),

        student: Object.freeze({
            id: normalizeNonNegativeNumber(
                response.aluno?.id,
            ),

            name: normalizeText(
                response.aluno?.nome,
                "Aluno",
            ),

            xpTotal: normalizeNonNegativeNumber(
                response.aluno?.xp_total,
            ),
        }),

        summary: normalizeSummary(
            response.resumo,
            missions,
        ),

        missions: Object.freeze(missions),
    });
}

function normalizeClaimResult(response) {
    if (!response || typeof response !== "object") {
        throw new Error(
            "O servidor retornou uma recompensa inválida.",
        );
    }

    return Object.freeze({
        code: normalizeText(
            response.code,
        ),

        message: normalizeText(
            response.mensagem,
            "Recompensa processada.",
        ),

        missionCode: normalizeText(
            response.missao_codigo ??
                response.missao?.codigo,
        ),

        xpEarned: normalizeNonNegativeNumber(
            response.xp_ganho,
        ),

        xpTotal: normalizeNonNegativeNumber(
            response.xp_total,
        ),

        alreadyClaimed:
            response.code ===
            "MISSION_ALREADY_CLAIMED",
    });
}

export const missoesService = Object.freeze({
    async loadDailyMissions() {
        const response =
            await missoesApi.getDailyMissions();

        return normalizeDailyMissions(
            response,
        );
    },

    async claimReward(missionCode) {
        const normalizedCode =
            normalizeText(missionCode);

        if (!normalizedCode) {
            throw new TypeError(
                "O código da missão é obrigatório.",
            );
        }

        const response =
            await missoesApi.claimReward(
                normalizedCode,
            );

        return normalizeClaimResult(
            response,
        );
    },
});