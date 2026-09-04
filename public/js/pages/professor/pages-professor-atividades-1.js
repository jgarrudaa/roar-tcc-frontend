/* Comportamento extraído de atividades.html. */

// ================================================================
// DADOS DOS ALUNOS (mesmos de alunos.html)
// ================================================================
const AVATAR_COLORS = [
    '#244D8C','#1a7c49','#7c3aed','#b07000',
    '#1F6CE3','#0e7490','#be185d','#c2410c',
];
const NIVEL_LABELS = {
    1: 'N\u00edvel 1 \u2014 Suporte Visual Puro',
    2: 'N\u00edvel 2 \u2014 Aprendiz Guiado',
    3: 'N\u00edvel 3 \u2014 Autonomia Contextual',
};
const XP_PER_ACTIVITY = 50;
const MODULE_XP = 150;
const MODULE_ACTIVITY_TYPES = ["Reconhecer", "Associar", "Validar"];

const studentsData = [
    { id:1, name:'Leandro Matos',   turma:'A', nivel:1, xp:1240, avatarColor:AVATAR_COLORS[0] },
    { id:2, name:'Ana Clara Souza', turma:'A', nivel:3, xp:1850, avatarColor:AVATAR_COLORS[1] },
    { id:3, name:'Bruno Ferreira',  turma:'A', nivel:2, xp:1620, avatarColor:AVATAR_COLORS[2] },
    { id:4, name:'Mariana Lima',    turma:'A', nivel:2, xp:980,  avatarColor:AVATAR_COLORS[3] },
    { id:5, name:'Gabriel Santos',  turma:'B', nivel:1, xp:760,  avatarColor:AVATAR_COLORS[4] },
    { id:6, name:'Isabela Costa',   turma:'B', nivel:3, xp:2100, avatarColor:AVATAR_COLORS[5] },
    { id:7, name:'Rafael Mendes',   turma:'B', nivel:2, xp:1380, avatarColor:AVATAR_COLORS[6] },
    { id:8, name:'Valentina Rocha', turma:'A', nivel:1, xp:540,  avatarColor:AVATAR_COLORS[7] },
];

