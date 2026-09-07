import { showToast } from "../../components/toast.js";
import { relatoriosService } from "../../services/relatorios-service.js";
import { sessionService } from "../../services/session-service.js";


const AVATAR_COLORS = Object.freeze([
    "#244D8C",
    "#1A7C49",
    "#7C3AED",
    "#B07000",
    "#1F6CE3",
    "#0E7490",
    "#BE185D",
    "#C2410C",
]);


const elements = {
    studentList: document.getElementById("studentList"),
    mobileSelect: document.getElementById("mobileSel"),
    dashboard: document.getElementById("dashboardArea"),
    teacherAvatar: document.querySelector(".navbar__avatar"),
    printButton: document.getElementById("printReportButton"),
};


const state = {
    teacherId: null,
    teacherDashboard: null,
    selectedStudentId: null,
    reportCache: new Map(),
    requestSequence: 0,
};


function createElement(
    tagName,
    className,
    textContent,
) {
    const element =
        document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (
        textContent !== undefined &&
        textContent !== null
    ) {
        element.textContent =
            String(textContent);
    }

    return element;
}


function requireTeacherId() {
    const session = sessionService.get();

    const teacherId = Number(
        session?.user?.id ??
        session?.user?.professor_id ??
        session?.professor_id,
    );

    if (
        !Number.isInteger(teacherId) ||
        teacherId <= 0
    ) {
        throw new Error(
            "Não foi possível identificar o professor autenticado.",
        );
    }

    return teacherId;
}


function formatNumber(value) {
    return (
        Number(value) || 0
    ).toLocaleString("pt-BR");
}


function formatSeconds(value) {
    const totalSeconds = Math.max(
        0,
        Math.round(Number(value) || 0),
    );

    if (totalSeconds < 60) {
        return `${totalSeconds}s`;
    }

    const minutes = Math.floor(
        totalSeconds / 60,
    );

    const seconds =
        totalSeconds % 60;

    return seconds
        ? `${minutes}min ${seconds}s`
        : `${minutes}min`;
}


function formatDate(value) {
    if (!(value instanceof Date)) {
        return "Sem atividade registrada";
    }

    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        },
    ).format(value);
}


function getAvatarColor(studentId) {
    const index =
        Math.abs(Number(studentId) || 0) %
        AVATAR_COLORS.length;

    return AVATAR_COLORS[index];
}


function getLevelTagClass(levelNumber) {
    if (levelNumber === 2) {
        return "tag-2";
    }

    if (levelNumber === 3) {
        return "tag-3";
    }

    return "tag-1";
}


function getProgressColor(percentage) {
    if (percentage >= 80) {
        return "#1A7C49";
    }

    if (percentage >= 50) {
        return "var(--c-blue-dark)";
    }

    return "#B91C1C";
}


function setLoading(message) {
    const loading =
        createElement(
            "div",
            "simple-report-card",
        );

    const text =
        createElement(
            "p",
            "simple-section-help",
            message,
        );

    loading.append(text);

    elements.dashboard.replaceChildren(
        loading,
    );
}


function setPageError(error) {
    console.error(
        "Erro ao carregar relatório:",
        error,
    );

    const container =
        createElement(
            "section",
            "simple-report-card",
        );

    const title =
        createElement(
            "h2",
            null,
            "Não foi possível carregar o relatório",
        );

    const message =
        createElement(
            "p",
            "simple-section-help",
            error?.message ||
            "Tente novamente em alguns instantes.",
        );

    const retryButton =
        createElement(
            "button",
            "btn btn--primary",
            "Tentar novamente",
        );

    retryButton.type = "button";

    retryButton.addEventListener(
        "click",
        initialize,
        {
            once: true,
        },
    );

    container.append(
        title,
        message,
        retryButton,
    );

    elements.dashboard.replaceChildren(
        container,
    );

    showToast(
        error?.message ||
        "Não foi possível carregar o relatório.",
        "error",
    );
}


