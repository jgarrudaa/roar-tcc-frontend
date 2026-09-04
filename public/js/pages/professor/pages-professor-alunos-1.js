/* Comportamento extraído de alunos.html. */

const NIVEL_LABELS = {
    1: { text: 'N\u00edvel 1 \u2014 Suporte Visual Puro', cls: 'tag-1', cardCls: 'nivel-1' },
    2: { text: 'N\u00edvel 2 \u2014 Aprendiz Guiado', cls: 'tag-2', cardCls: 'nivel-2' },
    3: { text: 'N\u00edvel 3 \u2014 Autonomia Contextual', cls: 'tag-3', cardCls: 'nivel-3' },
};

const AVATAR_COLORS = [
    '#244D8C','#1a7c49','#7c3aed','#b07000',
    '#1F6CE3','#0e7490','#be185d','#c2410c',
];

const studentsData = [
    {
        id:1, name:'Leandro Matos',   turma:'A', nivel:1, xp:1240, prog:70,  last:'Hoje',      avatarColor:AVATAR_COLORS[0],
        atividades:[
            {nome:'Partes do Corpo', tipo:'Arraste',    acertos:8,  erros:2, status:'done'},
            {nome:'Cores B\u00e1sicas',   tipo:'Sele\u00e7\u00e3o',    acertos:6,  erros:4, status:'done'},
            {nome:'Emo\u00e7\u00f5es',         tipo:'Associa\u00e7\u00e3o', acertos:5,  erros:3, status:'done'},
            {nome:'Animais',         tipo:'Input',      acertos:7,  erros:3, status:'done'},
            {nome:'N\u00fameros 1-10',    tipo:'Sequ\u00eancia',  acertos:3,  erros:7, status:'prog'},
            {nome:'Frutas',          tipo:'Arraste',    acertos:0,  erros:0, status:'none'},
        ]
    },
    {
        id:2, name:'Ana Clara Souza', turma:'A', nivel:3, xp:1850, prog:92,  last:'Hoje',      avatarColor:AVATAR_COLORS[1],
        atividades:[
            {nome:'Partes do Corpo', tipo:'Arraste',    acertos:10, erros:0, status:'done'},
            {nome:'Cores B\u00e1sicas',   tipo:'Sele\u00e7\u00e3o',    acertos:9,  erros:1, status:'done'},
            {nome:'Emo\u00e7\u00f5es',         tipo:'Associa\u00e7\u00e3o', acertos:8,  erros:2, status:'done'},
            {nome:'Animais',         tipo:'Input',      acertos:10, erros:0, status:'done'},
            {nome:'N\u00fameros 1-10',    tipo:'Sequ\u00eancia',  acertos:9,  erros:1, status:'done'},
            {nome:'Frutas',          tipo:'Arraste',    acertos:8,  erros:2, status:'done'},
        ]
    },
    {
        id:3, name:'Bruno Ferreira',  turma:'A', nivel:2, xp:1620, prog:55,  last:'Ontem',     avatarColor:AVATAR_COLORS[2],
        atividades:[
            {nome:'Partes do Corpo', tipo:'Arraste',    acertos:7,  erros:3, status:'done'},
            {nome:'Cores B\u00e1sicas',   tipo:'Sele\u00e7\u00e3o',    acertos:4,  erros:6, status:'done'},
            {nome:'Emo\u00e7\u00f5es',         tipo:'Associa\u00e7\u00e3o', acertos:5,  erros:5, status:'done'},
            {nome:'Animais',         tipo:'Input',      acertos:2,  erros:8, status:'prog'},
            {nome:'N\u00fameros 1-10',    tipo:'Sequ\u00eancia',  acertos:0,  erros:0, status:'none'},
            {nome:'Frutas',          tipo:'Arraste',    acertos:0,  erros:0, status:'none'},
        ]
    },
    {
        id:4, name:'Mariana Lima',    turma:'A', nivel:2, xp:980,  prog:80,  last:'Hoje',      avatarColor:AVATAR_COLORS[3],
        atividades:[
            {nome:'Partes do Corpo', tipo:'Arraste',    acertos:9,  erros:1, status:'done'},
            {nome:'Cores B\u00e1sicas',   tipo:'Sele\u00e7\u00e3o',    acertos:7,  erros:3, status:'done'},
            {nome:'Emo\u00e7\u00f5es',         tipo:'Associa\u00e7\u00e3o', acertos:6,  erros:2, status:'done'},
            {nome:'Animais',         tipo:'Input',      acertos:8,  erros:2, status:'done'},
            {nome:'N\u00fameros 1-10',    tipo:'Sequ\u00eancia',  acertos:4,  erros:3, status:'prog'},
            {nome:'Frutas',          tipo:'Arraste',    acertos:0,  erros:0, status:'none'},
        ]
    },
    {
        id:5, name:'Gabriel Santos',  turma:'B', nivel:1, xp:760,  prog:42,  last:'h\u00e1 3 dias', avatarColor:AVATAR_COLORS[4],
        atividades:[
            {nome:'Partes do Corpo', tipo:'Arraste',    acertos:4,  erros:6, status:'done'},
            {nome:'Cores B\u00e1sicas',   tipo:'Sele\u00e7\u00e3o',    acertos:5,  erros:5, status:'done'},
            {nome:'Emo\u00e7\u00f5es',         tipo:'Associa\u00e7\u00e3o', acertos:2,  erros:8, status:'prog'},
            {nome:'Animais',         tipo:'Input',      acertos:0,  erros:0, status:'none'},
            {nome:'N\u00fameros 1-10',    tipo:'Sequ\u00eancia',  acertos:0,  erros:0, status:'none'},
            {nome:'Frutas',          tipo:'Arraste',    acertos:0,  erros:0, status:'none'},
        ]
    },
    {
        id:6, name:'Isabela Costa',   turma:'B', nivel:3, xp:2100, prog:95,  last:'Hoje',      avatarColor:AVATAR_COLORS[5],
        atividades:[
            {nome:'Partes do Corpo', tipo:'Arraste',    acertos:10, erros:0, status:'done'},
            {nome:'Cores B\u00e1sicas',   tipo:'Sele\u00e7\u00e3o',    acertos:10, erros:0, status:'done'},
            {nome:'Emo\u00e7\u00f5es',         tipo:'Associa\u00e7\u00e3o', acertos:9,  erros:1, status:'done'},
            {nome:'Animais',         tipo:'Input',      acertos:9,  erros:1, status:'done'},
            {nome:'N\u00fameros 1-10',    tipo:'Sequ\u00eancia',  acertos:10, erros:0, status:'done'},
            {nome:'Frutas',          tipo:'Arraste',    acertos:9,  erros:1, status:'done'},
        ]
    },
    {
        id:7, name:'Rafael Mendes',   turma:'B', nivel:2, xp:1380, prog:64,  last:'Ontem',     avatarColor:AVATAR_COLORS[6],
        atividades:[
            {nome:'Partes do Corpo', tipo:'Arraste',    acertos:6,  erros:4, status:'done'},
            {nome:'Cores B\u00e1sicas',   tipo:'Sele\u00e7\u00e3o',    acertos:7,  erros:3, status:'done'},
            {nome:'Emo\u00e7\u00f5es',         tipo:'Associa\u00e7\u00e3o', acertos:4,  erros:6, status:'done'},
            {nome:'Animais',         tipo:'Input',      acertos:5,  erros:5, status:'prog'},
            {nome:'N\u00fameros 1-10',    tipo:'Sequ\u00eancia',  acertos:3,  erros:4, status:'prog'},
            {nome:'Frutas',          tipo:'Arraste',    acertos:0,  erros:0, status:'none'},
        ]
    },
    {
        id:8, name:'Valentina Rocha', turma:'A', nivel:1, xp:540,  prog:28,  last:'h\u00e1 5 dias', avatarColor:AVATAR_COLORS[7],
        atividades:[
            {nome:'Partes do Corpo', tipo:'Arraste',    acertos:3,  erros:7, status:'done'},
            {nome:'Cores B\u00e1sicas',   tipo:'Sele\u00e7\u00e3o',    acertos:2,  erros:5, status:'prog'},
            {nome:'Emo\u00e7\u00f5es',         tipo:'Associa\u00e7\u00e3o', acertos:0,  erros:0, status:'none'},
            {nome:'Animais',         tipo:'Input',      acertos:0,  erros:0, status:'none'},
            {nome:'N\u00fameros 1-10',    tipo:'Sequ\u00eancia',  acertos:0,  erros:0, status:'none'},
            {nome:'Frutas',          tipo:'Arraste',    acertos:0,  erros:0, status:'none'},
        ]
    },
];

