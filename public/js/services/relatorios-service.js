import { relatoriosApi } from "../api/relatorios-api.js";

const LEARNING_MODES = Object.freeze({
    "Nível 1 - Suporte Visual Puro": Object.freeze({
        number: 1,
        name: "Suporte Visual Puro",
        label: "Nível 1 — Suporte Visual Puro",
        className: "nivel-1",
    }),

    "Nível 2 - Aprendiz Guiado": Object.freeze({
        number: 2,
        name: "Aprendiz Guiado",
        label: "Nível 2 — Aprendiz Guiado",
        className: "nivel-2",
    }),

    "Nível 3 - Autonomia Contextual": Object.freeze({
        number: 3,
        name: "Autonomia Contextual",
        label: "Nível 3 — Autonomia Contextual",
        className: "nivel-3",
    }),
});

const DEFAULT_LEARNING_MODE = Object.freeze({
    number: 0,
    name: "Não informado",
    label: "Modo não informado",
    className: "nivel-1",
});

function toSafeNumber(value, fallback = 0) {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue)
        ? parsedValue
        : fallback;
}

function requirePositiveInteger(value, fieldName) {
    const parsedValue = Number(value);

    if (
        !Number.isInteger(parsedValue) ||
        parsedValue <= 0
    ) {
        throw new TypeError(
            `${fieldName} deve ser um número inteiro positivo.`,
        );
    }

    return parsedValue;
}

function normalizeText(value, fallback = "") {
    const normalizedValue = String(
        value ?? "",
    ).trim();

    return normalizedValue || fallback;
}

function normalizeDate(value) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? null
        : date;
}

function getLearningMode(value) {
    const normalizedValue = normalizeText(value);

    return (
        LEARNING_MODES[normalizedValue] ??
        DEFAULT_LEARNING_MODE
    );
}

function calculatePercentage(part, total) {
    if (!total) {
        return 0;
    }

    return Math.round(
        (part / total) * 100,
    );
}

function normalizeTeacherStudent(student) {
    const id = requirePositiveInteger(
        student?.aluno_id,
        "student.aluno_id",
    );

    const name = normalizeText(
        student?.nome,
        "Aluno sem nome",
    );

    const attempted = Math.max(
        0,
        toSafeNumber(
            student?.atividades_tentadas,
        ),
    );

    const completed = Math.max(
        0,
        toSafeNumber(
            student?.atividades_concluidas,
        ),
    );

    const learningMode = getLearningMode(
        student?.modo_aprendizagem,
    );

    return Object.freeze({
        id,
        name,

        initial:
            name
                .charAt(0)
                .toLocaleUpperCase("pt-BR") ||
            "A",

        schoolYear: normalizeText(
            student?.ano_escolar,
            "Não informado",
        ),

        learningMode,
        level: learningMode,

        xp: Math.max(
            0,
            toSafeNumber(
                student?.xp_total,
            ),
        ),

        totalAttempts: Math.max(
            0,
            toSafeNumber(
                student?.tentativas_totais,
            ),
        ),

        attempted,
        completed,

        completionRate: Math.max(
            0,
            Math.min(
                100,
                toSafeNumber(
                    student?.taxa_conclusao_pct,
                    calculatePercentage(
                        completed,
                        attempted,
                    ),
                ),
            ),
        ),

        totalErrors: Math.max(
            0,
            toSafeNumber(
                student?.total_erros,
            ),
        ),

        averageErrors: Math.max(
            0,
            toSafeNumber(
                student?.media_erros,
            ),
        ),

        totalTimeSeconds: Math.max(
            0,
            toSafeNumber(
                student?.tempo_total_segundos,
            ),
        ),

        averageTimeSeconds: Math.max(
            0,
            toSafeNumber(
                student?.media_tempo_segundos,
            ),
        ),

        lastAccess: normalizeDate(
            student?.ultimo_acesso,
        ),
    });
}

