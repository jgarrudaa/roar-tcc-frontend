import { relatoriosService } from "../../services/relatorios-service.js";
import { sessionService } from "../../services/session-service.js";
import { alunoService } from "../../services/aluno-service.js";
import { showToast } from "../../components/toast.js";

const LEVEL_STYLES = Object.freeze({
    0: {
        text: "Modo não informado",
        tagClass: "tag-1",
        cardClass: "nivel-1",
    },
    1: {
        text: "Nível 1 — Suporte Visual Puro",
        tagClass: "tag-1",
        cardClass: "nivel-1",
    },
    2: {
        text: "Nível 2 — Aprendiz Guiado",
        tagClass: "tag-2",
        cardClass: "nivel-2",
    },
    3: {
        text: "Nível 3 — Autonomia Contextual",
        tagClass: "tag-3",
        cardClass: "nivel-3",
    },
});

const AVATAR_COLORS = Object.freeze([
    "#244d8c",
    "#1a7c49",
    "#7c3aed",
    "#b07000",
    "#1f6ce3",
    "#0e7490",
    "#be185d",
    "#c2410c",
]);

const elements = {
    statistics: document.getElementById(
        "turmaStats",
    ),

    studentsGrid: document.getElementById(
        "studentsGrid",
    ),

    search: document.getElementById(
        "searchInput",
    ),

    levelFilter: document.getElementById(
        "filterNivel",
    ),

    schoolYearFilter: document.getElementById(
        "filterTurma",
    ),

    orderFilter: document.getElementById(
        "filterOrdem",
    ),

    modal: document.getElementById(
        "modalAluno",
    ),

    modalAvatar: document.getElementById(
        "modalAvatar",
    ),

    modalName: document.getElementById(
        "modalNome",
    ),

    modalMeta: document.getElementById(
        "modalMeta",
    ),

    modalLevel: document.getElementById(
        "modalNivelTag",
    ),

    modalStatistics: document.getElementById(
        "modalStats",
    ),

    modalChart: document.getElementById(
        "modalChart",
    ),

    modalTable: document.getElementById(
        "modalTable",
    ),

    reportButton: document.getElementById(
        "btnRelatorio",
    ),

    resetPinButton:
        document.getElementById(
            "btnRedefinirPin",
        ),

    generatedPinContainer:
        document.getElementById(
            "pinGeradoContainer",
        ),

    generatedPin:
        document.getElementById(
            "pinGerado",
        ),

    copyPinButton:
        document.getElementById(
            "btnCopiarPin",
        ),

    pinMessage:
        document.getElementById(
            "pinAlunoMensagem",
        ),

    notificationButton: document.getElementById(
        "btnNotif",
    ),

    profileAvatar: document.querySelector(
        ".navbar__avatar",
    ),

    closeButtons: document.querySelectorAll(
        [
            "#modalAluno .modal-close",
            "#modalAluno .u-pages-professor-alunos-017 > .btn--secondary",
        ].join(", "),
    ),
};

const state = {
    dashboard: null,
    students: [],
    visibleStudents: [],
    selectedStudent: null,
    report: null,
    loadingReport: false,
    resettingPin: false,
    generatedPin: "",
};

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function clampPercentage(value) {
    const number = Number(value);

    return Number.isFinite(number)
        ? Math.max(
            0,
            Math.min(
                100,
                Math.round(number),
            ),
        )
        : 0;
}

function formatInteger(value) {
    return Math.max(
        0,
        Number(value) || 0,
    ).toLocaleString("pt-BR");
}

function formatLastAccess(date) {
    if (
        !(date instanceof Date) ||
        Number.isNaN(date.getTime())
    ) {
        return "Sem atividade registrada";
    }

    const today = new Date();

    const currentDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
    );

    const accessDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
    );

    const difference = Math.round(
        (currentDay - accessDay) / 86400000,
    );

    if (difference <= 0) {
        return "Hoje";
    }

    if (difference === 1) {
        return "Ontem";
    }

    return `há ${difference} dias`;
}

function calculateAccuracy(
    completions,
    errors,
) {
    const validCompletions = Math.max(
        0,
        Number(completions) || 0,
    );

    const validErrors = Math.max(
        0,
        Number(errors) || 0,
    );

    const interactions =
        validCompletions + validErrors;

    return interactions
        ? clampPercentage(
            (
                validCompletions /
                interactions
            ) * 100,
        )
        : 0;
}