// ── RENDER: STAT CARDS ──────────────────────────────────────────
function renderTurmaStats() {
    const total     = studentsData.length;
    const mediaXP   = Math.round(studentsData.reduce((a,s)=>a+s.xp,0)/total);
    const mediaProg = Math.round(studentsData.reduce((a,s)=>a+s.prog,0)/total);
    const ativos    = studentsData.filter(s=>s.last==='Hoje').length;
    const stats = [
        {icon:'fi fi-br-users',      bg:'rgba(133,199,242,0.30)',color:'var(--c-blue-dark)',label:'Total de Alunos',   val:total},
        {icon:'fi fi-br-bolt',       bg:'rgba(68,246,152,0.25)', color:'#1a7c49',           label:'Ativos Hoje',       val:ativos},
        {icon:'fi fi-br-star',       bg:'rgba(245,158,11,0.20)', color:'#b07000',           label:'M\u00e9dia Progresso', val:mediaProg+'%'},
        {icon:'fi fi-br-trophy',     bg:'rgba(168,85,247,0.15)', color:'#7c3aed',           label:'M\u00e9dia de XP',     val:mediaXP.toLocaleString('pt-BR')},
    ];
    const c = document.getElementById('turmaStats');
    stats.forEach(s=>{
        c.innerHTML+=`<div class="stat-card">
            <div class="stat-card__icon" style="background:${s.bg};color:${s.color}"><i class="${s.icon}"></i></div>
            <div><div class="stat-card__label">${s.label}</div><div class="stat-card__value">${s.val}</div></div>
        </div>`;
    });
}

