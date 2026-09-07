import { moduloService } from "../../services/modulo-service.js";
import { relatoriosService } from "../../services/relatorios-service.js";
import { sessionService } from "../../services/session-service.js";
import { showToast } from "../../components/toast.js";

const MODULE_STYLES = Object.freeze([
    {
        icon: "fi fi-br-portrait",
        color: "blue",
    },
    {
        icon: "fi fi-br-paw",
        color: "green",
    },
    {
        icon: "fi fi-br-palette",
        color: "purple",
    },
    {
        icon: "fi fi-br-book-open-cover",
        color: "orange",
    },
]);

const elements = {
    statistics: document.getElementById("statsBar"),
    search: document.getElementById("searchInput"),
    order: document.getElementById("sortSel"),
    filters: document.getElementById("filterBar"),
    container: document.getElementById(
        "atividadesContainer",
    ),
    modal: document.getElementById("modalAtiv"),
    modalName: document.getElementById("mActNome"),
    modalMeta: document.getElementById("mActMeta"),
    modalStatistics: document.getElementById(
        "mActStats",
    ),
    moduleDetails: document.getElementById(
        "moduleDetails",
    ),
    activityList: document.getElementById(
        "mModuleActivities",
    ),
    moduleManagement: document.getElementById(
        "moduleManagement",
    ),
    closeButton: document.querySelector(
        "#modalAtiv .modal-close",
    ),
    notificationButton: document.getElementById(
        "btnNotif",
    ),
    profileAvatar: document.querySelector(
        ".navbar__avatar",
    ),
};

const state = {
    dashboard: null,
    modules: [],
    visibleModules: [],
    activeFilter: "all",
};

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatInteger(value) {
    return Math.max(
        0,
        Number(value) || 0,
    ).toLocaleString("pt-BR");
}

function formatDecimal(value) {
    return Math.max(
        0,
        Number(value) || 0,
    ).toLocaleString("pt-BR", {
        maximumFractionDigits: 1,
    });
}

function getModuleStyle(moduleId) {
    const index =
        Math.abs(Number(moduleId) - 1) %
        MODULE_STYLES.length;

    return MODULE_STYLES[index];
}

function getProgressClass(percentage) {
    if (percentage >= 70) {
        return "progress-bar--green";
    }

    if (percentage >= 40) {
        return "progress-bar--blue";
    }

    return "progress-bar--red";
}

function createEmptyModuleReport(moduleId) {
    return Object.freeze({
        moduleId,
        totalActivities: 0,
        participants: 0,
        completedStudents: 0,
        totalAttempts: 0,
        totalCompletions: 0,
        totalErrors: 0,
        accuracy: 0,
        activities: [],
    });
}

function setProfileAvatar() {
    const session = sessionService.get();

    const name = String(
        session?.user?.name ?? "Professor",
    ).trim();

    elements.profileAvatar.textContent =
        name
            .charAt(0)
            .toLocaleUpperCase("pt-BR") ||
        "P";
}

function renderLoading() {
    elements.statistics.innerHTML = Array
        .from(
            { length: 4 },
            () => `
                <div
                    class="stat-card"
                    aria-hidden="true"
                >
                    <div class="stat-card__icon">
                        <i class="fi fi-br-spinner"></i>
                    </div>

                    <div>
                        <div class="stat-card__label">
                            Carregando
                        </div>

                        <div class="stat-card__value">
                            —
                        </div>
                    </div>
                </div>
            `,
        )
        .join("");

    elements.container.innerHTML = `
        <div
            class="u-pages-professor-atividades-016"
            role="status"
        >
            <i
                class="
                    fi
                    fi-br-spinner
                    u-pages-professor-atividades-017
                "
            ></i>

            Carregando módulos...
        </div>
    `;
}

