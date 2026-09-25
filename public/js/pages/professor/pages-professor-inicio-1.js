import { showToast } from "../../components/toast.js";
import { relatoriosService } from "../../services/relatorios-service.js";
import { sessionService } from "../../services/session-service.js";

const SELECTORS = Object.freeze({
    teacherAvatar: "#teacherAvatar",

    totalStudents: "#totalStudents",
    totalActivities: "#totalActivities",
    classAverage: "#classAverage",
    totalCompletions: "#totalCompletions",

    studentsList: "#alunosNivelList",
    attentionList: "#attentionList",
    attentionCount: "#attentionCount",

    performanceStudent: "#histAluno",
    performanceList: "#histList",

    reportStudent: "#relAluno",
    generateReport: "#generateReportButton",

    reportModal: "#modalRelatorio",
    reportText: "#relatorioTexto",
    closeReport: "#closeReportButton",
    closeReportFooter: "#closeReportFooterButton",
    copyReport: "#copyReportButton",
});

const state = {
    dashboard: null,
    selectedStudentId: null,
    isGeneratingReport: false,
};

function getElements() {
    return {
        teacherAvatar: document.querySelector(
            SELECTORS.teacherAvatar,
        ),

        totalStudents: document.querySelector(
            SELECTORS.totalStudents,
        ),

        totalActivities: document.querySelector(
            SELECTORS.totalActivities,
        ),

        classAverage: document.querySelector(
            SELECTORS.classAverage,
        ),

        totalCompletions: document.querySelector(
            SELECTORS.totalCompletions,
        ),

        studentsList: document.querySelector(
            SELECTORS.studentsList,
        ),

        attentionList: document.querySelector(
            SELECTORS.attentionList,
        ),

        attentionCount: document.querySelector(
            SELECTORS.attentionCount,
        ),

        performanceStudent: document.querySelector(
            SELECTORS.performanceStudent,
        ),

        performanceList: document.querySelector(
            SELECTORS.performanceList,
        ),

        reportStudent: document.querySelector(
            SELECTORS.reportStudent,
        ),

        generateReport: document.querySelector(
            SELECTORS.generateReport,
        ),

        reportModal: document.querySelector(
            SELECTORS.reportModal,
        ),

        reportText: document.querySelector(
            SELECTORS.reportText,
        ),

        closeReport: document.querySelector(
            SELECTORS.closeReport,
        ),

        closeReportFooter: document.querySelector(
            SELECTORS.closeReportFooter,
        ),

        copyReport: document.querySelector(
            SELECTORS.copyReport,
        ),
    };
}

function createElement(tagName, className, text) {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function formatNumber(value) {
    return Number(value ?? 0).toLocaleString(
        "pt-BR",
    );
}

function formatDecimal(value) {
    return Number(value ?? 0).toLocaleString(
        "pt-BR",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        },
    );
}

function formatTime(seconds) {
    const safeSeconds = Number(seconds ?? 0);

    if (safeSeconds < 60) {
        return `${Math.round(safeSeconds)} s`;
    }

    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = Math.round(
        safeSeconds % 60,
    );

    return `${minutes}min ${remainingSeconds}s`;
}

function getStudentLevel(student) {
    const source =
        student?.level ??
        student?.learningMode ??
        {};

    const parsedNumber = Number(source.number);
    const number = [1, 2, 3].includes(parsedNumber)
        ? parsedNumber
        : 1;

    const defaultNames = {
        1: "Suporte Visual Puro",
        2: "Aprendiz Guiado",
        3: "Autonomia Contextual",
    };

    return {
        number,
        name:
            source.name ??
            source.label ??
            defaultNames[number],
        className:
            source.className ??
            `nivel-${number}`,
    };
}

function setText(element, value) {
    if (element) {
        element.textContent = value;
    }
}

function setPageLoading(elements) {
    setText(elements.totalStudents, "—");
    setText(elements.totalActivities, "—");
    setText(elements.classAverage, "—");
    setText(elements.totalCompletions, "—");

    if (elements.studentsList) {
        elements.studentsList.textContent =
            "Carregando alunos...";
    }

    if (elements.attentionList) {
        elements.attentionList.textContent =
            "Carregando dados...";
    }

    elements.performanceStudent?.setAttribute(
        "disabled",
        "",
    );

    elements.reportStudent?.setAttribute(
        "disabled",
        "",
    );

    if (elements.generateReport) {
        elements.generateReport.disabled = true;
    }
}

