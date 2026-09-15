import {
    alunosApi,
} from "../../api/alunos-api.js";

import {
    relatoriosService,
} from "../../services/relatorios-service.js";


const MEDAL_DEFINITIONS = Object.freeze([
    {
        id: "primeira-atividade",
        name: "Primeiro Passo",
        description:
            "Complete sua primeira atividade.",
        icon: "fi fi-br-star",
        color: "#d99a00",
        background: "rgba(255, 215, 0, 0.20)",

        isUnlocked(context) {
            return context.completed >= 1;
        },

        getDate(context) {
            return context.completedHistory[0]?.dateTime;
        },
    },

    {
        id: "tres-atividades",
        name: "Começando Bem",
        description:
            "Complete 3 atividades.",
        icon: "fi fi-br-sparkles",
        color: "#2563eb",
        background: "rgba(37, 99, 235, 0.16)",

        isUnlocked(context) {
            return context.completed >= 3;
        },

        getDate(context) {
            return context.completedHistory[2]?.dateTime;
        },
    },

    {
        id: "cinco-atividades",
        name: "Aprendiz Dedicado",
        description:
            "Complete 5 atividades.",
        icon: "fi fi-br-book-open-reader",
        color: "#7c3aed",
        background: "rgba(124, 58, 237, 0.16)",

        isUnlocked(context) {
            return context.completed >= 5;
        },

        getDate(context) {
            return context.completedHistory[4]?.dateTime;
        },
    },

    {
        id: "dez-atividades",
        name: "Grande Jornada",
        description:
            "Complete 10 atividades.",
        icon: "fi fi-br-trophy",
        color: "#9333ea",
        background: "rgba(147, 51, 234, 0.16)",

        isUnlocked(context) {
            return context.completed >= 10;
        },

        getDate(context) {
            return context.completedHistory[9]?.dateTime;
        },
    },

    {
        id: "doze-atividades",
        name: "Ciclo Completo",
        description:
            "Complete 12 atividades.",
        icon: "fi fi-br-medal",
        color: "#ea580c",
        background: "rgba(234, 88, 12, 0.16)",

        isUnlocked(context) {
            return context.completed >= 12;
        },

        getDate(context) {
            return context.completedHistory[11]?.dateTime;
        },
    },

    {
        id: "atividade-sem-erros",
        name: "Observação Atenta",
        description:
            "Complete uma atividade sem erros.",
        icon: "fi fi-br-check-circle",
        color: "#15803d",
        background: "rgba(21, 128, 61, 0.16)",

        isUnlocked(context) {
            return context.activitiesWithoutErrors >= 1;
        },

        getDate(context) {
            return context.firstActivityWithoutErrors?.dateTime;
        },
    },

    {
        id: "cinco-sem-erros",
        name: "Olhar Cuidadoso",
        description:
            "Complete 5 atividades sem erros.",
        icon: "fi fi-br-badge-check",
        color: "#059669",
        background: "rgba(5, 150, 105, 0.16)",

        isUnlocked(context) {
            return context.activitiesWithoutErrors >= 5;
        },

        getDate(context) {
            return context.historyWithoutErrors[4]?.dateTime;
        },
    },

    {
        id: "cem-xp",
        name: "100 XP",
        description:
            "Alcance 100 pontos de experiência.",
        icon: "fi fi-br-bolt",
        color: "#ca8a04",
        background: "rgba(202, 138, 4, 0.16)",

        isUnlocked(context) {
            return context.xp >= 100;
        },
    },

    {
        id: "duzentos-cinquenta-xp",
        name: "250 XP",
        description:
            "Alcance 250 pontos de experiência.",
        icon: "fi fi-br-bolt",
        color: "#ea580c",
        background: "rgba(234, 88, 12, 0.16)",

        isUnlocked(context) {
            return context.xp >= 250;
        },
    },

    {
        id: "quinhentos-xp",
        name: "500 XP",
        description:
            "Alcance 500 pontos de experiência.",
        icon: "fi fi-br-trophy-star",
        color: "#7c3aed",
        background: "rgba(124, 58, 237, 0.16)",

        isUnlocked(context) {
            return context.xp >= 500;
        },
    },

    {
        id: "mil-xp",
        name: "Super Aluno",
        description:
            "Alcance 1.000 pontos de experiência.",
        icon: "fi fi-br-graduation-cap",
        color: "#1d4ed8",
        background: "rgba(29, 78, 216, 0.16)",

        isUnlocked(context) {
            return context.xp >= 1000;
        },
    },

    {
        id: "dois-modulos",
        name: "Explorador",
        description:
            "Realize atividades em 2 módulos diferentes.",
        icon: "fi fi-br-compass-alt",
        color: "#0891b2",
        background: "rgba(8, 145, 178, 0.16)",

        isUnlocked(context) {
            return context.exploredModules >= 2;
        },
    },
]);