// ================================================================
// DADOS DAS ATIVIDADES (completas do site)
// ================================================================
const allCategories = [
    {
        id:'corpo', name:'Corpo Humano', icon:'fi fi-br-portrait', iconCls:'blue',
        atividades: [
            {
                id:'a1', name:'Partes do Corpo \u2014 Arraste', tipo:'Arrastar e Soltar',
                dif:'facil', xp:50, link:'../aluno/atividade.html?modulo=corpo-humano&etapa=2',
                icon:'fi fi-br-hand-holding-magic',
                stats:{ mediaAcertos:72, mediaErros:28, mediaXP:840, completaram:6 },
                alunosPerf:[
                    {id:1, acertos:8, erros:2, xp:50,  prog:100},
                    {id:2, acertos:10,erros:0, xp:50,  prog:100},
                    {id:3, acertos:7, erros:3, xp:40,  prog:100},
                    {id:4, acertos:9, erros:1, xp:50,  prog:100},
                    {id:5, acertos:4, erros:6, xp:20,  prog:100},
                    {id:6, acertos:10,erros:0, xp:50,  prog:100},
                    {id:7, acertos:6, erros:4, xp:35,  prog:100},
                    {id:8, acertos:3, erros:7, xp:15,  prog:100},
                ]
            },
            {
                id:'a2', name:'Identificar Membros', tipo:'Associa\u00e7\u00e3o',
                dif:'medio', xp:70, link:'../aluno/atividade.html?modulo=corpo-humano&etapa=3',
                icon:'fi fi-br-link',
                stats:{ mediaAcertos:65, mediaErros:35, mediaXP:920, completaram:5 },
                alunosPerf:[
                    {id:1, acertos:6, erros:4, xp:45,  prog:100},
                    {id:2, acertos:9, erros:1, xp:65,  prog:100},
                    {id:3, acertos:5, erros:5, xp:35,  prog:100},
                    {id:4, acertos:8, erros:2, xp:60,  prog:100},
                    {id:5, acertos:0, erros:0, xp:0,   prog:0},
                    {id:6, acertos:9, erros:1, xp:68,  prog:100},
                    {id:7, acertos:5, erros:5, xp:38,  prog:75},
                    {id:8, acertos:0, erros:0, xp:0,   prog:0},
                ]
            },
        ]
    },
    {
        id:'vocabulario', name:'Cores', icon:'fi fi-br-palette', iconCls:'green',
        atividades: [
            {
                id:'b1', name:'Aprender as Cores', tipo:'Associa\u00e7\u00e3o',
                dif:'facil', xp:40, link:'../aluno/atividade.html?modulo=corpo-humano&etapa=3',
                icon:'fi fi-br-palette',
                stats:{ mediaAcertos:80, mediaErros:20, mediaXP:720, completaram:7 },
                alunosPerf:[
                    {id:1, acertos:6, erros:4, xp:40,  prog:100},
                    {id:2, acertos:9, erros:1, xp:40,  prog:100},
                    {id:3, acertos:4, erros:6, xp:22,  prog:100},
                    {id:4, acertos:7, erros:3, xp:38,  prog:100},
                    {id:5, acertos:5, erros:5, xp:25,  prog:100},
                    {id:6, acertos:10,erros:0, xp:40,  prog:100},
                    {id:7, acertos:7, erros:3, xp:36,  prog:100},
                    {id:8, acertos:2, erros:5, xp:10,  prog:60},
                ]
            },
            {
                id:'b2', name:'Misturar Cores', tipo:'M\u00faltipla Escolha',
                dif:'medio', xp:60, link:'../aluno/atividade.html?modulo=corpo-humano&etapa=1',
                icon:'fi fi-br-brush',
                stats:{ mediaAcertos:55, mediaErros:45, mediaXP:580, completaram:4 },
                alunosPerf:[
                    {id:1, acertos:5, erros:5, xp:30,  prog:100},
                    {id:2, acertos:8, erros:2, xp:55,  prog:100},
                    {id:3, acertos:3, erros:7, xp:18,  prog:60},
                    {id:4, acertos:6, erros:4, xp:42,  prog:100},
                    {id:5, acertos:0, erros:0, xp:0,   prog:0},
                    {id:6, acertos:9, erros:1, xp:58,  prog:100},
                    {id:7, acertos:4, erros:6, xp:24,  prog:40},
                    {id:8, acertos:0, erros:0, xp:0,   prog:0},
                ]
            },
        ]
    },
    {
        id:'animais', name:'Animais da Fazenda', icon:'fi fi-br-paw', iconCls:'orange',
        atividades: [
            {
                id:'c1', name:'Sons dos Animais', tipo:'Ouvir e Identificar',
                dif:'facil', xp:45, link:'../aluno/atividade.html?modulo=corpo-humano&etapa=1',
                icon:'fi fi-br-music-alt',
                stats:{ mediaAcertos:68, mediaErros:32, mediaXP:610, completaram:5 },
                alunosPerf:[
                    {id:1, acertos:7, erros:3, xp:40,  prog:100},
                    {id:2, acertos:10,erros:0, xp:45,  prog:100},
                    {id:3, acertos:2, erros:8, xp:10,  prog:50},
                    {id:4, acertos:8, erros:2, xp:43,  prog:100},
                    {id:5, acertos:0, erros:0, xp:0,   prog:0},
                    {id:6, acertos:9, erros:1, xp:44,  prog:100},
                    {id:7, acertos:5, erros:5, xp:28,  prog:100},
                    {id:8, acertos:0, erros:0, xp:0,   prog:0},
                ]
            },
            {
                id:'c2', name:'Nomes dos Animais', tipo:'Arrastar e Soltar',
                dif:'medio', xp:65, link:'../aluno/atividade.html?modulo=corpo-humano&etapa=2',
                icon:'fi fi-br-dog',
                stats:{ mediaAcertos:58, mediaErros:42, mediaXP:740, completaram:4 },
                alunosPerf:[
                    {id:1, acertos:6, erros:4, xp:40,  prog:100},
                    {id:2, acertos:9, erros:1, xp:62,  prog:100},
                    {id:3, acertos:0, erros:0, xp:0,   prog:0},
                    {id:4, acertos:7, erros:3, xp:50,  prog:100},
                    {id:5, acertos:0, erros:0, xp:0,   prog:0},
                    {id:6, acertos:10,erros:0, xp:65,  prog:100},
                    {id:7, acertos:4, erros:6, xp:28,  prog:50},
                    {id:8, acertos:0, erros:0, xp:0,   prog:0},
                ]
            },
        ]
    },
    {
        id:'emocoes', name:'Emo\u00e7\u00f5es', icon:'fi fi-br-grin-alt', iconCls:'purple',
        atividades: [
            {
                id:'d1', name:'Express\u00f5es Faciais', tipo:'Identificar Imagens',
                dif:'facil', xp:40, link:'../aluno/atividade.html?modulo=corpo-humano&etapa=3',
                icon:'fi fi-br-face-smile',
                stats:{ mediaAcertos:63, mediaErros:37, mediaXP:560, completaram:6 },
                alunosPerf:[
                    {id:1, acertos:5, erros:3, xp:35,  prog:100},
                    {id:2, acertos:8, erros:2, xp:40,  prog:100},
                    {id:3, acertos:5, erros:5, xp:22,  prog:100},
                    {id:4, acertos:6, erros:2, xp:38,  prog:100},
                    {id:5, acertos:2, erros:8, xp:10,  prog:60},
                    {id:6, acertos:9, erros:1, xp:40,  prog:100},
                    {id:7, acertos:4, erros:6, xp:20,  prog:100},
                    {id:8, acertos:0, erros:0, xp:0,   prog:0},
                ]
            },
            {
                id:'d2', name:'Como me sinto?', tipo:'M\u00faltipla Escolha',
                dif:'facil', xp:35, link:'../aluno/atividade.html?modulo=corpo-humano&etapa=1',
                icon:'fi fi-br-comment-heart',
                stats:{ mediaAcertos:55, mediaErros:45, mediaXP:420, completaram:4 },
                alunosPerf:[
                    {id:1, acertos:4, erros:4, xp:25,  prog:100},
                    {id:2, acertos:7, erros:1, xp:35,  prog:100},
                    {id:3, acertos:4, erros:6, xp:18,  prog:50},
                    {id:4, acertos:5, erros:3, xp:28,  prog:100},
                    {id:5, acertos:0, erros:0, xp:0,   prog:0},
                    {id:6, acertos:8, erros:0, xp:35,  prog:100},
                    {id:7, acertos:3, erros:5, xp:15,  prog:30},
                    {id:8, acertos:0, erros:0, xp:0,   prog:0},
                ]
            },
        ]
    },
    {
        id:'vocabulario', name:'Frutas e Comida', icon:'fi fi-br-hamburger', iconCls:'green',
        atividades: [
            {
                id:'e1', name:'Frutas e Vegetais', tipo:'Associa\u00e7\u00e3o',
                dif:'facil', xp:40, link:'../aluno/atividade.html?modulo=corpo-humano&etapa=3',
                icon:'fi fi-br-apple-whole',
                stats:{ mediaAcertos:48, mediaErros:52, mediaXP:310, completaram:3 },
                alunosPerf:[
                    {id:1, acertos:0, erros:0, xp:0,  prog:0},
                    {id:2, acertos:8, erros:2, xp:40, prog:100},
                    {id:3, acertos:0, erros:0, xp:0,  prog:0},
                    {id:4, acertos:0, erros:0, xp:0,  prog:0},
                    {id:5, acertos:0, erros:0, xp:0,  prog:0},
                    {id:6, acertos:9, erros:1, xp:40, prog:100},
                    {id:7, acertos:0, erros:0, xp:0,  prog:0},
                    {id:8, acertos:0, erros:0, xp:0,  prog:0},
                ]
            },
        ]
    },
    {
        id:'vocabulario', name:'Fam\u00edlia', icon:'fi fi-br-users', iconCls:'blue',
        atividades: [
            {
                id:'f1', name:'Membros da Fam\u00edlia', tipo:'M\u00faltipla Escolha',
                dif:'facil', xp:40, link:'../aluno/atividade.html?modulo=corpo-humano&etapa=1',
                icon:'fi fi-br-home-heart',
                stats:{ mediaAcertos:60, mediaErros:40, mediaXP:480, completaram:4 },
                alunosPerf:[
                    {id:1, acertos:5, erros:5, xp:28,  prog:100},
                    {id:2, acertos:9, erros:1, xp:40,  prog:100},
                    {id:3, acertos:4, erros:6, xp:20,  prog:40},
                    {id:4, acertos:7, erros:3, xp:35,  prog:100},
                    {id:5, acertos:0, erros:0, xp:0,   prog:0},
                    {id:6, acertos:8, erros:2, xp:38,  prog:100},
                    {id:7, acertos:0, erros:0, xp:0,   prog:0},
                    {id:8, acertos:0, erros:0, xp:0,   prog:0},
                ]
            },
        ]
    },
];

