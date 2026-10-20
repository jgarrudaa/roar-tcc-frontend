import { sessionService } from "./session-service.js";

export const DINO_CATALOG = Object.freeze([
    { id: 1, name: "Dino Padrão", title: "O Mascote Lendário", price: 0, rarity: "padrao", rarityLabel: "Inicial", badgeColor: "#10b981", description: "O simpático dinossauro verde clássico da ROAR.", fileName: "dinooriginal.png", isOriginal: true, category: "classico" },
    { id: 2, name: "Dino Basquete", title: "Cestinha das Quadras", price: 300, rarity: "comum", rarityLabel: "Comum", badgeColor: "#3b82f6", description: "Enterradas certeiras e muita agilidade!", fileName: "dino_basquete.png", isOriginal: false, category: "esportes" },
    { id: 3, name: "Dino Explorador", title: "Aventureiro da Selva", price: 600, rarity: "comum", rarityLabel: "Comum", badgeColor: "#059669", description: "Equipado para descobrir novas palavras na floresta.", fileName: "dino_explorador.png", isOriginal: false, category: "aventura" },
    { id: 4, name: "Dino Jogador (Brasil)", title: "Artilheiro das Palavras", price: 600, rarity: "comum", rarityLabel: "Comum", badgeColor: "#3b82f6", description: "Camisa 10 pronto para marcar golaços!", fileName: "dino_jogador.png", isOriginal: false, category: "esportes" },
    { id: 5, name: "Dino Cowboy", title: "Xerife do Velho Oeste", price: 1200, rarity: "raro", rarityLabel: "Raro", badgeColor: "#d97706", description: "O xerife mais veloz do oeste!", fileName: "dino_cowboy.png", isOriginal: false, category: "aventura" },
    { id: 6, name: "Dino Cachorro-Quente", title: "Chef Divertido", price: 1200, rarity: "raro", rarityLabel: "Raro", badgeColor: "#f97316", description: "Divertido, irreverente e cheio de estilo!", fileName: "dino_hotdog.png", isOriginal: false, category: "divertido" },
    { id: 7, name: "Dino Militar", title: "Comandante Tático", price: 1800, rarity: "raro", rarityLabel: "Raro", badgeColor: "#65a30d", description: "Disciplina, estratégia e foco absoluto.", fileName: "dino_militar.png", isOriginal: false, category: "especial" },
    { id: 8, name: "Dino Ninja", title: "Guerreiro das Sombras", price: 1800, rarity: "epico", rarityLabel: "Épico", badgeColor: "#8b5cf6", description: "Silencioso e ultra-rápido nas respostas.", fileName: "dino_ninja.png", isOriginal: false, category: "aventura" },
    { id: 9, name: "Dino Cavaleiro", title: "Paladino da Távola", price: 2400, rarity: "epico", rarityLabel: "Épico", badgeColor: "#9333ea", description: "Armadura reluzente e coração corajoso.", fileName: "dino_cavaleiro.png", isOriginal: false, category: "fantasia" },
    { id: 10, name: "Dino Astronauta", title: "Explorador Cósmico", price: 2400, rarity: "lendario", rarityLabel: "Lendário", badgeColor: "#0284c7", description: "Flutua na gravidade zero buscando constelações!", fileName: "dino_astronauta.png", isOriginal: false, category: "fantasia" },
    { id: 11, name: "Dino Robô", title: "Androide do Futuro", price: 3000, rarity: "lendario", rarityLabel: "Lendário", badgeColor: "#06b6d4", description: "Tecnologia de inteligência robótica com circuitos neon.", fileName: "dino_robo.png", isOriginal: false, category: "fantasia" },
    { id: 12, name: "Dino Rico", title: "Fino Trato & Alta Classe", price: 4200, rarity: "lendario", rarityLabel: "Lendário", badgeColor: "#eab308", description: "Terno sob medida, cartola clássica e monóculo.", fileName: "dino_rico.png", isOriginal: false, category: "especial" },
    { id: 13, name: "Dino Rei", title: "Soberano do Reino ROAR", price: 6000, rarity: "mitico", rarityLabel: "Mítico", badgeColor: "#f59e0b", description: "Coroa de ouro maciço com joias raras.", fileName: "dino_rei.png", isOriginal: false, category: "fantasia" }
]);

const STORAGE_KEYS = Object.freeze({
    UNLOCKED: "roar_unlocked_dinos",
    EQUIPPED: "roar_equipped_dino",
    XP: "roar_dino_xp",
});

function getStoredJson(key, fallback) {
    try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : fallback; } catch { return fallback; }
}

function setStoredJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.warn("Erro ao salvar storage", e); }
}

