import { studentHomeService } from "../../services/student-home-service.js";
import { showToast } from "../../components/toast.js";


const MASCOT_MESSAGES = Object.freeze([
    "Você está indo\nmuito bem!",
    "Continue assim,\ncampeão!",
    "Hoje é um ótimo\ndia para aprender!",
    "Você consegue!",
    "Que orgulho de você!",
]);


const elements = {
    userName:
        document.querySelector("#userName"),

    navAvatar:
        document.querySelector("#navAvatar"),

    xpTotal:
        document.querySelector("#xpTotal"),

    learningMode:
        document.querySelector("#learningMode"),

    availableModules:
        document.querySelector("#availableModules"),

    heroCard:
        document.querySelector("#heroCard"),

    heroLabel:
        document.querySelector("#heroLabel"),

    heroTitle:
        document.querySelector("#heroTitle"),

    heroProgress:
        document.querySelector("#heroProgress"),

    heroPercent:
        document.querySelector("#heroPercent"),

    heroAction:
        document.querySelector("#heroAction"),

    categoriesGrid:
        document.querySelector("#categoriasGrid"),

    recentList:
        document.querySelector("#recentList"),

    mascotBubble:
        document.querySelector("#mascotBubble"),

    mascotImage:
        document.querySelector("#mascotImg"),

    notificationsButton:
        document.querySelector("#btnNotif"),
};


let mascotMessageIndex = 0;


function navigateTo(url) {
    if (typeof window.roarNavigate === "function") {
        window.roarNavigate(url);
        return;
    }

    window.location.assign(url);
}


function buildActivityUrl(module) {
    const parameters = new URLSearchParams({
        modulo: String(module.id),
        etapa: String(module.nextStage ?? 1),
    });

    return `atividade.html?${parameters.toString()}`;
}


function setMascotMessage(message) {
    const lines = String(message).split("\n");

    const content = document.createDocumentFragment();

    lines.forEach((line, index) => {
        content.append(
            document.createTextNode(line),
        );

        if (index < lines.length - 1) {
            content.append(
                document.createElement("br"),
            );
        }
    });

    elements.mascotBubble.replaceChildren(content);
}


function renderProfile(profile, modulesCount) {
    elements.userName.textContent =
        profile.name;

    elements.navAvatar.textContent =
        profile.initial;

    elements.navAvatar.title =
        `Abrir perfil de ${profile.name}`;

    elements.xpTotal.textContent =
        profile.xpTotal.toLocaleString("pt-BR");

    elements.learningMode.textContent =
        profile.learningMode;

    elements.availableModules.textContent =
        String(modulesCount);
}


function clearHeroInteractions() {
    const cleanHeroCard =
        elements.heroCard.cloneNode(true);

    elements.heroCard.replaceWith(
        cleanHeroCard,
    );

    elements.heroCard = cleanHeroCard;

    elements.heroLabel =
        cleanHeroCard.querySelector("#heroLabel");

    elements.heroTitle =
        cleanHeroCard.querySelector("#heroTitle");

    elements.heroProgress =
        cleanHeroCard.querySelector("#heroProgress");

    elements.heroPercent =
        cleanHeroCard.querySelector("#heroPercent");

    elements.heroAction =
        cleanHeroCard.querySelector("#heroAction");
}


function renderEmptyHero() {
    clearHeroInteractions();

    elements.heroLabel.textContent =
        "Novidades em breve";

    elements.heroTitle.textContent =
        "Nenhum módulo disponível";

    elements.heroPercent.textContent =
        "Aguarde sua professora liberar um módulo.";

    elements.heroProgress.style.width = "0%";

    elements.heroAction.textContent =
        "Indisponível";

    elements.heroAction.disabled = true;

    elements.heroCard.removeAttribute("role");
    elements.heroCard.removeAttribute("tabindex");
}


function renderHero(module) {
    if (!module) {
        renderEmptyHero();
        return;
    }

    clearHeroInteractions();

    const progress = Math.min(
        100,
        Math.max(
            0,
            Number(module.progress) || 0,
        ),
    );

    const openModule = () => {
        navigateTo(
            buildActivityUrl(module),
        );
    };

    const completed = module.status === "completed";
    elements.heroLabel.textContent = completed
        ? "Módulo concluído"
        : progress > 0 ? "Continue de onde parou" : "Próximo módulo";

    elements.heroTitle.textContent =
        module.title;

    elements.heroProgress.style.width =
        `${progress}%`;

    elements.heroPercent.textContent = completed
        ? "100% concluído"
        : progress > 0 ? `${progress}% concluído` : "Disponível para começar";

    elements.heroAction.textContent = completed
        ? "Revisar"
        : progress > 0 ? "Continuar" : "Começar";

    elements.heroAction.disabled = false;

    elements.heroCard.setAttribute(
        "role",
        "button",
    );

    elements.heroCard.setAttribute(
        "tabindex",
        "0",
    );

    elements.heroAction.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();
            openModule();
        },
    );

    elements.heroCard.addEventListener(
        "click",
        openModule,
    );

    elements.heroCard.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key !== "Enter" &&
                event.key !== " "
            ) {
                return;
            }

            event.preventDefault();
            openModule();
        },
    );
}