allCategories.forEach((category) => {
    const sourceActivities = category.atividades;
    category.atividades = MODULE_ACTIVITY_TYPES.map((name, index) => {
        const source = sourceActivities[index] || sourceActivities[sourceActivities.length - 1];
        return {
            ...source,
            id: `${category.id}-${category.name}-${index + 1}`,
            name,
            tipo: name,
            xp: XP_PER_ACTIVITY,
        };
    });
});

// Estado de desbloqueios por módulo: { moduleId: Set(alunoIds) }
const moduleUnlocks = {};
allCategories.forEach((category) => {
    moduleUnlocks[`${category.id}-${category.name}`] = new Set(studentsData.map((student) => student.id));
});

// ================================================================
// ESTADO GLOBAL
// ================================================================
let activeFilter = 'all';
let searchTerm   = '';
let currentModuleId = null;
let currentTab   = 'A';

// ================================================================
// RENDER: STATS BAR
// ================================================================
function renderStatsBar() {
    const totalActs   = allCategories.reduce((s,c)=>s+c.atividades.length,0);
    const totalAlunos = studentsData.length;
    const mediaXP     = Math.round(studentsData.reduce((s,a)=>s+a.xp,0)/totalAlunos);
    const mediaAcertos= Math.round(allCategories.reduce((s,c)=>s+c.atividades.reduce((ss,a)=>ss+a.stats.mediaAcertos,0),0)
                        / totalActs);
    const stats = [
        {icon:'fi fi-br-puzzle-pieces', bg:'rgba(133,199,242,0.30)', color:'var(--c-blue-dark)', label:'Total Atividades', val:totalActs},
        {icon:'fi fi-br-users',         bg:'rgba(68,246,152,0.25)',  color:'#1a7c49',            label:'Total Alunos',    val:totalAlunos},
        {icon:'fi fi-br-check-circle',  bg:'rgba(245,158,11,0.20)', color:'#b07000',            label:'M\u00e9dia Acertos', val:mediaAcertos+'%'},
        {icon:'fi fi-br-trophy',        bg:'rgba(168,85,247,0.15)', color:'#7c3aed',            label:'M\u00e9dia XP',   val:mediaXP.toLocaleString('pt-BR')},
    ];
    const c = document.getElementById('statsBar');
    stats.forEach(s=>{
        c.innerHTML += `<div class="stat-card">
            <div class="stat-card__icon" style="background:${s.bg};color:${s.color}"><i class="${s.icon}"></i></div>
            <div><div class="stat-card__label">${s.label}</div><div class="stat-card__value">${s.val}</div></div>
        </div>`;
    });
}

