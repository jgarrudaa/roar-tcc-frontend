import { showToast } from "../../components/toast.js";

const forgotButton = document.querySelector("#forgot-student-password");
let isRequesting = false;

forgotButton?.addEventListener("click", (event) => {
    event.preventDefault();

    if (isRequesting) {
        showToast("Uma solicitação de redefinição de senha já foi enviada ao professor responsável.", "info");
        return;
    }

    isRequesting = true;
    showToast("Uma nova redefinição de senha foi enviada ao professor responsável.", "success");

    setTimeout(() => {
        isRequesting = false;
    }, 4000);
});

