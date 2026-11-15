/* ============================================================
   PANTALLA DE CARGA — logo que rebota (estilo B) en azul, dorado y blanco
   Va en el <head> (antes de todo). Se inyecta sola: no necesita HTML ni CSS aparte.
   ============================================================ */
(function () {
  var MIN_MS = 1400;       // tiempo mínimo visible
  var MAX_MS = 6000;       // por si algo tarda de más, se quita igual
  var inicio = Date.now();

  var css = document.createElement('style');
  css.textContent =
    '#mvll-loader{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;overflow:hidden;' +
      'background:radial-gradient(circle at 50% 40%,#1a3a7c 0%,#0a1940 72%);transition:opacity .7s ease,visibility .7s ease;}' +
    '#mvll-loader.fuera{opacity:0;visibility:hidden;}' +
    '#mvll-loader .ml-logo-wrap{width:150px;height:150px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;border:4px solid #F0A500;box-shadow:0 10px 0 #b87d00;animation:mlRebota 1.3s ease-in-out infinite;}' +
    '#mvll-loader .ml-logo{width:120px;height:120px;border-radius:50%;object-fit:cover;}' +
    '#mvll-loader .ml-sombra{width:110px;height:12px;border-radius:50%;background:#000;margin-top:-6px;animation:mlSombra 1.3s ease-in-out infinite;}' +
    '#mvll-loader .ml-nombre{font-family:"Playfair Display",serif;font-weight:700;font-size:1.9rem;color:#fff;text-align:center;}' +
    '#mvll-loader .ml-sub{font-family:"Nunito",sans-serif;font-size:.85rem;color:#ffd166;letter-spacing:3px;text-transform:uppercase;margin-top:-10px;}' +
    '#mvll-loader .ml-puntos{display:flex;gap:12px;margin-top:6px;}' +
    '#mvll-loader .ml-puntos i{display:block;width:16px;height:16px;border-radius:50%;background:#F0A500;animation:mlRebota 1.3s ease-in-out infinite;}' +
    '#mvll-loader .ml-puntos i:nth-child(2){background:#fff;animation-delay:.2s;}' +
    '#mvll-loader .ml-puntos i:nth-child(3){animation-delay:.4s;}' +
    '#mvll-loader .ml-flota{position:absolute;border-radius:50%;animation:mlFlota 5s ease-in-out infinite;}' +
    '#mvll-loader .ml-ola{position:absolute;left:0;bottom:-1px;width:100%;height:80px;}' +
    '@keyframes mlRebota{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}' +
    '@keyframes mlSombra{0%,100%{transform:scaleX(1);opacity:.35}50%{transform:scaleX(.7);opacity:.2}}' +
    '@keyframes mlFlota{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-14px) rotate(8deg)}}' +
    '@media (prefers-reduced-motion:reduce){#mvll-loader *{animation:none!important}}' +
    'html.ml-bloqueado{overflow:hidden!important}';
  document.head.appendChild(css);
  document.documentElement.classList.add('ml-bloqueado');

  var el = document.createElement('div');
  el.id = 'mvll-loader';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML =
    '<span class="ml-flota" style="top:14%;left:12%;width:110px;height:44px;background:rgba(255,255,255,.14)"></span>' +
    '<span class="ml-flota" style="top:24%;right:14%;width:140px;height:54px;background:rgba(255,255,255,.12);animation-delay:-2s"></span>' +
    '<span class="ml-flota" style="bottom:22%;left:20%;width:24px;height:24px;background:#F0A500;opacity:.8;animation-delay:-1s"></span>' +
    '<span class="ml-flota" style="bottom:28%;right:22%;width:18px;height:18px;border:3px solid #ffd166;animation-delay:-3s"></span>' +
    '<div class="ml-logo-wrap"><img class="ml-logo" src="img/logo.png" alt=""/></div>' +
    '<div class="ml-sombra"></div>' +
    '<div class="ml-nombre">Mario Vargas Llosa</div>' +
    '<div class="ml-sub">Mariano Melgar · Arequipa</div>' +
    '<div class="ml-puntos"><i></i><i></i><i></i></div>' +
    '<svg class="ml-ola" viewBox="0 0 1200 80" preserveAspectRatio="none"><path d="M0 80V40Q150 0 300 40T600 40T900 40T1200 40V80Z" fill="#f7f4ec"/></svg>';
  document.documentElement.appendChild(el);

  var quitado = false;
  function quitar() {
    if (quitado) return;
    quitado = true;
    var espera = Math.max(0, MIN_MS - (Date.now() - inicio));
    setTimeout(function () {
      el.classList.add('fuera');
      document.documentElement.classList.remove('ml-bloqueado');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 800);
    }, espera);
  }
  window.addEventListener('load', quitar);
  setTimeout(quitar, MAX_MS);
})();