function moduleKey(category) {
    return `${category.id}-${category.name}`;
}

function getModuleStats(category) {
    const activities = category.atividades;
    const averageAccuracy = Math.round(activities.reduce((sum, activity) => sum + activity.stats.mediaAcertos, 0) / activities.length);
    const completedStudents = studentsData.filter((student) => activities.every((activity) => {
        const performance = activity.alunosPerf.find((item) => item.id === student.id);
        return performance?.prog === 100;
    })).length;
    return {
        averageAccuracy,
        completedStudents,
        totalXp: completedStudents * activities.length * XP_PER_ACTIVITY,
    };
}

function renderAll() {
    const container = document.getElementById('atividadesContainer');
    container.innerHTML = '';
    const q = searchTerm.toLowerCase();

    let anyFound = false;
    let modules = allCategories.filter((category) => {
        const matchFilter = activeFilter === 'all' || category.id === activeFilter;
        const matchSearch = !q || category.name.toLowerCase().includes(q) || category.atividades.some((activity) => (
            activity.name.toLowerCase().includes(q) || activity.tipo.toLowerCase().includes(q)
        ));
        return matchFilter && matchSearch;
    });

    const order = document.getElementById('sortSel').value;
    if (order === 'nome') modules = modules.slice().sort((a, b) => a.name.localeCompare(b.name, 'pt'));
    if (order === 'acertos') modules = modules.slice().sort((a, b) => getModuleStats(b).averageAccuracy - getModuleStats(a).averageAccuracy);

    modules.forEach(cat => {
        anyFound = true;

        const section = document.createElement('section');
        section.className = 'cat-section';
        section.innerHTML = `
            <div class="cat-header">
                <h2>${cat.name}</h2>
                <span class="badge badge--blue">${cat.atividades.length} atividade${cat.atividades.length>1?'s':''}</span>
            </div>
            <div class="cat-grid">
                ${renderModuleCard(cat)}
            </div>
        `;
        container.appendChild(section);
    });

    if(!anyFound) {
        container.innerHTML = `<div class="u-pages-professor-atividades-016">
            <i class="fi fi-br-search u-pages-professor-atividades-017"></i>
            Nenhuma atividade encontrada.
        </div>`;
    }

    // Botões de detalhe
    document.querySelectorAll('.btn-ver-detalhes').forEach((button) => {
        button.addEventListener('click', () => abrirModal(button.dataset.moduleid, 'details'));
    });
    document.querySelectorAll('.btn-gerenciar-modulo').forEach((button) => {
        button.addEventListener('click', () => abrirModal(button.dataset.moduleid, 'manage'));
    });
}

