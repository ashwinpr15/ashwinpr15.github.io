(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { return null; }
  }

  // ---------------------------------------------------------------- toast
  var toastEl = $('#toast');
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2400);
  }

  // ---------------------------------------------------------------- theme
  var themeBtn = $('#themeToggle');
  function syncThemeButton() {
    var dark = root.getAttribute('data-theme') === 'dark';
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    store('theme', t);
    syncThemeButton();
    if (window.__heroRecolor) window.__heroRecolor();
  }
  function toggleTheme() { setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); }
  themeBtn.addEventListener('click', toggleTheme);
  syncThemeButton();
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function (e) {
    if (!store('theme')) setTheme(e.matches ? 'light' : 'dark');
  });

  // ---------------------------------------------------------------- nav, progress, scrollspy
  var nav = $('#nav');
  var bar = $('#progressBar');
  var timeline = $('#timeline');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
      nav.classList.toggle('scrolled', y > 10);
      if (timeline) {
        var r = timeline.getBoundingClientRect();
        var vh = window.innerHeight;
        var fill = (vh * 0.65 - r.top) / r.height;
        timeline.style.setProperty('--fill', Math.max(0, Math.min(1, fill)).toFixed(3));
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  var navLinks = $$('.nav-links a');
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + en.target.id;
          a.classList.toggle('active', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { spy.observe(s); });
  }

  // ---------------------------------------------------------------- mobile menu
  var menuBtn = $('#menuBtn');
  var menu = $('#mobileMenu');
  function setMenu(open) {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { var first = $('a', menu); if (first) first.focus(); }
  }
  menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 1080 && !menu.hidden) setMenu(false); });

  // ---------------------------------------------------------------- local time
  var timeEl = $('#localTime');
  function tick() {
    try {
      timeEl.textContent = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }).format(new Date()) + ' in Boston';
    } catch (e) { timeEl.textContent = 'Boston, MA'; }
  }
  tick();
  setInterval(tick, 30000);

  // ---------------------------------------------------------------- typed roles
  var typedEl = $('#typed');
  var roles = ['Power BI reports', 'clean data models', 'pipelines with ADF & Airflow', 'QlikView → Power BI migrations', 'analytics that drive decisions'];
  if (typedEl && !reduceMotion.matches) {
    var ri = 0, ci = roles[0].length, deleting = true;
    var typeLoop = function () {
      var word = roles[ri];
      if (deleting) {
        ci--;
        if (ci <= 0) { deleting = false; ri = (ri + 1) % roles.length; }
      } else {
        ci++;
      }
      typedEl.textContent = roles[ri].slice(0, Math.max(ci, 0));
      var delay = deleting ? 38 : 70;
      if (!deleting && ci >= roles[ri].length) { deleting = true; delay = 1900; }
      setTimeout(typeLoop, delay);
    };
    setTimeout(typeLoop, 2200);
  }

  // ---------------------------------------------------------------- reveal + counters
  var reveals = $$('.reveal');
  function runCounter(el) {
    var to = +el.getAttribute('data-to');
    if (reduceMotion.matches) { el.textContent = to; return; }
    var start = performance.now();
    var dur = to > 50 ? 1400 : 900;
    (function step(now) {
      var t = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(to * eased);
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var idx = Array.prototype.indexOf.call(el.parentNode.children, el);
        el.style.transitionDelay = Math.min(idx, 4) * 70 + 'ms';
        el.classList.add('in');
        $$('.count', el).forEach(runCounter);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) {
      $$('.count', el).forEach(function (c) { c.textContent = '0'; });
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // ---------------------------------------------------------------- projects: filters
  var projects = $$('.project');
  var filters = $$('.filter');
  var note = $('#filterNote');
  var noteText = $('#filterNoteText');
  function applyFilter(cat) {
    filters.forEach(function (f) {
      var on = f.getAttribute('data-filter') === cat;
      f.classList.toggle('is-active', on);
      f.setAttribute('aria-pressed', String(on));
    });
    projects.forEach(function (p) {
      var cats = p.getAttribute('data-cat').split(' ');
      p.classList.toggle('is-hidden', cat !== 'all' && cats.indexOf(cat) === -1);
      p.classList.remove('is-dim');
    });
    note.hidden = true;
    clearSkill();
  }
  filters.forEach(function (f) {
    f.addEventListener('click', function () { applyFilter(f.getAttribute('data-filter')); });
  });
  $('#filterClear').addEventListener('click', function () { applyFilter('all'); });

  // ---------------------------------------------------------------- toolkit -> projects
  var skillBtns = $$('#stack button[data-skill]');
  var skillInfo = $('#skillInfo');
  function clearSkill() {
    skillBtns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    skillInfo.textContent = '';
  }
  skillBtns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
  skillBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-skill');
      var name = btn.textContent.trim();
      var wasOn = btn.getAttribute('aria-pressed') === 'true';
      applyFilter('all');
      if (wasOn) return;
      btn.setAttribute('aria-pressed', 'true');
      var hits = projects.filter(function (p) { return (' ' + p.getAttribute('data-skills') + ' ').indexOf(' ' + key + ' ') !== -1; });
      var pro = btn.classList.contains('pro');
      skillInfo.innerHTML = '';
      var b = document.createElement('b'); b.textContent = name;
      skillInfo.appendChild(b);
      if (hits.length) {
        projects.forEach(function (p) { p.classList.toggle('is-dim', hits.indexOf(p) === -1); });
        skillInfo.appendChild(document.createTextNode(
          (pro ? ': used professionally at TCS, and in ' : ': used in ') + hits.length + ' public project' + (hits.length > 1 ? 's' : '') + '. '));
        var a = document.createElement('a');
        a.href = '#projects'; a.textContent = 'Show them ↓';
        a.addEventListener('click', function () {
          projects.forEach(function (p) { p.classList.toggle('is-hidden', hits.indexOf(p) === -1); p.classList.remove('is-dim'); });
          noteText.textContent = 'Projects using ' + name + '.';
          note.hidden = false;
        });
        skillInfo.appendChild(a);
      } else if (pro) {
        skillInfo.appendChild(document.createTextNode(': used professionally at TCS. Client work isn\'t public, so there\'s no repo to show.'));
      } else {
        skillInfo.appendChild(document.createTextNode(': part of my MSBA studies at BU Questrom.'));
      }
    });
  });

  // ---------------------------------------------------------------- project modal
  var modal = $('#projectModal');
  var modalBody = $('#modalBody');
  var lastOpener = null;
  function openProject(article, opener) {
    var detail = $('.project-detail', article);
    var cover = $('.cover', article);
    modalBody.innerHTML = '';
    modal.className = 'modal ' + (article.className.match(/c-\w+/) || [''])[0];
    if (cover) modalBody.appendChild(cover.cloneNode(true));
    Array.prototype.forEach.call(detail.childNodes, function (n) { modalBody.appendChild(n.cloneNode(true)); });
    var h = $('h3', modalBody); if (h) h.id = 'modalTitle';
    lastOpener = opener;
    if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
    modal.querySelector('.modal-inner').scrollTop = 0;
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    if (typeof modal.close === 'function') modal.close(); else modal.removeAttribute('open');
  }
  modal.addEventListener('close', function () {
    document.body.style.overflow = '';
    if (lastOpener) lastOpener.focus();
  });
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  $('#modalClose').addEventListener('click', closeModal);
  projects.forEach(function (p) {
    var btn = $('.project-open', p);
    btn.addEventListener('click', function () { openProject(p, btn); });
  });

  // ---------------------------------------------------------------- copy email
  var copyBtn = $('#copyEmail');
  copyBtn.addEventListener('click', function () {
    var email = copyBtn.getAttribute('data-email');
    var done = function () { toast('Email copied: ' + email); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(email).then(done, function () { window.location.href = 'mailto:' + email; });
    } else {
      window.location.href = 'mailto:' + email;
    }
  });

  // ---------------------------------------------------------------- GitHub feed
  var LANG = { Python: '#3572A5', 'Jupyter Notebook': '#DA5B0B', 'C++': '#f34b7d', HTML: '#e34c26', JavaScript: '#f1e05a', CSS: '#563d7c', QML: '#44a51c' };
  function ago(iso) {
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    var units = [[31536000, 'year'], [2592000, 'month'], [604800, 'week'], [86400, 'day'], [3600, 'hour'], [60, 'minute']];
    for (var i = 0; i < units.length; i++) {
      var n = Math.floor(s / units[i][0]);
      if (n >= 1) return n + ' ' + units[i][1] + (n > 1 ? 's' : '') + ' ago';
    }
    return 'just now';
  }
  function renderRepos(list) {
    var ul = $('#ghList');
    ul.innerHTML = '';
    list.filter(function (r) { return !r.fork && r.name !== 'ashwinpr15'; }).slice(0, 6).forEach(function (r) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = r.html_url; a.target = '_blank'; a.rel = 'noopener';
      var name = document.createElement('span'); name.className = 'gh-name'; name.textContent = r.name;
      var desc = document.createElement('span'); desc.className = 'gh-desc'; desc.textContent = r.description || 'No description';
      var meta = document.createElement('span'); meta.className = 'gh-meta';
      if (r.language) {
        var lang = document.createElement('span'); lang.className = 'gh-lang'; lang.textContent = r.language;
        lang.style.setProperty('--lc', LANG[r.language] || 'var(--muted)');
        meta.appendChild(lang);
      }
      var upd = document.createElement('span'); upd.textContent = 'Updated ' + ago(r.pushed_at);
      meta.appendChild(upd);
      a.appendChild(name); a.appendChild(desc); a.appendChild(meta);
      li.appendChild(a); ul.appendChild(li);
    });
  }
  function loadRepos() {
    var ul = $('#ghList');
    var cached = null;
    try { cached = JSON.parse(sessionStorage.getItem('gh-repos') || 'null'); } catch (e) {}
    if (cached && Date.now() - cached.t < 600000) { renderRepos(cached.d); return; }
    ul.innerHTML = '<li class="gh-skeleton"></li><li class="gh-skeleton"></li><li class="gh-skeleton"></li>';
    fetch('https://api.github.com/users/ashwinpr15/repos?sort=pushed&per_page=12', { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        try { sessionStorage.setItem('gh-repos', JSON.stringify({ t: Date.now(), d: d })); } catch (e) {}
        renderRepos(d);
      })
      .catch(function () {
        ul.innerHTML = '<li class="gh-empty">Couldn\'t load live activity right now. <a href="https://github.com/ashwinpr15?tab=repositories" target="_blank" rel="noopener">Browse repositories on GitHub ↗</a></li>';
      });
  }
  var feed = $('.gh-feed');
  if ('IntersectionObserver' in window && feed) {
    var fio = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { loadRepos(); fio.disconnect(); } }, { rootMargin: '400px' });
    fio.observe(feed);
  } else { loadRepos(); }

  // ---------------------------------------------------------------- command palette
  var palette = $('#palette');
  var pInput = $('#paletteInput');
  var pList = $('#paletteList');
  var ICON = {
    go: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    out: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    act: '<svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>'
  };
  function goTo(id) { return function () { var el = document.getElementById(id); if (el) { el.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth' }); } }; }
  function openUrl(u) { return function () { window.open(u, '_blank', 'noopener'); }; }
  var commands = [
    { label: 'Home', hint: 'section', icon: 'go', run: goTo('top') },
    { label: 'About', hint: 'section', icon: 'go', run: goTo('about') },
    { label: 'Journey', hint: 'section', icon: 'go', run: goTo('journey') },
    { label: 'Toolkit', hint: 'section', icon: 'go', run: goTo('toolkit') },
    { label: 'Projects', hint: 'section', icon: 'go', run: goTo('projects') },
    { label: 'Education', hint: 'section', icon: 'go', run: goTo('education') },
    { label: 'Contact', hint: 'section', icon: 'go', run: goTo('contact') },
    { label: 'Toggle light / dark theme', hint: 'action', icon: 'act', run: toggleTheme },
    { label: 'Copy email address', hint: 'action', icon: 'act', run: function () { copyBtn.click(); } },
    { label: 'Open resume (PDF)', hint: 'link', icon: 'out', run: openUrl('assets/Ashwin-Resume.pdf') },
    { label: 'GitHub profile', hint: 'link', icon: 'out', run: openUrl('https://github.com/ashwinpr15') },
    { label: 'LinkedIn', hint: 'link', icon: 'out', run: openUrl('https://in.linkedin.com/in/prashwin') }
  ];
  projects.forEach(function (p) {
    var title = $('.project-title', p).textContent.trim();
    commands.push({ label: 'Project: ' + title, hint: 'project', icon: 'go', run: function () { openProject(p, $('.project-open', p)); } });
  });
  var shown = [], sel = 0;
  function renderPalette() {
    var q = pInput.value.trim().toLowerCase();
    shown = commands.filter(function (c) { return !q || c.label.toLowerCase().indexOf(q) !== -1; });
    sel = Math.min(sel, Math.max(shown.length - 1, 0));
    pList.innerHTML = '';
    if (!shown.length) {
      var none = document.createElement('li'); none.textContent = 'No matches'; none.style.color = 'var(--muted)';
      pList.appendChild(none); return;
    }
    shown.forEach(function (c, i) {
      var li = document.createElement('li');
      li.id = 'pal-' + i; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', String(i === sel));
      li.innerHTML = '<span class="pi">' + ICON[c.icon] + '</span>';
      var t = document.createElement('span'); t.textContent = c.label; li.appendChild(t);
      var k = document.createElement('span'); k.className = 'pk'; k.textContent = c.hint; li.appendChild(k);
      li.addEventListener('mousemove', function () { if (sel !== i) { sel = i; mark(); } });
      li.addEventListener('click', function () { runCmd(i); });
      pList.appendChild(li);
    });
    pInput.setAttribute('aria-activedescendant', 'pal-' + sel);
  }
  function mark() {
    $$('li', pList).forEach(function (li, i) { li.setAttribute('aria-selected', String(i === sel)); });
    var cur = $('#pal-' + sel); if (cur) cur.scrollIntoView({ block: 'nearest' });
    pInput.setAttribute('aria-activedescendant', 'pal-' + sel);
  }
  function runCmd(i) {
    var c = shown[i]; if (!c) return;
    closePalette();
    setTimeout(c.run, 60);
  }
  function openPalette() {
    if (palette.open) return;
    if (modal.open) closeModal();
    pInput.value = ''; sel = 0; renderPalette();
    if (typeof palette.showModal === 'function') palette.showModal(); else palette.setAttribute('open', '');
    pInput.focus();
  }
  function closePalette() { if (typeof palette.close === 'function') palette.close(); else palette.removeAttribute('open'); }
  $('#paletteOpen').addEventListener('click', openPalette);
  palette.addEventListener('click', function (e) { if (e.target === palette) closePalette(); });
  pInput.addEventListener('input', function () { sel = 0; renderPalette(); });
  pInput.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(shown.length, 1); mark(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + shown.length) % Math.max(shown.length, 1); mark(); }
    else if (e.key === 'Enter') { e.preventDefault(); runCmd(sel); }
  });
  document.addEventListener('keydown', function (e) {
    var typing = /input|textarea|select/i.test((e.target && e.target.tagName) || '');
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); palette.open ? closePalette() : openPalette(); }
    else if (e.key === '/' && !typing && !palette.open && !modal.open) { e.preventDefault(); openPalette(); }
  });
  if (/Mac|iPhone|iPad/.test(navigator.platform || '')) { var k1 = $('.kbd-hint kbd'); if (k1) k1.textContent = '⌘'; }

  // ---------------------------------------------------------------- hero canvas: signals -> data -> decisions
  var canvas = $('#heroCanvas');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1, parts = [], colors = [], running = false, raf = 0;
    var readColors = function () {
      var cs = getComputedStyle(root);
      colors = ['--violet', '--teal', '--orange'].map(function (v) { return hexToRgb(cs.getPropertyValue(v).trim()); });
    };
    function hexToRgb(h) {
      h = h.replace('#', '');
      if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
      var n = parseInt(h, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function colorAt(x) {
      var t = Math.max(0, Math.min(1, x / W)) * 2;
      var i = Math.min(1, Math.floor(t)), f = t - i;
      var a = colors[i], b = colors[i + 1];
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
    }
    function resize() {
      var rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width; H = rect.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(Math.min(90, Math.max(28, W * H / 16000)));
      parts = [];
      for (var i = 0; i < count; i++) parts.push(spawn(Math.random() * W));
    }
    function spawn(x) {
      return { x: x, y: Math.random() * H, base: Math.random() * H, v: 0.25 + Math.random() * 0.55, r: 1 + Math.random() * 1.8, ph: Math.random() * Math.PI * 2, amp: 8 + Math.random() * 26 };
    }
    function frame(time) {
      ctx.clearRect(0, 0, W, H);
      var light = root.getAttribute('data-theme') === 'light';
      var lineA = light ? 0.16 : 0.2, dotA = light ? 0.55 : 0.75;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (running) {
          p.x += p.v;
          p.y = p.base + Math.sin(time / 1400 + p.ph + p.x / 160) * p.amp;
          if (p.x > W + 20) { parts[i] = spawn(-20); continue; }
        }
      }
      for (var a = 0; a < parts.length; a++) {
        for (var b = a + 1; b < parts.length; b++) {
          var dx = parts[a].x - parts[b].x, dy = parts[a].y - parts[b].y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 12000) {
            var c = colorAt((parts[a].x + parts[b].x) / 2);
            ctx.strokeStyle = 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (lineA * (1 - d2 / 12000)).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(parts[a].x, parts[a].y); ctx.lineTo(parts[b].x, parts[b].y); ctx.stroke();
          }
        }
      }
      for (var j = 0; j < parts.length; j++) {
        var q = parts[j], cc = colorAt(q.x);
        ctx.fillStyle = 'rgba(' + (cc[0] | 0) + ',' + (cc[1] | 0) + ',' + (cc[2] | 0) + ',' + dotA + ')';
        ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill();
      }
      if (running) raf = requestAnimationFrame(frame);
    }
    function start() {
      if (running || reduceMotion.matches) return;
      running = true; raf = requestAnimationFrame(frame);
    }
    function stop() { running = false; cancelAnimationFrame(raf); }
    window.__heroRecolor = function () { readColors(); if (!running) frame(performance.now()); };
    readColors(); resize();
    for (var s = 0; s < parts.length; s++) parts[s].y = parts[s].base;
    frame(performance.now());
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { resize(); if (!running) frame(performance.now()); }, 150); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }).observe(canvas);
    } else { start(); }
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    reduceMotion.addEventListener('change', function () { reduceMotion.matches ? stop() : start(); });
  }
})();
