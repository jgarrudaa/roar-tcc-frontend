import { authService } from "../../services/auth-service.js";
import { formatCpf } from "../../utils/formatters.js";
import { showToast } from "../../components/toast.js";

const form = document.querySelector("#teacher-register-form");
const cpfInput = document.querySelector("#cpfInput");

cpfInput?.addEventListener("input", () => { cpfInput.value = formatCpf(cpfInput.value); });

form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
        await authService.registerTeacher({
            name: document.querySelector("#nomeInput").value.trim(),
            cpf: cpfInput.value,
            email: document.querySelector("#emailInput").value.trim(),
            password: document.querySelector("#senha").value,
        });
        showToast("Cadastro realizado com sucesso.", "success");
        window.setTimeout(() => {
            if (window.roarNavigate) {
                window.roarNavigate("login-professor.html");
            } else {
                window.location.href = "login-professor.html";
            }
        }, 500);
    } catch (error) {
        showToast(error.message, "error");
    } finally {
        submit.disabled = false;
    }
});