function renderModuleCard(category) {
    const key = moduleKey(category);
    const unlocked = moduleUnlocks[key].size;
    const total    = studentsData.length;
    const stats = getModuleStats(category);
    const pctAc = stats.averageAccuracy;
    const barCls   = pctAc>=70?'progress-bar--green':pctAc>=40?'progress-bar--blue':'progress-bar--red';

    return `
    <div class="act-card module-card" data-module-key="${key}">
        <div class="act-card__top">
            <div class="act-card__info">
                <div class="act-card__name">${category.name}</div>
                <div class="act-card__meta-row">
                    <span class="badge badge--blue u-pages-professor-atividades-018">${category.atividades.length} atividade${category.atividades.length > 1 ? 's' : ''}</span>
                    <span class="u-pages-professor-atividades-020">
                        ${MODULE_XP} XP por módulo
                    </span>
                </div>
                <div class="u-pages-professor-atividades-021">
                    <div class="u-pages-professor-atividades-022">
                        <span>M\u00e9dia de acertos da turma</span><span class="u-pages-professor-atividades-023">${pctAc}%</span>
                    </div>
                    <div class="progress-wrap u-pages-professor-atividades-024">
                        <div class="progress-bar ${barCls}" style="width:${pctAc}%"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="act-card__stats">
            <div class="act-stat">
                <div class="act-stat__val u-pages-professor-atividades-025">${pctAc}%</div>
                <div class="act-stat__lbl">Acertos</div>
            </div>
            <div class="act-stat">
                <div class="act-stat__val u-pages-professor-atividades-026">${stats.totalXp.toLocaleString('pt-BR')}</div>
                <div class="act-stat__lbl">XP total</div>
            </div>
            <div class="act-stat">
                <div class="act-stat__val">${stats.completedStudents}/${total}</div>
                <div class="act-stat__lbl">Completaram</div>
            </div>
        </div>
        <div class="act-card__footer">
            <span class="unlock-count">
                ${unlocked}/${total} alunos com acesso
            </span>
            <div class="module-card__actions">
                <button class="btn btn--ghost btn--sm btn-ver-detalhes" data-moduleid="${key}">Ver detalhes</button>
                <button class="btn btn--primary btn--sm btn-gerenciar-modulo" data-moduleid="${key}">Gerenciar</button>
            </div>
        </div>
    </div>`;
}