function createStudentListItem(student) {
    const button =
        createElement(
            "button",
            "student-item",
        );

    button.type = "button";
    button.dataset.studentId =
        String(student.id);

    if (
        student.id ===
        state.selectedStudentId
    ) {
        button.classList.add("active");
    }

    const avatar =
        createElement(
            "span",
            "si-av",
            student.initial,
        );

    avatar.style.backgroundColor =
        getAvatarColor(student.id);

    const information =
        createElement("span");

    const name =
        createElement(
            "span",
            "si-name",
            student.name,
        );

    const schoolYear =
        createElement(
            "span",
            "si-turma",
            student.schoolYear,
        );

    information.append(
        name,
        schoolYear,
    );

    const progress =
        createElement(
            "span",
            "si-prog",
            `${student.completionRate}%`,
        );

    progress.style.color =
        getProgressColor(
            student.completionRate,
        );

    button.append(
        avatar,
        information,
        progress,
    );

    button.addEventListener(
        "click",
        () => {
            selectStudent(student.id);
        },
    );

    return button;
}


function renderStudentSelectors(students) {
    elements.studentList.replaceChildren();
    elements.mobileSelect.replaceChildren();

    /*
     * Remove o onchange inline do HTML antigo.
     * A seleção passa a ser controlada por este módulo.
     */
    elements.mobileSelect.removeAttribute(
        "onchange",
    );

    if (!students.length) {
        const message =
            createElement(
                "p",
                "u-pages-professor-relatorios-040",
                "Nenhum aluno está vinculado a este professor.",
            );

        elements.studentList.append(message);

        const option =
            createElement(
                "option",
                null,
                "Nenhum aluno disponível",
            );

        option.value = "";
        elements.mobileSelect.append(option);

        return;
    }

    const listFragment =
        document.createDocumentFragment();

    const selectFragment =
        document.createDocumentFragment();

    students.forEach((student) => {
        listFragment.append(
            createStudentListItem(student),
        );

        const option =
            createElement(
                "option",
                null,
                `${student.name} — ${student.schoolYear}`,
            );

        option.value =
            String(student.id);

        option.selected =
            student.id ===
            state.selectedStudentId;

        selectFragment.append(option);
    });

    elements.studentList.append(
        listFragment,
    );

    elements.mobileSelect.append(
        selectFragment,
    );
}


function updateSelectedStudent(studentId) {
    elements.studentList
        .querySelectorAll(".student-item")
        .forEach((item) => {
            item.classList.toggle(
                "active",
                Number(item.dataset.studentId) ===
                studentId,
            );
        });

    elements.mobileSelect.value =
        String(studentId);
}


function createStudentHeader(report) {
    const student = report.student;

    const container =
        createElement(
            "section",
            "simple-student-card",
        );

    const heading =
        createElement(
            "div",
            "simple-student-heading",
        );

    const avatar =
        createElement(
            "div",
            "hero-av",
            student.initial,
        );

    avatar.style.backgroundColor =
        getAvatarColor(student.id);

    const information =
        createElement("div");

    const name =
        createElement(
            "h2",
            null,
            student.name,
        );

    const metadata =
        createElement(
            "p",
            null,
            `${student.schoolYear} · XP: ${formatNumber(student.xp)}`,
        );

    const level =
        createElement(
            "span",
            `nivel-tag ${getLevelTagClass(
                student.learningMode.number,
            )}`,
            student.learningMode.label,
        );

    information.append(
        name,
        metadata,
        level,
    );

    heading.append(
        avatar,
        information,
    );

    container.append(heading);

    return container;
}


function createSummaryItem(value, label) {
    const container =
        createElement("div");

    const valueElement =
        createElement(
            "strong",
            null,
            value,
        );

    const labelElement =
        createElement(
            "span",
            null,
            label,
        );

    container.append(
        valueElement,
        labelElement,
    );

    return container;
}


function createSummarySection(report) {
    const section =
        createElement(
            "section",
            "simple-report-card",
        );

    const title =
        createElement(
            "h2",
            null,
            "Resumo do desempenho",
        );

    const grid =
        createElement(
            "div",
            "simple-summary-grid",
        );

    grid.append(
        createSummaryItem(
            `${report.summary.completionRate}%`,
            "Taxa de conclusão",
        ),

        createSummaryItem(
            `${report.summary.completed}/${report.summary.attempted}`,
            "Atividades concluídas",
        ),

        createSummaryItem(
            report.summary.averageErrors,
            "Média de erros",
        ),

        createSummaryItem(
            formatSeconds(
                report.summary.averageTimeSeconds,
            ),
            "Tempo médio",
        ),
    );

    section.append(
        title,
        grid,
    );

    return section;
}


