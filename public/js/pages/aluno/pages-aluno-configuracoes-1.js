/* Comportamento extraído de configuracoes.html. */

// ============================================================
// TEMA
// ============================================================
const themeLight = document.getElementById('themeLight');
const themeDark  = document.getElementById('themeDark');

function updateThemeUI(theme) {
    if (theme === 'dark') {
        themeDark.classList.add('active');
        themeLight.classList.remove('active');
    } else {
        themeLight.classList.add('active');
        themeDark.classList.remove('active');
    }
}

// Inicializar botões com o tema ativo
const currentTheme = window.ROARTheme ? window.ROARTheme.get() : (localStorage.getItem('roarTheme') || 'light');
updateThemeUI(currentTheme);

themeLight.addEventListener('click', () => {
    updateThemeUI('light');
    if (window.ROARTheme) {
        window.ROARTheme.set('light');
    } else {
        localStorage.setItem('roarTheme', 'light');
        document.documentElement.removeAttribute('data-theme');
    }
    showToast('Tema claro ativado!', 'info');
});

themeDark.addEventListener('click', () => {
    updateThemeUI('dark');
    if (window.ROARTheme) {
        window.ROARTheme.set('dark');
    } else {
        localStorage.setItem('roarTheme', 'dark');
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    showToast('Modo escuro ativado!', 'info');
});

// ============================================================
// TAMANHO DE FONTE
// ============================================================
const savedFs = localStorage.getItem('roarFontSize') || 'medium';
document.querySelectorAll('.fs-btn').forEach(btn => {
    if (btn.dataset.fs === savedFs) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
    btn.addEventListener('click', () => {
        document.querySelectorAll('.fs-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const sizes = { small: '17px', medium: '19px', large: '22px' };
        document.documentElement.style.fontSize = sizes[btn.dataset.fs] || '19px';
        localStorage.setItem('roarFontSize', btn.dataset.fs);
    });
});

// ============================================================
// SALVAR & RESTAURAR CONFIGS
// ============================================================
try {
    const saved = JSON.parse(localStorage.getItem('roarSettings') || '{}');
    if (saved.nome) document.getElementById('cfgNome').value = saved.nome;
    if (saved.idioma) document.getElementById('cfgIdioma').value = saved.idioma;
    if (saved.volume !== undefined) document.getElementById('cfgVolume').value = saved.volume;
    if (saved.notif !== undefined) document.getElementById('cfgNotif').checked = saved.notif;
    if (saved.contrast !== undefined) document.getElementById('cfgContrast').checked = saved.contrast;
    if (saved.sons !== undefined) document.getElementById('cfgSons').checked = saved.sons;
    if (saved.anim !== undefined) document.getElementById('cfgAnim').checked = saved.anim;
    if (saved.estimulos !== undefined) document.getElementById('cfgEstimulos').checked = saved.estimulos;
} catch (e) {}

function saveConfig() {
    const settings = {
        nome:      document.getElementById('cfgNome').value,
        idioma:    document.getElementById('cfgIdioma').value,
        volume:    document.getElementById('cfgVolume').value,
        notif:     document.getElementById('cfgNotif').checked,
        contrast:  document.getElementById('cfgContrast').checked,
        sons:      document.getElementById('cfgSons').checked,
        anim:      document.getElementById('cfgAnim').checked,
        estimulos: document.getElementById('cfgEstimulos').checked,
    };
    localStorage.setItem('roarSettings', JSON.stringify(settings));
    showToast('Configurações salvas com sucesso!', 'success');
}

document.getElementById('btnSave').addEventListener('click',  saveConfig);
document.getElementById('btnSave2').addEventListener('click', saveConfig);
document.getElementById('btnLogout').addEventListener('click', () => {
    if (window.roarNavigate) {
        window.roarNavigate('../auth/login-aluno.html');
    } else {
        window.location.href = '../auth/login-aluno.html';
    }
});
document.getElementById('btnDados').addEventListener('click',  () => { showToast('Exportação de dados em breve', 'info'); });

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

function showToast(msg, type = '') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type ? 'toast--'+type : ''}`;
    t.innerHTML = `<i class="fi fi-br-check"></i> ${msg}`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}
