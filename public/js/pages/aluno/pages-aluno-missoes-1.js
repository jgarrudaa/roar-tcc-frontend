/* Comportamento extraído de missoes.html. */

const missions = [
    { id:'m1', name:'Complete uma atividade', desc:'Realize qualquer atividade disponível.', icon:'fi fi-br-puzzle-pieces', color:'a', xp:50, done:true },
    { id:'m2', name:'Acerte 80% ou mais',     desc:'Obtenha pelo menos 80% de acertos.',    icon:'fi fi-br-check-circle', color:'b', xp:40, done:false },
    { id:'m3', name:'Estude por 10 minutos',  desc:'Fique 10 min estudando.',                icon:'fi fi-br-time-fast',    color:'a', xp:30, done:false },
    { id:'m4', name:'Explore uma categoria',  desc:'Abra uma categoria nova.',               icon:'fi fi-br-book',         color:'b', xp:40, done:false },
    { id:'m5', name:'Assista o mascote',      desc:'Clique no mascote 3 vezes.',             icon:'fi fi-br-astonished-face',        color:'a', xp:40, done:false },
];

// Estado
let doneMissions = JSON.parse(localStorage.getItem('roarMissions') || JSON.stringify(missions.filter(m=>m.done).map(m=>m.id)));

function updateBanner() {
    const count = doneMissions.length;
    document.getElementById('doneCount').textContent = count;
    document.getElementById('dayProgress').style.width = (count / missions.length * 100) + '%';
}

function renderMissions() {
    const list = document.getElementById('missoesList');
    list.innerHTML = '';
    missions.forEach(m => {
        const isDone = doneMissions.includes(m.id);
        const div = document.createElement('div');
        div.className = `mission-card${isDone?' done':''}`;
        div.id = 'mc-' + m.id;
        const iconClass = m.color === 'a' ? 'activity-card__icon--blue' : 'activity-card__icon--green';
        div.innerHTML = `
            <div class="mission-card__icon ${iconClass}">
                <i class="${m.icon}"></i>
            </div>
            <div class="mission-card__body">
                <div class="mission-card__name">${m.name}</div>
                <div class="mission-card__desc">${m.desc}</div>
                <div class="mission-card__reward">
                    <span><i class="fi fi-br-star u-pages-aluno-missoes-004"></i> ${m.xp} XP</span>
                </div>
            </div>
            <div class="mission-card__check" id="chk-${m.id}" title="Marcar como concluída" onclick="toggleMission('${m.id}')">
                <i class="fi fi-br-check"></i>
            </div>
        `;
        list.appendChild(div);
    });
    updateBanner();
}

function toggleMission(id) {
    const idx = doneMissions.indexOf(id);
    if (idx === -1) {
        doneMissions.push(id);
        window.roarSound?.playAchievement?.();
        showToast('Missão concluída! +XP', 'success');
    } else {
        doneMissions.splice(idx, 1);
        window.roarSound?.playToggle?.(false);
    }
    localStorage.setItem('roarMissions', JSON.stringify(doneMissions));
    renderMissions();
}

// Data atual
const now = new Date();
document.getElementById('dateLabel').textContent = now.toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' });

function showToast(msg, type='') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast${type?' toast--'+type:''}`;
    t.innerHTML = `<i class="fi fi-br-check"></i> ${msg}`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

renderMissions();
