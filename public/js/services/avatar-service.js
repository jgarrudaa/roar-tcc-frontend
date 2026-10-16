/* ============================================================
   ROAR — avatar-service.js
   Gerenciamento central de avatares dos dinos, inventário e XP
   ============================================================ */

export const DINO_CATALOG = Object.freeze([
    {
        id: "dino_original",
        name: "Lex Clássico",
        title: "O Mascote Lendário",
        price: 0,
        rarity: "padrao",
        rarityLabel: "Inicial",
        badgeColor: "#10b981",
        description: "O simpático e inteligente dinossauro verde clássico da ROAR. Companheiro de todas as horas!",
        fileName: "dinooriginal.png",
        isOriginal: true,
        category: "classico",
    },
    {
        id: "dino_jogador",
        name: "Dino Craque",
        title: "Artilheiro das Palavras",
        price: 800,
        rarity: "comum",
        rarityLabel: "Comum",
        badgeColor: "#3b82f6",
        description: "Camisa 10 pronto para marcar golaços de vocabulário e comemorar cada acerto com drible!",
        fileName: "dino_jogador.png",
        isOriginal: false,
        category: "esportes",
    },
    {
        id: "dino_basquete",
        name: "Dino Basqueteiro",
        title: "Cestinha das Quadras",
        price: 800,
        rarity: "comum",
        rarityLabel: "Comum",
        badgeColor: "#3b82f6",
        description: "Enterradas certeiras e muita agilidade. Perfeito para quem tem foco e velocidade nas lições!",
        fileName: "dino_basquete.png",
        isOriginal: false,
        category: "esportes",
    },
    {
        id: "dino_explorador",
        name: "Dino Explorador",
        title: "Aventureiro da Selva",
        price: 800,
        rarity: "comum",
        rarityLabel: "Comum",
        badgeColor: "#059669",
        description: "Equipado com chapéu de safari e bússola mágica para descobrir novas palavras em qualquer floresta.",
        fileName: "dino_explorador.png",
        isOriginal: false,
        category: "aventura",
    },
    {
        id: "dino_cowboy",
        name: "Dino Cowboy",
        title: "Xerife do Velho Oeste",
        price: 900,
        rarity: "raro",
        rarityLabel: "Raro",
        badgeColor: "#d97706",
        description: "O xerife mais veloz do oeste! Com chapéu estiloso e bota de couro, põe qualquer dúvida pra correr.",
        fileName: "dino_cowboy.png",
        isOriginal: false,
        category: "aventura",
    },
    {
        id: "dino_militar",
        name: "Dino Militar",
        title: "Comandante Tático",
        price: 900,
        rarity: "raro",
        rarityLabel: "Raro",
        badgeColor: "#65a30d",
        description: "Disciplina, estratégia e foco absoluto. Missão dada é missão cumprida com nota 10!",
        fileName: "dino_militar.png",
        isOriginal: false,
        category: "especial",
    },
    {
        id: "dino_hotdog",
        name: "Dino Hot Dog",
        title: "Chef Divertido",
        price: 900,
        rarity: "raro",
        rarityLabel: "Raro",
        badgeColor: "#f97316",
        description: "Divertido, irreverente e cheio de sabor! Vestido de hot dog quentinho para alegrar o aprendizado.",
        fileName: "dino_hotdog.png",
        isOriginal: false,
        category: "divertido",
    },
    {
        id: "dino_ninja",
        name: "Dino Ninja",
        title: "Guerreiro das Sombras",
        price: 900,
        rarity: "epico",
        rarityLabel: "Épico",
        badgeColor: "#8b5cf6",
        description: "Silencioso e ultra-rápido. Move-se pelas sombras com reflexos afiados para acertar cada resposta.",
        fileName: "dino_ninja.png",
        isOriginal: false,
        category: "aventura",
    },
    {
        id: "dino_cavaleiro",
        name: "Dino Cavaleiro",
        title: "Paladino da Távola",
        price: 950,
        rarity: "epico",
        rarityLabel: "Épico",
        badgeColor: "#9333ea",
        description: "Armadura polida reluzente, escudo corajoso e coração leal. Um verdadeiro defensor do conhecimento!",
        fileName: "dino_cavaleiro.png",
        isOriginal: false,
        category: "fantasia",
    },
    {
        id: "dino_astronauta",
        name: "Dino Astronauta",
        title: "Explorador Cósmico",
        price: 980,
        rarity: "lendario",
        rarityLabel: "Lendário",
        badgeColor: "#0284c7",
        description: "Traje espacial com oxigênio lunar. Flutua na gravidade zero buscando constelações de conhecimento!",
        fileName: "dino_astronauta.png",
        isOriginal: false,
        category: "fantasia",
    },
    {
        id: "dino_robo",
        name: "Dino Cibernético",
        title: "Androide do Futuro",
        price: 980,
        rarity: "lendario",
        rarityLabel: "Lendário",
        badgeColor: "#06b6d4",
        description: "Tecnologia de inteligência robótica com circuitos de neon e processador quântico de inglês.",
        fileName: "dino_robo.png",
        isOriginal: false,
        category: "fantasia",
    },
    {
        id: "dino_rico",
        name: "Dino Magnata",
        title: "Fino Trato & Alta Classe",
        price: 1000,
        rarity: "lendario",
        rarityLabel: "Lendário",
        badgeColor: "#eab308",
        description: "Terno sob medida, cartola clássica e monóculo reluzente. O dino mais elegante de toda a ROAR!",
        fileName: "dino_rico.png",
        isOriginal: false,
        category: "especial",
    },
    {
        id: "dino_rei",
        name: "Dino Rei Supremo",
        title: "Soberano do Reino ROAR",
        price: 1000,
        rarity: "mitico",
        rarityLabel: "Mítico",
        badgeColor: "#f59e0b",
        description: "Coroa de ouro maciço com joias raras e manto real aveludado. A glória máxima para os mestres!",
        fileName: "dino_rei.png",
        isOriginal: false,
        category: "fantasia",
    },
]);

