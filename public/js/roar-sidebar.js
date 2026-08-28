/* ============================================================
   ROAR — roar-sidebar.js
   Lógica de Sidebar e Toast compartilhada entre páginas
   ============================================================ */

function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebarToggle');
    const backdrop = document.getElementById('sidebarBackdrop');
    const mobileBtn = document.getElementById('mobileMenuBtn');

    if (toggle && sidebar) {
        toggle.addEventListener('click', () => sidebar.classList.toggle('sidebar--collapsed'));
    }
    if (mobileBtn && sidebar && backdrop) {
        mobileBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
            backdrop.classList.add('open');
        });
    }
    if (backdrop && sidebar) {
        backdrop.addEventListener('click', () => {
            sidebar.classList.remove('open');
            backdrop.classList.remove('open');
        });
    }
}

function showToast(msg, type) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast' + (type ? ' toast--' + type : '');
    toast.innerHTML = '<i class="fi fi-br-info"></i> ' + msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

/* Auto-init ao carregar */
document.addEventListener('DOMContentLoaded', initSidebar);
