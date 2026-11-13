const revealItems = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -45px' });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const menuToggle = document.getElementById('menuToggle');
const siteNav = document.getElementById('siteNav');

function setNavOpen(open) {
  if (!siteNav) return;
  siteNav.classList.toggle('open', open);
  menuToggle?.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('nav-open', open);
}

menuToggle?.addEventListener('click', () => {
  setNavOpen(!siteNav?.classList.contains('open'));
});

siteNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setNavOpen(false)));

/* Escape e toque fora fecham o menu no celular. */
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !siteNav?.classList.contains('open')) return;
  setNavOpen(false);
  menuToggle?.focus();
});

document.addEventListener('click', (event) => {
  if (!siteNav?.classList.contains('open')) return;
  if (siteNav.contains(event.target) || menuToggle?.contains(event.target)) return;
  setNavOpen(false);
});

const wideScreen = window.matchMedia('(min-width: 921px)');
wideScreen.addEventListener?.('change', (event) => {
  if (event.matches) setNavOpen(false);
});

const periodButtons = document.querySelectorAll('[data-period]');
const prices = document.querySelectorAll('.price strong[data-monthly]');
periodButtons.forEach((button) => button.addEventListener('click', () => {
  periodButtons.forEach((item) => item.classList.toggle('active', item === button));
  const annual = button.dataset.period === 'annual';
  prices.forEach((price) => { price.textContent = annual ? price.dataset.annual : price.dataset.monthly; });
}));
