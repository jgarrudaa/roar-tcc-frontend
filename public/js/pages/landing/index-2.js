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
menuToggle?.addEventListener('click', () => {
  const open = siteNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
siteNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  siteNav.classList.remove('open');
  menuToggle?.setAttribute('aria-expanded', 'false');
}));

const periodButtons = document.querySelectorAll('[data-period]');
const prices = document.querySelectorAll('.price strong[data-monthly]');
periodButtons.forEach((button) => button.addEventListener('click', () => {
  periodButtons.forEach((item) => item.classList.toggle('active', item === button));
  const annual = button.dataset.period === 'annual';
  prices.forEach((price) => { price.textContent = annual ? price.dataset.annual : price.dataset.monthly; });
}));
