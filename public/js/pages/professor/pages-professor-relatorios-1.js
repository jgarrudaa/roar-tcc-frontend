/* Comportamento extraído de relatorios.html. */

// ================================================================
// DADOS
// ================================================================
const AVATAR_COLORS = [
    '#244D8C','#1a7c49','#7c3aed','#b07000',
    '#1F6CE3','#0e7490','#be185d','#c2410c',
];
const NIVEL_INFO = {
    1: { text: 'N\u00edvel 1 \u2014 Suporte Visual Puro', cls: 'tag-1', heroCls: 'hero-lvl1', color: '#1a7c49' },
    2: { text: 'N\u00edvel 2 \u2014 Aprendiz Guiado', cls: 'tag-2', heroCls: 'hero-lvl2', color: '#1e5a9e' },
    3: { text: 'N\u00edvel 3 \u2014 Autonomia Contextual', cls: 'tag-3', heroCls: 'hero-lvl3', color: '#7c3aed' },
};

const studentsData = [
    {
        id:1, name:'Leandro Matos',   turma:'A', nivel:1, xp:1240, prog:70,  last:'Hoje',
        avatarColor: AVATAR_COLORS[0],
        streakDias: 5, totalSessoes: 18, tempoMedio: 12,
        historicoSemana: [60, 75, 55, 80, 70, 65, 70],
        atividades: [
            { nome:'Partes do Corpo', tipo:'Arraste',    acertos:8,  erros:2, xp:50,  status:'done', data:'08/08' },
            { nome:'Cores B\u00e1sicas',   tipo:'Sele\u00e7\u00e3o',    acertos:6,  erros:4, xp:40,  status:'done', data:'09/08' },
            { nome:'Emo\u00e7\u00f5es',         tipo:'Associa\u00e7\u00e3o', acertos:5,  erros:3, xp:35,  status:'done', data:'10/08' },
            { nome:'Animais',         tipo:'Input',      acertos:7,  erros:3, xp:40,  status:'done', data:'11/08' },
            { nome:'N\u00fameros 1-10',    tipo:'Sequ\u00eancia',  acertos:3,  erros:7, xp:15,  status:'prog', data:'12/08' },
            { nome:'Frutas',          tipo:'Arraste',    acertos:0,  erros:0, xp:0,   status:'none', data:'\u2014'  },
        ]
    },
    {
        id:2, name:'Ana Clara Souza', turma:'A', nivel:3, xp:1850, prog:92,  last:'Hoje',
        avatarColor: AVATAR_COLORS[1],
        streakDias: 14, totalSessoes: 34, tempoMedio: 22,
        historicoSemana: [85, 90, 88, 95, 92, 88, 92],
        atividades: [
            { nome:'Partes do Corpo', tipo:'Arraste',    acertos:10, erros:0, xp:50,  status:'done', data:'06/08' },
            { nome:'Cores B\u00e1sicas',   tipo:'Sele\u00e7\u00e3o',    acertos:9,  erros:1, xp:40,  status:'done', data:'07/08' },
            { nome:'Emo\u00e7\u00f5es',         tipo:'Associa\u00e7\u00e3o', acertos:8,  erros:2, xp:38,  status:'done', data:'09/08' },
            { nome:'Animais',         tipo:'Input',      acertos:10, erros:0, xp:45,  status:'done', data:'10/08' },
            { nome:'N\u00fameros 1-10',    tipo:'Sequ\u00eancia',  acertos:9,  erros:1, xp:48,  status:'done', data:'11/08' },
            { nome:'Frutas',          tipo:'Arraste',    acertos:8,  erros:2, xp:40,  status:'done', data:'13/08' },
        ]
    },
    {
        id:3, name:'Bruno Ferreira',  turma:'A', nivel:2, xp:1620, prog:55,  last:'Ontem',
        avatarColor: AVATAR_COLORS[2],
        streakDias: 2, totalSessoes: 12, tempoMedio: 9,
        historicoSemana: [50, 60, 45, 55, 40, 55, 55],
        atividades: [
            { nome:'Partes do Corpo', tipo:'Arraste',    acertos:7,  erros:3, xp:40,  status:'done', data:'07/08' },
            { nome:'Cores B\u00e1sicas',   tipo:'Sele\u00e7\u00e3o',    acertos:4,  erros:6, xp:22,  status:'done', data:'08/08' },
            { nome:'Emo\u00e7\u00f5es',         tipo:'Associa\u00e7\u00e3o', acertos:5,  erros:5, xp:25,  status:'done', data:'10/08' },
            { nome:'Animais',         tipo:'Input',      acertos:2,  erros:8, xp:10,  status:'prog', data:'11/08' },
            { nome:'N\u00fameros 1-10',    tipo:'Sequ\u00eancia',  acertos:0,  erros:0, xp:0,   status:'none', data:'\u2014'  },
            { nome:'Frutas',          tipo:'Arraste',    acertos:0,  erros:0, xp:0,   status:'none', data:'\u2014'  },
        ]
    },
    {
        id:4, name:'Mariana Lima',    turma:'A', nivel:2, xp:980,  prog:80,  last:'Hoje',
        avatarColor: AVATAR_COLORS[3],
        streakDias: 7, totalSessoes: 20, tempoMedio: 15,
        historicoSemana: [75, 80, 78, 82, 79, 80, 80],
        atividades: [
            { nome:'Partes do Corpo', tipo:'Arraste',    acertos:9,  erros:1, xp:50,  status:'done', data:'08/08' },
            { nome:'Cores B\u00e1sicas',   tipo:'Sele\u00e7\u00e3o',    acertos:7,  erros:3, xp:38,  status:'done', data:'09/08' },
            { nome:'Emo\u00e7\u00f5es',         tipo:'Associa\u00e7\u00e3o', acertos:6,  erros:2, xp:36,  status:'done', data:'10/08' },
            { nome:'Animais',         tipo:'Input',      acertos:8,  erros:2, xp:43,  status:'done', data:'11/08' },
            { nome:'N\u00fameros 1-10',    tipo:'Sequ\u00eancia',  acertos:4,  erros:3, xp:28,  status:'prog', data:'13/08' },
            { nome:'Frutas',          tipo:'Arraste',    acertos:0,  erros:0, xp:0,   status:'none', data:'\u2014'  },
        ]
    },
    {
        id:5, name:'Gabriel Santos',  turma:'B', nivel:1, xp:760,  prog:42,  last:'h\u00e1 3 dias',
        avatarColor: AVATAR_COLORS[4],
        streakDias: 0, totalSessoes: 8, tempoMedio: 7,
        historicoSemana: [35, 42, 38, 45, 40, 30, 42],
        atividades: [
            { nome:'Partes do Corpo', tipo:'Arraste',    acertos:4,  erros:6, xp:20,  status:'done', data:'05/08' },
            { nome:'Cores B\u00e1sicas',   tipo:'Sele\u00e7\u00e3o',    acertos:5,  erros:5, xp:25,  status:'done', data:'07/08' },
            { nome:'Emo\u00e7\u00f5es',         tipo:'Associa\u00e7\u00e3o', acertos:2,  erros:8, xp:8,   status:'prog', data:'09/08' },
            { nome:'Animais',         tipo:'Input',      acertos:0,  erros:0, xp:0,   status:'none', data:'\u2014'  },
            { nome:'N\u00fameros 1-10',    tipo:'Sequ\u00eancia',  acertos:0,  erros:0, xp:0,   status:'none', data:'\u2014'  },
            { nome:'Frutas',          tipo:'Arraste',    acertos:0,  erros:0, xp:0,   status:'none', data:'\u2014'  },
        ]
    },
    {
        id:6, name:'Isabela Costa',   turma:'B', nivel:3, xp:2100, prog:95,  last:'Hoje',
        avatarColor: AVATAR_COLORS[5],
        streakDias: 21, totalSessoes: 40, tempoMedio: 25,
        historicoSemana: [90, 95, 92, 97, 94, 95, 95],
        atividades: [
            { nome:'Partes do Corpo', tipo:'Arraste',    acertos:10, erros:0, xp:50,  status:'done', data:'04/08' },
            { nome:'Cores B\u00e1sicas',   tipo:'Sele\u00e7\u00e3o',    acertos:10, erros:0, xp:40,  status:'done', data:'05/08' },
            { nome:'Emo\u00e7\u00f5es',         tipo:'Associa\u00e7\u00e3o', acertos:9,  erros:1, xp:40,  status:'done', data:'06/08' },
            { nome:'Animais',         tipo:'Input',      acertos:9,  erros:1, xp:44,  status:'done', data:'08/08' },
            { nome:'N\u00fameros 1-10',    tipo:'Sequ\u00eancia',  acertos:10, erros:0, xp:48,  status:'done', data:'10/08' },
            { nome:'Frutas',          tipo:'Arraste',    acertos:9,  erros:1, xp:40,  status:'done', data:'12/08' },
        ]
    },
    {
        id:7, name:'Rafael Mendes',   turma:'B', nivel:2, xp:1380, prog:64,  last:'Ontem',
        avatarColor: AVATAR_COLORS[6],
        streakDias: 3, totalSessoes: 15, tempoMedio: 11,
        historicoSemana: [58, 65, 62, 68, 60, 64, 64],
        atividades: [
            { nome:'Partes do Corpo', tipo:'Arraste',    acertos:6,  erros:4, xp:35,  status:'done', data:'07/08' },
            { nome:'Cores B\u00e1sicas',   tipo:'Sele\u00e7\u00e3o',    acertos:7,  erros:3, xp:36,  status:'done', data:'08/08' },
            { nome:'Emo\u00e7\u00f5es',         tipo:'Associa\u00e7\u00e3o', acertos:4,  erros:6, xp:20,  status:'done', data:'09/08' },
            { nome:'Animais',         tipo:'Input',      acertos:5,  erros:5, xp:25,  status:'prog', data:'11/08' },
            { nome:'N\u00fameros 1-10',    tipo:'Sequ\u00eancia',  acertos:3,  erros:4, xp:15,  status:'prog', data:'12/08' },
            { nome:'Frutas',          tipo:'Arraste',    acertos:0,  erros:0, xp:0,   status:'none', data:'\u2014'  },
        ]
    },
    {
        id:8, name:'Valentina Rocha', turma:'A', nivel:1, xp:540,  prog:28,  last:'h\u00e1 5 dias',
        avatarColor: AVATAR_COLORS[7],
        streakDias: 0, totalSessoes: 5, tempoMedio: 6,
        historicoSemana: [20, 28, 25, 30, 22, 15, 28],
        atividades: [
            { nome:'Partes do Corpo', tipo:'Arraste',    acertos:3,  erros:7, xp:15,  status:'done', data:'06/08' },
            { nome:'Cores B\u00e1sicas',   tipo:'Sele\u00e7\u00e3o',    acertos:2,  erros:5, xp:8,   status:'prog', data:'09/08' },
            { nome:'Emo\u00e7\u00f5es',         tipo:'Associa\u00e7\u00e3o', acertos:0,  erros:0, xp:0,   status:'none', data:'\u2014'  },
            { nome:'Animais',         tipo:'Input',      acertos:0,  erros:0, xp:0,   status:'none', data:'\u2014'  },
            { nome:'N\u00fameros 1-10',    tipo:'Sequ\u00eancia',  acertos:0,  erros:0, xp:0,   status:'none', data:'\u2014'  },
            { nome:'Frutas',          tipo:'Arraste',    acertos:0,  erros:0, xp:0,   status:'none', data:'\u2014'  },
        ]
    },
];