function createTableCell(
    text,
    className = null,
) {
    return createElement(
        "td",
        className,
        text,
    );
}


function createEmptyTableRow(
    columnCount,
    message,
) {
    const row =
        document.createElement("tr");

    const cell =
        createElement(
            "td",
            null,
            message,
        );

    cell.colSpan = columnCount;

    row.append(cell);

    return row;
}


function createModulesSection(report) {
    const section =
        createElement(
            "section",
            "simple-report-card",
        );

    const title =
        createElement(
            "h2",
            null,
            "Desempenho por módulo",
        );

    const description =
        createElement(
            "p",
            "simple-section-help",
            "Dados calculados a partir das atividades realizadas pelo aluno.",
        );

    const tableWrapper =
        createElement(
            "div",
            "simple-table-wrap",
        );

    const table =
        createElement(
            "table",
            "simple-report-table",
        );

    const head =
        document.createElement("thead");

    const headRow =
        document.createElement("tr");

    [
        "Módulo",
        "Conclusão",
        "Tentativas",
        "Média de erros",
        "Tempo médio",
    ].forEach((label) => {
        headRow.append(
            createElement(
                "th",
                null,
                label,
            ),
        );
    });

    head.append(headRow);

    const body =
        document.createElement("tbody");

    if (!report.modules.length) {
        body.append(
            createEmptyTableRow(
                5,
                "Este aluno ainda não realizou atividades.",
            ),
        );
    } else {
        report.modules.forEach((module) => {
            const row =
                document.createElement("tr");

            const moduleCell =
                createElement(
                    "th",
                    null,
                    module.name,
                );

            moduleCell.scope = "row";

            row.append(
                moduleCell,

                createTableCell(
                    `${module.completionRate}%`,
                ),

                createTableCell(
                    String(module.totalAttempts),
                ),

                createTableCell(
                    String(module.averageErrors),
                ),

                createTableCell(
                    formatSeconds(
                        module.averageTimeSeconds,
                    ),
                ),
            );

            body.append(row);
        });
    }

    table.append(
        head,
        body,
    );

    tableWrapper.append(table);

    section.append(
        title,
        description,
        tableWrapper,
    );

    return section;
}


function createHistorySection(report) {
    const section =
        createElement(
            "section",
            "simple-report-card",
        );

    const title =
        createElement(
            "h2",
            null,
            "Histórico recente",
        );

    const tableWrapper =
        createElement(
            "div",
            "simple-table-wrap",
        );

    const table =
        createElement(
            "table",
            "simple-report-table",
        );

    const head =
        document.createElement("thead");

    const headRow =
        document.createElement("tr");

    [
        "Data",
        "Módulo",
        "Atividade",
        "Erros",
        "Tempo",
        "Situação",
    ].forEach((label) => {
        headRow.append(
            createElement(
                "th",
                null,
                label,
            ),
        );
    });

    head.append(headRow);

    const body =
        document.createElement("tbody");

    const recentHistory =
        report.history.slice(0, 10);

    if (!recentHistory.length) {
        body.append(
            createEmptyTableRow(
                6,
                "Nenhuma tentativa registrada.",
            ),
        );
    } else {
        recentHistory.forEach((record) => {
            const row =
                document.createElement("tr");

            const status =
                createElement(
                    "span",
                    record.completed
                        ? "simple-status simple-status--done"
                        : "simple-status simple-status--prog",

                    record.completed
                        ? "Concluída"
                        : "Não concluída",
                );

            const statusCell =
                document.createElement("td");

            statusCell.append(status);

            row.append(
                createTableCell(
                    formatDate(record.dateTime),
                ),

                createTableCell(
                    record.moduleName,
                ),

                createTableCell(
                    record.activityName,
                ),

                createTableCell(
                    String(record.errors),
                ),

                createTableCell(
                    formatSeconds(
                        record.timeSeconds,
                    ),
                ),

                statusCell,
            );

            body.append(row);
        });
    }

    table.append(
        head,
        body,
    );

    tableWrapper.append(table);

    section.append(
        title,
        tableWrapper,
    );

    return section;
}


