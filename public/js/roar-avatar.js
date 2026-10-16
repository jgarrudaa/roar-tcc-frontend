/* ============================================================
   ROAR — roar-avatar.js
   Sincronizador automático de Mascote & Avatar em todas as páginas
   ============================================================ */

(function () {
    const DINO_CATALOG = [
        { id: "dino_original", name: "Lex Clássico", title: "O Mascote Lendário", price: 0, rarity: "padrao", rarityLabel: "Inicial", fileName: "dinooriginal.png", isOriginal: true },
        { id: "dino_jogador", name: "Dino Craque", title: "Artilheiro das Palavras", price: 800, rarity: "comum", rarityLabel: "Comum", fileName: "dino_jogador.png", isOriginal: false },
        { id: "dino_basquete", name: "Dino Basqueteiro", title: "Cestinha das Quadras", price: 800, rarity: "comum", rarityLabel: "Comum", fileName: "dino_basquete.png", isOriginal: false },
        { id: "dino_explorador", name: "Dino Explorador", title: "Aventureiro da Selva", price: 800, rarity: "comum", rarityLabel: "Comum", fileName: "dino_explorador.png", isOriginal: false },
        { id: "dino_cowboy", name: "Dino Cowboy", title: "Xerife do Velho Oeste", price: 900, rarity: "raro", rarityLabel: "Raro", fileName: "dino_cowboy.png", isOriginal: false },
        { id: "dino_militar", name: "Dino Militar", title: "Comandante Tático", price: 900, rarity: "raro", rarityLabel: "Raro", fileName: "dino_militar.png", isOriginal: false },
        { id: "dino_hotdog", name: "Dino Hot Dog", title: "Chef Divertido", price: 900, rarity: "raro", rarityLabel: "Raro", fileName: "dino_hotdog.png", isOriginal: false },
        { id: "dino_ninja", name: "Dino Ninja", title: "Guerreiro das Sombras", price: 900, rarity: "epico", rarityLabel: "Épico", fileName: "dino_ninja.png", isOriginal: false },
        { id: "dino_cavaleiro", name: "Dino Cavaleiro", title: "Paladino da Távola", price: 950, rarity: "epico", rarityLabel: "Épico", fileName: "dino_cavaleiro.png", isOriginal: false },
        { id: "dino_astronauta", name: "Dino Astronauta", title: "Explorador Cósmico", price: 980, rarity: "lendario", rarityLabel: "Lendário", fileName: "dino_astronauta.png", isOriginal: false },
        { id: "dino_robo", name: "Dino Cibernético", title: "Androide do Futuro", price: 980, rarity: "lendario", rarityLabel: "Lendário", fileName: "dino_robo.png", isOriginal: false },
        { id: "dino_rico", name: "Dino Magnata", title: "Fino Trato & Alta Classe", price: 1000, rarity: "lendario", rarityLabel: "Lendário", fileName: "dino_rico.png", isOriginal: false },
        { id: "dino_rei", name: "Dino Rei Supremo", title: "Soberano do Reino ROAR", price: 1000, rarity: "mitico", rarityLabel: "Mítico", fileName: "dino_rei.png", isOriginal: false },
    ];

    function getEquippedDino() {
        const id = localStorage.getItem("roar_equipped_dino") || "dino_original";
        return DINO_CATALOG.find((d) => d.id === id) || DINO_CATALOG[0];
    }

    function resolveDinoPath(dino) {
        const path = (window.location.pathname || "").replace(/\\/g, "/").toLowerCase();
        let prefix = "../../public/assets/imagens/";

        if (path.includes("/pages/aluno/") || path.includes("/pages/professor/") || path.includes("/pages/auth/")) {
            prefix = "../../public/assets/imagens/";
        } else if (path.includes("/pages/")) {
            prefix = "../public/assets/imagens/";
        } else {
            prefix = "public/assets/imagens/";
        }

        if (dino.isOriginal || dino.id === "dino_original") {
            return prefix + "dinooriginal.png";
        }
        return prefix + "dinos/" + dino.fileName;
    }

    function applyAvatarToPage() {
        const dino = getEquippedDino();
        const imgPath = resolveDinoPath(dino);

        // Navbar avatars
        const navAvatars = document.querySelectorAll(".navbar__avatar, #navAvatar, #studentAvatar, #navbarAvatar");
        navAvatars.forEach((avatar) => {
            let img = avatar.querySelector("img.navbar__avatar-img");
            if (!img) {
                avatar.textContent = "";
                img = document.createElement("img");
                img.className = "navbar__avatar-img";
                avatar.appendChild(img);
            }
            img.src = imgPath;
            img.alt = "Mascote: " + dino.name;
            avatar.title = "Mascote: " + dino.name;
            avatar.style.padding = "2px";
            avatar.style.background = "linear-gradient(135deg, rgba(133, 199, 242, 0.4), rgba(68, 246, 152, 0.3))";
        });

        // Mascote no Hero da home
        const mascotImgs = document.querySelectorAll("#mascotImg, .hero-mascot img");
        mascotImgs.forEach((img) => {
            img.src = imgPath;
            img.alt = "Mascote " + dino.name;
        });

        // Mascote na página de conquistas e atividades
        const congratsImgs = document.querySelectorAll(".congrats-banner img, .lex-feedback img, .shadow-lex img");
        congratsImgs.forEach((img) => {
            img.src = imgPath;
            img.alt = "Mascote " + dino.name;
        });

        // Avatar no perfil
        const profileAvatar = document.getElementById("profileAvatar");
        if (profileAvatar) {
            let img = profileAvatar.querySelector("img.profile-avatar-img");
            if (!img) {
                profileAvatar.textContent = "";
                img = document.createElement("img");
                img.className = "profile-avatar-img";
                img.style.width = "100%";
                img.style.height = "100%";
                img.style.objectFit = "contain";
                img.style.padding = "4px";
                profileAvatar.appendChild(img);
            }
            img.src = imgPath;
            img.alt = "Mascote: " + dino.name;
        }

        // Live XP nos elementos apropriados se houver valor salvo
        const storedXp = localStorage.getItem("roar_dino_xp");
        if (storedXp !== null) {
            const num = Number(storedXp);
            if (!Number.isNaN(num)) {
                const formatted = num.toLocaleString("pt-BR");
                document.querySelectorAll("#storeUserXp, #xpTotal, #studentXp").forEach((el) => {
                    el.textContent = formatted;
                });
            }
        }
    }

    // Inicialização segura
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyAvatarToPage);
    } else {
        applyAvatarToPage();
    }

    // Observa mudanças de página ou eventos customizados
    window.addEventListener("roar-avatar-changed", applyAvatarToPage);
    window.addEventListener("roar-xp-changed", applyAvatarToPage);
    window.addEventListener("storage", (e) => {
        if (e.key === "roar_equipped_dino" || e.key === "roar_dino_xp") {
            applyAvatarToPage();
        }
    });

    // Torna disponível globalmente
    window.ROAR_SYNC_AVATAR = applyAvatarToPage;
})();