const STORAGE_KEYS = Object.freeze({
    UNLOCKED: "roar_unlocked_dinos",
    EQUIPPED: "roar_equipped_dino",
    XP: "roar_dino_xp",
});

function getStoredJson(key, fallback) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch {
        return fallback;
    }
}

function setStoredJson(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn("AvatarService: Erro ao salvar storage", e);
    }
}

export const avatarService = {
    getCatalog() {
        const unlockedIds = this.getUnlockedDinos();
        const equippedId = this.getEquippedDinoId();

        return DINO_CATALOG.map((dino) => ({
            ...dino,
            isUnlocked: unlockedIds.includes(dino.id),
            isEquipped: dino.id === equippedId,
        }));
    },

    getDinoById(id) {
        return DINO_CATALOG.find((d) => d.id === id) || DINO_CATALOG[0];
    },

    getUnlockedDinos() {
        let unlocked = getStoredJson(STORAGE_KEYS.UNLOCKED, null);
        if (!Array.isArray(unlocked) || unlocked.length === 0) {
            unlocked = ["dino_original"];
            setStoredJson(STORAGE_KEYS.UNLOCKED, unlocked);
        } else if (!unlocked.includes("dino_original")) {
            unlocked.push("dino_original");
            setStoredJson(STORAGE_KEYS.UNLOCKED, unlocked);
        }
        return unlocked;
    },

    isUnlocked(id) {
        return this.getUnlockedDinos().includes(id);
    },

    getEquippedDinoId() {
        const equipped = localStorage.getItem(STORAGE_KEYS.EQUIPPED);
        const unlocked = this.getUnlockedDinos();
        if (equipped && unlocked.includes(equipped)) {
            return equipped;
        }
        return "dino_original";
    },

    getEquippedDino() {
        const id = this.getEquippedDinoId();
        return this.getDinoById(id);
    },

    getXp() {
        const storedXp = localStorage.getItem(STORAGE_KEYS.XP);
        if (storedXp !== null) {
            const parsed = Number(storedXp);
            if (!Number.isNaN(parsed) && parsed >= 0) return parsed;
        }

        try {
            const sessionRaw = localStorage.getItem("roarSession");
            if (sessionRaw) {
                const session = JSON.parse(sessionRaw);
                const sessionXp = Number(session?.user?.xpTotal ?? session?.user?.xp);
                if (!Number.isNaN(sessionXp) && sessionXp > 0) {
                    this.setXp(sessionXp);
                    return sessionXp;
                }
            }
        } catch {}

        try {
            const roarDataRaw = localStorage.getItem("roarData");
            if (roarDataRaw) {
                const roarData = JSON.parse(roarDataRaw);
                const roarXp = Number(roarData?.xp);
                if (!Number.isNaN(roarXp) && roarXp > 0) {
                    this.setXp(roarXp);
                    return roarXp;
                }
            }
        } catch {}

        const defaultXp = 1240;
        this.setXp(defaultXp);
        return defaultXp;
    },

    setXp(amount) {
        const safeAmount = Math.max(0, Math.round(Number(amount) || 0));
        localStorage.setItem(STORAGE_KEYS.XP, String(safeAmount));

        try {
            const roarDataRaw = localStorage.getItem("roarData");
            if (roarDataRaw) {
                const roarData = JSON.parse(roarDataRaw);
                roarData.xp = safeAmount;
                localStorage.setItem("roarData", JSON.stringify(roarData));
            }
        } catch {}

        try {
            const sessionRaw = localStorage.getItem("roarSession");
            if (sessionRaw) {
                const session = JSON.parse(sessionRaw);
                if (session && session.user) {
                    session.user.xpTotal = safeAmount;
                    session.user.xp = safeAmount;
                    localStorage.setItem("roarSession", JSON.stringify(session));
                }
            }
        } catch {}

        window.dispatchEvent(
            new CustomEvent("roar-xp-changed", {
                detail: { xp: safeAmount },
            })
        );

        return safeAmount;
    },

    addXp(amount) {
        return this.setXp(this.getXp() + amount);
    },

    buyDino(id) {
        const dino = this.getDinoById(id);
        if (!dino) {
            throw new Error("Dino não encontrado no catálogo.");
        }

        const unlocked = this.getUnlockedDinos();
        if (unlocked.includes(dino.id)) {
            return {
                success: true,
                alreadyOwned: true,
                dino,
                message: `Você já possui o ${dino.name}!`,
            };
        }

        const currentXp = this.getXp();
        if (currentXp < dino.price) {
            const needed = dino.price - currentXp;
            throw new Error(
                `XP insuficiente! Você tem ${currentXp.toLocaleString("pt-BR")} XP, mas este dino custa ${dino.price.toLocaleString("pt-BR")} XP (faltam ${needed.toLocaleString("pt-BR")} XP).`
            );
        }

        const remainingXp = this.setXp(currentXp - dino.price);

        unlocked.push(dino.id);
        setStoredJson(STORAGE_KEYS.UNLOCKED, unlocked);

        this.equipDino(dino.id);

        window.dispatchEvent(
            new CustomEvent("roar-avatar-changed", {
                detail: {
                    dino,
                    action: "buy",
                    remainingXp,
                },
            })
        );

        return {
            success: true,
            alreadyOwned: false,
            dino,
            remainingXp,
            message: `Parabéns! Você adotou o ${dino.name} e ele já foi equipado como seu mascote!`,
        };
    },

    equipDino(id) {
        const dino = this.getDinoById(id);
        if (!dino) {
            throw new Error("Dino não encontrado.");
        }

        const unlocked = this.getUnlockedDinos();
        if (!unlocked.includes(dino.id)) {
            throw new Error(`Você ainda não desbloqueou o ${dino.name}.`);
        }

        localStorage.setItem(STORAGE_KEYS.EQUIPPED, dino.id);

        this.applyToPage();

        window.dispatchEvent(
            new CustomEvent("roar-avatar-changed", {
                detail: {
                    dino,
                    action: "equip",
                },
            })
        );

        return {
            success: true,
            dino,
            message: `O ${dino.name} agora é o seu mascote ativo!`,
        };
    },

    resolveImagePath(dino, fromDepth = null) {
        if (!dino) dino = this.getEquippedDino();

        let prefix = "../../public/assets/imagens/";

        if (fromDepth === null && typeof window !== "undefined") {
            const path = window.location.pathname.replace(/\\/g, "/").toLowerCase();
            if (path.includes("/pages/aluno/") || path.includes("/pages/professor/") || path.includes("/pages/auth/")) {
                prefix = "../../public/assets/imagens/";
            } else if (path.includes("/pages/")) {
                prefix = "../public/assets/imagens/";
            } else {
                prefix = "public/assets/imagens/";
            }
        } else if (fromDepth === 0) {
            prefix = "public/assets/imagens/";
        } else if (fromDepth === 1) {
            prefix = "../public/assets/imagens/";
        } else if (fromDepth === 2) {
            prefix = "../../public/assets/imagens/";
        }

        if (dino.isOriginal || dino.id === "dino_original") {
            return `${prefix}dinooriginal.png`;
        }

        return `${prefix}dinos/${dino.fileName}`;
    },

    applyToPage(targetDoc = null) {
        if (typeof document === "undefined") return;
        const doc = targetDoc || document;
        const dino = this.getEquippedDino();
        const imgPath = this.resolveImagePath(dino);

        const navAvatars = doc.querySelectorAll(".navbar__avatar, #navAvatar, #studentAvatar, #navbarAvatar");
        navAvatars.forEach((avatar) => {
            let img = avatar.querySelector("img.navbar__avatar-img");
            if (!img) {
                avatar.innerHTML = "";
                img = doc.createElement("img");
                img.className = "navbar__avatar-img";
                avatar.appendChild(img);
            }
            img.src = imgPath;
            img.alt = `Mascote: ${dino.name}`;
            avatar.title = `Mascote Ativo: ${dino.name} (Abrir Perfil)`;
            avatar.style.padding = "2px";
            avatar.style.background = "linear-gradient(135deg, rgba(133, 199, 242, 0.4), rgba(68, 246, 152, 0.3))";
        });

        const mascotImgs = doc.querySelectorAll("#mascotImg, .hero-mascot img");
        mascotImgs.forEach((img) => {
            img.src = imgPath;
            img.alt = `Mascote ${dino.name}`;
        });

        const congratsBannerImgs = doc.querySelectorAll(".congrats-banner img");
        congratsBannerImgs.forEach((img) => {
            img.src = imgPath;
            img.alt = `Mascote ${dino.name}`;
        });

        const profileAvatar = doc.getElementById("profileAvatar");
        if (profileAvatar) {
            let img = profileAvatar.querySelector("img.profile-avatar-img");
            if (!img) {
                profileAvatar.innerHTML = "";
                img = doc.createElement("img");
                img.className = "profile-avatar-img";
                img.style.width = "100%";
                img.style.height = "100%";
                img.style.objectFit = "contain";
                img.style.padding = "6px";
                profileAvatar.appendChild(img);
            }
            img.src = imgPath;
            img.alt = `Mascote: ${dino.name}`;
            profileAvatar.title = `Mascote: ${dino.name}`;
        }

        const xpDisplays = doc.querySelectorAll("#xpTotal, #studentXp, #storeUserXp");
        const currentXp = this.getXp();
        xpDisplays.forEach((el) => {
            if (el.id === "storeUserXp" || el.id === "xpTotal" || el.id === "studentXp") {
                el.textContent = currentXp.toLocaleString("pt-BR");
            }
        });
    },
};

if (typeof window !== "undefined") {
    window.ROARAvatar = avatarService;
}
