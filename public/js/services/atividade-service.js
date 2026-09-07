import { alunosApi } from "../api/alunos-api.js";
import { atividadesApi } from "../api/atividades-api.js";

const LEARNING_MODES = Object.freeze({
    "Nível 1 - Suporte Visual Puro": Object.freeze({
        level: 1,
        label: "Nível 1 - Suporte Visual Puro",
    }),

    "Nível 2 - Aprendiz Guiado": Object.freeze({
        level: 2,
        label: "Nível 2 - Aprendiz Guiado",
    }),

    "Nível 3 - Autonomia Contextual": Object.freeze({
        level: 3,
        label: "Nível 3 - Autonomia Contextual",
    }),
});

// Nomes enviados pelo backend e nomes usados nos cadastros anteriores.
const LEARNING_MODE_ALIASES = new Map([
    ["visual guiado", "Nível 1 - Suporte Visual Puro"],
    ["suporte visual puro", "Nível 1 - Suporte Visual Puro"],
    ["interativo visual", "Nível 2 - Aprendiz Guiado"],
    ["aprendiz guiado", "Nível 2 - Aprendiz Guiado"],
    ["verbal", "Nível 3 - Autonomia Contextual"],
    ["autonomia contextual", "Nível 3 - Autonomia Contextual"],
    ...Object.keys(LEARNING_MODES).map(label => [label.toLocaleLowerCase("pt-BR"), label]),
]);

const INTERACTION_TYPES = Object.freeze({
    tap: "recognize",
    associacao: "associate",
    associação: "associate",
    multiplaescolha: "validate",
    múltiplaescolha: "validate",

    /*
     * Compatibilidade temporária com registros antigos.
     * Enquanto existir DragAndDrop no banco, ele será tratado
     * pelo motor de associação.
     */
    draganddrop: "associate",
});

function requirePositiveInteger(value, fieldName) {
    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
        throw new TypeError(
            `${fieldName} deve ser um número inteiro positivo.`,
        );
    }

    return parsedValue;
}

function normalizeText(value, fallback = "") {
    const normalizedValue = String(value ?? "").trim();

    return normalizedValue || fallback;
}

function normalizeInteractionKey(value) {
    return normalizeText(value)
        .toLocaleLowerCase("pt-BR")
        .replace(/[\s_-]/g, "");
}

function normalizeMediaUrl(value) {
    const mediaUrl = normalizeText(value);

    if (!mediaUrl) {
        return "";
    }

    const isAbsoluteUrl =
        mediaUrl.startsWith("http://") ||
        mediaUrl.startsWith("https://") ||
        mediaUrl.startsWith("data:") ||
        mediaUrl.startsWith("blob:");

    if (isAbsoluteUrl || mediaUrl.startsWith("/")) {
        return mediaUrl;
    }

    return `/${mediaUrl.replace(/^\/+/, "")}`;
}

function normalizeStudent(profile) {
    const studentId = requirePositiveInteger(
        profile?.id,
        "student.id",
    );

    const supportMode = normalizeText(
        profile?.supportLevel,
    );

    const modeKey = supportMode
        .toLocaleLowerCase("pt-BR")
        .replace(/[–—]/g, "-")
        .replace(/\s+/g, " ");
    const canonicalMode = LEARNING_MODE_ALIASES.get(modeKey);
    const learningMode = LEARNING_MODES[canonicalMode];

    if (!learningMode) {
        throw new Error(
            `Modo de aprendizagem não suportado: ${
                supportMode || "não informado"
            }.`,
        );
    }

    return Object.freeze({
        id: studentId,

        name: normalizeText(
            profile?.name,
            "Aluno",
        ),

        email: normalizeText(profile?.email),

        schoolYear: normalizeText(
            profile?.schoolYear,
            "Não informado",
        ),

        supportLevel: learningMode.level,
        supportMode: learningMode.label,

        xpTotal: Math.max(
            0,
            Number(profile?.xpTotal) || 0,
        ),
    });
}

