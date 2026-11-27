import { sessionService } from "../../services/session-service.js";

const tour = document.querySelector("#studentTour");
const title = document.querySelector("#studentTourTitle");
const text = document.querySelector("#studentTourText");
const stepLabel = document.querySelector("#studentTourStep");
const previousButton = document.querySelector("#studentTourPrevious");
const nextButton = document.querySelector("#studentTourNext");
const skipButton = document.querySelector("#studentTourSkip");

const steps = [
    {
        target: "menu",
        title: "Explore o menu",
        text: "Aqui você acessa suas atividades, missões, desempenho, conquistas e a Loja de Dinos.",
    },
    {
        target: "proximo-modulo",
        title: "Continue sua jornada",
        text: "Este cartão indica o próximo módulo. Toque em “Começar” para iniciar ou continuar.",
    },
    {
        target: "progresso",
        title: "Acompanhe seu progresso",
        text: "Veja seu XP, sua ofensiva de estudos e quantos módulos estão disponíveis.",
    },
    {
        target: "categorias",
        title: "Escolha uma categoria",
        text: "Explore os temas disponíveis e escolha uma atividade para aprender brincando.",
    },
    {
        target: "recentes",
        title: "Volte às atividades recentes",
        text: "Aqui ficam suas atividades feitas recentemente para você encontrá-las com facilidade.",
    },
    {
        target: "atalhos",
        title: "Use os atalhos",
        text: "Acesse rapidamente atividades, desempenho, conquistas, a loja e suas missões.",
    },
];

let currentStep = 0;
let activeTarget = null;

function getCompletionKey() {
    const session = sessionService.get();
    const studentId = session?.user?.id;

    if (!studentId || session?.role !== "student") {
        return null;
    }

    return `roar:student-tour:completed:${studentId}`;
}

function clearHighlight() {
    activeTarget?.classList.remove("tour-target-active");
    activeTarget = null;
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