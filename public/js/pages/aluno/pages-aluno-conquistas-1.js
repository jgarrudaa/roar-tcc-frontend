/* Comportamento extraído de conquistas.html. */

const allMedals = [
    { name: 'Primeira Aula',   desc: 'Complete sua primeira atividade.',     icon: 'fi fi-br-star',      color: '#ffd700', bg: 'rgba(255,215,0,0.2)',   date: '10/06/2026', locked: false },
    { name: '7 Dias Seguidos', desc: 'Estude 7 dias consecutivos.',          icon: 'fi fi-br-flame',     color: '#f97316', bg: 'rgba(249,115,22,0.2)',  date: '17/06/2026', locked: false },
    { name: '100% Acertos',    desc: 'Acerte tudo em uma atividade.',        icon: 'fi fi-br-check',     color: '#22c55e', bg: 'rgba(34,197,94,0.2)',   date: '20/06/2026', locked: false },
    { name: '10 Atividades',   desc: 'Complete 10 atividades.',              icon: 'fi fi-br-trophy',    color: '#a855f7', bg: 'rgba(168,85,247,0.2)',  date: '01/07/2026', locked: false },
    { name: '30 Dias',         desc: 'Estude por 30 dias seguidos.',         icon: 'fi fi-br-calendar',  color: '#3b82f6', bg: 'rgba(59,130,246,0.2)',  date: null, locked: true  },
    { name: 'Perfeito!',       desc: 'Acerte tudo em 5 atividades seguidas.',icon: 'fi fi-br-medal',     color: '#f59e0b', bg: 'rgba(245,158,11,0.2)',  date: null, locked: true  },
    { name: 'Explorador',      desc: 'Complete atividades de 5 categorias.', icon: 'fi fi-br-compass',   color: '#06b6d4', bg: 'rgba(6,182,212,0.2)',   date: null, locked: true  },
    { name: 'Super Aluno',     desc: 'Alcance 5000 XP.',                     icon: 'fi fi-br-graduation-cap', color: '#8b5cf6', bg: 'rgba(139,92,246,0.2)', date: null, locked: true },
    { name: 'Veloz',           desc: 'Complete uma atividade em menos de 2 min.', icon: 'fi fi-br-time-fast', color: '#ef4444', bg: 'rgba(239,68,68,0.2)', date: null, locked: true },
    { name: '50 Atividades',   desc: 'Complete 50 atividades.',              icon: 'fi fi-br-list',      color: '#10b981', bg: 'rgba(16,185,129,0.2)', date: null, locked: true  },
    { name: 'Comunicador',     desc: 'Use todas as formas de atividade.',    icon: 'fi fi-br-comment',   color: '#f472b6', bg: 'rgba(244,114,182,0.2)', date: null, locked: true },
    { name: 'Mestre das Cores',desc: 'Domine a categoria Cores.',            icon: 'fi fi-br-palette',   color: '#a3e635', bg: 'rgba(163,230,53,0.2)', date: null, locked: true },
];

function renderMedal(m, locked) {
    const div = document.createElement('div');
    div.className = `medal-big${locked ? ' locked' : ''}`;
    div.setAttribute('data-tooltip', locked ? 'Bloqueado: ' + m.desc : m.name);
    div.innerHTML = `
        <div class="medal-big__icon" style="background:${m.bg}">
            <i class="${m.icon}" style="color:${m.color}"></i>
        </div>
        <div class="medal-big__name">${m.name}</div>
        <div class="medal-big__desc">${m.desc}</div>
        ${!locked && m.date ? `<div class="medal-big__date"><i class="fi fi-br-calendar u-pages-aluno-conquistas-005"></i> ${m.date}</div>` : ''}
    `;
    return div;
}

const cGrid = document.getElementById('conquistadasGrid');
const bGrid = document.getElementById('bloqueadasGrid');
allMedals.forEach(m => {
    if (!m.locked) cGrid.appendChild(renderMedal(m, false));
    else            bGrid.appendChild(renderMedal(m, true));
});

const sidebar  = document.getElementById('sidebar');
const toggle   = document.getElementById('sidebarToggle');
const backdrop = document.getElementById('sidebarBackdrop');
const mobileBtn= document.getElementById('mobileMenuBtn');
toggle.addEventListener('click', () => sidebar.classList.toggle('sidebar--collapsed'));
mobileBtn.addEventListener('click', () => { sidebar.classList.add('open'); backdrop.classList.add('open'); });
backdrop.addEventListener('click', () => { sidebar.classList.remove('open'); backdrop.classList.remove('open'); });