function normalizeModuleItem(rawItem) {
    const itemId = requirePositiveInteger(
        rawItem?.item_id,
        "item_id",
    );

    const englishWord = normalizeText(
        rawItem?.palavra_en,
    ).toLocaleUpperCase("en-US");

    if (!englishWord) {
        throw new Error(
            `O item ${itemId} não possui palavra em inglês.`,
        );
    }

    const realImage = normalizeMediaUrl(
        rawItem?.url_imagem_real,
    );

    const vectorImage = normalizeMediaUrl(
        rawItem?.url_imagem_vetor,
    );

    if (!realImage && !vectorImage) {
        throw new Error(
            `O item ${englishWord} não possui nenhuma imagem cadastrada.`,
        );
    }

    return Object.freeze({
        id: String(itemId),
        itemId,

        order: requirePositiveInteger(
            rawItem?.ordem,
            "item.ordem",
        ),

        pt: normalizeText(
            rawItem?.palavra_pt,
            "Item",
        ),

        en: englishWord,

        realImage,
        vectorImage,
    });
}

function normalizeActivity(rawActivity) {
    const activityId = requirePositiveInteger(
        rawActivity?.atividade_id,
        "atividade_id",
    );

    const order = requirePositiveInteger(
        rawActivity?.ordem_sequencia,
        "ordem_sequencia",
    );

    const originalInteractionType = normalizeText(
        rawActivity?.tipo_interacao,
    );

    const normalizedInteractionKey =
        normalizeInteractionKey(originalInteractionType);

    const engineType =
        INTERACTION_TYPES[normalizedInteractionKey];

    if (!engineType) {
        throw new Error(
            `Tipo de interação não suportado: ${
                originalInteractionType || "não informado"
            }.`,
        );
    }

    return Object.freeze({
        id: String(activityId),
        activityId,
        order,

        name: normalizeText(
            rawActivity?.palavra_chave,
            `Etapa ${order}`,
        ).toLocaleUpperCase("en-US"),

        instruction: normalizeText(
            rawActivity?.instrucao_lex,
            "Realize a atividade apresentada.",
        ),

        type: engineType,
        originalType: originalInteractionType,

        learningMode: normalizeText(
            rawActivity?.modo_alvo,
        ),
    });
}

function validatePayload(payload) {
    if (
        !payload ||
        typeof payload !== "object" ||
        Array.isArray(payload)
    ) {
        throw new Error(
            "A API retornou um contexto de atividades inválido.",
        );
    }

    if (
        !payload.modulo ||
        typeof payload.modulo !== "object"
    ) {
        throw new Error(
            "A API não retornou os dados do módulo.",
        );
    }

    if (!Array.isArray(payload.atividades)) {
        throw new Error(
            "A API não retornou uma lista de atividades válida.",
        );
    }

    if (payload.atividades.length === 0) {
        throw new Error(
            "Este módulo ainda não possui atividades disponíveis.",
        );
    }

    if (!Array.isArray(payload.itens)) {
        throw new Error(
            "A API não retornou os itens de vocabulário do módulo.",
        );
    }

    if (payload.itens.length === 0) {
        throw new Error(
            "Este módulo ainda não possui itens de vocabulário.",
        );
    }
}

function validatePayloadStudent(
    payload,
    authenticatedStudent,
) {
    if (!payload?.aluno?.id) {
        return;
    }

    const payloadStudentId = Number(
        payload.aluno.id,
    );

    if (
        payloadStudentId !==
        authenticatedStudent.id
    ) {
        throw new Error(
            "A API retornou atividades pertencentes a outro aluno.",
        );
    }
}

function createModule(
    payload,
    normalizedItems,
    normalizedActivities,
) {
    const moduleId = requirePositiveInteger(
        payload.modulo.id,
        "modulo.id",
    );

    return Object.freeze({
        id: moduleId,

        title: normalizeText(
            payload.modulo.nome,
            "Módulo",
        ),

        /*
         * Lista de palavras e imagens que os motores utilizam
         * para construir as perguntas e alternativas.
         */
        items: normalizedItems,

        /*
         * Lista separada das etapas reais. Ela é utilizada
         * pelo controller para localizar a próxima atividade.
         */
        activities: normalizedActivities,

        totalActivities:
            normalizedActivities.length,

        firstStage:
            normalizedActivities[0]?.order ?? 1,

        lastStage:
            normalizedActivities[
                normalizedActivities.length - 1
            ]?.order ?? 1,
    });
}

function selectActivity(
    activities,
    requestedStage,
) {
    const selectedActivity = activities.find(
        (activity) =>
            activity.order === requestedStage,
    );

    if (!selectedActivity) {
        const availableStages = activities
            .map((activity) => activity.order)
            .join(", ");

        throw new Error(
            `A etapa ${requestedStage} não está disponível. ` +
            `Etapas disponíveis: ${
                availableStages || "nenhuma"
            }.`,
        );
    }

    return selectedActivity;
}