function renderStatistics() {
    const totalActivities = state.modules.reduce(
        (total, module) =>
            total +
            module.report.totalActivities,
        0,
    );

    const totalCompletions = state.modules.reduce(
        (total, module) =>
            total +
            module.report.totalCompletions,
        0,
    );

    const totalErrors = state.modules.reduce(
        (total, module) =>
            total +
            module.report.totalErrors,
        0,
    );

    const interactions =
        totalCompletions + totalErrors;

    const accuracy = interactions
        ? Math.round(
            (
                totalCompletions /
                interactions
            ) * 100,
        )
        : 0;

    const students = state.dashboard.students;

    const averageXp = students.length
        ? Math.round(
            students.reduce(
                (total, student) =>
                    total + student.xp,
                0,
            ) / students.length,
        )
        : 0;

    const statistics = [
        {
            icon: "fi fi-br-puzzle-pieces",
            background:
                "rgba(133, 199, 242, 0.30)",
            color: "var(--c-blue-dark)",
            label: "Total de atividades",
            value: totalActivities,
        },
        {
            icon: "fi fi-br-users",
            background:
                "rgba(68, 246, 152, 0.25)",
            color: "#1a7c49",
            label: "Total de alunos",
            value:
                state.dashboard.totalStudents,
        },
        {
            icon: "fi fi-br-check-circle",
            background:
                "rgba(245, 158, 11, 0.20)",
            color: "#b07000",
            label: "Aproveitamento",
            value: `${accuracy}%`,
        },
        {
            icon: "fi fi-br-trophy",
            background:
                "rgba(168, 85, 247, 0.15)",
            color: "#7c3aed",
            label: "Média de XP",
            value: formatInteger(averageXp),
        },
    ];

    elements.statistics.innerHTML =
        statistics
            .map(
                (statistic) => `
                    <div class="stat-card">
                        <div
                            class="stat-card__icon"
                            style="
                                background:
                                    ${statistic.background};
                                color:
                                    ${statistic.color};
                            "
                        >
                            <i
                                class="${statistic.icon}"
                                aria-hidden="true"
                            ></i>
                        </div>

                        <div>
                            <div
                                class="stat-card__label"
                            >
                                ${statistic.label}
                            </div>

                            <div
                                class="stat-card__value"
                            >
                                ${statistic.value}
                            </div>
                        </div>
                    </div>
                `,
            )
            .join("");
}

function renderFilters() {
    elements.filters.innerHTML = [
        `
            <button
                class="filter-chip active"
                type="button"
                data-module-id="all"
            >
                Todas
            </button>
        `,

        ...state.modules.map(
            (module) => `
                <button
                    class="filter-chip"
                    type="button"
                    data-module-id="${module.id}"
                >
                    ${escapeHtml(module.title)}
                </button>
            `,
        ),
    ].join("");

    const filterButtons =
        elements.filters.querySelectorAll(
            ".filter-chip",
        );

    filterButtons.forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                state.activeFilter =
                    button.dataset.moduleId;

                filterButtons.forEach(
                    (chip) => {
                        chip.classList.toggle(
                            "active",
                            chip === button,
                        );
                    },
                );

                applyFilters();
            },
        );
    });
}