function createCategoryCard(module) {
    const card =
        document.createElement("button");

    const iconWrapper =
        document.createElement("span");

    const icon =
        document.createElement("i");

    const name =
        document.createElement("span");

    card.type = "button";
    card.className = "cat-card";
    card.disabled = module.status === "preparation";

    card.setAttribute(
        "aria-label",
        `Abrir módulo ${module.title}`,
    );

    iconWrapper.className =
        `cat-card__icon cat-card__icon--${module.color}`;

    icon.className =
        module.icon ||
        "fi fi-br-puzzle-pieces";

    icon.setAttribute(
        "aria-hidden",
        "true",
    );

    name.className =
        "cat-card__name";

    name.textContent =
        module.title;

    iconWrapper.append(icon);

    card.append(
        iconWrapper,
        name,
    );

    card.addEventListener(
        "click",
        () => {
            if (module.status === "preparation") return;
            navigateTo(
                buildActivityUrl(module),
            );
        },
    );

    return card;
}


function renderModules(modules) {
    elements.categoriesGrid.replaceChildren();

    if (!modules.length) {
        const message =
            document.createElement("p");

        message.className = "text-muted";

        message.textContent =
            "Nenhum módulo está disponível no momento.";

        elements.categoriesGrid.append(message);

        return;
    }

    const fragment =
        document.createDocumentFragment();

    modules.forEach((module) => {
        fragment.append(
            createCategoryCard(module),
        );
    });

    elements.categoriesGrid.append(fragment);
}


function renderRecentActivities() {
    const message =
        document.createElement("p");

    message.className = "text-muted";

    message.textContent =
        "Acesse a página de desempenho para consultar seu histórico.";

    elements.recentList.replaceChildren(
        message,
    );
}


function bindMascotInteraction() {
    elements.mascotImage.addEventListener(
        "click",
        () => {
            mascotMessageIndex =
                (
                    mascotMessageIndex + 1
                ) % MASCOT_MESSAGES.length;

            setMascotMessage(
                MASCOT_MESSAGES[
                    mascotMessageIndex
                ],
            );
        },
    );
}


function bindNotificationInteraction() {
    elements.notificationsButton.addEventListener(
        "click",
        () => {
            showToast(
                "Nenhuma notificação nova",
                "info",
            );
        },
    );
}


function showLoadingState() {
    elements.heroLabel.textContent =
        "Próximo módulo";

    elements.heroTitle.textContent =
        "Carregando módulos...";

    elements.heroPercent.textContent =
        "Aguarde um instante";

    elements.heroProgress.style.width =
        "0%";

    elements.heroAction.disabled = true;
}


function showErrorState(error) {
    console.error(
        "Falha ao carregar a home do aluno:",
        error,
    );

    elements.heroLabel.textContent =
        "Não foi possível carregar";

    elements.heroTitle.textContent =
        "Tente novamente";

    elements.heroPercent.textContent =
        "Verifique sua conexão com a API.";

    elements.heroProgress.style.width =
        "0%";

    elements.heroAction.textContent =
        "Recarregar";

    elements.heroAction.disabled = false;

    elements.heroAction.addEventListener(
        "click",
        () => {
            window.location.reload();
        },
        {
            once: true,
        },
    );

    showToast(
        error?.message ||
        "Não foi possível carregar a página.",
        "error",
    );
}


function validateRequiredElements() {
    const missingElements = Object.entries(
        elements,
    )
        .filter(([, element]) => !element)
        .map(([name]) => name);

    if (missingElements.length) {
        throw new Error(
            `Elementos ausentes na home: ${missingElements.join(", ")}.`,
        );
    }
}


async function initialize() {
    try {
        validateRequiredElements();

        bindMascotInteraction();
        bindNotificationInteraction();

        renderRecentActivities();
        showLoadingState();

        const {
            profile,
            modules,
            featuredModule,
        } = await studentHomeService.load();

        renderProfile(
            profile,
            modules.length,
        );

        renderModules(modules);
        const nextModule = modules.find((module) =>
            module.status === "in_progress" || module.status === "available"
        ) ?? modules.find((module) => module.status === "completed") ?? featuredModule;
        renderHero(nextModule);
    } catch (error) {
        /*
         * Se os elementos essenciais existirem, mostramos
         * o erro visualmente. Caso o próprio HTML esteja
         * incompatível, o erro permanecerá no console.
         */
        if (
            elements.heroLabel &&
            elements.heroTitle &&
            elements.heroPercent &&
            elements.heroProgress &&
            elements.heroAction
        ) {
            showErrorState(error);
            return;
        }

        console.error(
            "Não foi possível inicializar a home:",
            error,
        );
    }
}


initialize();