function calculateProgress(student) {
    const totalActivities = Math.max(
        0,
        Number(
            student.availableActivities,
        ) || 0,
    );

    return totalActivities
        ? clampPercentage(
            (
                student.completed /
                totalActivities
            ) * 100,
        )
        : 0;
}

function getLevelStyle(student) {
    return (
        LEVEL_STYLES[
        student.level?.number
        ] ?? LEVEL_STYLES[0]
    );
}

function getProgressClass(progress) {
    if (progress >= 80) {
        return "progress-bar--green";
    }

    if (progress >= 50) {
        return "progress-bar--blue";
    }

    return "progress-bar--red";
}

function getAvatarColor(studentId) {
    const index =
        Math.abs(
            Number(studentId) || 0,
        ) % AVATAR_COLORS.length;

    return AVATAR_COLORS[index];
}

function setProfileAvatar() {
    const name = String(
        sessionService.get()?.user?.name ??
        "Professor",
    ).trim();

    if (!elements.profileAvatar) {
        return;
    }

    elements.profileAvatar.textContent =
        name
            .charAt(0)
            .toLocaleUpperCase("pt-BR") ||
        "P";
}

function renderLoading() {
    elements.statistics.innerHTML =
        Array.from(
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
        ).join("");

    elements.studentsGrid.innerHTML = `
        <div
            class="u-pages-professor-alunos-019"
            role="status"
        >
            <i class="fi fi-br-spinner"></i>
            Carregando alunos...
        </div>
    `;
}

function renderStatistics() {
    const total = state.students.length;

    const activeToday =
        state.students.filter(
            (student) =>
                formatLastAccess(
                    student.lastAccess,
                ) === "Hoje",
        ).length;

    const averageProgress = total
        ? Math.round(
            state.students.reduce(
                (sum, student) =>
                    sum +
                    calculateProgress(student),
                0,
            ) / total,
        )
        : 0;

    const averageXp = total
        ? Math.round(
            state.students.reduce(
                (sum, student) =>
                    sum + student.xp,
                0,
            ) / total,
        )
        : 0;

    const statistics = [
        [
            "fi fi-br-users",
            "rgba(133,199,242,.30)",
            "var(--c-blue-dark)",
            "Total de alunos",
            total,
        ],
        [
            "fi fi-br-bolt",
            "rgba(68,246,152,.25)",
            "#1a7c49",
            "Ativos hoje",
            activeToday,
        ],
        [
            "fi fi-br-star",
            "rgba(245,158,11,.20)",
            "#b07000",
            "Média de progresso",
            `${averageProgress}%`,
        ],
        [
            "fi fi-br-trophy",
            "rgba(168,85,247,.15)",
            "#7c3aed",
            "Média de XP",
            formatInteger(averageXp),
        ],
    ];

    elements.statistics.innerHTML =
        statistics.map(
            ([
                icon,
                background,
                color,
                label,
                value,
            ]) => `
                <div class="stat-card">
                    <div
                        class="stat-card__icon"
                        style="background:${background};color:${color}"
                    >
                        <i
                            class="${icon}"
                            aria-hidden="true"
                        ></i>
                    </div>

                    <div>
                        <div class="stat-card__label">
                            ${escapeHtml(label)}
                        </div>

                        <div class="stat-card__value">
                            ${escapeHtml(value)}
                        </div>
                    </div>
                </div>
            `,
        ).join("");
}

function renderSchoolYearOptions() {
    const years = [
        ...new Set(
            state.students
                .map(
                    (student) =>
                        student.schoolYear,
                )
                .filter(
                    (year) =>
                        year !==
                        "Não informado",
                ),
        ),
    ].sort(
        (firstYear, secondYear) =>
            firstYear.localeCompare(
                secondYear,
                "pt-BR",
                { numeric: true },
            ),
    );

    elements.schoolYearFilter.innerHTML = [
        '<option value="">Todos os anos</option>',

        ...years.map(
            (year) =>
                `<option value="${escapeHtml(year)}">${escapeHtml(year)}</option>`,
        ),
    ].join("");
}