// ── UTILITARIO ─────────────────────────────────────────────────
function calcTaxa(aluno) {
    const tot = aluno.atividades.reduce((a,t)=>a+t.acertos+t.erros,0);
    const ac  = aluno.atividades.reduce((a,t)=>a+t.acertos,0);
    return tot>0?Math.round((ac/tot)*100):0;
}

// ── RENDER: CARDS ──────────────────────────────────────────────
function renderCards(lista) {
    const grid = document.getElementById('studentsGrid');
    grid.innerHTML='';
    if(lista.length===0){
        grid.innerHTML=`<div class="u-pages-professor-alunos-019">
            <i class="fi fi-br-search u-pages-professor-alunos-020"></i>
            Nenhum aluno encontrado.
        </div>`;
        return;
    }
    lista.forEach(s=>{
        const nv    = NIVEL_LABELS[s.nivel];
        const taxa  = calcTaxa(s);
        const feitas= s.atividades.filter(a=>a.status==='done').length;
        const progBarColor = s.prog>=80?'progress-bar--green':s.prog>=50?'progress-bar--blue':'progress-bar--red';
        const card  = document.createElement('div');
        card.className=`student-card ${nv.cardCls}`;
        card.setAttribute('role','button');
        card.setAttribute('tabindex','0');
        card.setAttribute('aria-label',`Ver desempenho de ${s.name}`);
        card.id=`card-aluno-${s.id}`;
        card.innerHTML=`
            <div class="student-card__header">
                <div class="student-avatar" style="background:${s.avatarColor}">${s.name[0]}</div>
                <div>
                    <div class="student-card__name">${s.name}</div>
                    <div class="student-card__turma">Turma ${s.turma} &middot; \u00faltimo acesso: ${s.last}</div>
                </div>
            </div>
            <div class="student-card__stats">
                <div class="mini-stat"><div class="mini-stat__val">${s.xp.toLocaleString('pt-BR')}</div><div class="mini-stat__lbl">XP</div></div>
                <div class="mini-stat"><div class="mini-stat__val">${taxa}%</div><div class="mini-stat__lbl">Acertos</div></div>
                <div class="mini-stat"><div class="mini-stat__val">${feitas}/${s.atividades.length}</div><div class="mini-stat__lbl">Conclu\u00eddas</div></div>
            </div>
            <div class="progress-label"><span>Progresso geral</span><span>${s.prog}%</span></div>
            <div class="progress-wrap u-pages-professor-alunos-021">
                <div class="progress-bar ${progBarColor}" style="width:${s.prog}%"></div>
            </div>
            <span class="nivel-tag ${nv.cls}"><i class="fi fi-br-brain"></i>${nv.text}</span>
        `;
        card.addEventListener('click',()=>abrirModal(s.id));
        card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')abrirModal(s.id);});
        grid.appendChild(card);
    });
}

