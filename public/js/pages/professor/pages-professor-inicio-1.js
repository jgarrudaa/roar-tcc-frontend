/* Comportamento extraído de inicio.html. */

// ============================================================
// DADOS SIMULADOS
// ============================================================
const studentsData = [
    {
        name: 'Leandro', turma: 'A', nivel: 1, xp: 1240, prog: 70, last: 'Hoje',
        historico: [
            { tema: 'Corpo Humano', acertos: 8, erros: 2 },
            { tema: 'Cores', acertos: 6, erros: 4 },
            { tema: 'Emoções', acertos: 5, erros: 3 },
        ]
    },
    {
        name: 'Ana Clara', turma: 'A', nivel: 3, xp: 1850, prog: 90, last: 'Hoje',
        historico: [
            { tema: 'Corpo Humano', acertos: 10, erros: 0 },
            { tema: 'Cores', acertos: 9, erros: 1 },
            { tema: 'Emoções', acertos: 8, erros: 2 },
        ]
    },
    {
        name: 'Bruno', turma: 'A', nivel: 2, xp: 1620, prog: 55, last: 'Ontem',
        historico: [
            { tema: 'Corpo Humano', acertos: 7, erros: 3 },
            { tema: 'Cores', acertos: 4, erros: 6 },
        ]
    },
    {
        name: 'Mariana', turma: 'A', nivel: 2, xp: 980, prog: 80, last: 'Hoje',
        historico: [
            { tema: 'Corpo Humano', acertos: 9, erros: 1 },
            { tema: 'Cores', acertos: 7, erros: 3 },
            { tema: 'Emoções', acertos: 6, erros: 2 },
        ]
    },
];

const nivelLabels = {
    1: { text: 'Nível 1 — Suporte Visual Puro', cls: 'nivel-1' },
    2: { text: 'Nível 2 — Aprendiz Guiado', cls: 'nivel-2' },
    3: { text: 'Nível 3 — Autonomia Contextural', cls: 'nivel-3' },
};

const notifData = [
    { icon:'fi fi-br-check-circle', color:'rgba(34,197,94,0.20)', iconColor:'#15803d', text:'Leandro completou Corpo Humano', time:'há 10 min' },
    { icon:'fi fi-br-star',          color:'rgba(245,158,11,0.20)', iconColor:'#b07000',  text:'Ana Clara ganhou nova medalha',   time:'há 1 hora' },
    { icon:'fi fi-br-exclamation',   color:'rgba(239,68,68,0.15)',  iconColor:'#b91c1c',  text:'Bruno não acessa há 3 dias',      time:'há 3 dias' },
];

// ============================================================
// RENDER: ALUNOS COM NÍVEL TEA
// ============================================================
const alunosList = document.getElementById('alunosNivelList');
studentsData.forEach(s => {
    const nv = nivelLabels[s.nivel];
    const div = document.createElement('div');
    div.className = 'student-row';
    div.innerHTML = `
        <div class="avatar u-pages-professor-inicio-025">${s.name[0]}</div>
        <div class="student-row__name">${s.name}</div>
        <span class="nivel-badge ${nv.cls}">${nv.text}</span>
        <div class="u-pages-professor-inicio-026">
            <div class="u-pages-professor-inicio-027">
                <span>${s.prog}%</span>
            </div>
            <div class="progress-wrap u-pages-professor-inicio-028">
                <div class="progress-bar ${s.prog>=80?'progress-bar--green':'progress-bar--blue'}" style="width:${s.prog}%"></div>
            </div>
        </div>
    `;
    alunosList.appendChild(div);
});

// ============================================================
// RENDER: NOTIFICAÇÕES
// ============================================================
const notifList = document.getElementById('notifList');
notifData.forEach(n => {
    const div = document.createElement('div');
    div.className = 'notif-item';
    div.innerHTML = `
        <div class="notif-icon" style="background:${n.color}"><i class="${n.icon}" style="color:${n.iconColor}"></i></div>
        <div><div class="notif-text">${n.text}</div><div class="notif-time">${n.time}</div></div>
    `;
    notifList.appendChild(div);
});

// ============================================================
// RENDER: HISTÓRICO POR ALUNO
// ============================================================
const histSelect = document.getElementById('histAluno');
const relSelect  = document.getElementById('relAluno');
studentsData.forEach((s, i) => {
    histSelect.innerHTML += `<option value="${i}">${s.name}</option>`;
    relSelect.innerHTML  += `<option value="${i}">${s.name}</option>`;
});