function renderStudentCards() {
    if (!state.visibleStudents.length) {
        elements.studentsGrid.innerHTML = `
            <div class="u-pages-professor-alunos-019">
                <i class="fi fi-br-search u-pages-professor-alunos-020"></i>
                Nenhum aluno encontrado.
            </div>
        `;

        return;
    }

    elements.studentsGrid.innerHTML = "";

    const fragment =
        document.createDocumentFragment();

    state.visibleStudents.forEach(
        (student) => {
            const level =
                getLevelStyle(student);

            const progress =
                calculateProgress(student);

            const accuracy =
                calculateAccuracy(
                    student.totalAttempts,
                    student.totalErrors,
                );

            const card =
                document.createElement(
                    "article",
                );

            card.className =
                `student-card ${level.cardClass}`;

            card.tabIndex = 0;

            card.setAttribute(
                "role",
                "button",
            );

            card.setAttribute(
                "aria-label",
                `Ver detalhes de ${student.name}`,
            );

            card.innerHTML = `
                <div class="student-card__header">
                    <div
                        class="student-avatar"
                        style="background:${getAvatarColor(student.id)}"
                    >
                        ${escapeHtml(student.initial)}
                    </div>

                    <div>
                        <div class="student-card__name">
                            ${escapeHtml(student.name)}
                        </div>

                        <div class="student-card__turma">
                            ${escapeHtml(student.schoolYear)}
                            · último acesso:
                            ${escapeHtml(
                formatLastAccess(
                    student.lastAccess,
                ),
            )}
                        </div>
                    </div>
                </div>

                <div class="student-card__stats">
                    <div class="mini-stat">
                        <div class="mini-stat__val">
                            ${formatInteger(student.xp)}
                        </div>

                        <div class="mini-stat__lbl">
                            XP
                        </div>
                    </div>

                    <div class="mini-stat">
                        <div class="mini-stat__val">
                            ${accuracy}%
                        </div>

                        <div class="mini-stat__lbl">
                            Aproveit.
                        </div>
                    </div>

                    <div class="mini-stat">
                        <div class="mini-stat__val">
                           ${formatInteger(student.completed)}/${formatInteger(student.availableActivities)}
                        </div>

                        <div class="mini-stat__lbl">
                            Concluídas
                        </div>
                    </div>
                </div>

                <div class="progress-label">
                    <span>Progresso geral</span>
                    <span>${progress}%</span>
                </div>

                <div class="progress-wrap u-pages-professor-alunos-021">
                    <div
                        class="progress-bar ${getProgressClass(progress)}"
                        style="width:${progress}%"
                    ></div>
                </div>

                <span class="nivel-tag ${level.tagClass}">
                    <i
                        class="fi fi-br-brain"
                        aria-hidden="true"
                    ></i>

                    ${escapeHtml(level.text)}
                </span>
            `;

            const open = () => {
                openStudentModal(student.id);
            };

            card.addEventListener(
                "click",
                open,
            );

            card.addEventListener(
                "keydown",
                (event) => {
                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {
                        event.preventDefault();
                        open();
                    }
                },
            );

            fragment.appendChild(card);
        },
    );

    elements.studentsGrid.appendChild(
        fragment,
    );
}

function applyFilters() {
    const query =
        elements.search.value
            .trim()
            .toLocaleLowerCase("pt-BR");

    const selectedLevel =
        elements.levelFilter.value;

    const selectedYear =
        elements.schoolYearFilter.value;

    const selectedOrder =
        elements.orderFilter.value;

    state.visibleStudents =
        state.students.filter(
            (student) =>
                student.name
                    .toLocaleLowerCase("pt-BR")
                    .includes(query) &&
                (
                    !selectedLevel ||
                    String(
                        student.level.number,
                    ) === selectedLevel
                ) &&
                (
                    !selectedYear ||
                    student.schoolYear ===
                    selectedYear
                ),
        );

    state.visibleStudents.sort(
        (firstStudent, secondStudent) => {
            if (selectedOrder === "xp") {
                return (
                    secondStudent.xp -
                    firstStudent.xp
                );
            }

            if (selectedOrder === "prog") {
                return (
                    calculateProgress(
                        secondStudent,
                    ) -
                    calculateProgress(
                        firstStudent,
                    )
                );
            }

            return firstStudent.name.localeCompare(
                secondStudent.name,
                "pt-BR",
            );
        },
    );

    renderStudentCards();
}