function getAuthToken() {
    try {
        const session = sessionService.get();
        if (session && session.token) return session.token;
    } catch (e) { }

    try {
        const sessionRaw = localStorage.getItem("roarSession");
        if (sessionRaw) {
            const parsed = JSON.parse(sessionRaw);
            if (parsed && parsed.token) return parsed.token;
        }
    } catch (e) { }

    return localStorage.getItem("token") || localStorage.getItem("roar_token") || "";
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
        const numericId = Number(id);
        return DINO_CATALOG.find((d) => d.id === numericId) || DINO_CATALOG[0];
    },

    getUnlockedDinos() {
        let unlocked = getStoredJson(STORAGE_KEYS.UNLOCKED, null);
        if (!Array.isArray(unlocked) || unlocked.length === 0) {
            unlocked = [1];
            setStoredJson(STORAGE_KEYS.UNLOCKED, unlocked);
        } else if (!unlocked.includes(1)) {
            unlocked.push(1);
            setStoredJson(STORAGE_KEYS.UNLOCKED, unlocked);
        }
        return unlocked.map(Number);
    },

    isUnlocked(id) {
        return this.getUnlockedDinos().includes(Number(id));
    },

    getEquippedDinoId() {
        const equipped = localStorage.getItem(STORAGE_KEYS.EQUIPPED);
        const unlocked = this.getUnlockedDinos();
        const eqId = Number(equipped);
        if (eqId && unlocked.includes(eqId)) {
            return eqId;
        }
        return 1;
    },

    getEquippedDino() { return this.getDinoById(this.getEquippedDinoId()); },

    getXp() {
        // 1. PRIORIDADE 1: Chave direta atualizada pela Home/Avatar (roar_dino_xp)
        const storedXp = localStorage.getItem(STORAGE_KEYS.XP);
        if (storedXp !== null) {
            const parsed = Number(storedXp);
            if (!Number.isNaN(parsed) && parsed > 0) return parsed;
        }

        // 2. PRIORIDADE 2: XP gravado na sessão ativa de login (roarSession)
        try {
            const sessionRaw = localStorage.getItem("roarSession");
            if (sessionRaw) {
                const session = JSON.parse(sessionRaw);
                const sessionXp = Number(session?.user?.xpTotal ?? session?.user?.xp ?? session?.user?.xp_total);
                if (!Number.isNaN(sessionXp) && sessionXp > 0) {
                    return sessionXp;
                }
            }
        } catch { }

        // 3. PRIORIDADE 3: Objeto legado de dados (roarData)
        try {
            const roarDataRaw = localStorage.getItem("roarData");
            if (roarDataRaw) {
                const roarXp = Number(JSON.parse(roarDataRaw)?.xp);
                if (!Number.isNaN(roarXp) && roarXp > 0) return roarXp;
            }
        } catch { }

        return 0;
    },

    async syncXpFromApi() {
        const token = getAuthToken();
        if (!token) return this.getXp();

        try {
            const response = await fetch("https://back-tcc-version-2.vercel.app/alunos/loja-lex", {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.xp_atual !== undefined && data.xp_atual !== null) {
                    return this.setXp(data.xp_atual);
                }
            }
        } catch (e) {
            console.warn("API de sincronização indisponível. Mantendo valor salvo localmente.");
        }

        // Se a API retornar 400 ou 404, MANTÉM o valor atual e NUNCA zera
        return this.getXp();
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
        return this.setXp(this.getXp() + Number(amount));
    },

    async buyDino(id) {
        const dino = this.getDinoById(id);
        if (!dino) {
            throw new Error("Dino não encontrado no catálogo.");
        }

        const token = getAuthToken();
        if (!token) {
            throw new Error("Sessão expirada. Faça login novamente.");
        }

        const response = await fetch("https://back-tcc-version-2.vercel.app/alunos/loja-lex", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                acao: "comprar",
                skin_id: Number(dino.id) // Garante o envio de número inteiro
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.erro || "Erro ao comprar dino.");
        }

        const unlocked = this.getUnlockedDinos();
        if (!unlocked.includes(dino.id)) {
            unlocked.push(dino.id);
            setStoredJson(STORAGE_KEYS.UNLOCKED, unlocked);
        }

        const remainingXp = this.setXp(data.xp_restante ?? (this.getXp() - dino.price));
        localStorage.setItem(STORAGE_KEYS.EQUIPPED, String(dino.id));
        this.applyToPage();

        window.dispatchEvent(
            new CustomEvent("roar-avatar-changed", {
                detail: { dino, action: "buy", remainingXp },
            })
        );

        return {
            success: true,
            dino,
            remainingXp,
            message: data.mensagem || `Parabéns! Você adotou o ${dino.name}!`,
        };
    },

    async equipDino(id) {
        const dino = this.getDinoById(id);
        if (!dino) {
            throw new Error("Dino não encontrado.");
        }

        const token = getAuthToken();
        if (!token) {
            throw new Error("Sessão expirada. Faça login novamente.");
        }

        const response = await fetch("https://back-tcc-version-2.vercel.app/alunos/loja-lex", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                acao: "equipar",
                skin_id: Number(dino.id)
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.erro || "Erro ao equipar dino.");
        }

        localStorage.setItem(STORAGE_KEYS.EQUIPPED, String(dino.id));
        this.applyToPage();

        window.dispatchEvent(
            new CustomEvent("roar-avatar-changed", {
                detail: { dino, action: "equip" },
            })
        );

        return {
            success: true,
            dino,
            message: data.mensagem || `O ${dino.name} agora é o seu mascote ativo!`,
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
        } else if (fromDepth === 0) { prefix = "public/assets/imagens/"; }
        else if (fromDepth === 1) { prefix = "../public/assets/imagens/"; }
        else if (fromDepth === 2) { prefix = "../../public/assets/imagens/"; }

        if (dino.isOriginal || Number(dino.id) === 1) { return `${prefix}dinooriginal.png`; }
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
            avatar.title = `Mascote Ativo: ${dino.name}`;
        });

        doc.querySelectorAll("#mascotImg, .hero-mascot img, .congrats-banner img").forEach((img) => {
            img.src = imgPath;
        });

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