function renderHistorico(index) {
    const s = studentsData[index];
    const list = document.getElementById('histList');
    list.innerHTML = '';
    s.historico.forEach(h => {
        const div = document.createElement('div');
        div.className = 'hist-row';
        div.innerHTML = `
            <span class="u-pages-professor-inicio-029">${h.tema}</span>
            <span class="acertos u-pages-professor-inicio-014">${h.acertos}</span>
            <span class="erros u-pages-professor-inicio-014">${h.erros}</span>
        `;
        list.appendChild(div);
    });
}

histSelect.addEventListener('change', (e) => renderHistorico(parseInt(e.target.value)));
renderHistorico(0);

// ============================================================
// RELATÓRIO PEDAGÓGICO VIA IA (Simulado)
// ============================================================
function gerarRelatorioIA() {
    const idx = parseInt(relSelect.value);
    const s = studentsData[idx];
    const nv = nivelLabels[s.nivel];
    const totalAcertos = s.historico.reduce((a, h) => a + h.acertos, 0);
    const totalErros   = s.historico.reduce((a, h) => a + h.erros, 0);
    const total        = totalAcertos + totalErros;
    const taxa         = total > 0 ? Math.round((totalAcertos / total) * 100) : 0;

    const temasFortes  = s.historico.filter(h => h.acertos / (h.acertos + h.erros) >= 0.7).map(h => h.tema);
    const temasFracos  = s.historico.filter(h => h.acertos / (h.acertos + h.erros) < 0.7).map(h => h.tema);

    const texto = `RELATÓRIO PEDAGÓGICO — PLATAFORMA ROAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Aluno(a): ${s.name}
Turma: ${s.turma}
Nível de Suporte TEA: ${nv.text}
Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DESEMPENHO GERAL
O(a) aluno(a) ${s.name} apresentou uma taxa geral de acertos de ${taxa}% nas atividades realizadas na plataforma ROAR, com ${totalAcertos} acertos e ${totalErros} erros ao longo de ${s.historico.length} tema(s) trabalhado(s).

O progresso acumulado nos módulos da plataforma é de ${s.prog}%, com ${s.xp.toLocaleString('pt-BR')} pontos de experiência.

PONTOS FORTES
${temasFortes.length > 0 ? `O(a) aluno(a) demonstrou bom domínio nos seguintes temas: ${temasFortes.join(', ')}. Nesses temas, a taxa de acerto foi igual ou superior a 70%.` : 'Nenhum tema com taxa de acerto >= 70% foi identificado até o momento.'}

PONTOS DE ATENÇÃO
${temasFracos.length > 0 ? `Os seguintes temas necessitam de reforço: ${temasFracos.join(', ')}. Recomenda-se atividades complementares com foco em repetição espaçada e suporte visual ampliado.` : 'Todos os temas trabalhados apresentaram desempenho satisfatório.'}

RECOMENDAÇÕES
Considerando o nível de suporte TEA atribuído (${nv.text}), recomenda-se que as atividades continuem priorizando:
${s.nivel === 1 ? '• Estímulos visuais puros com hitboxes ampliadas\n• Áudio automático para reforço auditivo\n• Instruções com palavra isolada em caixa alta' : s.nivel === 2 ? '• Frases curtas e diretas (estrutura S+V+O)\n• Áudio sob demanda para autonomia parcial\n• Hitboxes de tamanho padrão' : '• Contextos e diálogos curtos para estimular autonomia\n• Instruções textuais sem áudio obrigatório\n• Hitboxes reduzidas para desafio motor'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Relatório gerado automaticamente pela plataforma ROAR.
Este documento pode ser anexado ao prontuário escolar do(a) aluno(a).`;

    document.getElementById('relatorioTexto').value = texto;
    document.getElementById('modalRelatorio').classList.add('open');
}

function fecharModal() {
    document.getElementById('modalRelatorio').classList.remove('open');
}

function copiarRelatorio() {
    const textarea = document.getElementById('relatorioTexto');
    textarea.select();
    document.execCommand('copy');
    showToast('Relatório copiado!', 'success');
}

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

document.getElementById('btnNotif').addEventListener('click', () => {
    showToast('3 novas notificações', 'info');
});

function showToast(msg, type='') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast${type?' toast--'+type:''}`;
    t.innerHTML = `<i class="fi fi-br-bell"></i> ${msg}`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}
