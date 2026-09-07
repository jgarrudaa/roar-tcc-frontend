import { showToast } from "../../components/toast.js";
import { sessionService } from "../../services/session-service.js";
import { storage } from "../../utils/storage.js";

const DEFAULTS = Object.freeze({ theme: "light", fontSize: "medium", volume: 80, notifications: false, highContrast: false, soundsEnabled: true, animationsEnabled: true, reducedStimuli: false });
const elements = {
    themeLight: document.getElementById("themeLight"), themeDark: document.getElementById("themeDark"),
    fontButtons: [...document.querySelectorAll(".fs-btn")], name: document.getElementById("cfgNome"),
    language: document.getElementById("cfgIdioma"), volume: document.getElementById("cfgVolume"),
    notifications: document.getElementById("cfgNotif"), contrast: document.getElementById("cfgContrast"),
    sounds: document.getElementById("cfgSons"), animations: document.getElementById("cfgAnim"),
    stimuli: document.getElementById("cfgEstimulos"), saveTop: document.getElementById("btnSave"),
    saveBottom: document.getElementById("btnSave2"), logout: document.getElementById("btnLogout"),
    avatar: document.querySelector(".navbar__avatar"),
};
let preferences = { ...DEFAULTS };

function normalize(value) {
    const source = value && typeof value === "object" ? value : {};
    return {
        theme: source.theme === "dark" ? "dark" : "light",
        fontSize: ["small", "medium", "large"].includes(source.fontSize) ? source.fontSize : "medium",
        volume: Math.min(100, Math.max(0, Number(source.volume ?? 80))),
        notifications: Boolean(source.notifications ?? false), highContrast: Boolean(source.highContrast ?? false),
        soundsEnabled: Boolean(source.soundsEnabled ?? true), animationsEnabled: Boolean(source.animationsEnabled ?? true),
        reducedStimuli: Boolean(source.reducedStimuli ?? false),
    };
}

function apply(value) {
    const root = document.documentElement;
    root.dataset.theme = value.theme;
    root.dataset.fontSize = value.fontSize;
    root.classList.toggle("high-contrast", value.highContrast);
    root.classList.toggle("reduced-motion", !value.animationsEnabled);
    root.classList.toggle("reduced-stimuli", value.reducedStimuli);
    window.ROARTheme?.set?.(value.theme);
}

function render() {
    elements.themeLight.classList.toggle("active", preferences.theme === "light");
    elements.themeDark.classList.toggle("active", preferences.theme === "dark");
    elements.fontButtons.forEach((button) => button.classList.toggle("active", button.dataset.fs === preferences.fontSize));
    elements.volume.value = preferences.volume;
    elements.notifications.checked = preferences.notifications;
    elements.contrast.checked = preferences.highContrast;
    elements.sounds.checked = preferences.soundsEnabled;
    elements.animations.checked = preferences.animationsEnabled;
    elements.stimuli.checked = preferences.reducedStimuli;
    const user = sessionService.get()?.user ?? {};
    const name = String(user.name ?? user.nome ?? "Aluno").trim();
    elements.name.value = name;
    elements.name.readOnly = true;
    elements.language.value = "Português";
    elements.language.disabled = true;
    elements.avatar.textContent = name.charAt(0).toLocaleUpperCase("pt-BR") || "A";
}

function readForm() {
    return normalize({
        ...preferences, volume: elements.volume.value, notifications: elements.notifications.checked,
        highContrast: elements.contrast.checked, soundsEnabled: elements.sounds.checked,
        animationsEnabled: elements.animations.checked, reducedStimuli: elements.stimuli.checked
    });
}

function preview() { preferences = readForm(); apply(preferences); }
function save() { preferences = readForm(); storage.setPreferences(preferences); apply(preferences); showToast("Configurações salvas com sucesso.", "success"); }
function setTheme(theme) { preferences = { ...preferences, theme }; render(); apply(preferences); }

function registerEvents() {
    elements.themeLight.addEventListener("click", () => setTheme("light"));
    elements.themeDark.addEventListener("click", () => setTheme("dark"));
    elements.fontButtons.forEach((button) => button.addEventListener("click", () => {
        preferences = { ...preferences, fontSize: button.dataset.fs }; render(); apply(preferences);
    }));
    [elements.volume, elements.notifications, elements.contrast, elements.sounds, elements.animations, elements.stimuli]
        .forEach((element) => element.addEventListener("input", preview));
    elements.saveTop.addEventListener("click", save);
    elements.saveBottom.addEventListener("click", save);
    elements.logout.addEventListener("click", () => { sessionService.end(); window.location.replace("../auth/login-aluno.html"); });
}

function initialize() {
    preferences = normalize(storage.getPreferences());
    render(); apply(preferences);
    document.getElementById("btnFoto")?.setAttribute("disabled", "");
    document.getElementById("btnDados")?.setAttribute("disabled", "");
    document.querySelectorAll('button[aria-label="Alterar e-mail"], button[aria-label="Alterar senha"]').forEach((button) => button.setAttribute("disabled", ""));
    registerEvents();
}

initialize();
