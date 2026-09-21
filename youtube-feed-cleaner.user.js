// ==UserScript==
// @name         YouTube Feed Cleaner
// @namespace    https://github.com/rodrigomescua/youtube-feed-cleaner
// @version      0.1.0
// @description  Gerencie termos e oculte vídeos correspondentes no feed de inscrições.
// @homepageURL  https://github.com/rodrigomescua/youtube-feed-cleaner
// @supportURL   https://github.com/rodrigomescua/youtube-feed-cleaner/issues
// @updateURL    https://raw.githubusercontent.com/rodrigomescua/youtube-feed-cleaner/main/youtube-feed-cleaner.user.js
// @downloadURL  https://raw.githubusercontent.com/rodrigomescua/youtube-feed-cleaner/main/youtube-feed-cleaner.user.js
// @license      MIT
// @match        https://www.youtube.com/feed/subscriptions*
// @match        https://www.youtube.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(() => {
  'use strict';

  const STORE_TERMS = 'ytfc.terms';
  const STORE_ENABLED = 'ytfc.enabled';
  const STORE_AUTO = 'ytfc.autoHide';
  const STORE_HIDDEN = 'ytfc.hiddenIds';
  const STYLE_ID = 'ytfc-style';
  const PANEL_ID = 'ytfc-panel';
  const BUTTON_ID = 'ytfc-open';
  const VIDEO_SELECTOR = 'ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer';
  const TITLE_SELECTOR = '#video-title, a#video-title-link';

  const get = async (key, fallback) => {
    try {
      const value = await GM_getValue(key, fallback);
      return value ?? fallback;
    } catch {
      return fallback;
    }
  };
  const set = async (key, value) => GM_setValue(key, value);

  let terms = [];
  let enabled = true;
  let autoHide = false;
  let hiddenIds = [];
  let scanTimer = 0;

  const normalize = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
  const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const onSubscriptions = () => location.pathname.startsWith('/feed/subscriptions');

  function styles() {
    if (document.getElementById(STYLE_ID)) return;
    const css = `
      #${BUTTON_ID}{position:fixed;right:22px;bottom:22px;z-index:99999;border:0;border-radius:999px;padding:12px 17px;background:#8ab4f8;color:#101114;font:600 14px Roboto,Arial;box-shadow:0 4px 18px #0006;cursor:pointer}
      #${PANEL_ID}{position:fixed;right:22px;bottom:78px;z-index:99999;width:min(370px,calc(100vw - 32px));max-height:min(75vh,680px);overflow:auto;box-sizing:border-box;padding:20px;border:1px solid #3c4048;border-radius:18px;background:#202124;color:#e8eaed;font:14px Roboto,Arial;box-shadow:0 12px 40px #0009}
      #${PANEL_ID}[hidden]{display:none} #${PANEL_ID} *{box-sizing:border-box}
      .ytfc-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}.ytfc-head h2{font-size:18px;margin:0}.ytfc-icon{border:0;background:transparent;color:#bdc1c6;font-size:22px;cursor:pointer}
      .ytfc-note{color:#bdc1c6;font-size:12px;line-height:1.5;margin:0 0 14px}.ytfc-row{display:flex;gap:8px;margin:12px 0}.ytfc-row input{min-width:0;flex:1;border:1px solid #5f6368;border-radius:9px;background:#303134;color:#fff;padding:10px 11px;font:inherit}.ytfc-add,.ytfc-action{border:0;border-radius:9px;background:#8ab4f8;color:#101114;padding:9px 12px;font-weight:600;cursor:pointer}.ytfc-switches{display:grid;gap:11px;margin:14px 0;padding:12px;border-radius:12px;background:#292a2d}.ytfc-switches label{display:flex;align-items:center;gap:9px;cursor:pointer}.ytfc-switches input{accent-color:#8ab4f8;width:16px;height:16px}
      .ytfc-list{list-style:none;margin:12px 0;padding:0;display:grid;gap:7px}.ytfc-list li{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 10px;background:#292a2d;border-radius:9px}.ytfc-term{overflow-wrap:anywhere}.ytfc-remove{border:0;border-radius:7px;background:#3c4043;color:#f1f3f4;padding:6px 9px;cursor:pointer}.ytfc-status{margin:12px 0 0;color:#bdc1c6;font-size:12px}
      .ytfc-match{outline:2px solid #fbbc04!important;outline-offset:2px;border-radius:8px!important}
      .ytfc-inline{display:flex;gap:6px;flex-wrap:wrap;margin:7px 0}.ytfc-inline button{border:0;border-radius:8px;padding:7px 10px;background:#fbbc04;color:#202124;font-weight:600;cursor:pointer}
    `;
    if (typeof GM_addStyle === 'function') GM_addStyle(css);
    else { const style = document.createElement('style'); style.id = STYLE_ID; style.textContent = css; document.head.append(style); }
  }

  function makePanel() {
    if (document.getElementById(PANEL_ID)) return;
    const button = document.createElement('button');
    button.id = BUTTON_ID; button.type = 'button'; button.textContent = '✦ Limpar feed';
    button.addEventListener('click', () => { const panel = document.getElementById(PANEL_ID); panel.hidden = !panel.hidden; renderPanel(); });
    const panel = document.createElement('section');
    panel.id = PANEL_ID; panel.hidden = true; panel.setAttribute('aria-label', 'Gerenciador de termos');
    document.body.append(button, panel);
    renderPanel();
  }

  function renderPanel() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    panel.innerHTML = `<div class="ytfc-head"><h2>Limpar feed</h2><button class="ytfc-icon" type="button" aria-label="Fechar">×</button></div>
      <p class="ytfc-note">Adicione palavras ou frases para encontrar vídeos pelo título no feed de inscrições.</p>
      <form class="ytfc-row"><input name="term" maxlength="100" placeholder="Ex.: spoilers, futebol" aria-label="Novo termo" required><button class="ytfc-add">Adicionar</button></form>
      <div class="ytfc-switches"><label><input type="checkbox" name="enabled" ${enabled ? 'checked' : ''}> Ativar detecção</label><label><input type="checkbox" name="auto" ${autoHide ? 'checked' : ''}> Ocultar automaticamente (experimental)</label></div>
      <ul class="ytfc-list">${terms.length ? terms.map((term, i) => `<li><span class="ytfc-term">${escapeHtml(term)}</span><button class="ytfc-remove" data-remove="${i}" type="button">Remover</button></li>`).join('') : '<li class="ytfc-term">Nenhum termo cadastrado ainda.</li>'}</ul>
      <p class="ytfc-status">${onSubscriptions() ? 'Os títulos visíveis são analisados automaticamente.' : 'Abra youtube.com/feed/subscriptions para analisar o feed.'}</p>`;
    panel.querySelector('.ytfc-icon').onclick = () => { panel.hidden = true; };
    panel.querySelector('form').onsubmit = async (event) => {
      event.preventDefault(); const input = panel.querySelector('input[name="term"]'); const value = input.value.trim();
      if (value && !terms.some((term) => normalize(term) === normalize(value))) { terms.push(value); await set(STORE_TERMS, terms); renderPanel(); scan(); }
    };
    panel.querySelectorAll('[data-remove]').forEach((button) => button.onclick = async () => { terms.splice(Number(button.dataset.remove), 1); await set(STORE_TERMS, terms); renderPanel(); scan(); });
    panel.querySelector('input[name="enabled"]').onchange = async (event) => { enabled = event.target.checked; await set(STORE_ENABLED, enabled); scan(); };
    panel.querySelector('input[name="auto"]').onchange = async (event) => { autoHide = event.target.checked; await set(STORE_AUTO, autoHide); scan(); };
  }

  function videoId(card, anchor) {
    const href = anchor?.getAttribute('href') || '';
    const id = new URL(href, location.origin).searchParams.get('v');
    return id || card.getAttribute('data-video-id') || '';
  }

  function titleFor(card) {
    const title = card.querySelector(TITLE_SELECTOR);
    return (title?.getAttribute('title') || title?.textContent || '').trim();
  }

  function matchingTerm(title) {
    const haystack = normalize(title);
    return terms.find((term) => normalize(term) && haystack.includes(normalize(term)));
  }

  function menuButton(card) {
    return card.querySelector('ytd-menu-renderer yt-icon-button, ytd-menu-renderer #button, button[aria-label*="More"], button[aria-label*="Ações"]');
  }

  function menuItem(label) {
    return [...document.querySelectorAll('ytd-menu-service-item-renderer, tp-yt-paper-listbox ytd-menu-service-item-renderer')]
      .find((el) => normalize(el.innerText).includes(normalize(label)));
  }

  async function hideVideo(card, id, manual = false) {
    if (id && hiddenIds.includes(id)) return;
    const menu = menuButton(card);
    if (!menu) return;
    menu.click();
    await new Promise((resolve) => setTimeout(resolve, 180));
    const item = menuItem('Não tenho interesse') || menuItem('Not interested');
    if (!item) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return; }
    item.click();
    if (id) { hiddenIds.push(id); hiddenIds = [...new Set(hiddenIds)].slice(-1000); await set(STORE_HIDDEN, hiddenIds); }
    card.classList.remove('ytfc-match');
    card.querySelector('.ytfc-inline')?.remove();
    if (manual) scan();
  }

  function scan() {
    clearTimeout(scanTimer);
    scanTimer = window.setTimeout(() => {
      if (!onSubscriptions()) return;
      document.querySelectorAll(VIDEO_SELECTOR).forEach((card) => {
        const title = titleFor(card);
        const anchor = card.querySelector(TITLE_SELECTOR);
        const id = videoId(card, anchor);
        card.querySelector('.ytfc-inline')?.remove(); card.classList.remove('ytfc-match');
        if (!enabled || !title || !matchingTerm(title) || (id && hiddenIds.includes(id))) return;
        card.classList.add('ytfc-match');
        if (autoHide) { hideVideo(card, id); return; }
        const actions = document.createElement('div'); actions.className = 'ytfc-inline';
        const hide = document.createElement('button'); hide.type = 'button'; hide.textContent = 'Ocultar do feed'; hide.title = 'Aciona “Não tenho interesse” no menu do YouTube';
        hide.onclick = () => hideVideo(card, id, true); actions.append(hide);
        const titleNode = card.querySelector('#details, #meta, h3') || anchor?.parentElement;
        titleNode?.append(actions);
      });
    }, 120);
  }

  async function init() {
    terms = await get(STORE_TERMS, []); enabled = await get(STORE_ENABLED, true); autoHide = await get(STORE_AUTO, false); hiddenIds = await get(STORE_HIDDEN, []);
    if (!Array.isArray(terms)) terms = [];
    if (!Array.isArray(hiddenIds)) hiddenIds = [];
    styles(); makePanel(); scan();
    new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('yt-navigate-finish', () => { renderPanel(); scan(); });
    window.addEventListener('popstate', scan);
  }

  init();
})();
