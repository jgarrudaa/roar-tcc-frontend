/* Comportamento extraído de inicio.html. */

// ============================================================
// DADOS CENTRALIZADOS (via roar-storage.js)
// ============================================================

const categorias = [
    { name: 'Corpo Humano', icon: 'fi fi-br-portrait',      color: 'a', link: 'atividade.html?modulo=corpo-humano&etapa=1' },
    { name: 'Cores',        icon: 'fi fi-br-palette',       color: 'b', link: 'atividades.html' },
    { name: 'Animais',      icon: 'fi fi-br-paw',           color: 'a', link: 'atividades.html' },
    { name: 'Emoções',      icon: 'fi fi-br-astonished-face',    color: 'b', link: 'atividades.html' },
    { name: 'Comida',       icon: 'fi fi-br-hamburger',   color: 'b', link: 'atividades.html' },
    { name: 'Família',      icon: 'fi fi-br-users',         color: 'a', link: 'atividades.html' },
    { name: 'Casa',         icon: 'fi fi-br-house-chimney', color: 'a', link: 'atividades.html' },
    { name: 'Escola',       icon: 'fi fi-br-backpack',      color: 'b', link: 'atividades.html' },
];

const mascotMsgs = [
    'Você está indo\nmuito bem! <i class="fi fi-br-star u-pages-aluno-inicio-008"></i>',
    'Continue assim,\ncampeão! <i class="fi fi-br-trophy u-pages-aluno-inicio-008"></i>',
    'Hoje é um ótimo\ndia para aprender!',
    'Você consegue! <i class="fi fi-br-sparkles u-pages-aluno-inicio-008"></i>',
    'Que orgulho de você!',
];
let mascotIdx = 0;

// ============================================================
// INIT
// ============================================================
function init() {
    const data = ROAR.init();

    // Navbar
    document.getElementById('userName').textContent = data.userName;
    document.getElementById('navAvatar').textContent = data.userInitial;

    // Stats
    document.getElementById('xpTotal').textContent    = data.xp.toLocaleString('pt-BR');

    document.getElementById('streakDays').textContent  = data.streak + ' dias';
    document.getElementById('progressoGeral').textContent = data.progressoGeral + '%';

    // Hero
    document.getElementById('heroProgress').style.width = data.heroCat.progress + '%';
    document.getElementById('heroPercent').textContent   = data.heroCat.progress + '% concluído';

    // Categorias
    const grid = document.getElementById('categoriasGrid');
    categorias.forEach(cat => {
        const el = document.createElement('div');
        el.className = 'cat-card';
        el.onclick = () => window.location.href = cat.link;
        el.innerHTML = `
            <div class="cat-card__icon cat-card__icon--${cat.color}">
                <i class="${cat.icon}"></i>
            </div>
            <span class="cat-card__name">${cat.name}</span>
        `;
        grid.appendChild(el);
    });

    // Recentes
    const recentList = document.getElementById('recentList');
    data.recent.forEach(item => {
        const el = document.createElement('div');
        el.className = 'recent-item';
        el.innerHTML = `
            <div class="recent-item__icon activity-card__icon activity-card__icon--${item.color}">
                <i class="${item.icon}"></i>
            </div>
            <div class="recent-item__info">
                <div class="recent-item__name">${item.name}</div>
                <div class="recent-item__meta">${item.cat}</div>
            </div>
            <span class="badge badge--blue">+${item.xp} XP</span>
        `;
        recentList.appendChild(el);
    });
}

// ============================================================
// MASCOTE
// ============================================================
function changeMascotMsg() {
    mascotIdx = (mascotIdx + 1) % mascotMsgs.length;
    document.getElementById('mascotBubble').innerHTML = mascotMsgs[mascotIdx].replace('\n', '<br>');
}

// ============================================================
// SIDEBAR (inicializado por roar-sidebar.js)
// ============================================================

// ============================================================
// NOTIFICAÇÃO (demo)
// ============================================================
document.getElementById('btnNotif').addEventListener('click', () => {
    showToast('Nenhuma notificação nova', 'info');
});

// showToast is provided by roar-sidebar.js

// ============================================================
// START
// ============================================================
init();