function normalizeTeacherDashboard(
    payload,
    statistics = {},
) {
    if (
        !payload ||
        typeof payload !== "object" ||
        Array.isArray(payload)
    ) {
        throw new Error(
            "A API retornou um dashboard de professor inválido.",
        );
    }

    const teacherId = requirePositiveInteger(
        payload.professor_id,
        "professor_id",
    );

    const students = Array.isArray(payload.alunos)
        ? payload.alunos.map(
            normalizeTeacherStudent,
        )
        : [];

    const studentsById = new Map(
        students.map((student) => [
            student.id,
            student,
        ]),
    );

    const ranking = Array.isArray(
        payload.ranking_xp,
    )
        ? payload.ranking_xp
            .map((student) =>
                studentsById.get(
                    Number(student.aluno_id),
                ),
            )
            .filter(Boolean)
        : [...students].sort(
            (
                firstStudent,
                secondStudent,
            ) =>
                secondStudent.xp -
                firstStudent.xp,
        );

    const attentionStudents = Array.isArray(
        payload.alunos_com_possivel_dificuldade,
    )
        ? payload
            .alunos_com_possivel_dificuldade
            .map((student) =>
                studentsById.get(
                    Number(student.aluno_id),
                ),
            )
            .filter(Boolean)
        : [];

    const totalStudents = Math.max(
        0,
        toSafeNumber(
            payload.total_alunos,
            students.length,
        ),
    );

    const totalAttempts = students.reduce(
        (total, student) =>
            total +
            (
                student.totalAttempts ||
                student.attempted
            ),
        0,
    );

    const totalCompleted = students.reduce(
        (total, student) =>
            total + student.completed,
        0,
    );

    const totalActivities = Math.max(
        0,
        toSafeNumber(
            statistics?.total_atividades,
        ),
    );

    const classAverage = Math.max(
        0,
        Math.min(
            100,
            toSafeNumber(
                statistics?.media_turma,
            ),
        ),
    );

    const averageErrors = students.length
        ? Number(
            (
                students.reduce(
                    (total, student) =>
                        total +
                        student.averageErrors,
                    0,
                ) / students.length
            ).toFixed(2),
        )
        : 0;

    const averageTimeSeconds =
        students.length
            ? Number(
                (
                    students.reduce(
                        (total, student) =>
                            total +
                            student.averageTimeSeconds,
                        0,
                    ) / students.length
                ).toFixed(2),
            )
            : 0;

    return Object.freeze({
        teacherId,

        totalStudents,
        totalActivities,
        classAverage,
        totalCompletions: totalCompleted,

        summary: Object.freeze({
            totalStudents,
            totalActivities,
            totalAttempts,
            totalCompleted,
            classAverage,
            averageErrors,
            averageTimeSeconds,
        }),

        learningModeDistribution:
            payload
                .distribuicao_modo_aprendizagem ??
            {},

        students,
        ranking,
        attentionStudents,
    });
}