// ================================================================
// MODAL
// ================================================================
function abrirModal(key, mode) {
    currentModuleId = key;
    currentTab   = 'A';

    const category = allCategories.find((item) => moduleKey(item) === key);
    const stats = getModuleStats(category);
    const isDetails = mode === 'details';
    document.getElementById('mActNome').textContent = isDetails ? `Detalhes: ${category.name}` : `Gerenciar: ${category.name}`;
    document.getElementById('mActMeta').textContent = `Módulo completo · 3 atividades · ${MODULE_XP} XP`;

    const totalAc = category.atividades.reduce((sum, activity) => sum + activity.alunosPerf.reduce((subtotal, performance) => subtotal + performance.acertos, 0), 0);
    const totalEr = category.atividades.reduce((sum, activity) => sum + activity.alunosPerf.reduce((subtotal, performance) => subtotal + performance.erros, 0), 0);
    document.getElementById('mActStats').innerHTML = `
        <div class="mstat"><div class="mstat__val u-pages-professor-atividades-025">${totalAc}</div><div class="mstat__lbl">Acertos totais</div></div>
        <div class="mstat"><div class="mstat__val u-pages-professor-atividades-029">${totalEr}</div><div class="mstat__lbl">Erros totais</div></div>
        <div class="mstat"><div class="mstat__val u-pages-professor-atividades-026">${stats.totalXp.toLocaleString('pt-BR')}</div><div class="mstat__lbl">XP distribu\u00eddo</div></div>
        <div class="mstat"><div class="mstat__val">${stats.completedStudents}/${studentsData.length}</div><div class="mstat__lbl">Conclu\u00edram o módulo</div></div>
    `;

    const tableRows = studentsData.map((student) => {
        const cells = category.atividades.map((activity) => {
            const performance = activity.alunosPerf.find((item) => item.id === student.id) || { acertos: 0, erros: 0 };
            return `<td>${performance.acertos} acertos<br><small>${performance.erros} erros</small></td>`;
        }).join('');
        return `<tr><th scope="row">${student.name}</th>${cells}</tr>`;
    }).join('');
    document.getElementById('mModuleActivities').innerHTML = `
        <table class="module-performance-table">
            <thead><tr><th>Aluno</th>${MODULE_ACTIVITY_TYPES.map((activity) => `<th>${activity}</th>`).join('')}</tr></thead>
            <tbody>${tableRows}</tbody>
        </table>
    `;
    document.getElementById('mActStats').hidden = !isDetails;
    document.getElementById('mActMeta').hidden = !isDetails;
    document.getElementById('moduleDetails').hidden = !isDetails;
    document.getElementById('moduleManagement').hidden = isDetails;

    if (!isDetails) {
        ['A','B','all'].forEach(t=>{
            document.getElementById('tab'+t.charAt(0).toUpperCase()+t.slice(1)).classList.toggle('active', t===currentTab||t==='A'&&currentTab==='A');
        });
        renderModalAlunos(category);
    }
    document.getElementById('modalAtiv').classList.add('open');
}

function switchTab(t) {
    currentTab = t;
    ['A','B','all'].forEach(id=>{
        document.getElementById('tab'+(id==='all'?'All':id)).classList.remove('active');
    });
    document.getElementById('tab'+(t==='all'?'All':t)).classList.add('active');
    const category = allCategories.find((item) => moduleKey(item) === currentModuleId);
    renderModalAlunos(category);
}

function renderModalAlunos(category) {
    const lista = currentTab==='all'
        ? studentsData
        : studentsData.filter(s=>s.turma===currentTab);

    const container = document.getElementById('mAlunosList');
    container.innerHTML = '';

    lista.forEach(s => {
        const isUnlocked = moduleUnlocks[moduleKey(category)].has(s.id);

        const row = document.createElement('div');
        row.className = 'aluno-unlock-row';
        row.innerHTML = `
            <div class="aluno-av" style="background:${s.avatarColor}">${s.name[0]}</div>
            <div class="aluno-info">
                <div class="aluno-info__name">${s.name}</div>
            </div>
            <div class="toggle-wrap">
                <span class="toggle-lbl${isUnlocked?' on':''}">
                    ${isUnlocked?'Liberado':'Bloqueado'}
                </span>
                <label class="toggle-switch" title="${isUnlocked?'Bloquear':'Liberar'} para ${s.name}">
                    <input type="checkbox" ${isUnlocked?'checked':''} onchange="toggleModuleUnlock('${moduleKey(category)}',${s.id},this)">
                    <span class="toggle-slider"></span>
                </label>
            </div>
        `;
        container.appendChild(row);
    });
}

function toggleModuleUnlock(key, alunoId, chk) {
    if(chk.checked) {
        moduleUnlocks[key].add(alunoId);
    } else {
        moduleUnlocks[key].delete(alunoId);
    }
    const aluno = studentsData.find(s=>s.id===alunoId);
    const lbl = chk.closest('.toggle-wrap').querySelector('.toggle-lbl');
    lbl.textContent = chk.checked ? 'Liberado' : 'Bloqueado';
    lbl.className = 'toggle-lbl'+(chk.checked?' on':'');
    showToast(`${aluno.name}: módulo ${chk.checked?'liberado!':'bloqueado'}`, chk.checked?'success':'');
    atualizarUnlockCount(key);
}

