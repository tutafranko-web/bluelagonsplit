/* Opsis Restoran — gumb za rezervaciju na webu restorana.
   Ugradnja: <script src="https://TVOJA-DOMENA/widget.js" data-restaurant="konoba-test" data-label="Rezerviraj stol" async></script> */
(function () {
  var s = document.currentScript;
  if (!s) return;
  var slug = s.getAttribute('data-restaurant');
  var base = s.src.replace(/\/widget\.js.*$/, '');
  var label = s.getAttribute('data-label') || 'Rezerviraj stol';
  var color = s.getAttribute('data-color') || '#0f5c8c';
  var btn = document.createElement('button');
  btn.textContent = label;
  btn.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:2147483000;padding:12px 18px;border:0;border-radius:999px;background:' + color + ';color:#fff;font:600 15px system-ui;box-shadow:0 4px 14px rgba(0,0,0,.2);cursor:pointer';
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:2147483001;display:none;align-items:center;justify-content:center';
  var frame = document.createElement('iframe');
  frame.title = label;
  frame.style.cssText = 'width:min(520px,100vw);height:min(760px,100vh);border:0;border-radius:12px;background:#f7f8fa';
  var close = document.createElement('button');
  close.textContent = '×';
  close.setAttribute('aria-label', 'Zatvori');
  close.style.cssText = 'position:absolute;top:12px;right:16px;font:28px system-ui;color:#fff;background:none;border:0;cursor:pointer';
  overlay.appendChild(frame);
  overlay.appendChild(close);
  btn.onclick = function () {
    if (!frame.src) frame.src = base + '/b/' + encodeURIComponent(slug) + '?lang=' + (navigator.language || 'hr').slice(0, 2);
    overlay.style.display = 'flex';
  };
  close.onclick = function () { overlay.style.display = 'none'; };
  overlay.onclick = function (e) { if (e.target === overlay) overlay.style.display = 'none'; };
  document.body.appendChild(btn);
  document.body.appendChild(overlay);
})();