function findActivityItem(
    selectedActivity,
    moduleItems,
) {
    const activityWord = normalizeText(
        selectedActivity?.name,
    ).toLocaleUpperCase("en-US");

    /*
     * Primeiro procura o item usando palavra_chave.
     *
     * Exemplo:
     * atividade.palavra_chave = "ARM"
     * item.palavra_en = "ARM"
     */
    const matchingItem = moduleItems.find(
        (item) => item.en === activityWord,
    );

    if (matchingItem) {
        return matchingItem;
    }

    /*
     * Compatibilidade para registros antigos que ainda não
     * tenham palavra_chave preenchida corretamente.
     */
    const itemByOrder =
        moduleItems[selectedActivity.order - 1];

    if (itemByOrder) {
        return itemByOrder;
    }

    throw new Error(
        `Nenhum item de vocabulário corresponde à atividade ${selectedActivity.activityId}.`,
    );
}

function createActivity(
    selectedActivity,
    moduleItems,
) {
    const item = findActivityItem(
        selectedActivity,
        moduleItems,
    );

    return Object.freeze({
        id: selectedActivity.activityId,
        stage: selectedActivity.order,
        type: selectedActivity.type,
        originalType:
            selectedActivity.originalType,
        instruction:
            selectedActivity.instruction,
        status: "active",

        /*
         * Este precisa ser um item de vocabulário.
         *
         * Ele contém:
         * en, pt, realImage e vectorImage.
         */
        item,
    });
}

function normalizeCompletionData(
    resultData = {},
) {
    const correctAnswers = Math.max(
        0,
        Math.trunc(
            Number(resultData.correct) || 0,
        ),
    );

    const wrongAnswers = Math.max(
        0,
        Math.trunc(
            Number(resultData.wrong) || 0,
        ),
    );

    const elapsedSeconds = Math.max(
        0,
        Math.round(
            Number(resultData.timeSeconds) || 0,
        ),
    );

    return Object.freeze({
        correctAnswers,
        wrongAnswers,
        elapsedSeconds,
    });
}

export const atividadeService = Object.freeze({
    async getContext(moduleId, stage) {
        const validModuleId =
            requirePositiveInteger(
                moduleId,
                "moduleId",
            );

        const validStage =
            requirePositiveInteger(
                stage,
                "stage",
            );

        /*
         * Primeiro busca o aluno autenticado.
         */
        const profile =
            await alunosApi.getCurrent();

        const student =
            normalizeStudent(profile);

        /*
         * Depois busca as atividades e os itens
         * correspondentes ao aluno.
         */
        const payload =
            await atividadesApi.getModuleForStudent(
                validModuleId,
                student.id,
            );

        validatePayload(payload);

        validatePayloadStudent(
            payload,
            student,
        );

        const normalizedActivities =
            payload.atividades
                .map(normalizeActivity)
                .sort(
                    (
                        firstActivity,
                        secondActivity,
                    ) =>
                        firstActivity.order -
                        secondActivity.order,
                );

        const normalizedItems =
            payload.itens
                .map(normalizeModuleItem)
                .sort(
                    (
                        firstItem,
                        secondItem,
                    ) =>
                        firstItem.order -
                        secondItem.order,
                );

        const module = createModule(
            payload,
            normalizedItems,
            normalizedActivities,
        );

        const selectedActivity =
            selectActivity(
                normalizedActivities,
                validStage,
            );

        const activity = createActivity(
            selectedActivity,
            normalizedItems,
        );

        return Object.freeze({
            student,
            module,
            activity,
        });
    },

    async registerAttempt(
        _activityId,
        attemptData = {},
    ) {
        /*
         * As tentativas individuais não são enviadas.
         * Elas são consolidadas pelo controller.
         */
        return Object.freeze({
            accepted: true,
            correct: Boolean(
                attemptData.correct,
            ),
            itemId:
                attemptData.itemId ?? null,
        });
    },

    async complete(
        activityId,
        resultData = {},
    ) {
        const validActivityId =
            requirePositiveInteger(
                activityId,
                "activityId",
            );

        const completion =
            normalizeCompletionData(
                resultData,
            );

        return atividadesApi.saveProgress({
            atividade_id: validActivityId,
            quantidade_erros:
                completion.wrongAnswers,
            tempo_segundos:
                completion.elapsedSeconds,
            concluido: true,
        });
    },
});