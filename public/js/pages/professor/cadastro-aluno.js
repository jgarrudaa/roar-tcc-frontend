import { showToast } from "../../components/toast.js";
import { alunoService } from "../../services/aluno-service.js";
import { sessionService } from "../../services/session-service.js";
import { formatCpf } from "../../utils/formatters.js";

const STUDENTS_PAGE = "alunos.html";

const SELECTORS = Object.freeze({
    form: "#cadastroForm",

    steps: ".student-register-step",
    step1: "#step1",
    step2: "#step2",
    step3: "#step3",

    name: "#nomeAluno",
    schoolYear: "#anoEscolar",
    email: "#emailAluno",
    cpf: "#cpfAluno",

    communication:
        'input[name="pergunta1"]:checked',

    reading:
        'input[name="pergunta2"]:checked',

    finalLevel: "#nivelFinal",
    confirmationName: "#confNome",
    confirmationPin: "#confPin",

    nextTriage:
        '[data-action="next-triage"]',

    backData:
        '[data-action="back-data"]',

    calculateLevel:
        '[data-action="calculate-level"]',

    backTriage:
        '[data-action="back-triage"]',

    save:
        '[data-action="save-student"]',
});

const state = {
    calculatedLevel: null,
    isSaving: false,
};

function getElements() {
    return {
        form: document.querySelector(SELECTORS.form),

        steps: document.querySelectorAll(
            SELECTORS.steps,
        ),

        step1: document.querySelector(
            SELECTORS.step1,
        ),

        step2: document.querySelector(
            SELECTORS.step2,
        ),

        step3: document.querySelector(
            SELECTORS.step3,
        ),

        nameInput: document.querySelector(
            SELECTORS.name,
        ),

        schoolYearInput: document.querySelector(
            SELECTORS.schoolYear,
        ),

        emailInput: document.querySelector(
            SELECTORS.email,
        ),

        cpfInput: document.querySelector(
            SELECTORS.cpf,
        ),

        finalLevelInput: document.querySelector(
            SELECTORS.finalLevel,
        ),

        confirmationName: document.querySelector(
            SELECTORS.confirmationName,
        ),

        confirmationPin: document.querySelector(
            SELECTORS.confirmationPin,
        ),

        nextTriageButton: document.querySelector(
            SELECTORS.nextTriage,
        ),

        backDataButton: document.querySelector(
            SELECTORS.backData,
        ),

        calculateLevelButton:
            document.querySelector(
                SELECTORS.calculateLevel,
            ),

        backTriageButton: document.querySelector(
            SELECTORS.backTriage,
        ),

        saveButton: document.querySelector(
            SELECTORS.save,
        ),
    };
}

function showStep(elements, stepNumber) {
    elements.steps.forEach((step) => {
        step.hidden = true;
    });

    const selectedStep = elements[
        `step${stepNumber}`
    ];

    if (!selectedStep) {
        return;
    }

    selectedStep.hidden = false;

    selectedStep
        .querySelector(
            "input:not([readonly]), select, button",
        )
        ?.focus();
}

function getSelectedValue(selector) {
    return document.querySelector(selector)?.value;
}

function validateInitialData(elements) {
    const inputs = [
        elements.nameInput,
        elements.schoolYearInput,
        elements.emailInput,
        elements.cpfInput,
    ];

    for (const input of inputs) {
        if (!input?.reportValidity()) {
            input?.focus();
            return false;
        }
    }

    return true;
}

function goToTriage(elements) {
    if (!validateInitialData(elements)) {
        showToast(
            "Preencha corretamente os dados do aluno.",
            "error",
        );

        return;
    }

    showStep(elements, 2);
}

function calculateTriageLevel(elements) {
    const communication = getSelectedValue(
        SELECTORS.communication,
    );

    const reading = getSelectedValue(
        SELECTORS.reading,
    );

    if (!communication || !reading) {
        showToast(
            "Responda às duas perguntas da triagem.",
            "error",
        );

        return;
    }

    try {
        state.calculatedLevel =
            alunoService.calculateLevel(
                communication,
                reading,
            );

        elements.finalLevelInput.value =
            String(state.calculatedLevel);

        elements.confirmationName.textContent =
            elements.nameInput.value.trim();

        elements.confirmationPin.textContent =
            "Será gerado ao salvar";

        showStep(elements, 3);
    } catch (error) {
        showToast(error.message, "error");
    }
}

function getStudentData(elements) {
    const session = sessionService.get();

    return {
        teacherId: session?.user?.id,
        name: elements.nameInput.value,
        schoolYear: elements.schoolYearInput.value,
        email: elements.emailInput.value,
        cpf: elements.cpfInput.value,

        communication: getSelectedValue(
            SELECTORS.communication,
        ),

        reading: getSelectedValue(
            SELECTORS.reading,
        ),

        /*
         * O formulário atual ainda não possui uma pergunta
         * específica sobre suporte de áudio.
         */
        audioSupport: false,
    };
}

function setSaving(elements, isSaving) {
    state.isSaving = isSaving;
    elements.saveButton.disabled = isSaving;

    elements.saveButton.textContent = isSaving
        ? "Salvando..."
        : "Salvar cadastro";
}

function navigateToStudents() {
    if (typeof window.roarNavigate === "function") {
        window.roarNavigate(STUDENTS_PAGE);
        return;
    }

    window.location.assign(STUDENTS_PAGE);
}

async function saveStudent(elements) {
    if (state.isSaving) {
        return;
    }

    setSaving(elements, true);

    try {
        const student = await alunoService.create(
            getStudentData(elements),
        );

        elements.confirmationPin.textContent =
            student.pin;

        showToast(
            `Aluno cadastrado. PIN: ${student.pin}`,
            "success",
            6000,
        );

        /*
         * O tempo maior permite que o professor anote o PIN
         * antes do redirecionamento.
         */
        window.setTimeout(
            navigateToStudents,
            4000,
        );
    } catch (error) {
        showToast(
            error?.message ??
            "Não foi possível cadastrar o aluno.",
            "error",
        );

        setSaving(elements, false);
    }
}

function registerEvents(elements) {
    elements.form?.addEventListener(
        "submit",
        (event) => event.preventDefault(),
    );

    elements.cpfInput?.addEventListener(
        "input",
        (event) => {
            event.currentTarget.value = formatCpf(
                event.currentTarget.value,
            );
        },
    );

    elements.nextTriageButton?.addEventListener(
        "click",
        () => goToTriage(elements),
    );

    elements.backDataButton?.addEventListener(
        "click",
        () => showStep(elements, 1),
    );

    elements.calculateLevelButton?.addEventListener(
        "click",
        () => calculateTriageLevel(elements),
    );

    elements.backTriageButton?.addEventListener(
        "click",
        () => showStep(elements, 2),
    );

    elements.saveButton?.addEventListener(
        "click",
        () => saveStudent(elements),
    );
}

function initializeStudentRegistration() {
    const elements = getElements();

    if (!elements.form) {
        console.error(
            "Formulário de cadastro do aluno não encontrado.",
        );

        return;
    }

    registerEvents(elements);
    showStep(elements, 1);
}

initializeStudentRegistration();