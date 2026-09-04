import { showToast } from "../../components/toast.js";

document.querySelector("#forgot-student-password")?.addEventListener("click", (event) => {
    event.preventDefault();
    showToast("Uma nova redefinição de senha foi enviada ao professor responsável.", "success");
});
