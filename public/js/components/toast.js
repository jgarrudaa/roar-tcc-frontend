function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getToastIcon(type) {
    switch (type) {
        case "success":
            return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
        case "error":
            return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
        case "warning":
            return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
        case "info":
        default:
            return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }
}

export function dismissToast(toast) {
    if (!toast || toast.classList.contains("toast--leaving")) return;
    if (toast._dismissTimeout) clearTimeout(toast._dismissTimeout);
    toast.classList.add("toast--leaving");
    setTimeout(() => {
        toast.remove();
        const container = document.querySelector("#toast-container");
        if (container && container.children.length === 0) {
            container.remove();
        }
    }, 280);
}

export function showToast(message, type = "info", duration = 4000) {
    if (!message) return;

    let container = document.querySelector("#toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.className = "toast-container";
        document.body.append(container);
    }

    // Evita duplicar mensagens idênticas em cliques repetidos
    const existingToasts = Array.from(container.querySelectorAll(".toast"));
    const duplicate = existingToasts.find(
        (el) => el.dataset.message === message && !el.classList.contains("toast--leaving")
    );

    if (duplicate) {
        // Reinicia o timer de expiração e adiciona leve destaque/pulso
        if (duplicate._dismissTimeout) {
            clearTimeout(duplicate._dismissTimeout);
        }
        duplicate.classList.remove("toast--pulse");
        void duplicate.offsetWidth;
        duplicate.classList.add("toast--pulse");
        duplicate._dismissTimeout = setTimeout(() => dismissToast(duplicate), duration);
        return;
    }

    // Limita a exibição a no máximo 3 notificações simultâneas para manter a interface limpa
    const activeToasts = existingToasts.filter((el) => !el.classList.contains("toast--leaving"));
    if (activeToasts.length >= 3) {
        dismissToast(activeToasts[0]);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.setAttribute("role", type === "error" ? "alert" : "status");
    toast.dataset.message = message;

    const iconSvg = getToastIcon(type);

    toast.innerHTML = `
        <div class="toast__icon" aria-hidden="true">${iconSvg}</div>
        <div class="toast__message">${escapeHtml(message)}</div>
        <button class="toast__close" type="button" aria-label="Fechar notificação">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;

    toast.querySelector(".toast__close")?.addEventListener("click", () => {
        dismissToast(toast);
    });

    container.append(toast);
    toast._dismissTimeout = setTimeout(() => dismissToast(toast), duration);
}
