import { alunosApi } from "../api/alunos-api.js";
import { atividadesApi } from "../api/atividades-api.js";
import { gameSettingsService } from "./game-settings-service.js";

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
    draganddrop: "shadowPuzzle",

    quebracabeca: "shadowPuzzle",
    arrastarsombra: "shadowPuzzle",
    encaixesombra: "shadowPuzzle",
    shadowpuzzle: "shadowPuzzle",
    puzzle: "shadowPuzzle",

    sombra: "shadow",
    shadow: "shadow",
    quebracabeca: "shadow",
    "quebracabeça": "shadow",

    multiplaescolha: "validate",
    múltiplaescolha: "validate",

    audioimagem: "audioImage",

    verdadeirofalso: "trueFalse",

    memoria: "memory",
    memória: "memory",

    completarfrase: "completeSentence",
    ordenarfrase: "orderSentence",
    escrita: "writing",
    bancopalavras: "wordBank",
    separarporcor: "categories",
    misturacores: "colorMix",
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

    // Older database entries omit the public directory used by this frontend.
    if (/^\/?assets\//.test(mediaUrl)) {
        return new URL(
            `../../${mediaUrl.replace(/^\//, "")}`,
            import.meta.url,
        ).href;
    }

    const isAbsoluteUrl =
        mediaUrl.startsWith("http://") ||
        mediaUrl.startsWith("https://") ||
        mediaUrl.startsWith("data:") ||
        mediaUrl.startsWith("blob:");

    if (isAbsoluteUrl) {
        return mediaUrl;
    }

    if (mediaUrl.startsWith("/")) {
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
    const teaSupportLevel = profile?.teaSupportLevel ?? profile?.nivel_suporte_tea;

    if (!learningMode) {
        throw new Error(
            `Modo de aprendizagem não suportado: ${supportMode || "não informado"
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
        teaSupportLevel: [1, 2, 3].includes(teaSupportLevel) ? teaSupportLevel : null,

        xpTotal: Math.max(
            0,
            Number(profile?.xpTotal) || 0,
        ),
    });
}

const COLOR_IMAGES_DIR = "/public/assets/imagens/modulos/cores";
const COLOR_OBJECTS_DIR = "/public/assets/imagens/modulos/cores-formas/objetos";

// Reconhecer, associar, memória e mistura de cores mostram a cor.
const COLOR_IMAGE_MAP = Object.freeze({
    RED: `${COLOR_IMAGES_DIR}/red.png`,
    BLUE: `${COLOR_IMAGES_DIR}/blue.png`,
    GREEN: `${COLOR_IMAGES_DIR}/green.png`,
    YELLOW: `${COLOR_IMAGES_DIR}/yellow.png`,
    ORANGE: `${COLOR_IMAGES_DIR}/orange.png`,
    PURPLE: `${COLOR_IMAGES_DIR}/purple.png`,
});

// A atividade de arrastar usa os objetos: cada cor tem o seu.
const COLOR_OBJECT_FILES = Object.freeze({
    RED: "aple.png",
    BLUE: "fish.png",
    GREEN: "leaf.png",
    YELLOW: "banana.png",
    ORANGE: "orange.png",
    PURPLE: "grapes.png",
});

const COLOR_ALIASES = Object.freeze({
    red: "RED",
    vermelho: "RED",
    aple: "RED",
    apple: "RED",
    blue: "BLUE",
    azul: "BLUE",
    fish: "BLUE",
    peixe: "BLUE",
    green: "GREEN",
    verde: "GREEN",
    leaf: "GREEN",
    folha: "GREEN",
    yellow: "YELLOW",
    amarelo: "YELLOW",
    banana: "YELLOW",
    orange: "ORANGE",
    laranja: "ORANGE",
    purple: "PURPLE",
    roxo: "PURPLE",
    violeta: "PURPLE",
    grape: "PURPLE",
    grapes: "PURPLE",
    uva: "PURPLE",
});

function normalizeColorKey(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/^(?:color|cor)[-_ ]/, "");
}

function findColor(value) {
    return COLOR_ALIASES[normalizeColorKey(value)] ?? null;
}

function findColorForImageUrl(url) {
    const match = String(url ?? "").match(
        /(?:cores-formas|cores)\/(?:objetos\/)?([a-z]+(?:-[a-z]+)*)\.(?:svg|png|jpe?g)/i,
    );

    if (!match) {
        return null;
    }

    for (const token of match[1].toLowerCase().split("-")) {
        const color = COLOR_ALIASES[token];

        if (color) {
            return color;
        }
    }

    return null;
}

function resolveColorImageUrl(url, englishWord) {
    const wordKey = String(englishWord ?? "").trim().toUpperCase();

    if (COLOR_IMAGE_MAP[wordKey]) {
        return COLOR_IMAGE_MAP[wordKey];
    }

    const colorFromUrl = findColorForImageUrl(url);

    return colorFromUrl ? COLOR_IMAGE_MAP[colorFromUrl] : url;
}

// Só a atividade de arrastar usa objetos: o cartão é o objeto e o cesto é a cor.
function resolveColorObjectImageUrl(url, englishWord, group) {
    const colorFromWord = findColor(englishWord);

    if (colorFromWord) {
        return `${COLOR_OBJECTS_DIR}/${COLOR_OBJECT_FILES[colorFromWord]}`;
    }

    const color =
        findColor(group?.en) ??
        findColor(group?.id) ??
        findColorForImageUrl(url);

    return color
        ? `${COLOR_OBJECTS_DIR}/${COLOR_OBJECT_FILES[color]}`
        : url;
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

    const realImage = resolveColorImageUrl(normalizeMediaUrl(
        rawItem?.url_imagem_real,
    ), englishWord);

    const vectorImage = resolveColorImageUrl(normalizeMediaUrl(
        rawItem?.url_imagem_vetor,
    ), englishWord);

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
            `Tipo de interação não suportado: ${originalInteractionType || "não informado"
            }.`,
        );
    }

    let groups = [];
    let cards = [];
    if (engineType === "categories") {
        groups = (rawActivity?.grupos || []).map(group => ({
            id: normalizeText(group?.id),
            en: normalizeText(group?.palavra_en).toLocaleUpperCase("en-US"),
            pt: normalizeText(group?.palavra_pt),
        }));
        const groupsById = new Map(groups.map(group => [group.id, group]));
        cards = (rawActivity?.cartoes || []).map(card => {
            const group = groupsById.get(normalizeText(card?.grupo));
            const itemId = requirePositiveInteger(card?.id, "cartao.id");
            const englishWord = normalizeText(card?.palavra_en)
                .toLocaleUpperCase("en-US");
            // O cartão é o objeto que o aluno arrasta até o cesto da cor.
            const image = resolveColorObjectImageUrl(
                normalizeMediaUrl(card?.url_imagem),
                englishWord,
                group,
            );

            if (!group || !englishWord || !image) {
                throw new Error("A atividade de categorias possui um cartão incompleto.");
            }

            return Object.freeze({
                item: Object.freeze({
                    id: `category-card:${itemId}`,
                    itemId,
                    order: requirePositiveInteger(card?.ordem, "cartao.ordem"),
                    en: englishWord,
                    pt: normalizeText(card?.palavra_pt, "Objeto"),
                    realImage: image,
                    vectorImage: image,
                    progressWord: group.en,
                }),
                category: group.id,
            });
        });

        if (groups.length < 2 || cards.length < 2) {
            throw new Error("A atividade de categorias não possui grupos e cartões suficientes.");
        }
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

        answer: normalizeText(
            rawActivity?.resposta_correta,
            rawActivity?.palavra_chave,
        ).toLocaleUpperCase("en-US"),

        type: engineType,
        originalType: originalInteractionType,
        ...(engineType === "categories" ? {
            title: "Associe o objeto à cor",
            groups,
            cards,
            dragToCategory: true,
        } : {}),

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
            `Etapas disponíveis: ${availableStages || "nenhuma"
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
        originalType: selectedActivity.originalType,
        instruction: selectedActivity.instruction,
        answer: selectedActivity.answer || item.en,
        status: "active",
        ...(selectedActivity.type === "categories" ? {
            title: selectedActivity.title,
            groups: selectedActivity.groups,
            cards: selectedActivity.cards,
            dragToCategory: selectedActivity.dragToCategory,
        } : {}),

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

const MODULE_SLUG_TO_ID = Object.freeze({
    "corpo-humano": 1,
    "animais-fazenda": 2,
    "fazenda": 2,
    "cores": 3,
    "formas": 4,
});

function resolveModuleId(value) {
    if (typeof value === "string") {
        const trimmed = value.trim();
        const numeric = Number(trimmed);
        if (Number.isInteger(numeric) && numeric > 0) {
            return numeric;
        }
        const slug = trimmed.toLowerCase();
        if (MODULE_SLUG_TO_ID[slug]) {
            return MODULE_SLUG_TO_ID[slug];
        }
    }
    return requirePositiveInteger(value, "moduleId");
}

function getMockModulePayload(moduleId, student) {

    if (moduleId === 1) {
        return {
            modulo: { id: 1, nome: "Corpo Humano" },
            aluno: { id: student.id },
            itens: [
                {
                    item_id: 1, ordem: 1, palavra_pt: "cabeça", palavra_en: "HEAD",
                    url_imagem_real: "/public/assets/imagens/modulos/corpo_humano/corpo_humano_real/head.png",
                    url_imagem_vetor: "/public/assets/imagens/modulos/corpo_humano/corpo_humano_vetor/head.png"
                },
                {
                    item_id: 2, ordem: 2, palavra_pt: "braço", palavra_en: "ARM",
                    url_imagem_real: "/public/assets/imagens/modulos/corpo_humano/corpo_humano_real/arm.png",
                    url_imagem_vetor: "/public/assets/imagens/modulos/corpo_humano/corpo_humano_vetor/arm.png"
                },
                {
                    item_id: 3, ordem: 3, palavra_pt: "barriga", palavra_en: "BELLY",
                    url_imagem_real: "/public/assets/imagens/modulos/corpo_humano/corpo_humano_real/belly.png",
                    url_imagem_vetor: "/public/assets/imagens/modulos/corpo_humano/corpo_humano_vetor/belly.png"
                },
                {
                    item_id: 4, ordem: 4, palavra_pt: "perna", palavra_en: "LEG",
                    url_imagem_real: "/public/assets/imagens/modulos/corpo_humano/corpo_humano_real/leg.png",
                    url_imagem_vetor: "/public/assets/imagens/modulos/corpo_humano/corpo_humano_vetor/leg.png"
                },
                {
                    item_id: 5, ordem: 5, palavra_pt: "pé", palavra_en: "FOOT",
                    url_imagem_real: "/public/assets/imagens/modulos/corpo_humano/corpo_humano_real/foot.png",
                    url_imagem_vetor: "/public/assets/imagens/modulos/corpo_humano/corpo_humano_vetor/foot.png"
                },
            ],
            atividades: [
                {
                    atividade_id: 1, ordem_sequencia: 1, tipo_interacao: "recognize", palavra_chave: "HEAD",
                    instrucao_lex: "Toque na imagem: cabeça.", resposta_correta: "HEAD"
                },
                {
                    atividade_id: 2, ordem_sequencia: 2, tipo_interacao: "associate", palavra_chave: "ARM",
                    instrucao_lex: "Observe a imagem. Escolha a palavra correta.", resposta_correta: "ARM"
                },
                {
                    atividade_id: 3, ordem_sequencia: 3, tipo_interacao: "validate", palavra_chave: "BELLY",
                    instrucao_lex: "Ouça a palavra em inglês e escolha a imagem correta.", resposta_correta: "BELLY"
                },
                {
                    atividade_id: 4, ordem_sequencia: 4, tipo_interacao: "shadowPuzzle", palavra_chave: "LEG",
                    instrucao_lex: "Encaixe a imagem na sombra correspondente.", resposta_correta: "LEG"
                },
            ],
        };
    }

    if (moduleId === 2) {
        return {
            modulo: { id: 2, nome: "Animais da Fazenda" },
            aluno: { id: student.id },
            itens: [
                {
                    item_id: 1, ordem: 1, palavra_pt: "vaca", palavra_en: "COW",
                    url_imagem_real: "/public/assets/imagens/modulos/fazenda/animais_reais/cow.png",
                    url_imagem_vetor: "/public/assets/imagens/modulos/fazenda/animais_vetor/cow.png"
                },
                {
                    item_id: 2, ordem: 2, palavra_pt: "cavalo", palavra_en: "HORSE",
                    url_imagem_real: "/public/assets/imagens/modulos/fazenda/animais_reais/horse.png",
                    url_imagem_vetor: "/public/assets/imagens/modulos/fazenda/animais_vetor/horse.png"
                },
                {
                    item_id: 3, ordem: 3, palavra_pt: "porco", palavra_en: "PIG",
                    url_imagem_real: "/public/assets/imagens/modulos/fazenda/animais_reais/pig.png",
                    url_imagem_vetor: "/public/assets/imagens/modulos/fazenda/animais_vetor/pig.png"
                },
                {
                    item_id: 4, ordem: 4, palavra_pt: "pato", palavra_en: "DUCK",
                    url_imagem_real: "/public/assets/imagens/modulos/fazenda/animais_reais/duck.png",
                    url_imagem_vetor: "/public/assets/imagens/modulos/fazenda/animais_vetor/duck.png"
                },
                {
                    item_id: 5, ordem: 5, palavra_pt: "ovelha", palavra_en: "SHEEP",
                    url_imagem_real: "/public/assets/imagens/modulos/fazenda/animais_reais/sheep.png",
                    url_imagem_vetor: "/public/assets/imagens/modulos/fazenda/animais_vetor/sheep.png"
                },
            ],
            atividades: [
                {
                    atividade_id: 21, ordem_sequencia: 1, tipo_interacao: "recognize", palavra_chave: "COW",
                    instrucao_lex: "Toque na imagem: vaca.", resposta_correta: "COW"
                },
                {
                    atividade_id: 22, ordem_sequencia: 2, tipo_interacao: "associate", palavra_chave: "HORSE",
                    instrucao_lex: "Observe a imagem. Escolha a palavra correta.", resposta_correta: "HORSE"
                },
                {
                    atividade_id: 23, ordem_sequencia: 3, tipo_interacao: "validate", palavra_chave: "PIG",
                    instrucao_lex: "Ouça a palavra em inglês e escolha a imagem correta.", resposta_correta: "PIG"
                },
            ],
        };
    }

    if (moduleId === 3) {
        return {
            modulo: { id: 3, nome: "Cores" },
            aluno: { id: student.id },
            itens: [
                {
                    item_id: 1, ordem: 1, palavra_pt: "vermelho", palavra_en: "RED",
                    url_imagem_real: COLOR_IMAGE_MAP.RED,
                    url_imagem_vetor: COLOR_IMAGE_MAP.RED
                },
                {
                    item_id: 2, ordem: 2, palavra_pt: "azul", palavra_en: "BLUE",
                    url_imagem_real: COLOR_IMAGE_MAP.BLUE,
                    url_imagem_vetor: COLOR_IMAGE_MAP.BLUE
                },
                {
                    item_id: 3, ordem: 3, palavra_pt: "amarelo", palavra_en: "YELLOW",
                    url_imagem_real: COLOR_IMAGE_MAP.YELLOW,
                    url_imagem_vetor: COLOR_IMAGE_MAP.YELLOW
                },
                {
                    item_id: 4, ordem: 4, palavra_pt: "verde", palavra_en: "GREEN",
                    url_imagem_real: COLOR_IMAGE_MAP.GREEN,
                    url_imagem_vetor: COLOR_IMAGE_MAP.GREEN
                },
                {
                    item_id: 5, ordem: 5, palavra_pt: "laranja", palavra_en: "ORANGE",
                    url_imagem_real: COLOR_IMAGE_MAP.ORANGE,
                    url_imagem_vetor: COLOR_IMAGE_MAP.ORANGE
                },
                {
                    item_id: 6, ordem: 6, palavra_pt: "roxo", palavra_en: "PURPLE",
                    url_imagem_real: COLOR_IMAGE_MAP.PURPLE,
                    url_imagem_vetor: COLOR_IMAGE_MAP.PURPLE
                },
            ],
            atividades: [
                {
                    atividade_id: 31, ordem_sequencia: 1, tipo_interacao: "recognize", palavra_chave: "RED",
                    instrucao_lex: "Toque na cor: vermelho.", resposta_correta: "RED"
                },
                {
                    atividade_id: 32, ordem_sequencia: 2, tipo_interacao: "associate", palavra_chave: "BLUE",
                    instrucao_lex: "Observe a cor. Escolha a palavra correta.", resposta_correta: "BLUE"
                },
                {
                    atividade_id: 33, ordem_sequencia: 3, tipo_interacao: "validate", palavra_chave: "GREEN",
                    instrucao_lex: "Ouça a palavra em inglês e escolha a cor correta.", resposta_correta: "GREEN"
                },
                {
                    atividade_id: 34, ordem_sequencia: 4, tipo_interacao: "memory", palavra_chave: "YELLOW",
                    instrucao_lex: "Encontre os pares das cores.", resposta_correta: "YELLOW"
                },
            ],
        };
    }

    return null;
}

async function loadModuleContext(moduleId) {
    const validModuleId = resolveModuleId(moduleId);

    const [profile, gameSettings] = await Promise.all([alunosApi.getCurrent(), gameSettingsService.getCurrent()]);
    const student = normalizeStudent(profile);

    let payload;
    try {
        payload = await atividadesApi.getModuleForStudent(
            validModuleId,
            student.id,
        );
        validatePayload(payload);
        validatePayloadStudent(payload, student);
    } catch (apiError) {
        payload = getMockModulePayload(validModuleId, student);
        if (!payload) {
            throw apiError;
        }
    }

    const normalizedActivities = payload.atividades
        .map(normalizeActivity)
        .sort((a, b) => a.order - b.order);

    const normalizedItems = payload.itens
        .map(normalizeModuleItem)
        .sort((a, b) => a.order - b.order);

    const module = createModule(
        payload,
        normalizedItems,
        normalizedActivities,
    );

    return Object.freeze({ student, module, gameSettings });
}

function createActivityContext(moduleContext, stage) {
    const validStage = requirePositiveInteger(
        stage,
        "stage",
    );

    const selectedActivity = selectActivity(
        moduleContext.module.activities,
        validStage,
    );

    const activity = createActivity(
        selectedActivity,
        moduleContext.module.items,
    );

    return Object.freeze({
        ...moduleContext,
        activity,
    });
}





export const atividadeService = Object.freeze({
    async getCurrentStudent() {
        return normalizeStudent(await alunosApi.getCurrent());
    },

    async loadModuleContext(moduleId) {
        return loadModuleContext(moduleId);
    },

    getActivityContext(moduleContext, stage) {
        return createActivityContext(moduleContext, stage);
    },

    async getContext(moduleId, stage) {
        const moduleContext = await loadModuleContext(moduleId);
        return createActivityContext(moduleContext, stage);
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
            id_tentativa: resultData.attemptId,
            palavras: resultData.words || [],
        });
    },
});