// ================================================================
// ESTADO
// ================================================================
let selectedId = 1;
const DIAS = ['Seg','Ter','Qua','Qui','Sex','S\u00e1b','Dom'];

// ================================================================
// SIDEBAR DE ALUNOS
// ================================================================
function renderStudentList() {
    const list = document.getElementById('studentList');
    const sel  = document.getElementById('mobileSel');
    list.innerHTML = '';
    sel.innerHTML  = '';
    studentsData.forEach(s => {
        const progCls = s.prog>=80?'#44F698':s.prog>=50?'var(--c-blue-mid)':'#ef4444';
        const item = document.createElement('div');
        item.className = 'student-item' + (s.id===selectedId?' active':'');
        item.id = `si-${s.id}`;
        item.innerHTML = `
            <div class="si-av" style="background:${s.avatarColor}">${s.name[0]}</div>
            <div>
                <div class="si-name">${s.name}</div>
                <div class="si-turma">Turma ${s.turma}</div>
            </div>
            <div class="si-prog" style="color:${progCls}">${s.prog}%</div>
        `;
        item.addEventListener('click', () => selecionarAluno(s.id));
        list.appendChild(item);

        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name + ' (Turma ' + s.turma + ')';
        if(s.id===selectedId) opt.selected = true;
        sel.appendChild(opt);
    });
}

