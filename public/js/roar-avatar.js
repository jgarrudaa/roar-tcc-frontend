/* ============================================================
   ROAR — roar-avatar.js
   Sincronizador automático de Mascote & Avatar em todas as páginas
   ============================================================ */

(function () {
    // Agora usando exatamente os IDs e nomes que existem no Supabase
    const DINO_CATALOG = [
        { id: 1, name: "Dino Padrão", fileName: "dinooriginal.png", isOriginal: true },
        { id: 2, name: "Dino Basquete", fileName: "dino_basquete.png", isOriginal: false },
        { id: 3, name: "Dino Explorador", fileName: "dino_explorador.png", isOriginal: false },
        { id: 4, name: "Dino Jogador (Brasil)", fileName: "dino_jogador.png", isOriginal: false },
        { id: 5, name: "Dino Cowboy", fileName: "dino_cowboy.png", isOriginal: false },
        { id: 6, name: "Dino Cachorro-Quente", fileName: "dino_hotdog.png", isOriginal: false },
        { id: 7, name: "Dino Militar", fileName: "dino_militar.png", isOriginal: false },
        { id: 8, name: "Dino Ninja", fileName: "dino_ninja.png", isOriginal: false },
        { id: 9, name: "Dino Cavaleiro", fileName: "dino_cavaleiro.png", isOriginal: false },
        { id: 10, name: "Dino Astronauta", fileName: "dino_astronauta.png", isOriginal: false },
        { id: 11, name: "Dino Robô", fileName: "dino_robo.png", isOriginal: false },
        { id: 12, name: "Dino Rico", fileName: "dino_rico.png", isOriginal: false },
        { id: 13, name: "Dino Rei", fileName: "dino_rei.png", isOriginal: false }
    ];

    function getEquippedDino() {
        const idString = localStorage.getItem("roar_equipped_dino");
        // Converte para número e procura. Se falhar, usa o ID 1
        const id = Number(idString) || 1;
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

        if (dino.isOriginal || dino.id === 1) {
            return prefix + "dinooriginal.png";
        }
        return prefix + "dinos/" + dino.fileName;
    }

    function applyAvatarToPage() {
        const dino = getEquippedDino();
        const imgPath = resolveDinoPath(dino);

        // 1. Bolinhas do Navbar (Canto superior direito)
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

        // 2. Avatar Gigante do Perfil (#profileAvatar)
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

        // 3. Mascote na Home (#mascotImg), Conquistas e Feedback de Atividades
        const mascotImgs = document.querySelectorAll("#mascotImg, .hero-mascot img, .congrats-banner img, .lex-feedback img, .shadow-lex img");
        mascotImgs.forEach((img) => {
            img.src = imgPath;
            img.alt = "Mascote " + dino.name;
        });

        // 4. Live XP
        const storedXp = localStorage.getItem("roar_dino_xp");
        if (storedXp !== null) {
            const num = Number(storedXp);
            if (!Number.isNaN(num)) {
                const formatted = num.toLocaleString("pt-BR");
                document.querySelectorAll("#storeUserXp, #xpTotal, #studentXp").forEach((el) => {
                    el.textContent = formatted;
                });

                // Formatação específica para o detalhe no perfil
                const xpDetail = document.getElementById("studentXpDetail");
                if (xpDetail) {
                    xpDetail.textContent = formatted + " XP";
                }
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

    // Torna disponível globalmente para outras scripts chamarem
    window.ROAR_SYNC_AVATAR = applyAvatarToPage;

    // Assegura compatibilidade com o objeto global antigo se for chamado
    if (!window.ROARAvatar) {
        window.ROARAvatar = {
            applyToPage: applyAvatarToPage,
            getXp: () => Number(localStorage.getItem("roar_dino_xp") || 0)
        };
    }
})();