document.documentElement.classList.add('js');
const themeButton = document.getElementById('themeToggle');
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const light = theme === 'light';
  themeButton.textContent = light ? '☾' : '☀';
  themeButton.setAttribute('aria-label', `Switch to ${light ? 'dark' : 'light'} theme`);
}
let savedTheme;
try { savedTheme = localStorage.getItem('theme'); } catch (_) { /* Storage may be disabled. */ }
applyTheme(['light', 'dark'].includes(savedTheme) ? savedTheme : (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
themeButton.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(theme);
  try { localStorage.setItem('theme', theme); } catch (_) { /* Theme still works without persistence. */ }
});
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab, focus = false) {
  tabs.forEach(item => {
    const selected = item === tab;
    item.classList.toggle('active', selected);
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  });
  if (focus) tab.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (['ArrowRight', 'ArrowDown'].includes(event.key)) next = (index + 1) % tabs.length;
    if (['ArrowLeft', 'ArrowUp'].includes(event.key)) next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); selectTab(tabs[next], true); }
  });
});
// Progressive enhancement: skill content remains visible if scripting is unavailable.
selectTab(tabs[0]);
const hamburger = document.getElementById('hamburger');
const overlay = document.getElementById('mobileOverlay');
const mobileLinks = [...overlay.querySelectorAll('a')];
function setMenu(open, restoreFocus = false) {
  overlay.hidden = !open;
  overlay.classList.toggle('active', open);
  hamburger.classList.toggle('active', open);
  hamburger.setAttribute('aria-expanded', String(open));
  hamburger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  document.body.style.overflow = open ? 'hidden' : '';
  document.querySelector('main').inert = open;
  document.querySelector('footer').inert = open;
  if (open) mobileLinks[0].focus();
  else if (restoreFocus) hamburger.focus();
}
hamburger.addEventListener('click', () => setMenu(overlay.hidden, true));
mobileLinks.forEach(link => link.addEventListener('click', () => {
  setMenu(false);
  const section = document.querySelector(link.getAttribute('href'));
  section.tabIndex = -1;
  section.focus({ preventScroll: true });
}));
document.addEventListener('keydown', event => {
  if (overlay.hidden) return;
  if (event.key === 'Escape') { event.preventDefault(); setMenu(false, true); }
  if (event.key === 'Tab') {
    const focusables = [hamburger, ...mobileLinks];
    const index = focusables.indexOf(document.activeElement);
    event.preventDefault();
    focusables[(index + (event.shiftKey ? -1 : 1) + focusables.length) % focusables.length].focus();
  }
});
matchMedia('(min-width: 769px)').addEventListener('change', event => { if (event.matches) setMenu(false); });
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) document.querySelectorAll('.nav-links a').forEach(link => {
      if (link.getAttribute('href') === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-20% 0px -60% 0px' });
document.querySelectorAll('section[id]').forEach(section => observer.observe(section));
