/* Comportamento extraído de desempenho.html. */

// ============================================================
// DADOS
// ============================================================
const weekData  = [40, 75, 55, 120, 90, 150, 80];
const weekLabels= ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
const monthData = [320, 280, 450, 510];
const monthLbls = ['Sem 1','Sem 2','Sem 3','Sem 4'];

const catData = [
    { name: 'Corpo Humano', icon: 'fi fi-br-user',      color: '#85C7F2', prog: 70 },
    { name: 'Cores',        icon: 'fi fi-br-palette',    color: '#44F698', prog: 100 },
    { name: 'Animais',      icon: 'fi fi-br-cat',        color: '#85C7F2', prog: 50 },
    { name: 'Emoções',      icon: 'fi fi-br-astonished-face', color: '#44F698', prog: 60 },
    { name: 'Comida',       icon: 'fi fi-br-hamburger',      color: '#44F698', prog: 0 },
];

const rankData = [
    { pos: 1, name: 'Ana Clara',  xp: 1850, me: false },
    { pos: 2, name: 'Bruno',      xp: 1620, me: false },
    { pos: 3, name: 'Leandro',    xp: 1240, me: true  },
    { pos: 4, name: 'Mariana',    xp: 980,  me: false },
    { pos: 5, name: 'Pedro',      xp: 760,  me: false },
];

const medals = [
    { name: 'Primeira Aula',   icon: 'fi fi-br-star',      color: '#ffd700', bg: 'rgba(255,215,0,0.2)',  locked: false },
    { name: '7 Dias Seguidos', icon: 'fi fi-br-flame',      color: '#f97316', bg: 'rgba(249,115,22,0.2)', locked: false },
    { name: '100% Acertos',    icon: 'fi fi-br-check',      color: '#22c55e', bg: 'rgba(34,197,94,0.2)',  locked: false },
    { name: '10 Atividades',   icon: 'fi fi-br-trophy',     color: '#a855f7', bg: 'rgba(168,85,247,0.2)', locked: false },
    { name: '30 Dias',         icon: 'fi fi-br-calendar',   color: '#3b82f6', bg: 'rgba(59,130,246,0.2)', locked: true  },
    { name: 'Perfeito!',       icon: 'fi fi-br-medal',      color: '#f59e0b', bg: 'rgba(245,158,11,0.2)', locked: true  },
];

// ============================================================
// GRÁFICO DE BARRAS
// ============================================================
let currentData   = weekData;
let currentLabels = weekLabels;
let todayIdx      = 5; // Sábado

function renderBarChart() {
    const chart = document.getElementById('barChart');
    chart.innerHTML = '';
    const max = Math.max(...currentData);

    currentData.forEach((val, i) => {
        const col = document.createElement('div');
        col.className = 'bar-chart__col';

        const pct = max > 0 ? (val / max) * 100 : 0;
        const isHighlight = i === todayIdx;

        col.innerHTML = `
            <div class="bar-chart__bar${isHighlight ? ' highlight' : ''} u-pages-aluno-desempenho-009" data-h="${pct}">
                <span class="bar-chart__val">${val}</span>
            </div>
            <span class="bar-chart__label">${currentLabels[i]}</span>
        `;
        chart.appendChild(col);
    });

    // Animar as barras
    requestAnimationFrame(() => {
        chart.querySelectorAll('.bar-chart__bar').forEach(bar => {
            bar.style.height = bar.dataset.h + '%';
        });
    });
}

// ============================================================
// DONUT CANVAS
// ============================================================
function drawDonut() {
    const canvas = document.getElementById('donutCanvas');
    if (!canvas) return;
    const ctx    = canvas.getContext('2d');
    const cx = 65, cy = 65, r = 52, lw = 18;
    const acc = 0.82;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    ctx.clearRect(0, 0, 130, 130);

    // Fundo
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)';
    ctx.lineWidth = lw;
    ctx.stroke();

    // Progresso
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + acc * Math.PI * 2);
    ctx.strokeStyle = isDark ? '#3B82F6' : '#1F6CE3';
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.stroke();
}

window.addEventListener('roar-theme-changed', () => {
    drawDonut();
});

// ============================================================
// CATEGORIAS
// ============================================================
function renderCatProgress() {
    const list = document.getElementById('catProgressList');
    list.innerHTML = '';
    catData.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'category-progress-item';
        div.innerHTML = `
            <div class="cat-progress-icon" style="background:${cat.color}33">
                <i class="${cat.icon}" style="color:${cat.color}cc;filter:brightness(0.7)"></i>
            </div>
            <div class="cat-progress-info">
                <div class="cat-progress-name">${cat.name}</div>
                <div class="u-pages-aluno-desempenho-010">
                    <div class="progress-wrap u-pages-aluno-desempenho-011">
                        <div class="progress-bar" style="width:${cat.prog}%;background:${cat.color === '#44F698' ? 'var(--c-primary)' : 'var(--c-blue-mid)'}"></div>
                    </div>
                    <span class="u-pages-aluno-desempenho-012">${cat.prog}%</span>
                </div>
            </div>
        `;
        list.appendChild(div);
    });
}



// ============================================================
// MEDALHAS
// ============================================================
function renderMedals() {
    const grid = document.getElementById('medalsGrid');
    grid.innerHTML = '';
    medals.forEach(m => {
        const div = document.createElement('div');
        div.className = `medal-card${m.locked ? ' locked' : ''}`;
        div.setAttribute('data-tooltip', m.locked ? 'Bloqueado' : m.name);
        div.innerHTML = `
            <div class="medal-card__icon" style="background:${m.bg}">
                <i class="${m.icon}" style="color:${m.color}"></i>
            </div>
            <div class="medal-card__name">${m.name}</div>
        `;
        grid.appendChild(div);
    });
}

// ============================================================
// ABAS
// ============================================================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        if (tab === 'semanal' || tab === 'visao') {
            currentData   = weekData;
            currentLabels = weekLabels;
            todayIdx      = 5;
            document.getElementById('periodoLabel').textContent = 'Semanal';
        } else {
            currentData   = monthData;
            currentLabels = monthLbls;
            todayIdx      = 2;
            document.getElementById('periodoLabel').textContent = 'Mensal';
        }
        renderBarChart();
    });
});

// ============================================================
// SIDEBAR
// ============================================================
const sidebar  = document.getElementById('sidebar');
const toggle   = document.getElementById('sidebarToggle');
const backdrop = document.getElementById('sidebarBackdrop');
const mobileBtn= document.getElementById('mobileMenuBtn');

toggle.addEventListener('click', () => sidebar.classList.toggle('sidebar--collapsed'));
mobileBtn.addEventListener('click', () => { sidebar.classList.add('open'); backdrop.classList.add('open'); });
backdrop.addEventListener('click', () => { sidebar.classList.remove('open'); backdrop.classList.remove('open'); });

// INIT
renderBarChart();
drawDonut();
renderCatProgress();
renderMedals();