function renderTeacherIdentity(elements) {
    const session = sessionService.get();
    const teacherName = session?.user?.name ?? "Professor";

    setText(
        elements.teacherAvatar,
        teacherName.charAt(0).toUpperCase(),
    );
}

function renderStatistics(elements, dashboard) {
    setText(
        elements.totalStudents,
        formatNumber(dashboard.totalStudents),
    );

    setText(
        elements.totalActivities,
        formatNumber(dashboard.totalActivities),
    );

    setText(
        elements.classAverage,
        `${formatNumber(dashboard.classAverage)}%`,
    );

    setText(
        elements.totalCompletions,
        formatNumber(dashboard.totalCompletions),
    );
}

function createStudentRow(student) {
    const studentLevel = getStudentLevel(student);

    const row = createElement(
        "div",
        "student-row",
    );

    const avatar = createElement(
        "div",
        "avatar u-pages-professor-inicio-025",
        student.name.charAt(0).toUpperCase(),
    );

    const name = createElement(
        "div",
        "student-row__name",
        student.name,
    );

    const level = createElement(
        "span",
        `nivel-badge ${studentLevel.className}`,
        `Nível ${studentLevel.number} — ${studentLevel.name}`,
    );

    const progressContainer = createElement(
        "div",
        "u-pages-professor-inicio-026",
    );

    const percentage = createElement(
        "div",
        "u-pages-professor-inicio-027",
    );

    percentage.append(
        createElement(
            "span",
            "",
            `${student.completionRate}%`,
        ),
    );

    const progressWrap = createElement(
        "div",
        "progress-wrap u-pages-professor-inicio-028",
    );

    const progressBar = createElement(
        "div",
        [
            "progress-bar",
            student.completionRate >= 80
                ? "progress-bar--green"
                : "progress-bar--blue",
        ].join(" "),
    );

    progressBar.style.width =
        `${student.completionRate}%`;

    progressBar.setAttribute(
        "role",
        "progressbar",
    );

    progressBar.setAttribute(
        "aria-valuemin",
        "0",
    );

    progressBar.setAttribute(
        "aria-valuemax",
        "100",
    );

    progressBar.setAttribute(
        "aria-valuenow",
        String(student.completionRate),
    );

    progressWrap.append(progressBar);
    progressContainer.append(percentage, progressWrap);

    row.append(
        avatar,
        name,
        level,
        progressContainer,
    );

    return row;
}

function renderStudents(elements, students) {
    if (!elements.studentsList) {
        return;
    }

    elements.studentsList.replaceChildren();

    if (!students.length) {
        elements.studentsList.append(
            createElement(
                "p",
                "",
                "Nenhum aluno cadastrado.",
            ),
        );

        return;
    }

    students.forEach((student) => {
        elements.studentsList.append(
            createStudentRow(student),
        );
    });
}

function createAttentionRow(student) {
    const row = createElement(
        "div",
        "notif-item",
    );

    const icon = createElement(
        "div",
        "notif-icon",
    );

    icon.style.background =
        "rgba(239, 68, 68, 0.15)";

    const iconElement =
        createElement(
            "i",
            "fi fi-br-exclamation",
        );

    iconElement.style.color =
        "#b91c1c";

    iconElement.setAttribute(
        "aria-hidden",
        "true",
    );

    icon.append(iconElement);

    const content =
        createElement(
            "div",
            "attention-content",
        );

    const title = createElement(
        "div",
        "notif-text",
        student.name,
    );

    const description = createElement(
        "div",
        "notif-time",
        student.attentionReason ??
        "Necessita de acompanhamento",
    );

    content.append(
        title,
        description,
    );

    row.append(
        icon,
        content,
    );

    return row;
}