function createGuidanceSection(report) {
    const section =
        createElement(
            "section",
            "simple-report-card simple-guidance",
        );

    const title =
        createElement(
            "h2",
            null,
            "Orientação para a próxima aula",
        );

    const paragraph =
        createElement("p");

    const modulesNeedingSupport =
        report.modules.filter(
            (module) =>
                module.totalAttempts > 0 &&
                (
                    module.averageErrors >= 2 ||
                    module.completionRate < 70
                ),
        );

    if (!report.history.length) {
        paragraph.textContent =
            "O aluno ainda não possui histórico suficiente para gerar uma orientação.";
    } else if (
        modulesNeedingSupport.length
    ) {
        paragraph.textContent =
            "Considere reforçar os módulos: " +
            modulesNeedingSupport
                .map((module) => module.name)
                .join(", ") +
            ".";
    } else {
        paragraph.textContent =
            "O aluno apresenta uma boa taxa de conclusão nos módulos realizados.";
    }

    section.append(
        title,
        paragraph,
    );

    return section;
}


function renderStudentReport(report) {
    elements.dashboard.replaceChildren(
        createStudentHeader(report),
        createSummarySection(report),
        createModulesSection(report),
        createHistorySection(report),
        createGuidanceSection(report),
    );
}


async function getStudentReport(studentId) {
    if (
        state.reportCache.has(studentId)
    ) {
        return state.reportCache.get(
            studentId,
        );
    }

    const report =
        await relatoriosService.getStudentReport(
            studentId,
        );

    state.reportCache.set(
        studentId,
        report,
    );

    return report;
}


async function selectStudent(studentId) {
    const numericStudentId =
        Number(studentId);

    if (
        !Number.isInteger(numericStudentId) ||
        numericStudentId <= 0
    ) {
        return;
    }

    const currentRequest =
        ++state.requestSequence;

    state.selectedStudentId =
        numericStudentId;

    updateSelectedStudent(
        numericStudentId,
    );

    setLoading(
        "Carregando relatório do aluno...",
    );

    try {
        const report =
            await getStudentReport(
                numericStudentId,
            );

        if (
            currentRequest !==
            state.requestSequence
        ) {
            return;
        }

        renderStudentReport(report);
    } catch (error) {
        if (
            currentRequest !==
            state.requestSequence
        ) {
            return;
        }

        setPageError(error);
    }
}


function bindMobileSelect() {
    elements.mobileSelect.removeAttribute(
        "onchange",
    );

    elements.mobileSelect.addEventListener(
        "change",
        (event) => {
            selectStudent(
                Number(event.target.value),
            );
        },
    );
}


function bindPrintButton() {
    elements.printButton.addEventListener(
        "click",
        () => {
            window.print();
        },
    );
}


function validateElements() {
    const missingElements = Object.entries(
        elements,
    )
        .filter(([, element]) => !element)
        .map(([name]) => name);

    if (missingElements.length) {
        throw new Error(
            `Elementos ausentes na página: ${missingElements.join(", ")}.`,
        );
    }
}


async function initialize() {
    try {
        validateElements();

        setLoading(
            "Carregando alunos...",
        );

        state.teacherId =
            requireTeacherId();

        const dashboard =
            await relatoriosService.getTeacherDashboard(
                state.teacherId,
            );

        state.teacherDashboard =
            dashboard;

        const teacherSession =
            sessionService.get();

        const teacherName =
            teacherSession?.user?.name ??
            teacherSession?.user?.nome ??
            "Professor";

        elements.teacherAvatar.textContent =
            String(teacherName)
                .trim()
                .charAt(0)
                .toLocaleUpperCase("pt-BR") ||
            "P";

        if (!dashboard.students.length) {
            renderStudentSelectors([]);

            const emptyState =
                createElement(
                    "section",
                    "simple-report-card",
                );

            emptyState.append(
                createElement(
                    "h2",
                    null,
                    "Nenhum aluno encontrado",
                ),

                createElement(
                    "p",
                    "simple-section-help",
                    "Cadastre ou vincule um aluno para visualizar relatórios.",
                ),
            );

            elements.dashboard.replaceChildren(
                emptyState,
            );

            return;
        }

        state.selectedStudentId =
            dashboard.students[0].id;

        renderStudentSelectors(
            dashboard.students,
        );

        await selectStudent(
            state.selectedStudentId,
        );
    } catch (error) {
        setPageError(error);
    }
}


bindMobileSelect();
bindPrintButton();
initialize();
