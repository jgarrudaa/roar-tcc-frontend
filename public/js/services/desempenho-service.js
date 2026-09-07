import { alunosApi } from "../api/alunos-api.js";
import { desempenhoApi } from "../api/desempenho-api.js";


const PERIODS = Object.freeze({
    overview: "overview",
    weekly: "weekly",
    monthly: "monthly",
});


function toSafeNumber(value, fallback = 0) {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue)
        ? parsedValue
        : fallback;
}


function toDate(value) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? null
        : date;
}


function startOfToday() {
    const date = new Date();

    date.setHours(0, 0, 0, 0);

    return date;
}


function startOfCurrentWeek() {
    const date = startOfToday();
    const day = date.getDay();
    const difference = day === 0 ? 6 : day - 1;

    date.setDate(date.getDate() - difference);

    return date;
}


function startOfCurrentMonth() {
    const date = startOfToday();

    date.setDate(1);

    return date;
}


function getPeriodStart(period) {
    switch (period) {
        case PERIODS.weekly:
            return startOfCurrentWeek();

        case PERIODS.monthly:
            return startOfCurrentMonth();

        case PERIODS.overview:
        default:
            return null;
    }
}


function normalizePeriod(period) {
    const validPeriods = Object.values(PERIODS);

    return validPeriods.includes(period)
        ? period
        : PERIODS.overview;
}


function filterHistoryByPeriod(history, period) {
    const startDate = getPeriodStart(period);

    if (!startDate) {
        return history;
    }

    return history.filter((record) => {
        const recordDate = toDate(record.dateTime);

        return recordDate && recordDate >= startDate;
    });
}


function normalizeHistoryRecord(record) {
    const dateTime = toDate(record?.data_hora);

    return Object.freeze({
        id: toSafeNumber(record?.id),
        activityId: toSafeNumber(
            record?.atividade_id,
        ),
        activityName:
            record?.atividade?.palavra_chave ??
            "Atividade",

        activityOrder: toSafeNumber(
            record?.atividade?.ordem_sequencia,
        ),

        moduleId: toSafeNumber(
            record?.modulo?.id,
        ),

        moduleName:
            record?.modulo?.nome ??
            "Módulo não informado",

        learningMode:
            record?.modo_utilizado ??
            "Não informado",

        errors: Math.max(
            0,
            toSafeNumber(
                record?.quantidade_erros,
            ),
        ),

        timeSeconds: Math.max(
            0,
            toSafeNumber(
                record?.tempo_segundos,
            ),
        ),

        completed: Boolean(
            record?.concluido,
        ),

        dateTime,
    });
}


function calculatePercentage(part, total) {
    if (!total) {
        return 0;
    }

    return Math.round(
        (part / total) * 100,
    );
}


function calculateAverage(values) {
    if (!values.length) {
        return 0;
    }

    const total = values.reduce(
        (sum, value) => sum + value,
        0,
    );

    return Math.round(
        (total / values.length) * 10,
    ) / 10;
}


function calculateSummary(history) {
    const attemptedActivities = new Set();
    const completedActivities = new Set();

    history.forEach((record) => {
        if (record.activityId) {
            attemptedActivities.add(
                record.activityId,
            );
        }

        if (
            record.activityId &&
            record.completed
        ) {
            completedActivities.add(
                record.activityId,
            );
        }
    });

    return Object.freeze({
        totalAttempts: history.length,

        attempted: attemptedActivities.size,

        completed: completedActivities.size,

        completionRate: calculatePercentage(
            completedActivities.size,
            attemptedActivities.size,
        ),

        totalErrors: history.reduce(
            (total, record) =>
                total + record.errors,
            0,
        ),

        averageErrors: calculateAverage(
            history.map(
                (record) => record.errors,
            ),
        ),

        totalTimeSeconds: history.reduce(
            (total, record) =>
                total + record.timeSeconds,
            0,
        ),

        averageTimeSeconds: calculateAverage(
            history.map(
                (record) => record.timeSeconds,
            ),
        ),
    });
}


