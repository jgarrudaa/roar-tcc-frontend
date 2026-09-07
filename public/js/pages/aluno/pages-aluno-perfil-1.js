import { showToast } from "../../components/toast.js";
import { perfilAlunoService } from "../../services/perfil-aluno-service.js";
import { sessionService } from "../../services/session-service.js";


const elements = {
    navbarAvatar:
        document.getElementById("navbarAvatar"),

    profileAvatar:
        document.getElementById("profileAvatar"),

    studentName:
        document.getElementById("studentName"),

    studentSchoolYear:
        document.getElementById("studentSchoolYear"),

    studentEmail:
        document.getElementById("studentEmail"),

    studentLearningMode:
        document.getElementById("studentLearningMode"),

    studentXp:
        document.getElementById("studentXp"),

    studentId:
        document.getElementById("studentId"),

    studentEmailDetail:
        document.getElementById("studentEmailDetail"),

    studentSchoolYearDetail:
        document.getElementById(
            "studentSchoolYearDetail",
        ),

    studentLevel:
        document.getElementById("studentLevel"),

    studentLearningModeDetail:
        document.getElementById(
            "studentLearningModeDetail",
        ),

    studentXpDetail:
        document.getElementById("studentXpDetail"),

    profileStatus:
        document.getElementById("profileStatus"),
};


function validateElements() {
    const missingElements =
        Object.entries(elements)
            .filter(([, element]) => !element)
            .map(([name]) => name);

    if (missingElements.length) {
        throw new Error(
            `Elementos ausentes no perfil: ${missingElements.join(", ")}.`,
        );
    }
}


function formatNumber(value) {
    return Number(value ?? 0)
        .toLocaleString("pt-BR");
}


function setLoading() {
    elements.studentName.textContent =
        "Carregando perfil...";

    elements.studentSchoolYear.textContent =
        "Ano escolar: —";

    elements.studentEmail.textContent =
        "E-mail: —";

    elements.studentLearningMode.textContent =
        "Carregando...";

    elements.profileStatus.textContent =
        "Carregando suas informações...";
}


function renderProfile(profile) {
    elements.navbarAvatar.textContent =
        profile.initials;

    elements.navbarAvatar.title =
        profile.name;

    elements.profileAvatar.textContent =
        profile.initials;

    elements.studentName.textContent =
        profile.name;

    elements.studentSchoolYear.textContent =
        `Ano escolar: ${profile.schoolYear}`;

    elements.studentEmail.textContent =
        `E-mail: ${profile.email}`;

    elements.studentLearningMode.textContent =
        profile.learningMode.label;

    elements.studentXp.textContent =
        formatNumber(profile.xp);

    elements.studentId.textContent =
        String(profile.id);

    elements.studentEmailDetail.textContent =
        profile.email;

    elements.studentSchoolYearDetail.textContent =
        profile.schoolYear;

    elements.studentLevel.textContent =
        `Nível ${profile.learningMode.number}`;

    elements.studentLearningModeDetail.textContent =
        profile.learningMode.name;

    elements.studentXpDetail.textContent =
        `${formatNumber(profile.xp)} XP`;

    elements.profileStatus.textContent =
        "Suas informações estão atualizadas.";
}


function updateSession(profile) {
    const currentSession =
        sessionService.get();

    if (!currentSession) {
        return;
    }

    const currentUser =
        currentSession.user ?? {};

    sessionService.start({
        ...currentSession,

        user: {
            ...currentUser,

            id:
                currentUser.id ??
                profile.id,

            name: profile.name,
            nome: profile.name,
            email: profile.email,

            schoolYear:
                profile.schoolYear,

            supportLevel:
                profile.learningMode.label,

            xpTotal:
                profile.xp,
        },
    });
}


function renderError(error) {
    console.error(
        "Erro ao carregar perfil do aluno:",
        error,
    );

    elements.studentName.textContent =
        "Perfil indisponível";

    elements.studentLearningMode.textContent =
        "Não foi possível carregar";

    elements.profileStatus.textContent =
        error?.message ??
        "Não foi possível carregar suas informações.";

    showToast(
        error?.message ??
        "Não foi possível carregar o perfil.",
        "error",
    );
}


async function loadProfile() {
    setLoading();

    try {
        const profile =
            await perfilAlunoService
                .getCurrentStudent();

        renderProfile(profile);
        updateSession(profile);
    } catch (error) {
        renderError(error);
    }
}


async function initialize() {
    try {
        validateElements();
        await loadProfile();
    } catch (error) {
        console.error(
            "Erro ao inicializar perfil:",
            error,
        );

        showToast(
            error?.message ??
            "Não foi possível inicializar o perfil.",
            "error",
        );
    }
}


initialize();