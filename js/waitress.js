/* ==========================================================================
   waitress.js — Lector de pedidos para el personal (mesera.html)
   Cámara + jsQR para leer el QR del cliente, validar y mostrar el pedido.
   Depende de: config.js, utils.js, i18n.js, icons.js, vendor/jsQR.js, order-qr.js
   ========================================================================== */
(function (root) {
  'use strict';

  var cfg = root.AppConfig, I18n = root.I18n, Utils = root.Utils, Icons = root.Icons, OrderQR = root.OrderQR;
  var esc = Utils.esc, doc = root.document;

  var stream = null, rafId = null, lastScanAt = 0, lastText = '', lastTextAt = 0;
  var scanCanvas = null, scanCtx = null;
  var cameraWanted = false;      // la cámara estaba activa antes de leer el pedido
  var collecting = null;         // { id, total, parts: { k: order } } para pedidos divididos
  var current = null;            // pedido mostrado

  function $(s, c) { return (c || doc).querySelector(s); }
  function t(k, v) { return I18n.t(k, v); }
  function ico(n, s) { return Icons.svg(n, s); }

  /* ------------------------------------------------------------ mensajes */
  function showMsg(kind, text, iconName) {
    $('#messages').innerHTML = '<div class="msg ' + kind + '" role="' + (kind === 'error' ? 'alert' : 'status') + '">' +
      ico(iconName || (kind === 'error' ? 'circle-alert' : kind === 'warn' ? 'triangle-alert' : 'info'), 20) + '<span>' + esc(text) + '</span></div>';
  }
  function clearMsg() { $('#messages').innerHTML = ''; }
  function setStatus(text) { $('#status').textContent = text || ''; }

  function fmt(cents) {
    var cur = current ? current.c : cfg.currency.code;
    var sym = cur === cfg.currency.code ? cfg.currency.symbol : cur + ' ';
    return sym + Utils.fromCents(cents).toFixed(cfg.currency.decimals);
  }

  /* -------------------------------------------------------------- cámara */
  function cameraErrorText(err) {
    var n = err && err.name;
    if (n === 'NotAllowedError' || n === 'PermissionDeniedError' || n === 'SecurityError') return t('staff.camDenied');
    if (n === 'NotFoundError' || n === 'DevicesNotFoundError' || n === 'OverconstrainedError') return t('staff.camNotFound');
    if (n === 'NotReadableError' || n === 'TrackStartError') return t('staff.camBusy');
    return t('staff.camGeneric');
  }

  function startCamera() {
    clearMsg();
    if (typeof root.jsQR !== 'function') { showMsg('error', t('staff.camGeneric')); return; }
    if (!root.isSecureContext && root.location.hostname !== 'localhost' && root.location.hostname !== '127.0.0.1') {
      showMsg('error', t('staff.camInsecure')); return;
    }
    if (!root.navigator.mediaDevices || !root.navigator.mediaDevices.getUserMedia) {
      showMsg('error', t('staff.camNoSupport')); return;
    }
    setStatus(t('staff.starting'));
    root.navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
    }).then(function (s) {
      stream = s;
      var v = $('#video');
      v.srcObject = s;
      v.setAttribute('playsinline', 'true');
      v.muted = true;
      return v.play();
    }).then(function () {
      cameraWanted = true;
      $('#video-wrap').classList.add('on');
      $('#btn-start').hidden = true;
      $('#btn-stop').hidden = false;
      setStatus(t('staff.scanning'));
      lastScanAt = 0;
      rafId = root.requestAnimationFrame(tick);
    }).catch(function (err) {
      stopCamera(true);
      setStatus('');
      showMsg('error', cameraErrorText(err));
    });
  }

  function stopCamera(keepWanted) {
    if (rafId) { root.cancelAnimationFrame(rafId); rafId = null; }
    if (stream) { stream.getTracks().forEach(function (tr) { tr.stop(); }); stream = null; }
    var v = $('#video');
    if (v) { try { v.pause(); } catch (e) { /* ignorar */ } v.srcObject = null; }
    $('#video-wrap').classList.remove('on');
    $('#btn-start').hidden = false;
    $('#btn-stop').hidden = true;
    if (!keepWanted) cameraWanted = false;
    if (!current) setStatus('');
  }

  function tick(ts) {
    if (!stream) return;
    rafId = root.requestAnimationFrame(tick);
    if (ts - lastScanAt < 110) return;          // ~9 lecturas por segundo
    lastScanAt = ts;
    var v = $('#video');
    if (v.readyState < 2 || !v.videoWidth) return;
    var scale = Math.min(1, 720 / v.videoWidth);
    var w = Math.round(v.videoWidth * scale), h = Math.round(v.videoHeight * scale);
    if (!scanCanvas) { scanCanvas = doc.createElement('canvas'); scanCtx = scanCanvas.getContext('2d', { willReadFrequently: true }); }
    scanCanvas.width = w; scanCanvas.height = h;
    scanCtx.drawImage(v, 0, 0, w, h);
    var img = scanCtx.getImageData(0, 0, w, h);
    var code = root.jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' });
    if (code && code.data) handleText(code.data);
  }

  /* ------------------------------------------------- leer desde una imagen */
  function readFromFile(file) {
    clearMsg();
    if (!file) return;
    if (typeof root.jsQR !== 'function') { showMsg('error', t('staff.unreadable')); return; }
    var url = root.URL.createObjectURL(file), img = new root.Image();
    img.onload = function () {
      root.URL.revokeObjectURL(url);
      var scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      var w = Math.max(1, Math.round(img.naturalWidth * scale)), h = Math.max(1, Math.round(img.naturalHeight * scale));
      var c = doc.createElement('canvas'); c.width = w; c.height = h;
      var ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      var data = ctx.getImageData(0, 0, w, h);
      var code = root.jsQR(data.data, w, h, { inversionAttempts: 'attemptBoth' });
      if (!code || !code.data) { showMsg('warn', t('staff.noQr')); return; }
      lastText = '';
      handleText(code.data);
    };
    img.onerror = function () { root.URL.revokeObjectURL(url); showMsg('error', t('staff.unreadable')); };
    img.src = url;
  }

  /* ---------------------------------------------------- interpretar el QR */
  function handleText(text) {
    var now = Date.now();
    if (text === lastText && now - lastTextAt < 1800) return;   // evita repetir el mismo mensaje en cada fotograma
    lastText = text; lastTextAt = now;

    var res = OrderQR.parse(text);
    if (!res.ok) {
      showMsg('error', res.code === 'empty' ? t('staff.empty') : res.code === 'unreadable' ? t('staff.unreadable') : t('staff.invalid'));
      return;
    }
    var order = res.order;
    if (order.part) {
      if (!collecting || collecting.id !== order.id) collecting = { id: order.id, n: order.part[1], parts: {} };
      if (collecting.parts[order.part[0]]) { showMsg('info', t('staff.partDup')); return; }
      collecting.parts[order.part[0]] = order;
      var have = Object.keys(collecting.parts).length;
      if (have < collecting.n) { showMsg('info', t('staff.partProgress', { k: have, n: collecting.n })); return; }
      order = OrderQR.mergeParts(Object.keys(collecting.parts).map(function (k) { return collecting.parts[k]; }));
      collecting = null;
    } else {
      collecting = null;
    }
    showOrder(order);
  }

  /* ------------------------------------------------------ mostrar pedido */
  function showOrder(order) {
    current = order;
    clearMsg();
    var wasCamera = !!stream;
    if (stream) stopCamera(true);
    cameraWanted = wasCamera || cameraWanted;
    try { if (root.navigator.vibrate) root.navigator.vibrate(120); } catch (e) { /* ignorar */ }
    renderOrder(true);
  }

  function renderOrder(animate) {
    var o = current;
    if (!o) { $('#result').hidden = true; $('#result').innerHTML = ''; return; }
    var chk = OrderQR.check(o);
    var html = '';
    if (!chk.consistent) html += '<div class="msg warn keep-print">' + ico('triangle-alert', 20) + '<span>' + esc(t('staff.mismatch')) + '</span></div>';
    html += '<article class="ticket' + (animate ? ' enter' : '') + '" aria-label="' + esc(t('staff.order') + ' ' + o.id) + '">' +
      '<div class="ticket-head">' +
        '<div class="t-title">' + ico('check', 18) + esc(t('staff.scanned')) + '</div>' +
        '<div>' + esc(t('staff.order')) + ' <span class="ticket-id">' + esc(o.id) + '</span></div>' +
        '<div class="ticket-meta">' + esc(t('staff.date')) + ': ' + esc(Utils.formatDateTime(o.t, I18n.lang)) + ' · ' + esc(t('staff.currency')) + ': ' + esc(o.c) + '</div>' +
      '</div>' +
      '<div class="t-items">' + o.items.map(function (i) {
        return '<div class="t-item">' +
          '<div class="t-qty" aria-label="' + esc(t('staff.qty')) + '">' + i.qty + '×</div>' +
          '<div><div class="t-name">' + esc(i.name) + '</div>' +
            (i.opts.length ? '<div class="t-opts">' + i.opts.map(function (p) { return '<span><b>' + esc(p[0]) + ':</b> ' + esc(p[1]) + '</span>'; }).join('') + '</div>' : '') +
            '<div class="t-unit">' + esc(t('staff.unit')) + ': ' + esc(fmt(i.unitCents)) + '</div></div>' +
          '<div class="t-sub" aria-label="' + esc(t('staff.subtotal')) + '">' + esc(fmt(i.subCents)) + '</div>' +
        '</div>';
      }).join('') + '</div>' +
      '<div class="t-total"><span class="label">' + esc(t('staff.total')) + '</span><span class="amount">' + esc(fmt(o.totalCents)) + '</span></div>' +
      '<div class="t-units">' + esc(t('staff.units')) + ': ' + chk.units + '</div>' +
      '<p class="ticket-note">' + esc(t('staff.disclaimer')) + '</p>' +
    '</article>' +
    '<div class="ticket-actions">' +
      '<button type="button" class="btn btn-primary" data-action="print">' + ico('printer', 20) + '<span>' + esc(t('staff.print')) + '</span></button>' +
      '<button type="button" class="btn btn-ghost" data-action="again">' + ico('scan-line', 20) + '<span>' + esc(t('staff.again')) + '</span></button>' +
    '</div>';
    var r = $('#result');
    r.innerHTML = html; r.hidden = false;
    $('#scanner').hidden = true;
    if (animate && r.scrollIntoView) r.scrollIntoView({ block: 'start' });
  }

  function again() {
    current = null; collecting = null; lastText = '';
    clearMsg();
    renderOrder(false);
    $('#scanner').hidden = false;
    setStatus('');
    if (cameraWanted) startCamera();
  }

  /* ------------------------------------------------------------- eventos */
  function onClick(ev) {
    var el = ev.target.closest('[data-action]');
    if (!el) return;
    switch (el.getAttribute('data-action')) {
      case 'start': startCamera(); break;
      case 'stop': stopCamera(false); break;
      case 'again': again(); break;
      case 'print': root.print(); break;
      case 'lang': I18n.setLang(I18n.other()); break;
    }
  }

  function renderStatic() {
    doc.title = cfg.business.name + ' · ' + t('staff.title');
    I18n.apply(doc);
    $('#lang-btn span:last-child').textContent = t('lang.toggle');
    $('#lang-btn').setAttribute('aria-label', t('lang.toggleLabel'));
    if (stream) setStatus(t('staff.scanning'));
    renderOrder(false);
  }

  function init() {
    I18n.init(cfg);
    $all('[data-icon]').forEach(function (el) {
      el.innerHTML = ico(el.getAttribute('data-icon'), parseInt(el.getAttribute('data-size'), 10) || 20);
    });
    var logo = $('#staff-logo');
    if (logo) { logo.src = cfg.assets.logo; logo.alt = cfg.business.name; }
    doc.addEventListener('click', onClick);
    $('#btn-upload').addEventListener('click', function () { $('#file-input').click(); });
    $('#file-input').addEventListener('change', function (e) {
      readFromFile(e.target.files && e.target.files[0]);
      e.target.value = '';
    });
    I18n.onChange(renderStatic);
    root.addEventListener('pagehide', function () { stopCamera(true); });
    doc.addEventListener('visibilitychange', function () { if (doc.hidden && stream) stopCamera(true); });
    renderStatic();
    if (!root.navigator.mediaDevices || !root.navigator.mediaDevices.getUserMedia) showMsg('warn', t('staff.camNoSupport'));
  }

  function $all(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})(window);
