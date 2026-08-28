import { APP_CONFIG } from "../../config/app-config.js";
import { authService } from "../../services/auth-service.js";
import { showToast } from "../../components/toast.js";

const form = document.querySelector("#teacher-login-form");

form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
        await authService.loginTeacher({
            email: document.querySelector("#emailInput").value,
            password: document.querySelector("#senha").value,
        });
        window.location.href = APP_CONFIG.routes.teacherHome;
    } catch (error) {
        showToast(error.message, "error");
    } finally {
        submit.disabled = false;
    }
});
