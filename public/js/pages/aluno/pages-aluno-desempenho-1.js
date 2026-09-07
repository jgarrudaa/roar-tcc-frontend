import { showToast } from "../../components/toast.js";
import { desempenhoService } from "../../services/desempenho-service.js";


const PERIOD_LABELS = Object.freeze({
    overview: "Geral",
    weekly: "Semanal",
    monthly: "Mensal",
});

const TAB_PERIODS = Object.freeze({
    visao: "overview",
    semanal: "weekly",
    mensal: "monthly",
});

const elements = {
    avatar: document.querySelector("#studentAvatar"),

    xpTotal:
        document.querySelector("#xpTotal"),

    completedActivities:
        document.querySelector(
            "#completedActivities",
        ),

    averageErrors:
        document.querySelector("#averageErrors"),

    averageTime:
        document.querySelector("#averageTime"),

    periodLabel:
        document.querySelector("#periodoLabel"),

    barChart:
        document.querySelector("#barChart"),

    donutCanvas:
        document.querySelector("#donutCanvas"),

    completionPercentage:
        document.querySelector(
            "#completionPercentage",
        ),

    completedLegend:
        document.querySelector(
            "#completedLegend",
        ),

    remainingLegend:
        document.querySelector(
            "#remainingLegend",
        ),

    averageTimeLegend:
        document.querySelector(
            "#averageTimeLegend",
        ),

    moduleProgressList:
        document.querySelector(
            "#catProgressList",
        ),

    recentHistory:
        document.querySelector("#recentHistory"),

    tabs:
        Array.from(
            document.querySelectorAll(
                ".tab-btn",
            ),
        ),
};


let activePeriod = "overview";
let requestSequence = 0;


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

    const seconds = totalSeconds % 60;

    return seconds
        ? `${minutes}min ${seconds}s`
        : `${minutes}min`;
}


function formatDate(date) {
    if (!(date instanceof Date)) {
        return "Data não informada";
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
    ).format(date);
}


function formatShortDate(dateValue) {
    const date = new Date(
        `${dateValue}T00:00:00`,
    );

    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            day: "2-digit",
            month: "2-digit",
        },
    ).format(date);
}


function renderStudent(student) {
    elements.avatar.textContent =
        student.initial;

    elements.avatar.title =
        `Perfil de ${student.name}`;
}


function renderSummary(student, summary) {
    elements.xpTotal.textContent =
        student.xp.toLocaleString("pt-BR");

    elements.completedActivities.textContent =
        String(summary.completed);

    elements.averageErrors.textContent =
        String(summary.averageErrors);

    elements.averageTime.textContent =
        formatSeconds(
            summary.averageTimeSeconds,
        );
}


function renderBarChart(dailyEvolution) {
    elements.barChart.replaceChildren();

    if (!dailyEvolution.length) {
        const message =
            document.createElement("p");

        message.className =
            "performance-empty";

        message.textContent =
            "Nenhuma atividade registrada neste período.";

        elements.barChart.append(message);

        return;
    }

    const maximumValue = Math.max(
        ...dailyEvolution.map(
            (day) => day.attempts,
        ),
        1,
    );

    const fragment =
        document.createDocumentFragment();

    dailyEvolution.forEach((day, index) => {
        const column =
            document.createElement("div");

        const bar =
            document.createElement("div");

        const value =
            document.createElement("span");

        const label =
            document.createElement("span");

        column.className =
            "bar-chart__col";

        bar.className =
            "bar-chart__bar";

        if (
            index ===
            dailyEvolution.length - 1
        ) {
            bar.classList.add("highlight");
        }

        const percentage = Math.max(
            5,
            Math.round(
                (
                    day.attempts /
                    maximumValue
                ) * 100,
            ),
        );

        bar.style.height = `${percentage}%`;
        bar.title =
            `${day.attempts} tentativa(s), ` +
            `${day.completed} conclusão(ões)`;

        value.className =
            "bar-chart__val";

        value.textContent =
            String(day.attempts);

        label.className =
            "bar-chart__label";

        label.textContent =
            formatShortDate(day.date);

        bar.append(value);

        column.append(
            bar,
            label,
        );

        fragment.append(column);
    });

    elements.barChart.append(fragment);
}


function drawDonut(percentage) {
    const canvas = elements.donutCanvas;
    const context = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const radius = 51;
    const lineWidth = 14;

    context.clearRect(
        0,
        0,
        width,
        height,
    );

    context.lineWidth = lineWidth;
    context.lineCap = "round";

    context.beginPath();
    context.strokeStyle =
        "rgba(0, 0, 0, 0.10)";

    context.arc(
        centerX,
        centerY,
        radius,
        0,
        Math.PI * 2,
    );

    context.stroke();

    if (percentage <= 0) {
        return;
    }

    const startAngle = -Math.PI / 2;

    const endAngle =
        startAngle +
        (
            Math.PI *
            2 *
            percentage
        ) /
        100;

    context.beginPath();
    context.strokeStyle = "#1F6CE3";

    context.arc(
        centerX,
        centerY,
        radius,
        startAngle,
        endAngle,
    );

    context.stroke();
}


function renderCompletion(summary) {
    const percentage =
        summary.completionRate;

    elements.completionPercentage.textContent =
        `${percentage}%`;

    elements.completedLegend.textContent =
        `${percentage}%`;

    elements.remainingLegend.textContent =
        `${Math.max(0, 100 - percentage)}%`;

    elements.averageTimeLegend.textContent =
        formatSeconds(
            summary.averageTimeSeconds,
        );

    drawDonut(percentage);
}


