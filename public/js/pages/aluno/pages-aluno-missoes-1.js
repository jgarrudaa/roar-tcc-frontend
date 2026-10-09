import {
    missoesService,
} from "../../services/missoes-service.js";

const elements = Object.freeze({
    dateLabel:
        document.getElementById("dateLabel"),

    greeting:
        document.getElementById(
            "studentGreeting",
        ),

    doneCount:
        document.getElementById("doneCount"),

    totalCount:
        document.getElementById("totalCount"),

    progress:
        document.getElementById(
            "dayProgress",
        ),

    totalReward:
        document.getElementById(
            "totalReward",
        ),

    missionsList:
        document.getElementById(
            "missoesList",
        ),

    avatar:
        document.querySelector(
            ".navbar__avatar",
        ),

    toastContainer:
        document.getElementById(
            "toast-container",
        ),
});

const state = {
    data: null,
    loading: false,
    claimingMissionCode: null,
};

function escapeHtml(value) {
    const element =
        document.createElement("div");

    element.textContent =
        String(value ?? "");

    return element.innerHTML;
}

function getFirstName(fullName) {
    return (
        String(fullName ?? "")
            .trim()
            .split(/\s+/)[0] ||
        "Aluno"
    );
}

function getGreeting() {
    const hour = Number(
        new Intl.DateTimeFormat(
            "pt-BR",
            {
                hour: "2-digit",
                hour12: false,
                timeZone:
                    "America/Sao_Paulo",
            },
        ).format(new Date()),
    );

    if (hour < 12) {
        return "Bom dia";
    }

    if (hour < 18) {
        return "Boa tarde";
    }

    return "Boa noite";
}

function formatDate(dateValue) {
    if (!dateValue) {
        return new Date().toLocaleDateString(
            "pt-BR",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
            },
        );
    }

    const date = new Date(
        `${dateValue}T12:00:00`,
    );

    return date.toLocaleDateString(
        "pt-BR",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
        },
    );
}

function formatProgress(mission) {
    if (mission.type === "tempo") {
        const currentMinutes = Math.floor(
            mission.progress / 60,
        );

        const goalMinutes = Math.ceil(
            mission.goal / 60,
        );

        return (
            `${currentMinutes} de ` +
            `${goalMinutes} minutos`
        );
    }

    if (mission.type === "ofensiva") {
        return (
            `${mission.progress} de ` +
            `${mission.goal} dias`
        );
    }

    return (
        `${mission.progress} de ` +
        `${mission.goal}`
    );
}

function showToast(
    message,
    type = "success",
) {
    if (!elements.toastContainer) {
        return;
    }

    const toast =
        document.createElement("div");

    toast.className =
        `toast toast--${type}`;

    const icon =
        document.createElement("i");

    icon.className =
        type === "success"
            ? "fi fi-br-check-circle"
            : "fi fi-br-exclamation";

    const text =
        document.createElement("span");

    text.textContent = message;

    toast.append(icon, text);

    elements.toastContainer.appendChild(
        toast,
    );

    window.setTimeout(
        () => toast.remove(),
        3500,
    );
}

function updateStudentInformation(data) {
    const firstName = getFirstName(
        data.student.name,
    );

    elements.greeting.textContent =
        `${getGreeting()}, ${firstName}!`;

    elements.dateLabel.textContent =
        formatDate(data.date);

    if (elements.avatar) {
        elements.avatar.textContent =
            firstName
                .charAt(0)
                .toLocaleUpperCase("pt-BR");

        elements.avatar.setAttribute(
            "aria-label",
            `Abrir perfil de ${firstName}`,
        );
    }
}

function updateBanner(data) {
    const {
        completed,
        total,
        progressPercentage,
        totalPossibleXp,
    } = data.summary;

    elements.doneCount.textContent =
        String(completed);

    elements.totalCount.textContent =
        String(total);

    const percentage = Math.min(
        100,
        Math.max(0, progressPercentage),
    );

    elements.progress.style.width =
        `${percentage}%`;

    elements.progress.setAttribute(
        "aria-valuenow",
        String(percentage),
    );

    elements.totalReward.innerHTML = `
        <i
            class="
                fi
                fi-br-star
                u-pages-aluno-missoes-004
            "
            aria-hidden="true"
        ></i>
        ${totalPossibleXp} XP
    `;
}

function createMissionAction(mission) {
    if (mission.rewardClaimed) {
        return `
            <button
                class="
                    mission-card__action
                    mission-card__action--claimed
                "
                type="button"
                disabled
                aria-label="
                    Recompensa da missão
                    ${escapeHtml(mission.name)}
                    já recebida
                "
            >
                <i
                    class="fi fi-br-check"
                    aria-hidden="true"
                ></i>

                <span>Recebida</span>
            </button>
        `;
    }

    if (mission.rewardAvailable) {
        const isClaiming =
            state.claimingMissionCode ===
            mission.code;

        return `
            <button
                class="
                    mission-card__action
                    mission-card__action--claim
                "
                type="button"
                data-mission-code="
                    ${escapeHtml(mission.code)}
                "
                ${isClaiming ? "disabled" : ""}
                aria-label="
                    Resgatar ${mission.xp} XP da missão
                    ${escapeHtml(mission.name)}
                "
            >
                <i
                    class="fi fi-br-gift"
                    aria-hidden="true"
                ></i>

                <span>
                    ${
                        isClaiming
                            ? "Resgatando..."
                            : `Resgatar ${mission.xp} XP`
                    }
                </span>
            </button>
        `;
    }

    return `
        <div
            class="mission-card__status"
            aria-label="
                Progresso da missão:
                ${escapeHtml(formatProgress(mission))}
            "
        >
            <i
                class="fi fi-br-lock"
                aria-hidden="true"
            ></i>

            <span>Em andamento</span>
        </div>
    `;
}