function normalizeHistoryRecord(record) {
    const activityId = toSafeNumber(
        record?.atividade_id,
    );

    const dateTime = normalizeDate(
        record?.data_hora,
    );

    return Object.freeze({
        id: toSafeNumber(record?.id),

        activityId,

        activityName: normalizeText(
            record?.atividade?.palavra_chave,
            activityId
                ? `Atividade ${activityId}`
                : "Atividade",
        ),

        activityOrder: toSafeNumber(
            record?.atividade
                ?.ordem_sequencia,
        ),

        moduleId: toSafeNumber(
            record?.modulo?.id,
        ),

        moduleName: normalizeText(
            record?.modulo?.nome,
            "Módulo não informado",
        ),

        learningMode: normalizeText(
            record?.modo_utilizado,
            "Não informado",
        ),

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

function normalizeDailyEvolution(day) {
    return Object.freeze({
        date: normalizeText(
            day?.data,
        ),

        attempts: Math.max(
            0,
            toSafeNumber(
                day?.tentativas,
            ),
        ),

        completions: Math.max(
            0,
            toSafeNumber(
                day?.conclusoes ??
                day?.concluidas,
            ),
        ),

        attemptedActivities: Math.max(
            0,
            toSafeNumber(
                day?.atividades_tentadas,
            ),
        ),

        completedActivities: Math.max(
            0,
            toSafeNumber(
                day?.atividades_concluidas,
            ),
        ),

        averageErrors: Math.max(
            0,
            toSafeNumber(
                day?.media_erros,
            ),
        ),

        averageTimeSeconds: Math.max(
            0,
            toSafeNumber(
                day?.media_tempo_segundos,
            ),
        ),
    });
}

function normalizeModulePerformance(module) {
    const attempted = Math.max(
        0,
        toSafeNumber(
            module?.atividades_tentadas,
        ),
    );

    const completed = Math.max(
        0,
        toSafeNumber(
            module?.atividades_concluidas,
        ),
    );

    return Object.freeze({
        id: requirePositiveInteger(
            module?.modulo_id,
            "module.modulo_id",
        ),

        name: normalizeText(
            module?.nome,
            "Módulo sem nome",
        ),

        totalAttempts: Math.max(
            0,
            toSafeNumber(
                module?.tentativas_totais,
            ),
        ),

        attempted,
        completed,

        completionRate: Math.max(
            0,
            Math.min(
                100,
                toSafeNumber(
                    module?.taxa_conclusao_pct,
                    calculatePercentage(
                        completed,
                        attempted,
                    ),
                ),
            ),
        ),

        totalErrors: Math.max(
            0,
            toSafeNumber(
                module?.total_erros,
            ),
        ),

        averageErrors: Math.max(
            0,
            toSafeNumber(
                module?.media_erros,
            ),
        ),

        totalTimeSeconds: Math.max(
            0,
            toSafeNumber(
                module
                    ?.tempo_total_segundos,
            ),
        ),

        averageTimeSeconds: Math.max(
            0,
            toSafeNumber(
                module
                    ?.media_tempo_segundos,
            ),
        ),
    });
}

function normalizeStudentReport(payload) {
    if (
        !payload ||
        typeof payload !== "object" ||
        Array.isArray(payload)
    ) {
        throw new Error(
            "A API retornou um relatório de aluno inválido.",
        );
    }

    const studentPayload = payload.aluno;
    const summaryPayload =
        payload.resumo ?? {};

    if (!studentPayload?.id) {
        throw new Error(
            "O servidor não retornou os dados do aluno.",
        );
    }

    const id = requirePositiveInteger(
        studentPayload.id,
        "aluno.id",
    );

    const name = normalizeText(
        studentPayload.nome,
        "Aluno sem nome",
    );

    const attempted = Math.max(
        0,
        toSafeNumber(
            summaryPayload
                .atividades_tentadas,
        ),
    );

    const completed = Math.max(
        0,
        toSafeNumber(
            summaryPayload
                .atividades_concluidas,
        ),
    );

    const history = Array.isArray(
        payload.historico,
    )
        ? payload.historico.map(
            normalizeHistoryRecord,
        )
        : [];

    return Object.freeze({
        student: Object.freeze({
            id,
            name,

            initial:
                name
                    .charAt(0)
                    .toLocaleUpperCase(
                        "pt-BR",
                    ) ||
                "A",

            schoolYear: normalizeText(
                studentPayload
                    .ano_escolar,
                "Não informado",
            ),

            learningMode:
                getLearningMode(
                    studentPayload
                        .modo_aprendizagem,
                ),

            level: getLearningMode(
                studentPayload
                    .modo_aprendizagem,
            ),

            xp: Math.max(
                0,
                toSafeNumber(
                    studentPayload
                        .xp_total,
                ),
            ),
        }),

        summary: Object.freeze({
            totalAttempts: Math.max(
                0,
                toSafeNumber(
                    summaryPayload
                        .tentativas_totais,
                ),
            ),

            attempted,
            completed,

            completionRate: Math.max(
                0,
                Math.min(
                    100,
                    toSafeNumber(
                        summaryPayload
                            .taxa_conclusao_pct,
                        calculatePercentage(
                            completed,
                            attempted,
                        ),
                    ),
                ),
            ),

            totalErrors: Math.max(
                0,
                toSafeNumber(
                    summaryPayload
                        .total_erros,
                ),
            ),

            averageErrors: Math.max(
                0,
                toSafeNumber(
                    summaryPayload
                        .media_erros,
                ),
            ),

            totalTimeSeconds: Math.max(
                0,
                toSafeNumber(
                    summaryPayload
                        .tempo_total_segundos,
                ),
            ),

            averageTimeSeconds: Math.max(
                0,
                toSafeNumber(
                    summaryPayload
                        .media_tempo_segundos,
                ),
            ),
        }),

        dailyEvolution: Array.isArray(
            payload.evolucao_diaria,
        )
            ? payload.evolucao_diaria.map(
                normalizeDailyEvolution,
            )
            : [],

        modules: Array.isArray(
            payload.desempenho_modulos,
        )
            ? payload.desempenho_modulos.map(
                normalizeModulePerformance,
            )
            : [],

        history,
    });
}

function normalizeModuleActivity(activity) {
    const totalAttempts = Math.max(
        0,
        toSafeNumber(
            activity?.tentativas_totais,
        ),
    );

    const completions = Math.max(
        0,
        toSafeNumber(
            activity?.conclusoes_registradas,
        ),
    );

    const totalErrors = Math.max(
        0,
        toSafeNumber(
            activity?.total_erros,
        ),
    );

    return Object.freeze({
        id: requirePositiveInteger(
            activity?.atividade_id,
            "activity.atividade_id",
        ),

        name: normalizeText(
            activity?.palavra_chave,
            "Atividade sem nome",
        ),

        order: Math.max(
            0,
            toSafeNumber(
                activity?.ordem,
            ),
        ),

        participants: Math.max(
            0,
            toSafeNumber(
                activity
                    ?.alunos_participantes,
            ),
        ),

        totalAttempts,

        completions,

        attemptedActivities: Math.max(
            0,
            toSafeNumber(
                activity
                    ?.atividades_tentadas,
            ),
        ),

        completedActivities: Math.max(
            0,
            toSafeNumber(
                activity
                    ?.atividades_concluidas,
            ),
        ),

        totalErrors,

        averageErrors: Math.max(
            0,
            toSafeNumber(
                activity?.media_erros,
            ),
        ),

        averageTimeSeconds: Math.max(
            0,
            toSafeNumber(
                activity
                    ?.media_tempo_segundos,
            ),
        ),

        accuracy: calculatePercentage(
            completions,
            completions + totalErrors,
        ),
    });
}

function normalizeModuleReport(payload) {
    if (
        !payload ||
        typeof payload !== "object" ||
        Array.isArray(payload)
    ) {
        throw new Error(
            "A API retornou um relatório de módulo inválido.",
        );
    }

    const activities = Array.isArray(
        payload.atividades,
    )
        ? payload.atividades
            .map(
                normalizeModuleActivity,
            )
            .sort(
                (
                    firstActivity,
                    secondActivity,
                ) =>
                    firstActivity.order -
                    secondActivity.order,
            )
        : [];

    const totalAttempts = activities.reduce(
        (total, activity) =>
            total + activity.totalAttempts,
        0,
    );

    const totalCompletions =
        activities.reduce(
            (total, activity) =>
                total +
                activity.completions,
            0,
        );

    const totalErrors = activities.reduce(
        (total, activity) =>
            total + activity.totalErrors,
        0,
    );

    return Object.freeze({
        moduleId: requirePositiveInteger(
            payload.modulo_id,
            "modulo_id",
        ),

        totalActivities: Math.max(
            0,
            toSafeNumber(
                payload.total_atividades,
                activities.length,
            ),
        ),

        participants: Math.max(
            0,
            toSafeNumber(
                payload
                    .alunos_participantes_modulo,
            ),
        ),

        completedStudents: Math.max(
            0,
            toSafeNumber(
                payload
                    .alunos_concluiram_modulo,
            ),
        ),

        totalAttempts,
        totalCompletions,
        totalErrors,

        accuracy: calculatePercentage(
            totalCompletions,
            totalCompletions +
                totalErrors,
        ),

        activities,
    });
}

async function getTeacherDashboard(
    teacherId,
) {
    const validTeacherId =
        requirePositiveInteger(
            teacherId,
            "teacherId",
        );

    const [payload, statistics] =
        await Promise.all([
            relatoriosApi
                .getTeacherReport(
                    validTeacherId,
                ),

            relatoriosApi
                .getTeacherStatistics(
                    validTeacherId,
                )
                .catch(() => ({})),
        ]);

    return normalizeTeacherDashboard(
        payload,
        statistics,
    );
}

async function getStudentReport(studentId) {
    const validStudentId =
        requirePositiveInteger(
            studentId,
            "studentId",
        );

    const payload =
        await relatoriosApi
            .getStudentReport(
                validStudentId,
            );

    return normalizeStudentReport(
        payload,
    );
}

async function getModuleReport(moduleId) {
    const validModuleId =
        requirePositiveInteger(
            moduleId,
            "moduleId",
        );

    const payload =
        await relatoriosApi
            .getModuleReport(
                validModuleId,
            );

    return normalizeModuleReport(
        payload,
    );
}

export const relatoriosService =
    Object.freeze({
        getTeacherDashboard,
        getStudentReport,
        getModuleReport,
    });