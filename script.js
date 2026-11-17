// Small enhancements only. Every page works without this file.
(function () {
  'use strict';

  var root = document.documentElement;
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  // ---------------------------------------------------------------- theme toggle
  var themeBtn = document.getElementById('themeToggle');
  function effectiveTheme() {
    var t = root.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    return systemDark.matches ? 'dark' : 'light';
  }
  function syncThemeButton() {
    var dark = effectiveTheme() === 'dark';
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }
  if (themeBtn) {
    themeBtn.hidden = false;
    syncThemeButton();
    themeBtn.addEventListener('click', function () {
      var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      syncThemeButton();
    });
    systemDark.addEventListener('change', function () {
      var saved = null;
      try { saved = localStorage.getItem('theme'); } catch (e) {}
      if (!saved) { root.removeAttribute('data-theme'); syncThemeButton(); }
    });
  }

  // ---------------------------------------------------------------- copy email
  var copyBtn = document.getElementById('copyEmail');
  var status = document.getElementById('copyStatus');
  if (copyBtn && navigator.clipboard && window.isSecureContext) {
    copyBtn.hidden = false;
    copyBtn.addEventListener('click', function () {
      var email = copyBtn.getAttribute('data-email');
      navigator.clipboard.writeText(email).then(function () {
        copyBtn.textContent = 'Copied';
        if (status) status.textContent = 'Email address copied to the clipboard.';
        setTimeout(function () { copyBtn.textContent = 'Copy email'; }, 2000);
      }, function () {
        if (status) status.textContent = 'Copying failed. The email address is ashwinpr@bu.edu.';
      });
    });
  }
})();