function desbloquearTodos() {
    const category = allCategories.find((item) => moduleKey(item) === currentModuleId);
    const lista = currentTab==='all'
        ? studentsData
        : studentsData.filter(s=>s.turma===currentTab);

    lista.forEach(s=>moduleUnlocks[currentModuleId].add(s.id));
    renderModalAlunos(category);
    showToast('Módulo liberado para os alunos selecionados!', 'success');
    atualizarUnlockCount(currentModuleId);
}

function atualizarUnlockCount(key) {
    const el = document.querySelector(`[data-module-key="${key}"] .unlock-count`);
    if(el) el.textContent = `${moduleUnlocks[key].size}/${studentsData.length} alunos com acesso`;
}

function fecharModal() {
    document.getElementById('modalAtiv').classList.remove('open');
}

document.getElementById('modalAtiv').addEventListener('click', function(e){ if(e.target===this) fecharModal(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape') fecharModal(); });

// ================================================================
// FILTROS E BUSCA
// ================================================================
function filtrar() { renderAll(); }

document.querySelectorAll('.filter-chip').forEach(chip=>{
    chip.addEventListener('click',()=>{
        document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
        chip.classList.add('active');
        activeFilter = chip.dataset.f;
        filtrar();
    });
});

document.getElementById('searchInput').addEventListener('input', e=>{
    searchTerm = e.target.value.trim();
    filtrar();
});

function toggleSection(sec) { sec.classList.toggle('collapsed'); }

// Tab buttons estilo
document.querySelectorAll('.tab-btn').forEach(b=>{
    b.style.cssText='padding:7px 18px;border-radius:var(--r-sm);border:none;background:transparent;font-family:\'Poppins\',sans-serif;font-size:0.85rem;font-weight:600;color:var(--c-text-soft);cursor:pointer;transition:all 0.15s';
    b.addEventListener('mouseenter',()=>{ if(!b.classList.contains('active')) b.style.background='rgba(0,0,0,0.05)'; });
    b.addEventListener('mouseleave',()=>{ if(!b.classList.contains('active')) b.style.background='transparent'; });
});
document.getElementById('modalAtiv').addEventListener('click',function(e){
    document.querySelectorAll('.tab-btn').forEach(b=>{
        b.style.background = b.classList.contains('active')
            ? 'var(--c-card)'
            : 'transparent';
        b.style.color = b.classList.contains('active')
            ? 'var(--c-blue-dark)'
            : 'var(--c-text-soft)';
        b.style.boxShadow = b.classList.contains('active')
            ? 'var(--shadow-sm)'
            : 'none';
    });
});

// ================================================================
// SIDEBAR
// ================================================================
const sidebar   = document.getElementById('sidebar');
const toggle    = document.getElementById('sidebarToggle');
const backdrop  = document.getElementById('sidebarBackdrop');
const mobileBtn = document.getElementById('mobileMenuBtn');
toggle.addEventListener('click',  ()=>sidebar.classList.toggle('sidebar--collapsed'));
mobileBtn.addEventListener('click',()=>{ sidebar.classList.add('open'); backdrop.classList.add('open'); });
backdrop.addEventListener('click', ()=>{ sidebar.classList.remove('open'); backdrop.classList.remove('open'); });
document.getElementById('btnNotif').addEventListener('click',()=>showToast('3 novas notifica\u00e7\u00f5es','info'));

// ================================================================
// TOAST
// ================================================================
function showToast(msg, type='') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast${type?' toast--'+type:''}`;
    t.innerHTML = `<i class="fi fi-br-bell"></i> ${msg}`;
    c.appendChild(t);
    setTimeout(()=>t.remove(), 3500);
}

// ================================================================
// INIT
// ================================================================
renderStatsBar();
renderAll();

// Aplica estilos iniciais nas tabs após render
setTimeout(()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>{
        b.style.background = b.classList.contains('active')
            ? 'var(--c-card)'
            : 'transparent';
        b.style.color = b.classList.contains('active')
            ? 'var(--c-blue-dark)'
            : 'var(--c-text-soft)';
        b.style.boxShadow = b.classList.contains('active')
            ? 'var(--shadow-sm)'
            : 'none';
    });
},100);
