import { showToast } from "../../components/toast.js";

document.querySelector("#teacher-recovery-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    showToast("Se o e-mail estiver cadastrado, enviaremos as instruções para redefinir sua senha.", "success");
});