// ================================================================
// SELECIONAR ALUNO â†’ GERAR DASHBOARD
// ================================================================
function selecionarAluno(id) {
    selectedId = id;
    document.querySelectorAll('.student-item').forEach(el => el.classList.remove('active'));
    const si = document.getElementById(`si-${id}`);
    if(si) si.classList.add('active');
    renderDashboard();
}

// ================================================================
// RENDER DASHBOARD COMPLETO
// ================================================================
function renderDashboard() {
    const s   = studentsData.find(x => x.id===selectedId);
    const nv  = NIVEL_INFO[s.nivel];
    const area = document.getElementById('dashboardArea');

    // CÃ¡lculos gerais
    const totalAc = s.atividades.reduce((a,t)=>a+t.acertos, 0);
    const totalEr = s.atividades.reduce((a,t)=>a+t.erros,   0);
    const totalXP = s.atividades.reduce((a,t)=>a+t.xp,      0);
    const tot     = totalAc + totalEr;
    const taxa    = tot>0 ? Math.round((totalAc/tot)*100) : 0;
    const feitas  = s.atividades.filter(a=>a.status==='done').length;
    const temasFortes = s.atividades.filter(a=>{
        const t=a.acertos+a.erros; return t>0 && (a.acertos/t)>=0.7;
    }).map(a=>a.nome);
    const temasFracos = s.atividades.filter(a=>{
        const t=a.acertos+a.erros; return t>0 && (a.acertos/t)<0.7;
    }).map(a=>a.nome);
    const maxHist = Math.max(...s.historicoSemana, 1);

    area.innerHTML = `

    <!-- 1. HERO CARD -->
    <div class="aluno-hero ${nv.heroCls}">
        <div class="aluno-hero__top">
            <div class="hero-av" style="background:${s.avatarColor}">${s.name[0]}</div>
            <div class="hero-info">
                <div class="hero-info__name">${s.name}</div>
                <div class="hero-info__meta">Turma ${s.turma} &middot; \u00daltimo acesso: ${s.last}</div>
                <span class="nivel-tag ${nv.cls}"><i class="fi fi-br-brain"></i>${nv.text}</span>
            </div>
            <div class="u-pages-professor-relatorios-006">
                <div class="u-pages-professor-relatorios-007">${s.prog}%</div>
                <div class="u-pages-professor-relatorios-008">PROGRESSO GERAL</div>
                <div class="progress-wrap u-pages-professor-relatorios-009">
                    <div class="progress-bar ${s.prog>=80?'progress-bar--green':s.prog>=50?'progress-bar--blue':'progress-bar--red'}" style="width:${s.prog}%"></div>
                </div>
            </div>
        </div>
        <div class="hero-kpis">
            <div class="kpi">
                <div class="kpi__icon"><i class="fi fi-br-star u-pages-professor-relatorios-010"></i></div>
                <div class="kpi__val">${s.xp.toLocaleString('pt-BR')}</div>
                <div class="kpi__lbl">XP Total</div>
            </div>
            <div class="kpi">
                <div class="kpi__icon"><i class="fi fi-br-check-circle u-pages-professor-relatorios-011"></i></div>
                <div class="kpi__val">${taxa}%</div>
                <div class="kpi__lbl">Taxa Acerto</div>
            </div>
            <div class="kpi">
                <div class="kpi__icon"><i class="fi fi-br-puzzle-pieces u-pages-professor-relatorios-002"></i></div>
                <div class="kpi__val">${feitas}/${s.atividades.length}</div>
                <div class="kpi__lbl">Conclu\u00eddas</div>
            </div>
            <div class="kpi">
                <div class="kpi__icon"><i class="fi fi-br-flame u-pages-professor-relatorios-012"></i></div>
                <div class="kpi__val">${s.streakDias}</div>
                <div class="kpi__lbl">Dias Streak</div>
            </div>
            <div class="kpi">
                <div class="kpi__icon"><i class="fi fi-br-time-forward u-pages-professor-relatorios-013"></i></div>
                <div class="kpi__val">${s.totalSessoes}</div>
                <div class="kpi__lbl">Sess\u00f5es</div>
            </div>
            <div class="kpi">
                <div class="kpi__icon"><i class="fi fi-br-hourglass-end u-pages-professor-relatorios-014"></i></div>
                <div class="kpi__val">${s.tempoMedio}min</div>
                <div class="kpi__lbl">T. M\u00e9dio</div>
            </div>
        </div>
    </div>

    <!-- 2. GRÃFICOS LADO A LADO -->
    <div class="grid-2">

        <!-- GrÃ¡fico barras: acertos x erros por atividade -->
        <div class="chart-card">
            <div class="chart-title"><i class="fi fi-br-chart-simple"></i>Acertos &times; Erros por Atividade</div>
            <div class="bar-chart" id="barChart"></div>
            <div class="chart-legend u-pages-professor-relatorios-015">
                <span><span class="leg-dot u-pages-professor-relatorios-016"></span>Acertos</span>
                <span><span class="leg-dot u-pages-professor-relatorios-017"></span>Erros</span>
            </div>
        </div>

        <!-- GrÃ¡fico donut: aproveitamento geral -->
        <div class="chart-card">
            <div class="chart-title"><i class="fi fi-br-chart-pie"></i>Aproveitamento Geral</div>
            <div class="donut-wrap">
                <div class="donut" id="donutChart">
                    <div class="donut__center">
                        <div class="donut__pct">${taxa}%</div>
                        <div class="donut__sub">Acertos</div>
                    </div>
                </div>
                <div class="donut-legend">
                    <div class="dl-item">
                        <div class="dl-dot u-pages-professor-relatorios-018"></div>
                        <div class="dl-name">Acertos</div>
                        <div class="dl-val">${totalAc}</div>
                    </div>
                    <div class="dl-item">
                        <div class="dl-dot u-pages-professor-relatorios-019"></div>
                        <div class="dl-name">Erros</div>
                        <div class="dl-val">${totalEr}</div>
                    </div>
                    <div class="dl-item">
                        <div class="dl-dot u-pages-professor-relatorios-020"></div>
                        <div class="dl-name">XP Ganho</div>
                        <div class="dl-val">${totalXP}</div>
                    </div>
                    <div class="dl-item">
                        <div class="dl-dot u-pages-professor-relatorios-021"></div>
                        <div class="dl-name">Conclu\u00eddas</div>
                        <div class="dl-val">${feitas}/${s.atividades.length}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 3. HISTÃ“RICO DA SEMANA + BARRAS HORIZONTAIS -->
    <div class="grid-2">

        <!-- Hist. semana -->
        <div class="chart-card">
            <div class="chart-title"><i class="fi fi-br-calendar-lines"></i>Progresso nos \u00daltimos 7 Dias</div>
            <div class="bar-chart u-pages-professor-relatorios-022" id="weekChart"></div>
            <div class="chart-legend u-pages-professor-relatorios-015">
                <span><span class="leg-dot u-pages-professor-relatorios-023"></span>% Desempenho di\u00e1rio</span>
            </div>
        </div>

        <!-- Barras horizontais: aproveitamento por atividade -->
        <div class="chart-card">
            <div class="chart-title"><i class="fi fi-br-poll-h"></i>Aproveitamento por Atividade</div>
            <div class="hbar-list" id="hbarList"></div>
        </div>
    </div>

    <!-- 4. TABELA DETALHADA -->
    <div class="chart-card">
        <div class="chart-title"><i class="fi fi-br-table-list"></i>Detalhamento Completo por Atividade</div>
        <div class="u-pages-professor-relatorios-024">
        <table class="detail-table">
            <thead>
                <tr>
                    <th>Atividade</th>
                    <th>Tipo</th>
                    <th class="u-pages-professor-relatorios-025">Acertos</th>
                    <th class="u-pages-professor-relatorios-025">Erros</th>
                    <th class="u-pages-professor-relatorios-025">XP</th>
                    <th>Aproveit.</th>
                    <th>Status</th>
                    <th>Data</th>
                </tr>
            </thead>
            <tbody id="detailTable"></tbody>
        </table>
        </div>
    </div>

    <!-- 5. PONTOS FORTES / FRACOS + TIMELINE -->
    <div class="grid-2">

        <!-- Insights pedagÃ³gicos -->
        <div class="chart-card">
            <div class="chart-title"><i class="fi fi-br-lightbulb"></i>An\u00e1lise Pedag\u00f3gica</div>
            <div class="insight-grid">
                <div class="insight-card insight-card--forte">
                    <div class="insight-title"><i class="fi fi-br-check"></i> Pontos Fortes</div>
                    <div id="fortesContainer"></div>
                </div>
                <div class="insight-card insight-card--fraco">
                    <div class="insight-title"><i class="fi fi-br-exclamation"></i> Refor\u00e7o Necess\u00e1rio</div>
                    <div id="fracosContainer"></div>
                </div>
            </div>
            <div class="u-pages-professor-relatorios-026">
                <div class="u-pages-professor-relatorios-027">RECOMENDA\u00c7\u00c3O DO SISTEMA</div>
                <div id="recomContainer" class="u-pages-professor-relatorios-028"></div>
            </div>
        </div>

        <!-- Timeline de atividades -->
        <div class="chart-card">
            <div class="chart-title"><i class="fi fi-br-time-forward"></i>Linha do Tempo de Atividades</div>
            <div class="timeline" id="timelineList"></div>
        </div>
    </div>
    `;

    // Preencher grÃ¡fico de barras (acertos x erros)
    setTimeout(() => {
        const barChart = document.getElementById('barChart');
        const maxV = Math.max(...s.atividades.map(a=>a.acertos+a.erros), 1);
        s.atividades.forEach(a => {
            const hAc = Math.round((a.acertos/maxV)*140);
            const hEr = Math.round((a.erros/maxV)*140);
            const col = document.createElement('div');
            col.className = 'bc-col';
            col.innerHTML = `
                <div class="bc-bars">
                    <div class="bc-bar ac" style="height:${hAc}px" title="${a.acertos} acertos"></div>
                    <div class="bc-bar er" style="height:${hEr}px" title="${a.erros} erros"></div>
                </div>
                <div class="bc-lbl">${a.nome.split(' ')[0]}</div>
            `;
            barChart.appendChild(col);
        });

        // Donut (conic-gradient)
        const pctAc = taxa;
        const pctEr = 100 - taxa;
        document.getElementById('donutChart').style.background =
            `conic-gradient(#44F698 0% ${pctAc}%, #ef4444 ${pctAc}% 100%)`;

        // GrÃ¡fico semana
        const weekChart = document.getElementById('weekChart');
        const maxW = Math.max(...s.historicoSemana, 1);
        s.historicoSemana.forEach((v, i) => {
            const h = Math.round((v/maxW)*100);
            const col = document.createElement('div');
            col.className = 'bc-col';
            col.style.gap = '4px';
            col.innerHTML = `
                <div class="u-pages-professor-relatorios-029">
                    <div style="width:100%;height:${h}px;border-radius:5px 5px 0 0;background:var(--c-blue-mid);opacity:0.75;transition:height 0.8s cubic-bezier(0.34,1.56,0.64,1)" title="${v}%"></div>
                </div>
                <div class="bc-lbl">${DIAS[i]}</div>
            `;
            weekChart.appendChild(col);
        });

        // Barras horizontais
        const hbarList = document.getElementById('hbarList');
        s.atividades.forEach(a => {
            const t = a.acertos + a.erros;
            const pct = t>0 ? Math.round((a.acertos/t)*100) : 0;
            const barCls = pct>=70?'pct-g':pct>=40?'pct-y':'pct-r';
            const item = document.createElement('div');
            item.className = 'hbar-item';
            item.innerHTML = `
                <div class="hbar-lbl" title="${a.nome}">${a.nome}</div>
                <div class="hbar-track">
                    <div class="hbar-fill ${barCls}" style="width:${pct}%"></div>
                </div>
                <div class="hbar-val">${pct}%</div>
            `;
            hbarList.appendChild(item);
        });

        // Tabela detalhada
        const tbody = document.getElementById('detailTable');
        s.atividades.forEach(a => {
            const t = a.acertos + a.erros;
            const pct = t>0 ? Math.round((a.acertos/t)*100) : 0;
            const bCls = pct>=70?'pct-g':pct>=40?'pct-y':'pct-r';
            const statusMap = {
                done: `<span class="pill pill-done"><i class="fi fi-br-check"></i> Conclu\u00edda</span>`,
                prog: `<span class="pill pill-prog"><i class="fi fi-br-time-forward"></i> Em andamento</span>`,
                none: `<span class="pill pill-none"><i class="fi fi-br-minus"></i> N\u00e3o iniciada</span>`,
            };
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="u-pages-professor-relatorios-030">${a.nome}</td>
                <td class="u-pages-professor-relatorios-031">${a.tipo}</td>
                <td class="u-pages-professor-relatorios-032">${a.acertos}</td>
                <td class="u-pages-professor-relatorios-033">${a.erros}</td>
                <td class="u-pages-professor-relatorios-034">${a.xp}</td>
                <td>
                    <div class="u-pages-professor-relatorios-035">
                        <div class="pct-mini-wrap"><div class="pct-mini ${bCls}" style="width:${pct}%"></div></div>
                        <span class="u-pages-professor-relatorios-036">${pct}%</span>
                    </div>
                </td>
                <td>${statusMap[a.status]}</td>
                <td class="u-pages-professor-relatorios-031">${a.data}</td>
            `;
            const tableLabels = ['Atividade', 'Tipo', 'Acertos', 'Erros', 'XP', 'Aproveitamento', 'Status', 'Data'];
            tr.querySelectorAll('td').forEach((cell, index) => cell.dataset.label = tableLabels[index]);
            tbody.appendChild(tr);
        });

        // Pontos fortes / fracos
        const fortesEl = document.getElementById('fortesContainer');
        const fracosEl = document.getElementById('fracosContainer');
        if(temasFortes.length > 0) {
            temasFortes.forEach(t => {
                fortesEl.innerHTML += `<div class="insight-item"><i class="fi fi-br-check u-pages-professor-relatorios-011"></i>${t}</div>`;
            });
        } else {
            fortesEl.innerHTML = `<div class="u-pages-professor-relatorios-037">Nenhum tema com &ge;70% ainda.</div>`;
        }
        if(temasFracos.length > 0) {
            temasFracos.forEach(t => {
                fracosEl.innerHTML += `<div class="insight-item"><i class="fi fi-br-exclamation u-pages-professor-relatorios-038"></i>${t}</div>`;
            });
        } else {
            fracosEl.innerHTML = `<div class="u-pages-professor-relatorios-037">Todos os temas com desempenho satisfat\u00f3rio!</div>`;
        }

        // RecomendaÃ§Ã£o
        const recomMap = {
            1: `Priorizar est\u00edmulos <strong>visuais puros</strong> com hitboxes ampliadas e \u00e1udio autom\u00e1tico. Manter instru\u00e7\u00f5es com palavra isolada em caixa alta.`,
            2: `Utilizar <strong>frases curtas</strong> e diretas (S+V+O). \u00c1udio sob demanda para autonomia parcial. Hitboxes de tamanho padr\u00e3o.`,
            3: `Inserir <strong>contextos e di\u00e1logos</strong> curtos. Instru\u00e7\u00f5es textuais sem \u00e1udio obrigat\u00f3rio. Hitboxes reduzidas para desafio motor.`,
        };
        document.getElementById('recomContainer').innerHTML = recomMap[s.nivel];

        // Timeline
        const tlEl = document.getElementById('timelineList');
        const realizadas = s.atividades.filter(a=>a.status!=='none').reverse();
        realizadas.forEach(a => {
            const dotColor = a.status==='done'?'#44F698':a.status==='prog'?'#f59e0b':'var(--c-border)';
            const t = a.acertos+a.erros;
            const pct = t>0?Math.round((a.acertos/t)*100):0;
            const item = document.createElement('div');
            item.className = 'tl-item';
            item.innerHTML = `
                <div class="tl-dot-col"><div class="tl-dot" style="background:${dotColor}"></div></div>
                <div class="tl-content">
                    <div class="tl-act">${a.nome} <span class="u-pages-professor-relatorios-039">&mdash; ${a.data}</span></div>
                    <div class="tl-sub">${a.tipo} &middot; ${a.acertos} acertos, ${a.erros} erros &middot; ${pct}% &middot; ${a.xp} XP</div>
                </div>
            `;
            tlEl.appendChild(item);
        });
        if(realizadas.length===0) {
            tlEl.innerHTML = `<div class="u-pages-professor-relatorios-040">Nenhuma atividade realizada ainda.</div>`;
        }
    }, 50);
}

// ================================================================
// SIDEBAR + MOBILE
// ================================================================
const sidebar   = document.getElementById('sidebar');
const toggle    = document.getElementById('sidebarToggle');
const backdrop  = document.getElementById('sidebarBackdrop');
const mobileBtn = document.getElementById('mobileMenuBtn');
toggle.addEventListener('click',  () => sidebar.classList.toggle('sidebar--collapsed'));
mobileBtn.addEventListener('click',() => { sidebar.classList.add('open'); backdrop.classList.add('open'); });
backdrop.addEventListener('click', () => { sidebar.classList.remove('open'); backdrop.classList.remove('open'); });
document.getElementById('btnNotif').addEventListener('click', () => showToast('3 novas notifica\u00e7\u00f5es', 'info'));

// ================================================================
// TOAST
// ================================================================
function showToast(msg, type='') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast${type?' toast--'+type:''}`;
    t.innerHTML = `<i class="fi fi-br-bell"></i> ${msg}`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

// ================================================================
// INIT
// ================================================================
renderStudentList();
renderDashboard();
