import { alunoService } from "../../services/aluno-service.js";
import { formatCpf } from "../../utils/formatters.js";
import { showToast } from "../../components/toast.js";

const get = (selector) => document.querySelector(selector);
const showStep = (step) => {
    document.querySelectorAll(".student-register-step").forEach((element) => {
        element.hidden = true;
    });
    get(`#step${step}`).hidden = false;
};

get("#cpfAluno")?.addEventListener("input", (event) => {
    event.target.value = formatCpf(event.target.value);
});

function goToTriage() {
    if (!get("#nomeAluno").value.trim()) {
        showToast("Preencha o nome do aluno.", "error");
        return;
    }
    showStep(2);
}

function calculateLevel() {
    const communication = get('input[name="pergunta1"]:checked');
    const reading = get('input[name="pergunta2"]:checked');
    if (!communication || !reading) {
        showToast("Responda às duas perguntas da triagem.", "error");
        return;
    }
    let level = 2;
    if (communication.value === "A1" || reading.value === "B1") level = 1;
    if (communication.value === "A3" && reading.value === "B3") level = 3;
    get("#nivelFinal").value = String(level);
    get("#confNome").textContent = get("#nomeAluno").value.trim();
    get("#confPin").textContent = "Gerado ao salvar";
    showStep(3);
}

async function saveStudent() {
    const button = document.querySelector('[data-action="save-student"]');
    button.disabled = true;
    try {
        const result = await alunoService.create({
            name: get("#nomeAluno").value.trim(),
            cpf: get("#cpfAluno").value,
            email: get("#emailAluno").value.trim(),
            schoolYear: get("#anoEscolar").value,
            supportLevel: Number(get("#nivelFinal").value),
        });
        get("#confPin").textContent = result.pin;
        showToast(`Aluno cadastrado. PIN: ${result.pin}`, "success");
        window.setTimeout(() => {
            if (window.roarNavigate) {
                window.roarNavigate("alunos.html");
            } else {
                window.location.href = "alunos.html";
            }
        }, 900);
    } catch (error) {
        showToast(error.message, "error");
        button.disabled = false;
    }
}

get("#cadastroForm")?.addEventListener("submit", (event) => event.preventDefault());
get('[data-action="next-triage"]')?.addEventListener("click", goToTriage);
get('[data-action="back-data"]')?.addEventListener("click", () => showStep(1));
get('[data-action="calculate-level"]')?.addEventListener("click", calculateLevel);
get('[data-action="back-triage"]')?.addEventListener("click", () => showStep(2));
get('[data-action="save-student"]')?.addEventListener("click", saveStudent);
