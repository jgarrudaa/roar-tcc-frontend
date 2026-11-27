import { sessionService } from "../../services/session-service.js";

const tour = document.querySelector("#professorTour");
const title = document.querySelector("#tourTitle");
const text = document.querySelector("#tourText");
const stepLabel = document.querySelector("#tourStep");
const previousButton = document.querySelector("#tourPrevious");
const nextButton = document.querySelector("#tourNext");
const skipButton = document.querySelector("#tourSkip");

const steps = [
    {
        target: "menu",
        title: "Navegue pelo ROAR",
        text: "Use este menu para acessar o início, os alunos, as atividades, os relatórios e seu perfil.",
    },
    {
        target: "novo-aluno",
        title: "Cadastre seus alunos",
        text: "Use este botão para adicionar um aluno e configurar o acesso dele à plataforma.",
    },
    {
        target: "indicadores",
        title: "Acompanhe a turma",
        text: "Aqui você encontra um resumo dos alunos, das atividades e do desempenho da turma.",
    },
    {
        target: "lista-alunos",
        title: "Veja os alunos",
        text: "Esta área mostra os alunos e seus níveis de suporte. O botão “Ver todos” abre a lista completa.",
    },
    {
        target: "atencao",
        title: "Confira quem precisa de atenção",
        text: "Consulte os avisos sobre alunos que podem precisar de acompanhamento.",
    },
    {
        target: "relatorios",
        title: "Gere relatórios",
        text: "Selecione um aluno e gere um resumo do desempenho registrado na plataforma.",
    },
];

let currentStep = 0;
let activeTarget = null;

function getCompletionKey() {
    const session = sessionService.get();
    const teacherId = session?.user?.id;

    if (!teacherId || session?.role !== "teacher") {
        return null;
    }

    return `roar:teacher-tour:completed:${teacherId}`;
}

function clearHighlight() {
    activeTarget?.classList.remove("tour-target-active");
    activeTarget = null;
}

function showStep(index) {
    currentStep = index;

    const step = steps[currentStep];
    const target = document.querySelector(
        `[data-tour="${step.target}"]`,
    );

    clearHighlight();

    if (!target) {
        finishTour();
        return;
    }

    activeTarget = target;
    activeTarget.classList.add("tour-target-active");
    activeTarget.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
    });

    stepLabel.textContent = `Etapa ${currentStep + 1} de ${steps.length}`;
    title.textContent = step.title;
    text.textContent = step.text;

    previousButton.disabled = currentStep === 0;
    nextButton.textContent =
        currentStep === steps.length - 1
            ? "Concluir"
            : "Próximo";

    tour.hidden = false;
}

function finishTour() {
    const completionKey = getCompletionKey();

    if (completionKey) {
        localStorage.setItem(completionKey, "true");
    }

    clearHighlight();

    if (tour) {
        tour.hidden = true;
    }
}

function initializeTour() {
    const completionKey = getCompletionKey();

    if (
        !tour ||
        !completionKey ||
        localStorage.getItem(completionKey) === "true"
    ) {
        return;
    }

    nextButton.addEventListener("click", () => {
        if (currentStep === steps.length - 1) {
            finishTour();
            return;
        }

        showStep(currentStep + 1);
    });

    previousButton.addEventListener("click", () => {
        if (currentStep > 0) {
            showStep(currentStep - 1);
        }
    });

    skipButton.addEventListener("click", finishTour);

    showStep(0);
}

initializeTour();