function renderAttentionStudents(
    elements,
    attentionStudents,
) {
    setText(
        elements.attentionCount,
        `${attentionStudents.length} ${attentionStudents.length === 1
            ? "aluno"
            : "alunos"
        }`,
    );

    if (!elements.attentionList) {
        return;
    }

    elements.attentionList.replaceChildren();

    if (!attentionStudents.length) {
        elements.attentionList.append(
            createElement(
                "p",
                "",
                "Nenhum alerta de dificuldade no momento.",
            ),
        );

        return;
    }

    attentionStudents.forEach((student) => {
        elements.attentionList.append(
            createAttentionRow(student),
        );
    });
}

function populateStudentSelect(
    select,
    students,
    placeholder,
) {
    if (!select) {
        return;
    }

    select.replaceChildren();

    const placeholderOption =
        createElement("option", "", placeholder);

    placeholderOption.value = "";
    placeholderOption.disabled = true;

    select.append(placeholderOption);

    students.forEach((student) => {
        const option = createElement(
            "option",
            "",
            student.name,
        );

        option.value = String(student.id);
        select.append(option);
    });

    if (students.length) {
        select.value = String(students[0].id);
        select.disabled = false;
    } else {
        placeholderOption.selected = true;
        select.disabled = true;
    }
}

function createPerformanceRow(
    label,
    value,
    description,
) {
    const row = createElement(
        "div",
        "hist-row",
    );

    row.append(
        createElement(
            "span",
            "u-pages-professor-inicio-029",
            label,
        ),

        createElement(
            "span",
            "acertos u-pages-professor-inicio-014",
            value,
        ),

        createElement(
            "span",
            "u-pages-professor-inicio-014",
            description,
        ),
    );

    return row;
}

function renderStudentPerformance(elements, studentId) {
    const student = state.dashboard?.students.find(
        (item) => item.id === Number(studentId),
    );

    if (!elements.performanceList) {
        return;
    }

    elements.performanceList.replaceChildren();

    if (!student) {
        elements.performanceList.append(
            createElement(
                "p",
                "",
                "Selecione um aluno.",
            ),
        );

        return;
    }

    elements.performanceList.append(
        createPerformanceRow(
            "Tentativas",
            formatNumber(student.attempted),
            "registros",
        ),

        createPerformanceRow(
            "Conclusões",
            formatNumber(student.completed),
            `${student.completionRate}%`,
        ),

        createPerformanceRow(
            "Média de erros",
            formatDecimal(student.averageErrors),
            "por atividade",
        ),

        createPerformanceRow(
            "Tempo médio",
            formatTime(student.averageTimeSeconds),
            "por atividade",
        ),
    );
}

function buildPedagogicalReport(report) {
    const { student, summary } = report;
    const studentLevel = getStudentLevel(student);

    return [
        "RELATÓRIO PEDAGÓGICO — PLATAFORMA ROAR",
        "",
        `Aluno(a): ${student.name}`,
        `Ano escolar: ${student.schoolYear}`,
        `Nível de suporte: Nível ${studentLevel.number} — ${studentLevel.name}`,
        `Data de emissão: ${new Date().toLocaleDateString("pt-BR")}`,
        "",
        "DESEMPENHO GERAL",
        `Atividades registradas: ${summary.attempted}`,
        `Atividades concluídas: ${summary.completed}`,
        `Taxa de conclusão: ${summary.completionRate}%`,
        `Média de erros: ${formatDecimal(summary.averageErrors)}`,
        `Tempo médio: ${formatTime(summary.averageTimeSeconds)}`,
        `XP total: ${formatNumber(student.xp)}`,
        "",
        "ORIENTAÇÃO",
        getRecommendation(studentLevel.number, summary),
        "",
        "Relatório gerado automaticamente com base nos dados registrados na plataforma ROAR.",
    ].join("\n");
}

function getRecommendation(levelNumber, summary) {
    if (!summary.attempted) {
        return "Ainda não existem tentativas suficientes para produzir uma orientação de desempenho.";
    }

    const difficultyMessage =
        summary.averageErrors >= 3
            ? "Recomenda-se reforçar as atividades com maior quantidade de erros e acompanhar novas tentativas."
            : "O aluno apresenta uma quantidade controlada de erros nas atividades registradas.";

    const levelMessage = {
        1: "Mantenha apoio visual intenso, instruções objetivas e repetição de áudio quando necessário.",
        2: "Mantenha instruções curtas, apoio intermediário e participação ativa.",
        3: "Priorize leitura, interpretação contextual e maior autonomia.",
    }[levelNumber];

    return `${difficultyMessage} ${levelMessage}`;
}

