/* ============================================================
   ROAR — avatar-service.js
   Gerenciamento central de avatares dos dinos, inventário e XP
   ============================================================ */

export const DINO_CATALOG = Object.freeze([
    {
        id: "1",
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
        id: "2",
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
        id: "3",
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
        id: "4",
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
        id: "5",
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
        id: "6",
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
        id: "7",
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
        id: "8",
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
        id: "9",
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
        id: "10",
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
        id: "11",
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
        id: "12",
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
        id: "13",
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
            unlocked = [1]; // ID 1 é o Dino Padrão
            setStoredJson(STORAGE_KEYS.UNLOCKED, unlocked);
        } else if (!unlocked.includes(1)) {
            unlocked.push(1);
            setStoredJson(STORAGE_KEYS.UNLOCKED, unlocked);
        }
        return unlocked;
    },

    getEquippedDinoId() {
        const equipped = localStorage.getItem(STORAGE_KEYS.EQUIPPED);
        const unlocked = this.getUnlockedDinos();
        const eqId = parseInt(equipped, 10); // Converte para número
        if (eqId && unlocked.includes(eqId)) {
            return eqId;
        }
        return 1; // Padrão
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
        } catch { }

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
        } catch { }

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
        } catch { }

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
        } catch { }

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
    async buyDino(id) {
        const dino = this.getDinoById(id);
        if (!dino) throw new Error("Dino não encontrado no catálogo.");

        // NOTA: Confirme qual é a chave do localStorage onde o token está salvo
        // (Geralmente é token ou roar_token)
        const token = localStorage.getItem("token") || localStorage.getItem("roar_token");

        const response = await fetch("http://localhost:5000/alunos/loja-lex", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ acao: "comprar", skin_id: dino.id })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.erro || "Erro ao comprar na loja.");
        }

        // Se o backend aprovou, atualizamos o local
        const unlocked = this.getUnlockedDinos();
        if (!unlocked.includes(dino.id)) {
            unlocked.push(dino.id);
            setStoredJson(STORAGE_KEYS.UNLOCKED, unlocked);
        }

        // Atualiza o XP local com o que o back-end devolveu e equipa
        this.setXp(data.xp_restante);
        await this.equipDino(dino.id);

        window.dispatchEvent(
            new CustomEvent("roar-avatar-changed", {
                detail: { dino, action: "buy", remainingXp: data.xp_restante },
            })
        );

        return { success: true, dino, message: data.mensagem };
    },

    async equipDino(id) {
        const dino = this.getDinoById(id);
        if (!dino) throw new Error("Dino não encontrado.");

        const token = localStorage.getItem("token") || localStorage.getItem("roar_token");

        const response = await fetch("http://localhost:5000/alunos/loja-lex", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ acao: "equipar", skin_id: dino.id })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.erro || "Erro ao equipar dino.");
        }

        localStorage.setItem(STORAGE_KEYS.EQUIPPED, dino.id);
        this.applyToPage();

        window.dispatchEvent(
            new CustomEvent("roar-avatar-changed", {
                detail: { dino, action: "equip" },
            })
        );

        return { success: true, dino, message: data.mensagem };
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