function renderModuleCard(module) {
    const report = module.report;
    const style = getModuleStyle(module.id);
    const totalStudents =
        state.dashboard.totalStudents;

    const isPreparation =
        report.totalActivities === 0;

    const actions = isPreparation
        ? `
            <span class="badge">
                Em preparação
            </span>
        `
        : `
            <button
                class="btn btn--ghost btn--sm"
                type="button"
                data-action="details"
                data-module-id="${module.id}"
            >
                Ver detalhes
            </button>

            <button
                class="btn btn--primary btn--sm"
                type="button"
                data-action="manage"
                data-module-id="${module.id}"
            >
                Gerenciar
            </button>
        `;

    const activityLabel =
        report.totalActivities === 1
            ? "atividade"
            : "atividades";

    return `
        <section class="cat-section">
            <div class="cat-header">
                <div
                    class="
                        cat-icon
                        cat-icon--${style.color}
                    "
                >
                    <i
                        class="${style.icon}"
                        aria-hidden="true"
                    ></i>
                </div>

                <h2>
                    ${escapeHtml(module.title)}
                </h2>

                <span class="badge badge--blue">
                    ${report.totalActivities}
                    ${activityLabel}
                </span>
            </div>

            <div class="cat-grid">
                <article
                    class="act-card module-card"
                >
                    <div class="act-card__top">
                        <div
                            class="act-card__info"
                        >
                            <div
                                class="act-card__name"
                            >
                                ${escapeHtml(
                                    module.title,
                                )}
                            </div>

                            <div
                                class="
                                    act-card__meta-row
                                "
                            >
                                <span
                                    class="
                                        badge
                                        badge--blue
                                        u-pages-professor-atividades-018
                                    "
                                >
                                    ${report.totalActivities}
                                    ${activityLabel}
                                </span>

                                <span
                                    class="
                                        u-pages-professor-atividades-020
                                    "
                                >
                                    ${formatInteger(
                                        report.totalAttempts,
                                    )}
                                    tentativas
                                </span>
                            </div>

                            <div
                                class="
                                    u-pages-professor-atividades-021
                                "
                            >
                                <div
                                    class="
                                        u-pages-professor-atividades-022
                                    "
                                >
                                    <span>
                                        Aproveitamento
                                        da turma
                                    </span>

                                    <span
                                        class="
                                            u-pages-professor-atividades-023
                                        "
                                    >
                                        ${report.accuracy}%
                                    </span>
                                </div>

                                <div
                                    class="
                                        progress-wrap
                                        u-pages-professor-atividades-024
                                    "
                                >
                                    <div
                                        class="
                                            progress-bar
                                            ${getProgressClass(
                                                report.accuracy,
                                            )}
                                        "
                                        style="
                                            width:
                                                ${report.accuracy}%;
                                        "
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        class="act-card__stats"
                    >
                        <div class="act-stat">
                            <div
                                class="
                                    act-stat__val
                                    u-pages-professor-atividades-025
                                "
                            >
                                ${report.accuracy}%
                            </div>

                            <div
                                class="act-stat__lbl"
                            >
                                Aproveit.
                            </div>
                        </div>

                        <div class="act-stat">
                            <div
                                class="
                                    act-stat__val
                                    u-pages-professor-atividades-026
                                "
                            >
                                ${formatInteger(
                                    report.totalAttempts,
                                )}
                            </div>

                            <div
                                class="act-stat__lbl"
                            >
                                Tentativas
                            </div>
                        </div>

                        <div class="act-stat">
                            <div
                                class="act-stat__val"
                            >
                                ${formatInteger(
                                    report.completedStudents,
                                )}
                                /
                                ${formatInteger(
                                    totalStudents,
                                )}
                            </div>

                            <div
                                class="act-stat__lbl"
                            >
                                Completaram
                            </div>
                        </div>
                    </div>

                    <div
                        class="act-card__footer"
                    >
                        <span
                            class="unlock-count"
                        >
                            ${formatInteger(
                                report.participants,
                            )}
                            /
                            ${formatInteger(
                                totalStudents,
                            )}
                            alunos participaram
                        </span>

                        <div
                            class="
                                module-card__actions
                            "
                        >
                            ${actions}
                        </div>
                    </div>
                </article>
            </div>
        </section>
    `;
}

function renderModules() {
    if (!state.visibleModules.length) {
        elements.container.innerHTML = `
            <div
                class="
                    u-pages-professor-atividades-016
                "
            >
                <i
                    class="
                        fi
                        fi-br-search
                        u-pages-professor-atividades-017
                    "
                ></i>

                Nenhum módulo encontrado.
            </div>
        `;

        return;
    }

    elements.container.innerHTML =
        state.visibleModules
            .map(renderModuleCard)
            .join("");

    const detailsButtons =
        elements.container.querySelectorAll(
            "[data-action='details']",
        );

    detailsButtons.forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                openModuleDetails(
                    Number(
                        button.dataset.moduleId,
                    ),
                );
            },
        );
    });

    const managementButtons =
        elements.container.querySelectorAll(
            "[data-action='manage']",
        );

    managementButtons.forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                showToast(
                    (
                        "A liberação individual será " +
                        "ativada quando o controle de " +
                        "acesso existir no banco."
                    ),
                    "info",
                );
            },
        );
    });
}