function openReportModal(elements) {
    elements.reportModal?.classList.add("open");
}

function closeReportModal(elements) {
    elements.reportModal?.classList.remove("open");
}

async function generateReport(elements) {
    if (state.isGeneratingReport) {
        return;
    }

    const studentId = Number(
        elements.reportStudent?.value,
    );

    if (!studentId) {
        showToast(
            "Selecione um aluno para gerar o relatório.",
            "warning",
        );
        return;
    }

    state.isGeneratingReport = true;
    elements.generateReport.disabled = true;
    elements.generateReport.textContent =
        "Gerando relatório...";

    try {
        const report =
            await relatoriosService.getStudentReport(
                studentId,
            );

        elements.reportText.value =
            buildPedagogicalReport(report);

        openReportModal(elements);
    } catch (error) {
        showToast(
            error?.message ??
            "Não foi possível gerar o relatório.",
            "error",
        );
    } finally {
        state.isGeneratingReport = false;
        elements.generateReport.disabled = false;
        elements.generateReport.textContent =
            "Gerar relatório";
    }
}

async function copyReport(elements) {
    const text = elements.reportText?.value;

    if (!text) {
        return;
    }

    try {
        await navigator.clipboard.writeText(text);

        showToast(
            "Relatório copiado.",
            "success",
        );
    } catch {
        elements.reportText.select();

        document.execCommand("copy");

        showToast(
            "Relatório copiado.",
            "success",
        );
    }
}

function registerEvents(elements) {
    elements.performanceStudent?.addEventListener(
        "change",
        (event) => {
            state.selectedStudentId =
                Number(event.target.value);

            renderStudentPerformance(
                elements,
                state.selectedStudentId,
            );
        },
    );

    elements.generateReport?.addEventListener(
        "click",
        () => generateReport(elements),
    );

    elements.closeReport?.addEventListener(
        "click",
        () => closeReportModal(elements),
    );

    elements.closeReportFooter?.addEventListener(
        "click",
        () => closeReportModal(elements),
    );

    elements.copyReport?.addEventListener(
        "click",
        () => copyReport(elements),
    );

    elements.reportModal?.addEventListener(
        "click",
        (event) => {
            if (event.target === elements.reportModal) {
                closeReportModal(elements);
            }
        },
    );

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeReportModal(elements);
        }
    });
}

function renderDashboard(elements, dashboard) {
    state.dashboard = dashboard;

    renderStatistics(elements, dashboard);
    renderStudents(elements, dashboard.students);

    renderAttentionStudents(
        elements,
        dashboard.attentionStudents,
    );

    populateStudentSelect(
        elements.performanceStudent,
        dashboard.students,
        "Selecione um aluno",
    );

    populateStudentSelect(
        elements.reportStudent,
        dashboard.students,
        "Selecione um aluno",
    );

    state.selectedStudentId =
        dashboard.students[0]?.id ?? null;

    renderStudentPerformance(
        elements,
        state.selectedStudentId,
    );

    if (elements.generateReport) {
        elements.generateReport.disabled =
            dashboard.students.length === 0;
    }
}

async function initializeTeacherDashboard() {
    const elements = getElements();
    const session = sessionService.get();
    const teacherId = session?.user?.id;

    renderTeacherIdentity(elements);
    registerEvents(elements);
    setPageLoading(elements);

    if (!teacherId) {
        showToast(
            "Não foi possível identificar o professor.",
            "error",
        );

        return;
    }

    try {
        const dashboard =
            await relatoriosService.getTeacherDashboard(
                teacherId,
            );

        renderDashboard(elements, dashboard);
    } catch (error) {
        showToast(
            error?.message ??
            "Não foi possível carregar a dashboard.",
            "error",
        );

        setText(
            elements.studentsList,
            "Não foi possível carregar os alunos.",
        );

        setText(
            elements.attentionList,
            "Não foi possível carregar os alertas.",
        );
    }
}

initializeTeacherDashboard();