function prepareModal(student) {
    const level =
        getLevelStyle(student);

    elements.modalAvatar.textContent =
        student.initial;

    elements.modalAvatar.style.background =
        getAvatarColor(student.id);

    elements.modalName.textContent =
        student.name;

    elements.modalMeta.textContent =
        `${student.schoolYear} · ` +
        `${formatInteger(student.xp)} XP · ` +
        `último acesso: ${formatLastAccess(student.lastAccess)}`;

    elements.modalLevel.className =
        `nivel-tag ${level.tagClass}`;

    elements.modalLevel.innerHTML = `
        <i
            class="fi fi-br-brain"
            aria-hidden="true"
        ></i>

        ${escapeHtml(level.text)}
    `;

    elements.modalStatistics.innerHTML = `
        <div class="mstat">
            <div class="mstat__val">
                —
            </div>

            <div class="mstat__lbl">
                Carregando relatório...
            </div>
        </div>
    `;

    elements.modalChart.innerHTML = "";
    elements.modalTable.innerHTML = "";

    clearGeneratedPin();
}

function renderModalReport(report) {
    const {
        summary,
        history,
    } = report;

    const accuracy =
        calculateAccuracy(
            summary.totalAttempts,
            summary.totalErrors,
        );

    elements.modalStatistics.innerHTML = `
        <div class="mstat">
            <div class="mstat__val">
                ${accuracy}%
            </div>

            <div class="mstat__lbl">
                Aproveitamento
            </div>
        </div>

        <div class="mstat">
            <div class="mstat__val">
                ${formatInteger(summary.totalAttempts)}
            </div>

            <div class="mstat__lbl">
                Conclusões
            </div>
        </div>

        <div class="mstat">
            <div class="mstat__val">
                ${formatInteger(summary.totalErrors)}
            </div>

            <div class="mstat__lbl">
                Total de erros
            </div>
        </div>

        <div class="mstat">
            <div class="mstat__val">
                ${formatInteger(summary.completed)}/${formatInteger(summary.availableActivities)}
            </div>

            <div class="mstat__lbl">
                Atividades concluídas
            </div>
        </div>
    `;

    const chartRecords =
        history.slice(0, 8).reverse();

    const maximum = Math.max(
        ...chartRecords.map(
            (record) =>
                (
                    record.completed
                        ? 1
                        : 0
                ) + record.errors,
        ),
        1,
    );

    elements.modalChart.innerHTML =
        chartRecords.length
            ? chartRecords.map(
                (record) => `
                    <div class="act-col">
                        <div class="act-bar-wrap">
                            <div
                                class="act-bar acertos"
                                style="height:${record.completed
                        ? Math.max(
                            10,
                            Math.round(
                                110 /
                                maximum,
                            ),
                        )
                        : 0
                    }px"
                                title="${record.completed
                        ? 1
                        : 0
                    } conclusão"
                            ></div>

                            <div
                                class="act-bar erros"
                                style="height:${Math.round(
                        (
                            record.errors /
                            maximum
                        ) * 110,
                    )}px"
                                title="${record.errors} erros"
                            ></div>
                        </div>

                        <div class="act-lbl">
                            ${escapeHtml(
                        record.activityName
                            .split(" ")[0],
                    )}
                        </div>
                    </div>
                `,
            ).join("")
            : "<p>Nenhuma atividade realizada.</p>";

    elements.modalTable.innerHTML =
        history.length
            ? history.map(
                (record) => {
                    const percentage =
                        calculateAccuracy(
                            record.completed
                                ? 1
                                : 0,
                            record.errors,
                        );

                    const percentageClass =
                        percentage >= 70
                            ? "pct-green"
                            : percentage >= 40
                                ? "pct-yellow"
                                : "pct-red";

                    const status =
                        record.completed
                            ? `
                                <span class="status-pill pill-done">
                                    <i class="fi fi-br-check"></i>
                                    Concluída
                                </span>
                            `
                            : `
                                <span class="status-pill pill-prog">
                                    <i class="fi fi-br-time-forward"></i>
                                    Não concluída
                                </span>
                            `;

                    return `
                        <tr>
                            <td class="u-pages-professor-alunos-022">
                                ${escapeHtml(record.activityName)}
                            </td>

                            <td class="u-pages-professor-alunos-023">
                                ${escapeHtml(record.moduleName)}
                            </td>

                            <td class="u-pages-professor-alunos-024">
                                ${record.completed ? 1 : 0}
                            </td>

                            <td class="u-pages-professor-alunos-025">
                                ${formatInteger(record.errors)}
                            </td>

                            <td>
                                <div class="u-pages-professor-alunos-026">
                                    <div class="pct-bar-wrap">
                                        <div
                                            class="pct-bar ${percentageClass}"
                                            style="width:${percentage}%"
                                        ></div>
                                    </div>

                                    <span class="u-pages-professor-alunos-027">
                                        ${percentage}%
                                    </span>
                                </div>
                            </td>

                            <td>
                                ${status}
                            </td>
                        </tr>
                    `;
                },
            ).join("")
            : `
                <tr>
                    <td colspan="6">
                        Nenhuma atividade realizada.
                    </td>
                </tr>
            `;
}