function applyFilters() {
    const query = elements.search.value
        .trim()
        .toLocaleLowerCase("pt-BR");

    const order = elements.order.value;

    state.visibleModules =
        state.modules.filter((module) => {
            const matchesFilter =
                state.activeFilter === "all" ||
                String(module.id) ===
                    state.activeFilter;

            const matchesModuleName =
                module.title
                    .toLocaleLowerCase(
                        "pt-BR",
                    )
                    .includes(query);

            const matchesActivity =
                module.report.activities.some(
                    (activity) =>
                        activity.name
                            .toLocaleLowerCase(
                                "pt-BR",
                            )
                            .includes(query),
                );

            const matchesSearch =
                !query ||
                matchesModuleName ||
                matchesActivity;

            return (
                matchesFilter &&
                matchesSearch
            );
        });

    state.visibleModules.sort(
        (
            firstModule,
            secondModule,
        ) => {
            if (order === "nome") {
                return firstModule.title
                    .localeCompare(
                        secondModule.title,
                        "pt-BR",
                    );
            }

            if (order === "acertos") {
                return (
                    secondModule
                        .report.accuracy -
                    firstModule
                        .report.accuracy
                );
            }

            return (
                firstModule.id -
                secondModule.id
            );
        },
    );

    renderModules();
}

function renderActivityTable(module) {
    const rows = module.report.activities
        .map(
            (activity) => `
                <tr>
                    <th scope="row">
                        ${escapeHtml(
                            activity.name,
                        )}

                        <br>

                        <small>
                            Etapa
                            ${formatInteger(
                                activity.order,
                            )}
                        </small>
                    </th>

                    <td>
                        ${formatInteger(
                            activity.participants,
                        )}
                    </td>

                    <td>
                        ${formatInteger(
                            activity.totalAttempts,
                        )}
                    </td>

                    <td>
                        ${formatInteger(
                            activity.completions,
                        )}
                    </td>

                    <td>
                        ${formatInteger(
                            activity.totalErrors,
                        )}
                    </td>

                    <td>
                        ${formatDecimal(
                            activity.averageTimeSeconds,
                        )}s
                    </td>

                    <td>
                        ${activity.accuracy}%
                    </td>
                </tr>
            `,
        )
        .join("");

    elements.activityList.innerHTML = `
        <table
            class="module-performance-table"
        >
            <thead>
                <tr>
                    <th>Atividade</th>
                    <th>Alunos</th>
                    <th>Tentativas</th>
                    <th>Conclusões</th>
                    <th>Erros</th>
                    <th>Tempo médio</th>
                    <th>Aproveit.</th>
                </tr>
            </thead>

            <tbody>
                ${
                    rows ||
                    `
                        <tr>
                            <td colspan="7">
                                Nenhuma atividade
                                cadastrada.
                            </td>
                        </tr>
                    `
                }
            </tbody>
        </table>
    `;
}

function openModuleDetails(moduleId) {
    const module = state.modules.find(
        (item) => item.id === moduleId,
    );

    if (!module) {
        return;
    }

    const report = module.report;

    elements.modalName.textContent =
        `Detalhes: ${module.title}`;

    elements.modalMeta.textContent =
        (
            `${report.totalActivities} atividades · ` +
            `${report.totalAttempts} tentativas registradas`
        );

    elements.modalStatistics.hidden = false;
    elements.moduleDetails.hidden = false;
    elements.moduleManagement.hidden = true;

    elements.modalStatistics.innerHTML = `
        <div class="mstat">
            <div
                class="
                    mstat__val
                    u-pages-professor-atividades-025
                "
            >
                ${report.accuracy}%
            </div>

            <div class="mstat__lbl">
                Aproveitamento
            </div>
        </div>

        <div class="mstat">
            <div
                class="
                    mstat__val
                    u-pages-professor-atividades-029
                "
            >
                ${formatInteger(
                    report.totalErrors,
                )}
            </div>

            <div class="mstat__lbl">
                Erros registrados
            </div>
        </div>

        <div class="mstat">
            <div
                class="
                    mstat__val
                    u-pages-professor-atividades-026
                "
            >
                ${formatInteger(
                    report.participants,
                )}
            </div>

            <div class="mstat__lbl">
                Participantes
            </div>
        </div>

        <div class="mstat">
            <div class="mstat__val">
                ${formatInteger(
                    report.completedStudents,
                )}
                /
                ${formatInteger(
                    state.dashboard.totalStudents,
                )}
            </div>

            <div class="mstat__lbl">
                Concluíram o módulo
            </div>
        </div>
    `;

    renderActivityTable(module);

    elements.modal.classList.add("open");

    elements.modal.setAttribute(
        "aria-hidden",
        "false",
    );
}

