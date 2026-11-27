'use strict';

const pwaReady = (async () => {
  if (!window.isSecureContext || !('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('./sw.js');
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return;
    await new Promise(resolve => {
      const finish = () => {
        clearTimeout(timeout);
        navigator.serviceWorker.removeEventListener('controllerchange', finish);
        resolve();
      };
      const timeout = setTimeout(finish, 1500);
      navigator.serviceWorker.addEventListener('controllerchange', finish);
      if (navigator.serviceWorker.controller) finish();
    });
  } catch (error) {
    console.warn('MY LIFE SPACE PWA:', error);
  }
})();

let installPrompt;
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
});
window.addEventListener('appinstalled', () => {
  installPrompt = undefined;
  const controls = document.getElementById('pwaInstallControls');
  if (controls) controls.hidden = true;
});
document.addEventListener('DOMContentLoaded', () => {
  const controls = document.getElementById('pwaInstallControls');
  const button = document.getElementById('pwaInstall');
  const help = document.getElementById('pwaInstallHelp');
  if (!controls || !button || !help) return;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  controls.hidden = standalone || !window.isSecureContext;
  button.addEventListener('click', async () => {
    if (installPrompt) {
      const prompt = installPrompt;
      installPrompt = undefined;
      try {
        await prompt.prompt();
        return;
      } catch (error) {
        console.warn('MY LIFE SPACE install prompt:', error);
      }
    }
    help.hidden = !help.hidden;
    button.setAttribute('aria-expanded', String(!help.hidden));
  });
});