async function openStudentModal(
    studentId,
) {
    if (state.loadingReport) {
        return;
    }

    const student =
        state.students.find(
            (item) =>
                item.id === studentId,
        );

    if (!student) {
        return;
    }

    state.selectedStudent = student;
    state.report = null;
    state.loadingReport = true;

    prepareModal(student);

    elements.modal.classList.add("open");

    elements.modal.setAttribute(
        "aria-hidden",
        "false",
    );

    try {
        state.report =
            await relatoriosService
                .getStudentReport(studentId);

        renderModalReport(state.report);
    } catch (error) {
        elements.modalStatistics.innerHTML = `
            <div class="mstat">
                <div class="mstat__val">
                    !
                </div>

                <div class="mstat__lbl">
                    Relatório indisponível
                </div>
            </div>
        `;

        showToast(
            error?.message ??
            "Não foi possível carregar o relatório do aluno.",
            "error",
        );
    } finally {
        state.loadingReport = false;
    }
}


function clearGeneratedPin() {
    state.generatedPin = "";

    elements.generatedPin.textContent =
        "----";

    elements.generatedPinContainer.hidden =
        true;

    elements.copyPinButton.disabled =
        true;

    elements.pinMessage.textContent =
        "";
}


function closeStudentModal() {
    if (state.resettingPin) {
        return;
    }

    elements.modal.classList.remove(
        "open",
    );

    elements.modal.setAttribute(
        "aria-hidden",
        "true",
    );

    state.selectedStudent = null;
    state.report = null;

    clearGeneratedPin();
}


async function resetSelectedStudentPin() {
    const student =
        state.selectedStudent;

    if (!student) {
        showToast(
            "Selecione um aluno válido.",
            "error",
        );

        return;
    }

    if (state.resettingPin) {
        return;
    }

    const confirmed =
        window.confirm(
            `Gerar um novo PIN para ${student.name}? ` +
            "O PIN atual deixará de funcionar imediatamente.",
        );

    if (!confirmed) {
        return;
    }

    state.resettingPin = true;

    elements.resetPinButton.disabled =
        true;

    elements.copyPinButton.disabled =
        true;

    elements.pinMessage.textContent =
        "Gerando um PIN seguro...";

    try {
        const response =
            await alunoService.resetPin(
                student.id,
            );

        state.generatedPin =
            response.pin;

        elements.generatedPin.textContent =
            response.pin;

        elements.generatedPinContainer.hidden =
            false;

        elements.copyPinButton.disabled =
            false;

        elements.pinMessage.textContent =
            "Novo PIN gerado. Entregue-o diretamente ao aluno.";

        showToast(
            `Novo PIN de ${student.name} gerado com sucesso.`,
            "success",
        );
    } catch (error) {
        state.generatedPin = "";

        elements.generatedPin.textContent =
            "----";

        elements.generatedPinContainer.hidden =
            true;

        elements.pinMessage.textContent =
            error?.message ||
            "Não foi possível gerar um novo PIN.";

        showToast(
            elements.pinMessage.textContent,
            "error",
        );
    } finally {
        state.resettingPin = false;

        elements.resetPinButton.disabled =
            false;
    }
}