function dateKey(date) {
    if (!date) {
        return null;
    }

    const year = date.getFullYear();
    const month = String(
        date.getMonth() + 1,
    ).padStart(2, "0");

    const day = String(
        date.getDate(),
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function calculateDailyEvolution(history) {
    const groupedRecords = new Map();

    history.forEach((record) => {
        const key = dateKey(record.dateTime);

        if (!key) {
            return;
        }

        if (!groupedRecords.has(key)) {
            groupedRecords.set(key, {
                date: key,
                attempts: 0,
                completed: 0,
                errors: 0,
                timeSeconds: 0,
            });
        }

        const day = groupedRecords.get(key);

        day.attempts += 1;
        day.errors += record.errors;
        day.timeSeconds += record.timeSeconds;

        if (record.completed) {
            day.completed += 1;
        }
    });

    return Array.from(
        groupedRecords.values(),
    )
        .sort(
            (firstDay, secondDay) =>
                firstDay.date.localeCompare(
                    secondDay.date,
                ),
        )
        .slice(-14);
}


function calculateModulePerformance(history) {
    const groupedModules = new Map();

    history.forEach((record) => {
        if (!record.moduleId) {
            return;
        }

        if (!groupedModules.has(record.moduleId)) {
            groupedModules.set(
                record.moduleId,
                {
                    id: record.moduleId,
                    name: record.moduleName,
                    records: [],
                },
            );
        }

        groupedModules
            .get(record.moduleId)
            .records.push(record);
    });

    return Array.from(
        groupedModules.values(),
    )
        .map((module) => ({
            id: module.id,
            name: module.name,
            ...calculateSummary(
                module.records,
            ),
        }))
        .sort(
            (firstModule, secondModule) =>
                firstModule.name.localeCompare(
                    secondModule.name,
                    "pt-BR",
                ),
        );
}


function normalizeStudent(
    profile,
    reportStudent,
) {
    const id = toSafeNumber(
        reportStudent?.id ?? profile?.id,
    );

    if (!id) {
        throw new Error(
            "O servidor não retornou um aluno válido.",
        );
    }

    const name = String(
        reportStudent?.nome ??
        profile?.name ??
        "Aluno",
    ).trim();

    return Object.freeze({
        id,
        name,
        initial:
            name.charAt(0)
                .toLocaleUpperCase("pt-BR") ||
            "A",

        schoolYear:
            reportStudent?.ano_escolar ??
            profile?.schoolYear ??
            "Não informado",

        learningMode:
            reportStudent?.modo_aprendizagem ??
            profile?.supportLevel ??
            "Não informado",

        xp: Math.max(
            0,
            toSafeNumber(
                reportStudent?.xp_total ??
                profile?.xpTotal,
            ),
        ),
    });
}


export const desempenhoService = Object.freeze({
    periods: PERIODS,

    async load(period = PERIODS.overview) {
        const normalizedPeriod =
            normalizePeriod(period);

        const profile =
            await alunosApi.getCurrent();

        const report =
            await desempenhoApi.getStudentReport(
                profile.id,
            );

        const completeHistory = Array.isArray(
            report?.historico,
        )
            ? report.historico.map(
                normalizeHistoryRecord,
            )
            : [];

        const filteredHistory =
            filterHistoryByPeriod(
                completeHistory,
                normalizedPeriod,
            );

        return Object.freeze({
            period: normalizedPeriod,

            student: normalizeStudent(
                profile,
                report?.aluno,
            ),

            summary:
                calculateSummary(
                    filteredHistory,
                ),

            dailyEvolution:
                calculateDailyEvolution(
                    filteredHistory,
                ),

            modules:
                calculateModulePerformance(
                    filteredHistory,
                ),

            recentHistory: [
                ...filteredHistory,
            ]
                .sort(
                    (firstRecord, secondRecord) =>
                        (
                            secondRecord.dateTime?.getTime() ??
                            0
                        ) -
                        (
                            firstRecord.dateTime?.getTime() ??
                            0
                        ),
                )
                .slice(0, 8),
        });
    },
});