// ── FILTROS ────────────────────────────────────────────────────
function filtrarAlunos(){
    const q    = document.getElementById('searchInput').value.toLowerCase();
    const nivel= document.getElementById('filterNivel').value;
    const turma= document.getElementById('filterTurma').value;
    const ordem= document.getElementById('filterOrdem').value;
    let lista  = studentsData.filter(s=>{
        return s.name.toLowerCase().includes(q)
            && (nivel===''||String(s.nivel)===nivel)
            && (turma===''||s.turma===turma);
    });
    if(ordem==='xp')   lista=lista.slice().sort((a,b)=>b.xp-a.xp);
    if(ordem==='prog') lista=lista.slice().sort((a,b)=>b.prog-a.prog);
    if(ordem==='nome') lista=lista.slice().sort((a,b)=>a.name.localeCompare(b.name,'pt'));
    renderCards(lista);
}

// ── MODAL ──────────────────────────────────────────────────────
function abrirModal(id){
    const s  = studentsData.find(x=>x.id===id);
    const nv = NIVEL_LABELS[s.nivel];

    const av = document.getElementById('modalAvatar');
    av.textContent=s.name[0];
    av.style.background=s.avatarColor;
    document.getElementById('modalNome').textContent=s.name;
    document.getElementById('modalMeta').textContent=`Turma ${s.turma} \u00b7 ${s.xp.toLocaleString('pt-BR')} XP \u00b7 \u00daltimo acesso: ${s.last}`;
    const ntag=document.getElementById('modalNivelTag');
    ntag.className=`nivel-tag ${nv.cls}`;
    ntag.innerHTML=`<i class="fi fi-br-brain"></i>${nv.text}`;

    const totalAc=s.atividades.reduce((a,t)=>a+t.acertos,0);
    const totalEr=s.atividades.reduce((a,t)=>a+t.erros,0);
    const total=totalAc+totalEr;
    const taxa=total>0?Math.round((totalAc/total)*100):0;
    const feitas=s.atividades.filter(a=>a.status==='done').length;

    document.getElementById('modalStats').innerHTML=`
        <div class="mstat"><div class="mstat__val">${taxa}%</div><div class="mstat__lbl">Taxa de Acerto</div></div>
        <div class="mstat"><div class="mstat__val">${totalAc}</div><div class="mstat__lbl">Total Acertos</div></div>
        <div class="mstat"><div class="mstat__val">${totalEr}</div><div class="mstat__lbl">Total Erros</div></div>
        <div class="mstat"><div class="mstat__val">${feitas}/${s.atividades.length}</div><div class="mstat__lbl">Conclu\u00eddas</div></div>
    `;

    // Gráfico
    const chart=document.getElementById('modalChart');
    chart.innerHTML='';
    const maxVal=Math.max(...s.atividades.map(a=>a.acertos+a.erros),1);
    s.atividades.forEach(a=>{
        const hAc=Math.round((a.acertos/maxVal)*110);
        const hEr=Math.round((a.erros/maxVal)*110);
        const col=document.createElement('div');
        col.className='act-col';
        col.innerHTML=`
            <div class="act-bar-wrap">
                <div class="act-bar acertos" style="height:${hAc}px" title="${a.acertos} acertos"></div>
                <div class="act-bar erros"   style="height:${hEr}px" title="${a.erros} erros"></div>
            </div>
            <div class="act-lbl">${a.nome.split(' ')[0]}</div>
        `;
        chart.appendChild(col);
    });

    // Tabela
    const tbody=document.getElementById('modalTable');
    tbody.innerHTML='';
    s.atividades.forEach(a=>{
        const tot=a.acertos+a.erros;
        const pct=tot>0?Math.round((a.acertos/tot)*100):0;
        const barCls=pct>=70?'pct-green':pct>=40?'pct-yellow':'pct-red';
        const statusMap={
            done:'<span class="status-pill pill-done"><i class="fi fi-br-check"></i> Conclu\u00edda</span>',
            prog:'<span class="status-pill pill-prog"><i class="fi fi-br-time-forward"></i> Em progresso</span>',
            none:'<span class="status-pill pill-none"><i class="fi fi-br-minus"></i> N\u00e3o iniciada</span>',
        };
        const tr=document.createElement('tr');
        tr.innerHTML=`
            <td class="u-pages-professor-alunos-022">${a.nome}</td>
            <td class="u-pages-professor-alunos-023">${a.tipo}</td>
            <td class="u-pages-professor-alunos-024">${a.acertos}</td>
            <td class="u-pages-professor-alunos-025">${a.erros}</td>
            <td>
                <div class="u-pages-professor-alunos-026">
                    <div class="pct-bar-wrap"><div class="pct-bar ${barCls}" style="width:${pct}%"></div></div>
                    <span class="u-pages-professor-alunos-027">${pct}%</span>
                </div>
            </td>
            <td>${statusMap[a.status]}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('btnRelatorio').onclick=()=>{
        const t=calcTaxa(s);
        showToast(`Relat\u00f3rio de ${s.name}: ${t}% de aproveitamento geral`,'success');
    };

    document.getElementById('modalAluno').classList.add('open');
}

function fecharModal(){
    document.getElementById('modalAluno').classList.remove('open');
}

document.getElementById('modalAluno').addEventListener('click',function(e){if(e.target===this)fecharModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')fecharModal();});

// ── SIDEBAR ────────────────────────────────────────────────────
const sidebar  =document.getElementById('sidebar');
const toggle   =document.getElementById('sidebarToggle');
const backdrop =document.getElementById('sidebarBackdrop');
const mobileBtn=document.getElementById('mobileMenuBtn');
toggle.addEventListener('click',  ()=>sidebar.classList.toggle('sidebar--collapsed'));
mobileBtn.addEventListener('click',()=>{sidebar.classList.add('open');backdrop.classList.add('open');});
backdrop.addEventListener('click', ()=>{sidebar.classList.remove('open');backdrop.classList.remove('open');});
document.getElementById('btnNotif').addEventListener('click',()=>showToast('3 novas notifica\u00e7\u00f5es','info'));

// ── TOAST ──────────────────────────────────────────────────────
function showToast(msg,type=''){
    const c=document.getElementById('toast-container');
    const t=document.createElement('div');
    t.className=`toast${type?' toast--'+type:''}`;
    t.innerHTML=`<i class="fi fi-br-bell"></i> ${msg}`;
    c.appendChild(t);
    setTimeout(()=>t.remove(),3500);
}

// ── INIT ───────────────────────────────────────────────────────
renderTurmaStats();
filtrarAlunos();