async function copyGeneratedPin() {
    const pin =
        state.generatedPin;

    if (!/^\d{4}$/.test(pin)) {
        showToast(
            "Gere um novo PIN primeiro.",
            "info",
        );

        return;
    }

    try {
        await navigator.clipboard.writeText(
            pin,
        );

        elements.pinMessage.textContent =
            "PIN copiado para a área de transferência.";

        showToast(
            "PIN copiado.",
            "success",
        );
    } catch {
        const temporaryInput =
            document.createElement("textarea");

        temporaryInput.value =
            pin;

        temporaryInput.setAttribute(
            "readonly",
            "",
        );

        temporaryInput.style.position =
            "fixed";

        temporaryInput.style.opacity =
            "0";

        document.body.append(
            temporaryInput,
        );

        temporaryInput.select();

        const copied =
            document.execCommand(
                "copy",
            );

        temporaryInput.remove();

        if (!copied) {
            showToast(
                `Anote o PIN: ${pin}`,
                "info",
            );

            return;
        }

        elements.pinMessage.textContent =
            "PIN copiado para a área de transferência.";

        showToast(
            "PIN copiado.",
            "success",
        );
    }
}






function showReportSummary() {
    if (!state.report) {
        showToast(
            "Aguarde o carregamento do relatório.",
            "info",
        );

        return;
    }

    const accuracy =
        calculateAccuracy(
            state.report.summary
                .totalAttempts,
            state.report.summary
                .totalErrors,
        );

    showToast(
        `${state.report.student.name}: ` +
        `${accuracy}% de aproveitamento geral.`,
        "success",
    );
}

function validateElements() {
    const missing =
        Object.entries(elements)
            .filter(
                ([name, value]) =>
                    name !== "closeButtons" &&
                    !value,
            )
            .map(([name]) => name);

    if (missing.length) {
        throw new Error(
            `Elementos ausentes na página: ${missing.join(", ")}.`,
        );
    }
}

function bindEvents() {
    elements.search.addEventListener(
        "input",
        applyFilters,
    );

    elements.levelFilter.addEventListener(
        "change",
        applyFilters,
    );

    elements.schoolYearFilter.addEventListener(
        "change",
        applyFilters,
    );

    elements.orderFilter.addEventListener(
        "change",
        applyFilters,
    );

    elements.reportButton.addEventListener(
        "click",
        showReportSummary,
    );


    elements.resetPinButton.addEventListener(
        "click",
        resetSelectedStudentPin,
    );
    elements.copyPinButton.addEventListener(
        "click",
        copyGeneratedPin,
    );

    elements.notificationButton.addEventListener(
        "click",
        () => {
            showToast(
                "Você não possui novas notificações.",
                "info",
            );
        },
    );

    elements.closeButtons.forEach(
        (button) => {
            button.addEventListener(
                "click",
                closeStudentModal,
            );
        },
    );

    elements.modal.addEventListener(
        "click",
        (event) => {
            if (
                event.target === elements.modal
            ) {
                closeStudentModal();
            }
        },
    );

    document.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key === "Escape" &&
                elements.modal.classList
                    .contains("open")
            ) {
                closeStudentModal();
            }
        },
    );
}

async function loadStudents() {
    const teacherId = Number(
        sessionService.get()?.user?.id,
    );

    if (
        !Number.isInteger(teacherId) ||
        teacherId <= 0
    ) {
        throw new Error(
            "Não foi possível identificar o professor autenticado.",
        );
    }

    renderLoading();

    state.dashboard =
        await relatoriosService
            .getTeacherDashboard(
                teacherId,
            );

    state.students = [
        ...state.dashboard.students,
    ];

    renderStatistics();
    renderSchoolYearOptions();
    applyFilters();
}

async function initialize() {
    try {
        validateElements();
        setProfileAvatar();
        bindEvents();

        await loadStudents();
    } catch (error) {
        console.error(
            "Erro ao carregar a página de alunos:",
            error,
        );

        if (elements.studentsGrid) {
            elements.studentsGrid.innerHTML = `
                <div
                    class="u-pages-professor-alunos-019"
                    role="alert"
                >
                    <i class="fi fi-br-exclamation"></i>
                    Não foi possível carregar os alunos.
                </div>
            `;
        }

        showToast(
            error?.message ??
            "Não foi possível carregar os alunos.",
            "error",
        );
    }
}

initialize();