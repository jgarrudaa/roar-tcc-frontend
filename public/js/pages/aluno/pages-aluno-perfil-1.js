/* Comportamento extraído de perfil.html. */

// Conquistas mini
const conquistas = [
    { name: 'Primeira Aula', icon: 'fi fi-br-star',  color: '#ffd700', bg: 'rgba(255,215,0,0.2)'  },
    { name: '7 Dias',        icon: 'fi fi-br-flame',  color: '#f97316', bg: 'rgba(249,115,22,0.2)' },
    { name: '100% Acertos',  icon: 'fi fi-br-check',  color: '#22c55e', bg: 'rgba(34,197,94,0.2)'  },
    { name: '10 Atividades', icon: 'fi fi-br-trophy', color: '#a855f7', bg: 'rgba(168,85,247,0.2)' },
];

const row = document.getElementById('conquRow');
conquistas.forEach(c => {
    const div = document.createElement('div');
    div.className = 'conq-mini';
    div.innerHTML = `
        <div class="conq-mini__icon" style="background:${c.bg}">
            <i class="${c.icon}" style="color:${c.color}"></i>
        </div>
        <div class="conq-mini__name">${c.name}</div>
    `;
    row.appendChild(div);
});

// Modal editar
const editBtn   = document.getElementById('btnEditProfile');
const editModal = document.getElementById('editModal');
const closeBtn  = document.getElementById('closeEditModal');
const saveBtn   = document.getElementById('saveProfile');

editBtn.addEventListener('click',  () => editModal.classList.add('open'));
closeBtn.addEventListener('click', () => editModal.classList.remove('open'));
editModal.addEventListener('click', e => { if(e.target===editModal) editModal.classList.remove('open'); });
saveBtn.addEventListener('click', () => {
    editModal.classList.remove('open');
    showToast('Perfil salvo com sucesso!', 'success');
});

// Sidebar
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

// Adicionar classe filter-chip para usar no perfil
document.head.insertAdjacentHTML('beforeend', `
`);