function closeModal() {
    elements.modal.classList.remove(
        "open",
    );

    elements.modal.setAttribute(
        "aria-hidden",
        "true",
    );
}

function validateElements() {
    const missingElements =
        Object.entries(elements)
            .filter(
                ([, element]) => !element,
            )
            .map(([name]) => name);

    if (missingElements.length) {
        throw new Error(
            (
                "Elementos ausentes na página: " +
                `${missingElements.join(", ")}.`
            ),
        );
    }
}

function bindEvents() {
    elements.search.addEventListener(
        "input",
        applyFilters,
    );

    elements.order.addEventListener(
        "change",
        applyFilters,
    );

    elements.closeButton.addEventListener(
        "click",
        closeModal,
    );

    elements.modal.addEventListener(
        "click",
        (event) => {
            if (
                event.target ===
                elements.modal
            ) {
                closeModal();
            }
        },
    );

    elements.notificationButton
        .addEventListener(
            "click",
            () => {
                showToast(
                    (
                        "Você não possui " +
                        "novas notificações."
                    ),
                    "info",
                );
            },
        );

    document.addEventListener(
        "keydown",
        (event) => {
            if (event.key === "Escape") {
                closeModal();
            }
        },
    );
}

async function loadPage() {
    const session = sessionService.get();
    const teacherId = Number(
        session?.user?.id,
    );

    if (
        !Number.isInteger(teacherId) ||
        teacherId <= 0
    ) {
        throw new Error(
            (
                "Não foi possível identificar " +
                "o professor autenticado."
            ),
        );
    }

    renderLoading();

    const [modules, dashboard] =
        await Promise.all([
            moduloService.listJourney(),

            relatoriosService
                .getTeacherDashboard(
                    teacherId,
                ),
        ]);

    const reports = await Promise.all(
        modules.map(async (module) => {
            try {
                return await relatoriosService
                    .getModuleReport(
                        module.id,
                    );
            } catch (error) {
                const isEmptyModule =
                    error?.status === 404 ||
                    error?.code ===
                        "MODULE_WITHOUT_ACTIVITIES";

                if (isEmptyModule) {
                    return createEmptyModuleReport(
                        module.id,
                    );
                }

                throw error;
            }
        }),
    );

    state.dashboard = dashboard;

    state.modules = modules.map(
        (module, index) => ({
            ...module,
            report: reports[index],
        }),
    );

    renderStatistics();
    renderFilters();
    applyFilters();
}

async function initialize() {
    try {
        validateElements();
        setProfileAvatar();
        bindEvents();

        await loadPage();
    } catch (error) {
        console.error(
            (
                "Erro ao carregar atividades " +
                "do professor:"
            ),
            error,
        );

        if (elements.container) {
            elements.container.innerHTML = `
                <div
                    class="
                        u-pages-professor-atividades-016
                    "
                    role="alert"
                >
                    <i
                        class="
                            fi
                            fi-br-exclamation
                            u-pages-professor-atividades-017
                        "
                    ></i>

                    Não foi possível carregar
                    as atividades.
                </div>
            `;
        }

        showToast(
            (
                error?.message ??
                "Não foi possível carregar as atividades."
            ),
            "error",
        );
    }
}

initialize();