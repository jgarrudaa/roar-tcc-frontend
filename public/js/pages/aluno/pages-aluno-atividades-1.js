import { showToast } from "../../components/toast.js";
import { moduloService } from "../../services/modulo-service.js";

const ICONS = Object.freeze({
    "corpo-humano": "fi fi-br-portrait",
    cores: "fi fi-br-palette",
    "animais-fazenda": "fi fi-br-paw",
    emocoes: "fi fi-br-grin-alt",
    comida: "fi fi-br-apple-whole",
    familia: "fi fi-br-users",
    casa: "fi fi-br-home",
    escola: "fi fi-br-book-open-cover",
});

function progressText(module) {
    if (module.progress === 100) return "Módulo concluído";
    if (module.progress > 0) return `${module.progress}% concluído`;
    return module.status === "active" ? "Começar módulo" : "Em preparação";
}

function createModuleCard(module, index) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `module-card module-card--${index % 2 === 0 ? "blue" : "green"}`;
    card.disabled = module.status !== "active";
    card.setAttribute("aria-label", `${module.title}. ${progressText(module)}`);

    const icon = document.createElement("span");
    icon.className = "module-card__icon";
    icon.innerHTML = `<i class="${ICONS[module.id] ?? "fi fi-br-book-open-cover"}" aria-hidden="true"></i>`;

    const title = document.createElement("strong");
    title.textContent = module.title;

    const progress = document.createElement("span");
    progress.className = "module-card__progress";
    progress.textContent = progressText(module);

    const bar = document.createElement("span");
    bar.className = "module-card__bar";
    bar.setAttribute("aria-hidden", "true");
    const fill = document.createElement("span");
    fill.style.width = `${module.progress}%`;
    bar.append(fill);

    card.append(icon, title, progress, bar);
    card.addEventListener("click", () => {
        const url = `atividade.html?modulo=${encodeURIComponent(module.id)}&etapa=${module.nextStage}`;
        if (window.roarNavigate) {
            window.roarNavigate(url);
        } else {
            window.location.href = url;
        }
    });
    return card;
}

async function renderModules() {
    const container = document.querySelector("#modulosContent");
    try {
        const modules = await moduloService.listJourney();
        container.replaceChildren(...modules.map(createModuleCard));
    } catch (error) {
        container.textContent = "Não foi possível carregar os módulos.";
        showToast(error.message, "error");
    }
}

const sidebar = document.querySelector("#sidebar");
const backdrop = document.querySelector("#sidebarBackdrop");
document.querySelector("#sidebarToggle")?.addEventListener("click", () => sidebar.classList.toggle("sidebar--collapsed"));
document.querySelector("#mobileMenuBtn")?.addEventListener("click", () => {
    sidebar.classList.add("open");
    backdrop.classList.add("open");
});
backdrop?.addEventListener("click", () => {
    sidebar.classList.remove("open");
    backdrop.classList.remove("open");
});

renderModules();