const elements = {
    avatar:
        document.querySelector(
            ".navbar__avatar",
        ),

    bannerTitle:
        document.querySelector(
            ".congrats-banner__text h2",
        ),

    bannerDescription:
        document.querySelector(
            ".congrats-banner__text > p",
        ),

    unlockedCount:
        document.getElementById(
            "unlocked-count",
        ),

    lockedCount:
        document.getElementById(
            "locked-count",
        ),

    unlockedBadge:
        document.getElementById(
            "unlocked-badge",
        ),

    lockedBadge:
        document.getElementById(
            "locked-badge",
        ),

    unlockedGrid:
        document.getElementById(
            "conquistadasGrid",
        ),

    lockedGrid:
        document.getElementById(
            "bloqueadasGrid",
        ),
};

function validateElements() {
    const requiredElements = [
        "avatar",
        "bannerTitle",
        "bannerDescription",
        "unlockedCount",
        "lockedCount",
        "unlockedBadge",
        "lockedBadge",
        "unlockedGrid",
        "lockedGrid",
    ];

    const missingElements =
        requiredElements.filter(
            (name) =>
                !elements[name],
        );

    if (missingElements.length > 0) {
        throw new Error(
            `Elementos ausentes na página: ${missingElements.join(", ")}.`,
        );
    }
}


function normalizeDate(value) {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime())
            ? null
            : value;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? null
        : date;
}


function formatDate(value) {
    const date =
        normalizeDate(value);

    if (!date) {
        return "";
    }

    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        },
    ).format(date);
}


function createAchievementContext(
    report,
) {
    const completedHistory =
        report.history
            .filter(
                (record) =>
                    record.completed,
            )
            .sort(
                (first, second) => {
                    const firstTime =
                        normalizeDate(
                            first.dateTime,
                        )?.getTime() ?? 0;

                    const secondTime =
                        normalizeDate(
                            second.dateTime,
                        )?.getTime() ?? 0;

                    return (
                        firstTime -
                        secondTime
                    );
                },
            );

    /*
     * Um aluno pode concluir a mesma atividade mais
     * de uma vez. Para medalhas de quantidade, contamos
     * somente atividades diferentes.
     */
    const uniqueCompletedActivities =
        new Map();

    completedHistory.forEach(
        (record) => {
            const activityKey =
                String(
                    record.activityId ||
                    record.id,
                );

            if (
                !uniqueCompletedActivities.has(
                    activityKey,
                )
            ) {
                uniqueCompletedActivities.set(
                    activityKey,
                    record,
                );
            }
        },
    );

    const uniqueHistory =
        Array.from(
            uniqueCompletedActivities.values(),
        );

    const historyWithoutErrors =
        uniqueHistory.filter(
            (record) =>
                Number(record.errors) === 0,
        );

    const exploredModules =
        report.modules.filter(
            (module) =>
                module.attempted > 0 ||
                module.completed > 0 ||
                module.totalAttempts > 0,
        ).length;

    return Object.freeze({
        completed:
            Math.max(
                report.summary.completed,
                uniqueHistory.length,
            ),

        xp:
            Math.max(
                0,
                Number(report.student.xp) || 0,
            ),

        exploredModules,

        completedHistory:
            uniqueHistory,

        historyWithoutErrors,

        activitiesWithoutErrors:
            historyWithoutErrors.length,

        firstActivityWithoutErrors:
            historyWithoutErrors[0] ?? null,
    });
}


function evaluateMedals(context) {
    return MEDAL_DEFINITIONS.map(
        (definition) => {
            const unlocked =
                Boolean(
                    definition.isUnlocked(
                        context,
                    ),
                );

            const unlockedDate =
                unlocked &&
                    typeof definition.getDate ===
                    "function"
                    ? definition.getDate(
                        context,
                    )
                    : null;

            return Object.freeze({
                ...definition,
                unlocked,
                unlockedDate,
            });
        },
    );
}


function createIcon(medal) {
    const iconContainer =
        document.createElement("div");

    const icon =
        document.createElement("i");

    iconContainer.className =
        "medal-big__icon";

    iconContainer.style.background =
        medal.background;

    icon.className =
        medal.icon;

    icon.style.color =
        medal.color;

    icon.setAttribute(
        "aria-hidden",
        "true",
    );

    iconContainer.append(icon);

    return iconContainer;
}


