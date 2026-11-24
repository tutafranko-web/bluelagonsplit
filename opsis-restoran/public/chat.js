/* Opsis Restoran — AI chat na webu restorana.
   Ugradnja: <script src="https://TVOJA-DOMENA/chat.js" data-restaurant="konoba-test" async></script> */
(function () {
  var s = document.currentScript;
  if (!s) return;
  var slug = s.getAttribute('data-restaurant');
  var base = s.src.replace(/\/chat\.js.*$/, '');
  var color = s.getAttribute('data-color') || '#0f5c8c';
  var lang = (navigator.language || 'hr').slice(0, 2);
  var hello = { hr: 'Bok! Ja sam AI asistent restorana. Mogu provjeriti slobodne stolove, napraviti rezervaciju ili odgovoriti na pitanja.', de: 'Hallo! Ich bin der KI-Assistent des Restaurants. Ich kann Tische prüfen, reservieren oder Fragen beantworten.' }[lang]
    || "Hi! I'm the restaurant's AI assistant. I can check tables, make a booking or answer questions.";
  var key = 'opsis-chat-' + slug;
  var sid = localStorage.getItem(key);
  if (!sid) { sid = 'w' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(key, sid); }

  var css = document.createElement('style');
  css.textContent =
    '.oc-btn{position:fixed;right:20px;bottom:20px;width:56px;height:56px;border-radius:50%;border:0;background:' + color + ';color:#fff;font:24px system-ui;cursor:pointer;z-index:2147483000;box-shadow:0 4px 14px rgba(0,0,0,.25)}' +
    '.oc-box{position:fixed;right:20px;bottom:88px;width:min(360px,calc(100vw - 40px));height:min(520px,calc(100vh - 120px));background:#fff;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.25);display:none;flex-direction:column;overflow:hidden;z-index:2147483000;font:15px/1.4 system-ui}' +
    '.oc-log{flex:1;overflow:auto;padding:12px;background:#f7f8fa}' +
    '.oc-m{max-width:85%;padding:8px 11px;border-radius:12px;margin:6px 0;white-space:pre-wrap;word-wrap:break-word}' +
    '.oc-bot{background:#fff;border:1px solid #e3e6ea}.oc-me{background:' + color + ';color:#fff;margin-left:auto}' +
    '.oc-f{display:flex;border-top:1px solid #e3e6ea}.oc-f input{flex:1;border:0;padding:12px;font:inherit;outline:none}.oc-f button{border:0;background:none;color:' + color + ';font:600 15px system-ui;padding:0 14px;cursor:pointer}';
  document.head.appendChild(css);
  var btn = document.createElement('button'); btn.className = 'oc-btn'; btn.textContent = '💬'; btn.setAttribute('aria-label', 'Chat');
  var box = document.createElement('div'); box.className = 'oc-box';
  box.innerHTML = '<div class="oc-log"></div><form class="oc-f"><input placeholder="…" maxlength="2000"><button>➤</button></form>';
  document.body.appendChild(btn); document.body.appendChild(box);
  var log = box.querySelector('.oc-log'), form = box.querySelector('form'), input = box.querySelector('input');
  function add(text, me) {
    var d = document.createElement('div'); d.className = 'oc-m ' + (me ? 'oc-me' : 'oc-bot'); d.textContent = text;
    log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }
  add(hello, false);
  btn.onclick = function () { box.style.display = box.style.display === 'flex' ? 'none' : 'flex'; input.focus(); };
  form.onsubmit = function (e) {
    e.preventDefault();
    var text = input.value.trim(); if (!text) return;
    input.value = ''; add(text, true);
    var wait = add('…', false);
    fetch(base + '/api/r/' + encodeURIComponent(slug) + '/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sid, message: text }),
    }).then(function (r) { return r.json(); })
      .then(function (d) { wait.textContent = d.reply || d.message || 'Greška'; })
      .catch(function () { wait.textContent = 'Veza nije uspjela. Pokušajte ponovno.'; });
  };
})();