function createMissionCard(mission) {
    const card =
        document.createElement("article");

    const statusClasses = [
        "mission-card",
        mission.completed
            ? "mission-card--completed"
            : "",
        mission.rewardClaimed
            ? "mission-card--claimed"
            : "",
    ]
        .filter(Boolean)
        .join(" ");

    card.className = statusClasses;

    const colorClass =
        mission.color === "green"
            ? "mission-card__icon--green"
            : "mission-card__icon--blue";

    card.innerHTML = `
        <div
            class="
                mission-card__icon
                ${colorClass}
            "
            aria-hidden="true"
        >
            <i class="${escapeHtml(mission.icon)}"></i>
        </div>

        <div class="mission-card__body">
            <h3 class="mission-card__name">
                ${escapeHtml(mission.name)}
            </h3>

            <p class="mission-card__desc">
                ${escapeHtml(mission.description)}
            </p>

            <div class="mission-card__details">
                <span class="mission-card__reward">
                    <i
                        class="
                            fi
                            fi-br-star
                            u-pages-aluno-missoes-004
                        "
                        aria-hidden="true"
                    ></i>

                    ${mission.xp} XP
                </span>

                <span class="mission-card__progress-text">
                    ${escapeHtml(formatProgress(mission))}
                </span>
            </div>
        </div>

        <div class="mission-card__action-wrap">
            ${createMissionAction(mission)}
        </div>
    `;

    return card;
}

function renderMissions(missions) {
    elements.missionsList.replaceChildren();

    if (!missions.length) {
        const emptyState =
            document.createElement("div");

        emptyState.className =
            "missions-state";

        emptyState.innerHTML = `
            <i
                class="fi fi-br-calendar"
                aria-hidden="true"
            ></i>

            <h2>Nenhuma missão disponível</h2>

            <p>
                Volte mais tarde para conferir
                novas missões.
            </p>
        `;

        elements.missionsList.appendChild(
            emptyState,
        );

        return;
    }

    const fragment =
        document.createDocumentFragment();

    missions.forEach(mission => {
        fragment.appendChild(
            createMissionCard(mission),
        );
    });

    elements.missionsList.appendChild(
        fragment,
    );
}

function renderLoading() {
    elements.missionsList.innerHTML = `
        <div
            class="missions-state"
            role="status"
            aria-live="polite"
        >
            <i
                class="
                    fi
                    fi-br-spinner
                    missions-state__spinner
                "
                aria-hidden="true"
            ></i>

            <h2>Carregando missões</h2>

            <p>
                Aguarde enquanto buscamos
                seu progresso.
            </p>
        </div>
    `;
}

function renderError(message) {
    elements.missionsList.innerHTML = `
        <div
            class="
                missions-state
                missions-state--error
            "
            role="alert"
        >
            <i
                class="fi fi-br-exclamation"
                aria-hidden="true"
            ></i>

            <h2>Não foi possível carregar</h2>

            <p>${escapeHtml(message)}</p>

            <button
                class="missions-state__retry"
                id="retryMissionsButton"
                type="button"
            >
                Tentar novamente
            </button>
        </div>
    `;

    document
        .getElementById(
            "retryMissionsButton",
        )
        ?.addEventListener(
            "click",
            loadMissions,
        );
}

function renderPage(data) {
    updateStudentInformation(data);
    updateBanner(data);
    renderMissions(data.missions);
}

async function loadMissions() {
    if (state.loading) {
        return;
    }

    state.loading = true;
    renderLoading();

    try {
        const data =
            await missoesService
                .loadDailyMissions();

        state.data = data;
        renderPage(data);
    } catch (error) {
        console.error(
            "Erro ao carregar missões:",
            error,
        );

        renderError(
            error.message ||
                "Tente novamente mais tarde.",
        );
    } finally {
        state.loading = false;
    }
}

async function claimMissionReward(
    missionCode,
) {
    if (
        !missionCode ||
        state.claimingMissionCode
    ) {
        return;
    }

    state.claimingMissionCode =
        missionCode;

    if (state.data) {
        renderMissions(
            state.data.missions,
        );
    }

    try {
        const result =
            await missoesService
                .claimReward(missionCode);

        if (result.alreadyClaimed) {
            showToast(
                "Esta recompensa já foi recebida.",
                "success",
            );
        } else {
            window.roarSound
                ?.playAchievement?.();

            showToast(
                `Missão concluída! +${result.xpEarned} XP`,
                "success",
            );
        }

        state.claimingMissionCode = null;
        await loadMissions();
    } catch (error) {
        console.error(
            "Erro ao resgatar recompensa:",
            error,
        );

        state.claimingMissionCode = null;

        showToast(
            error.message ||
                "Não foi possível resgatar a recompensa.",
            "error",
        );

        if (state.data) {
            renderMissions(
                state.data.missions,
            );
        }
    }
}

function handleMissionListClick(event) {
    const button = event.target.closest(
        "[data-mission-code]",
    );

    if (!button || button.disabled) {
        return;
    }

    const missionCode =
        button.dataset.missionCode;

    claimMissionReward(missionCode);
}

function initialize() {
    localStorage.removeItem(
        "roarMissions",
    );

    elements.missionsList.addEventListener(
        "click",
        handleMissionListClick,
    );

    loadMissions();
}

initialize();