function createMedalCard(medal) {
    const card =
        document.createElement("article");

    const name =
        document.createElement("h3");

    const description =
        document.createElement("p");

    card.className =
        medal.unlocked
            ? "medal-big"
            : "medal-big locked";

    card.dataset.achievementId =
        medal.id;

    name.className =
        "medal-big__name";

    name.textContent =
        medal.name;

    description.className =
        "medal-big__desc";

    description.textContent =
        medal.description;

    card.append(
        createIcon(medal),
        name,
        description,
    );

    if (medal.unlocked) {
        const formattedDate =
            formatDate(
                medal.unlockedDate,
            );

        const status =
            document.createElement("div");

        status.className =
            "medal-big__date";

        const calendarIcon =
            document.createElement("i");

        calendarIcon.className =
            formattedDate
                ? "fi fi-br-calendar"
                : "fi fi-br-check";

        calendarIcon.setAttribute(
            "aria-hidden",
            "true",
        );

        const statusText =
            document.createElement("span");

        statusText.textContent =
            formattedDate
                ? ` Conquistada em ${formattedDate}`
                : " Conquistada";

        status.append(
            calendarIcon,
            statusText,
        );

        card.append(status);

        card.setAttribute(
            "aria-label",
            `${medal.name}. Conquista desbloqueada.`,
        );
    } else {
        card.setAttribute(
            "aria-label",
            `${medal.name}. Conquista ainda bloqueada. ${medal.description}`,
        );
    }

    return card;
}


function updateStudentIdentity(
    student,
) {
    const name =
        String(
            student.name || "Aluno",
        ).trim();

    const firstName =
        name.split(/\s+/)[0] ||
        "Aluno";

    const initial =
        firstName
            .charAt(0)
            .toLocaleUpperCase(
                "pt-BR",
            ) || "A";

    elements.avatar.textContent =
        initial;

    elements.avatar.title =
        `Perfil de ${name}`;

    elements.bannerTitle.textContent =
        `Parabéns, ${firstName}!`;
}


function updateSummary(
    unlockedCount,
    lockedCount,
) {
    elements.bannerDescription.textContent =
        unlockedCount > 0
            ? (
                `Você conquistou ${unlockedCount} ` +
                `${unlockedCount === 1 ? "medalha" : "medalhas"} ` +
                "até agora. Continue aprendendo no seu ritmo!"
            )
            : (
                "Complete atividades para conquistar sua " +
                "primeira medalha. Aprenda no seu ritmo!"
            );

    elements.unlockedCount.textContent =
        String(unlockedCount);

    elements.lockedCount.textContent =
        String(lockedCount);

    elements.unlockedBadge.textContent =
        `${unlockedCount} ${unlockedCount === 1
            ? "medalha"
            : "medalhas"
        }`;

    elements.lockedBadge.textContent =
        `${lockedCount} ${lockedCount === 1
            ? "medalha"
            : "medalhas"
        }`;
}


function renderMedals(medals) {
    const unlockedMedals =
        medals.filter(
            (medal) =>
                medal.unlocked,
        );

    const lockedMedals =
        medals.filter(
            (medal) =>
                !medal.unlocked,
        );

    elements.unlockedGrid
        .replaceChildren(
            ...unlockedMedals.map(
                createMedalCard,
            ),
        );

    elements.lockedGrid
        .replaceChildren(
            ...lockedMedals.map(
                createMedalCard,
            ),
        );

    if (
        unlockedMedals.length === 0
    ) {
        const emptyMessage =
            document.createElement("p");

        emptyMessage.className =
            "achievements-empty";

        emptyMessage.textContent =
            "Sua primeira conquista aparecerá aqui.";

        elements.unlockedGrid.append(
            emptyMessage,
        );
    }

    updateSummary(
        unlockedMedals.length,
        lockedMedals.length,
    );
}


function showLoading() {
    const loading =
        document.createElement("p");

    loading.className =
        "achievements-loading";

    loading.textContent =
        "Carregando suas conquistas...";

    elements.unlockedGrid
        .replaceChildren(loading);

    elements.lockedGrid
        .replaceChildren();
}


function showError(error) {
    const container =
        document.createElement("div");

    const title =
        document.createElement("strong");

    const description =
        document.createElement("p");

    container.className =
        "achievements-error";

    title.textContent =
        "Não foi possível carregar as conquistas.";

    description.textContent =
        error?.message ||
        "Tente novamente em alguns instantes.";

    container.append(
        title,
        description,
    );

    if (elements.unlockedGrid) {
        elements.unlockedGrid
            .replaceChildren(container);
    }

    if (elements.lockedGrid) {
        elements.lockedGrid
            .replaceChildren();
    }

    elements.bannerTitle.textContent =
        "Suas conquistas";

    elements.bannerDescription.textContent =
        "Não se preocupe. Seu progresso continua salvo.";
}


async function initialize() {
    try {
        validateElements();
        showLoading();

        const profile =
            await alunosApi.getCurrent();

        const studentId =
            Number(profile?.id);

        if (
            !Number.isInteger(studentId) ||
            studentId <= 0
        ) {
            throw new Error(
                "Não foi possível identificar o aluno conectado.",
            );
        }

        const report =
            await relatoriosService
                .getStudentReport(
                    studentId,
                );

        updateStudentIdentity(
            report.student,
        );

        const context =
            createAchievementContext(
                report,
            );

        const medals =
            evaluateMedals(context);

        renderMedals(medals);
    } catch (error) {
        console.error(
            "Erro ao carregar conquistas:",
            error,
        );

        showError(error);
    }
}


initialize();