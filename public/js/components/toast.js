export function showToast(message, type = "info") {
    let container = document.querySelector("#toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.className = "toast-container";
        document.body.append(container);
    }
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.setAttribute("role", type === "error" ? "alert" : "status");
    toast.textContent = message;
    container.append(toast);
    window.setTimeout(() => toast.remove(), 3500);
}
