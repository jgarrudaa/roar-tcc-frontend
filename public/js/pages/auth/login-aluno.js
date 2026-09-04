import { APP_CONFIG } from "../../config/app-config.js";
import { authService } from "../../services/auth-service.js";
import { showToast } from "../../components/toast.js";

const form = document.querySelector("#student-login-form");

form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
        await authService.loginStudent({
            email: document.querySelector("#emailInput").value,
            pin: document.querySelector("#senha").value,
        });
        if (window.roarNavigate) {
            window.roarNavigate(APP_CONFIG.routes.studentHome);
        } else {
            window.location.href = APP_CONFIG.routes.studentHome;
        }
    } catch (error) {
        showToast(error.message, "error");
    } finally {
        submit.disabled = false;
    }
});