function createModuleProgress(module) {
    const container =
        document.createElement("div");

    const icon =
        document.createElement("div");

    const iconElement =
        document.createElement("i");

    const information =
        document.createElement("div");

    const name =
        document.createElement("div");

    const progressWrapper =
        document.createElement("div");

    const progressBar =
        document.createElement("div");

    const percentage =
        document.createElement("div");

    container.className =
        "category-progress-item";

    icon.className =
        "cat-progress-icon stat-card__icon--xp";

    iconElement.className =
        "fi fi-br-book-open-cover";

    information.className =
        "cat-progress-info";

    name.className =
        "cat-progress-name";

    name.textContent = module.name;

    progressWrapper.className =
        "progress-wrap";

    progressBar.className =
        "progress-bar";

    progressBar.style.width =
        `${module.completionRate}%`;

    percentage.className =
        "u-pages-aluno-desempenho-012";

    percentage.textContent =
        `${module.completionRate}%`;

    icon.append(iconElement);
    progressWrapper.append(progressBar);

    information.append(
        name,
        progressWrapper,
    );

    container.append(
        icon,
        information,
        percentage,
    );

    return container;
}


function renderModules(modules) {
    elements.moduleProgressList.replaceChildren();

    if (!modules.length) {
        const message =
            document.createElement("p");

        message.className =
            "performance-empty";

        message.textContent =
            "Nenhum módulo realizado neste período.";

        elements.moduleProgressList.append(message);

        return;
    }

    const fragment =
        document.createDocumentFragment();

    modules.forEach((module) => {
        fragment.append(
            createModuleProgress(module),
        );
    });

    elements.moduleProgressList.append(fragment);
}


function createHistoryItem(record) {
    const container =
        document.createElement("div");

    const icon =
        document.createElement("div");

    const iconElement =
        document.createElement("i");

    const information =
        document.createElement("div");

    const title =
        document.createElement("div");

    const metadata =
        document.createElement("div");

    const status =
        document.createElement("span");

    container.className =
        "category-progress-item";

    icon.className =
        "cat-progress-icon";

    iconElement.className =
        record.completed
            ? "fi fi-br-check-circle"
            : "fi fi-br-time-forward";

    information.className =
        "cat-progress-info";

    title.className =
        "cat-progress-name";

    title.textContent =
        `${record.moduleName} — ${record.activityName}`;

    metadata.className =
        "big-stat__label";

    metadata.textContent =
        `${formatDate(record.dateTime)} · ` +
        `${record.errors} erro(s) · ` +
        formatSeconds(record.timeSeconds);

    status.className =
        record.completed
            ? "badge badge--green"
            : "badge badge--blue";

    status.textContent =
        record.completed
            ? "Concluída"
            : "Não concluída";

    icon.append(iconElement);

    information.append(
        title,
        metadata,
    );

    container.append(
        icon,
        information,
        status,
    );

    return container;
}


function renderHistory(history) {
    elements.recentHistory.replaceChildren();

    if (!history.length) {
        const message =
            document.createElement("p");

        message.className =
            "performance-empty";

        message.textContent =
            "Nenhuma atividade encontrada neste período.";

        elements.recentHistory.append(message);

        return;
    }

    const fragment =
        document.createDocumentFragment();

    history.forEach((record) => {
        fragment.append(
            createHistoryItem(record),
        );
    });

    elements.recentHistory.append(fragment);
}


function renderDashboard(data) {
    elements.periodLabel.textContent =
        PERIOD_LABELS[data.period];

    renderStudent(data.student);

    renderSummary(
        data.student,
        data.summary,
    );

    renderBarChart(
        data.dailyEvolution,
    );

    renderCompletion(
        data.summary,
    );

    renderModules(
        data.modules,
    );

    renderHistory(
        data.recentHistory,
    );
}


function showLoading() {
    elements.barChart.textContent =
        "Carregando desempenho...";

    elements.moduleProgressList.textContent =
        "Carregando módulos...";

    elements.recentHistory.textContent =
        "Carregando histórico...";
}


function showError(error) {
    console.error(
        "Falha ao carregar desempenho:",
        error,
    );

    elements.barChart.textContent =
        "Não foi possível carregar a evolução.";

    elements.moduleProgressList.textContent =
        "Não foi possível carregar os módulos.";

    elements.recentHistory.textContent =
        "Não foi possível carregar o histórico.";

    showToast(
        error?.message ||
        "Não foi possível carregar seu desempenho.",
        "error",
    );
}


async function loadDashboard(period) {
    const currentRequest =
        ++requestSequence;

    activePeriod = period;

    showLoading();

    try {
        const data =
            await desempenhoService.load(
                period,
            );

        if (
            currentRequest !== requestSequence
        ) {
            return;
        }

        renderDashboard(data);
    } catch (error) {
        if (
            currentRequest !== requestSequence
        ) {
            return;
        }

        showError(error);
    }
}


function bindTabs() {
    elements.tabs.forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                const period =
                    TAB_PERIODS[
                        button.dataset.tab
                    ];

                if (
                    !period ||
                    period === activePeriod
                ) {
                    return;
                }

                elements.tabs.forEach(
                    (tabButton) => {
                        tabButton.classList.remove(
                            "active",
                        );
                    },
                );

                button.classList.add("active");

                loadDashboard(period);
            },
        );
    });
}


function initialize() {
    bindTabs();
    loadDashboard(activePeriod);
}


initialize();