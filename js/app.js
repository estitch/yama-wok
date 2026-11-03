/* ==========================================================================
   app.js — Interfaz de la carta (index.html)
   Construye TODA la interfaz a partir de AppConfig y menuData.
   Depende de: config.js, utils.js, i18n.js, icons.js, menu-data.js,
               vendor/qrcode.js, cart.js, order-qr.js
   ========================================================================== */
(function (root) {
  'use strict';

  var cfg = root.AppConfig, menu = root.menuData;
  var I18n = root.I18n, Cart = root.Cart, OrderQR = root.OrderQR, Utils = root.Utils, Icons = root.Icons;
  var esc = Utils.esc;
  var doc = root.document;

  var state = { cat: 'all', q: '' };
  var layers = [];          // pila de paneles/modales abiertos
  var qtySeen = {};         // key de línea -> cantidad (para animar cambios)
  var opt = null;           // estado del modal de opciones
  var qrState = null;       // estado del modal del QR
  var toastTimer = null;
  var searchTimer = null;

  /* ------------------------------------------------------------- helpers */
  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function t(k, v) { return I18n.t(k, v); }
  function L(x) { return I18n.loc(x); }
  function ico(name, size, cls) { return Icons.svg(name, size, cls); }
  function money(n) { return Utils.money(n); }               // S/30  ó  S/8.50
  function money2(cents) { return Utils.money(Utils.fromCents(cents), true); } // S/30.00
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }

  function hydrateIcons(ctx) {
    $all('[data-icon]', ctx).forEach(function (el) {
      el.innerHTML = ico(el.getAttribute('data-icon'), parseInt(el.getAttribute('data-size'), 10) || 20);
    });
  }

  function applyTheme() {
    var th = cfg.theme || {}, st = doc.documentElement.style;
    if (th.primary) st.setProperty('--red', th.primary);
    if (th.primaryDark) st.setProperty('--red-dark', th.primaryDark);
    if (th.cream) st.setProperty('--cream', th.cream);
    if (th.sand) st.setProperty('--sand', th.sand);
    if (th.ink) st.setProperty('--ink', th.ink);
  }

  /* ---------------------------------------------------- capas (modales) */
  function focusables(el) {
    return $all('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])', el)
      .filter(function (n) { return n.offsetParent !== null || n === doc.activeElement; });
  }

  function pushLayer(spec) {
    spec.opener = doc.activeElement;
    layers.push(spec);
    spec.el.classList.add('open');
    spec.el.setAttribute('aria-hidden', 'false');
    if (spec.backdrop) spec.backdrop.classList.add('open');
    doc.body.classList.add('no-scroll');
    root.setTimeout(function () {
      var target = (spec.focus && $(spec.focus, spec.el)) || focusables(spec.el)[0] || spec.el;
      if (target && target.focus) target.focus({ preventScroll: true });
    }, 60);
  }

  function popLayer(el) {
    var idx = -1, i;
    for (i = 0; i < layers.length; i++) if (layers[i].el === el) idx = i;
    if (idx === -1) return;
    var spec = layers.splice(idx, 1)[0];
    spec.el.classList.remove('open');
    spec.el.setAttribute('aria-hidden', 'true');
    if (spec.backdrop) spec.backdrop.classList.remove('open');
    if (!layers.length) doc.body.classList.remove('no-scroll');
    if (spec.opener && spec.opener.focus && doc.body.contains(spec.opener)) spec.opener.focus({ preventScroll: true });
  }

  function topLayer() { return layers[layers.length - 1]; }

  /* ---------------------------------------------------------- cabecera */
  function renderHero() {
    var b = cfg.business, a = cfg.assets;
    var tag = L(b.tagline), desc = L(b.description);
    var contact = [];
    if (b.address) contact.push('<span>' + ico('map-pin', 15) + esc(b.address) + '</span>');
    if (b.phone) contact.push('<a href="tel:' + esc(String(b.phone).replace(/[^\d+]/g, '')) + '">' + ico('phone', 15) + esc(b.phone) + '</a>');
    ['facebook', 'instagram', 'tiktok'].forEach(function (k) {
      var u = safeUrl(b.social && b.social[k]);
      if (u) contact.push('<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + ico('link', 15) + esc(k.charAt(0).toUpperCase() + k.slice(1)) + '</a>');
    });

    $('#hero').innerHTML =
      '<button type="button" class="lang-btn" id="lang-btn" data-action="lang" aria-label="' + esc(t('lang.toggleLabel')) + '">' +
        ico('languages', 16) + '<span>' + esc(t('lang.toggle')) + '</span></button>' +
      '<div class="hero-inner">' +
        (a.mascot ? '<div class="hero-mascot"><img src="' + esc(a.mascot) + '" alt="" width="563" height="700" decoding="async"></div>' : '') +
        '<div class="hero-text">' +
          '<h1><img class="hero-logo" src="' + esc(a.logo) + '" alt="' + esc(b.name + (tag ? ' — ' + tag : '')) + '" width="900" height="364"></h1>' +
          (desc ? '<p class="hero-desc">' + esc(desc) + '</p>' : '') +
        '</div>' +
      '</div>' +
      (contact.length ? '<div class="hero-contact">' + contact.join('') + '</div>' : '');
  }

  /* -------------------------------------------------------- navegación */
  function renderNav() {
    var html = '<button type="button" class="chip" data-action="cat" data-cat="all" aria-pressed="' + (state.cat === 'all') + '">' +
      ico('utensils', 16) + '<span>' + esc(t('nav.all')) + '</span></button>';
    menu.categories.forEach(function (c) {
      html += '<button type="button" class="chip" data-action="cat" data-cat="' + esc(c.id) + '" aria-pressed="' + (state.cat === c.id) + '">' +
        ico(c.icon, 16) + '<span>' + esc(L(c.name)) + '</span></button>';
    });
    $('#chips').innerHTML = html;
    var ac = $('#chips [aria-pressed="true"]');
    if (ac && ac.scrollIntoView) ac.scrollIntoView({ inline: 'center', block: 'nearest' });
  }

  function setCategory(id) {
    state.cat = id;
    renderNav();
    renderMenu(true);
    scrollToMenu();
  }

  function scrollToMenu() {
    var nav = $('#cat-nav'), m = $('#menu');
    var top = m.getBoundingClientRect().top + root.pageYOffset - (nav ? nav.offsetHeight : 0) - 6;
    if (root.pageYOffset > top) root.scrollTo({ top: Math.max(0, top) });
  }

  /* ----------------------------------------------------------- carta */
  function matches(p, q) {
    if (!q) return true;
    return norm(L(p.name)).indexOf(q) !== -1 || norm(L(p.description)).indexOf(q) !== -1;
  }

  function actionsHtml(p) {
    var name = L(p.name);
    if (!Cart.isOrderable(p)) return '<span class="card-unavailable">' + esc(t('product.unavailable')) + '</span>';
    if (p.optionGroups && p.optionGroups.length) {
      return '<button type="button" class="btn-add" data-action="customize" data-id="' + esc(p.id) + '" aria-label="' + esc(t('product.customizeAria', { name: name })) + '">' +
        ico('sliders-horizontal', 15) + '<span>' + esc(t('product.customize')) + '</span></button>';
    }
    var q = Cart.countFor(p.id);
    if (q > 0) {
      return '<div class="stepper small" role="group" aria-label="' + esc(name) + '">' +
        '<button type="button" data-action="card-dec" data-key="' + esc(p.id) + '" aria-label="' + esc(t('cart.dec', { name: name })) + '">' + ico('minus', 16) + '</button>' +
        '<span class="qty" aria-live="polite">' + q + '</span>' +
        '<button type="button" data-action="card-inc" data-key="' + esc(p.id) + '" aria-label="' + esc(t('cart.inc', { name: name })) + '">' + ico('plus', 16) + '</button></div>';
    }
    return '<button type="button" class="btn-add" data-action="add" data-id="' + esc(p.id) + '" aria-label="' + esc(t('product.addAria', { name: name })) + '">' +
      ico('plus', 15) + '<span>' + esc(t('product.add')) + '</span></button>';
  }

  function cardHtml(p, idx) {
    var name = L(p.name), desc = L(p.description), detail = L(p.detail), sched = L(p.schedule);
    var q = Cart.countFor(p.id);
    return '<article class="card' + (Cart.isOrderable(p) ? '' : ' is-unavailable') + (q ? ' has-qty' : '') + '" data-id="' + esc(p.id) + '" data-qty="' + q + '" style="--i:' + idx + '">' +
      '<span class="card-qty-badge" title="' + esc(t('product.inOrder', { n: q })) + '">' + q + '</span>' +
      (p.image ? '<div class="card-media"><img src="' + esc(p.image) + '" alt="' + esc(name) + '" loading="lazy" decoding="async" width="640" height="480"></div>' : '') +
      '<div class="card-body">' +
        '<h3 class="card-title"><span class="card-icon">' + ico(p.icon, 16) + '</span><span>' + esc(name) + '</span></h3>' +
        (desc ? '<p class="card-desc">' + esc(desc) + '</p>' : '') +
        (detail ? '<p class="card-detail">' + esc(detail) + '</p>' : '') +
        (sched ? '<p class="card-schedule">' + ico('clock', 13) + esc(sched) + '</p>' : '') +
        '<div class="card-foot"><span class="price">' + esc(money(p.price)) + '</span><div class="card-actions">' + actionsHtml(p) + '</div></div>' +
      '</div></article>';
  }

  function renderMenu(animate) {
    var q = norm(state.q.trim());
    var html = '', total = 0, idx = 0;
    menu.categories.forEach(function (c) {
      if (state.cat !== 'all' && state.cat !== c.id) return;
      var prods = (c.products || []).filter(function (p) { return matches(p, q); });
      if (!prods.length) return;
      total += prods.length;
      html += '<section class="cat-section theme-' + esc(c.theme || 'red') + '" id="cat-' + esc(c.id) + '" aria-labelledby="h-' + esc(c.id) + '">' +
        '<div class="cat-head"><span class="cat-icon">' + ico(c.icon, 24) + '</span><div>' +
          '<h2 class="cat-title" id="h-' + esc(c.id) + '">' + esc(L(c.name)) + '</h2>' +
          (c.description ? '<p class="cat-desc">' + esc(L(c.description)) + '</p>' : '') +
          (c.note ? '<span class="cat-note">' + ico('clock', 13) + esc(L(c.note)) + '</span>' : '') +
        '</div></div>' +
        (c.banner ? '<div class="cat-banner"><img src="' + esc(c.banner) + '" alt="" loading="lazy" decoding="async" width="1292" height="969"></div>' : '') +
        '<div class="grid' + (prods.length === 1 ? ' single' : '') + '">' + prods.map(function (p) { return cardHtml(p, idx++); }).join('') + '</div></section>';
    });
    if (!total) {
      html = '<div class="empty-state">' + ico('search', 40) + '<strong>' + esc(t('search.none', { q: state.q.trim() })) + '</strong><p>' + esc(t('search.noneHint')) + '</p></div>';
    }
    var m = $('#menu');
    m.innerHTML = html;
    if (animate) {
      m.classList.remove('animate-in'); void m.offsetWidth; m.classList.add('animate-in');
      root.setTimeout(function () { m.classList.remove('animate-in'); }, 900);
    }
  }

  /* Actualiza solo contadores y botones de las tarjetas (sin repintar toda la carta). */
  function updateCardStates() {
    $all('.card').forEach(function (card) {
      var p = Cart.getProduct(card.getAttribute('data-id'));
      if (!p) return;
      var q = Cart.countFor(p.id), prev = parseInt(card.getAttribute('data-qty'), 10) || 0;
      card.classList.toggle('has-qty', q > 0);
      card.setAttribute('data-qty', q);
      var badge = $('.card-qty-badge', card);
      badge.textContent = q;
      badge.setAttribute('title', t('product.inOrder', { n: q }));
      if (q !== prev) {
        $('.card-actions', card).innerHTML = actionsHtml(p);
        var tick = $('.qty', card) || badge;
        tick.classList.remove('tick'); void tick.offsetWidth; tick.classList.add('tick');
      }
    });
  }

  function pulseCard(id) {
    var card = $('.card[data-id="' + id + '"]');
    if (!card) return;
    card.classList.remove('pulse'); void card.offsetWidth; card.classList.add('pulse');
  }

  function bumpFab() {
    var f = $('#cart-fab');
    f.classList.remove('bump'); void f.offsetWidth; f.classList.add('bump');
  }

  /* ----------------------------------------------------------- toast */
  function showToast(msg) {
    var el = $('#toast');
    el.innerHTML = ico('check', 16) + '<span>' + esc(msg) + '</span>';
    el.classList.add('show');
    root.clearTimeout(toastTimer);
    toastTimer = root.setTimeout(function () { el.classList.remove('show'); }, 1900);
  }

  /* --------------------------------------------------------- carrito */
  function renderCart() {
    var lines = Cart.lines(I18n.lang), count = Cart.count(), total = Cart.totalCents();

    /* botón flotante */
    var fab = $('#cart-fab');
    var prevCount = parseInt(fab.getAttribute('data-count'), 10) || 0;
    $('.fab-count', fab).textContent = count;
    $('.fab-count', fab).setAttribute('data-n', count);
    $('.fab-total', fab).textContent = count ? money2(total) : '';
    fab.setAttribute('data-count', count);
    fab.setAttribute('aria-label', t('cart.open') + (count ? ' — ' + t('cart.items', { n: count }) + ', ' + money2(total) : ''));
    if (count !== prevCount) {
      var fc = $('.fab-count', fab);
      fc.classList.remove('tick'); void fc.offsetWidth; fc.classList.add('tick');
    }

    $('#cart-sub').textContent = count ? t('cart.items', { n: count }) : '';

    /* cuerpo */
    var body = $('#cart-body'), foot = $('#cart-foot');
    if (!lines.length) {
      body.innerHTML = '<div class="cart-empty">' + ico('shopping-bag', 48) + '<strong>' + esc(t('cart.empty')) + '</strong><p>' + esc(t('cart.emptyHint')) + '</p></div>';
      foot.innerHTML = '';
      foot.hidden = true;
      qtySeen = { __init: true };
      return;
    }
    foot.hidden = false;
    var seenNow = {};
    body.innerHTML = '<ul>' + lines.map(function (l) {
      seenNow[l.key] = l.qty;
      var cls = 'cart-item';
      if (qtySeen.__init && !(l.key in qtySeen)) cls += ' is-new';
      else if (qtySeen[l.key] !== undefined && qtySeen[l.key] !== l.qty) cls += ' changed';
      return '<li class="' + cls + '" data-key="' + esc(l.key) + '">' +
        '<div class="ci-name">' + esc(l.name) + '</div>' +
        (l.options.length ? '<ul class="ci-opts">' + l.options.map(function (o) { return '<li><b>' + esc(o.group) + ':</b> ' + esc(o.values) + '</li>'; }).join('') + '</ul>' : '') +
        '<div class="ci-unit">' + esc(t('cart.unit')) + ': ' + esc(money2(l.unitCents)) + '</div>' +
        '<div class="ci-row">' +
          '<div class="stepper small" role="group" aria-label="' + esc(t('cart.qty') + ': ' + l.name) + '">' +
            '<button type="button" data-action="cart-dec" data-key="' + esc(l.key) + '" aria-label="' + esc(t('cart.dec', { name: l.name })) + '">' + ico('minus', 16) + '</button>' +
            '<span class="qty" aria-live="polite">' + l.qty + '</span>' +
            '<button type="button" data-action="cart-inc" data-key="' + esc(l.key) + '" aria-label="' + esc(t('cart.inc', { name: l.name })) + '">' + ico('plus', 16) + '</button>' +
          '</div>' +
          '<span class="ci-sub" aria-label="' + esc(t('cart.subtotal')) + '">' + esc(money2(l.subtotalCents)) + '</span>' +
          '<button type="button" class="icon-btn ci-del" data-action="cart-del" data-key="' + esc(l.key) + '" aria-label="' + esc(t('cart.remove', { name: l.name })) + '">' + ico('trash-2', 20) + '</button>' +
        '</div></li>';
    }).join('') + '</ul>';
    seenNow.__init = true;
    qtySeen = seenNow;

    foot.innerHTML =
      '<div class="total-row"><span class="label">' + esc(t('cart.total')) + '</span><span class="amount" aria-live="polite">' + esc(money2(total)) + '</span></div>' +
      '<button type="button" class="btn btn-primary btn-block" data-action="generate">' + ico('qr-code', 20) + '<span>' + esc(t('cart.generate')) + '</span></button>' +
      '<p class="cart-hint">' + esc(t('cart.hint')) + '</p>' +
      '<button type="button" class="btn btn-danger btn-block" data-action="clear">' + ico('trash-2', 18) + '<span>' + esc(t('cart.clear')) + '</span></button>';
  }

  function openCart() {
    $('#toast').classList.remove('show');
    if (layers.some(function (l) { return l.el.id === 'cart-panel'; })) return;
    pushLayer({ el: $('#cart-panel'), backdrop: $('#cart-backdrop'), focus: '#cart-close', close: closeCart });
  }
  function closeCart() { popLayer($('#cart-panel')); }

  function confirmDialog(title, text, yesLabel, onYes) {
    var m = $('#confirm-modal');
    m.innerHTML = '<div class="sheet" role="alertdialog" aria-modal="true" aria-labelledby="cf-title" aria-describedby="cf-text">' +
      '<div class="dialog-body"><h2 id="cf-title">' + esc(title) + '</h2><p id="cf-text">' + esc(text) + '</p></div>' +
      '<div class="dialog-actions"><button type="button" class="btn btn-ghost" data-action="confirm-no">' + esc(t('confirm.no')) + '</button>' +
      '<button type="button" class="btn btn-primary" data-action="confirm-yes">' + esc(yesLabel) + '</button></div></div>';
    m._onYes = onYes;
    pushLayer({ el: m, focus: '[data-action="confirm-no"]', close: closeConfirm });
  }
  function closeConfirm() { popLayer($('#confirm-modal')); }

  /* ----------------------------------------------- modal de opciones */
  function groupHtml(g, p) {
    var type = g.type === 'single' ? 'radio' : 'checkbox';
    var tag, cls = '';
    if (g.type === 'single') tag = g.required ? t('options.required') + ' · ' + t('options.chooseOne') : t('options.optional');
    else tag = t('options.optional') + (g.max ? ' · ' + t('options.upTo', { n: g.max }) : '');
    if (g.type === 'single' && g.required) cls = ' req';
    var longest = 0;
    (g.options || []).forEach(function (o) { longest = Math.max(longest, L(o.label).length); });
    var single = longest > 22 || (g.options || []).length < 2;
    return '<fieldset class="og" data-gid="' + esc(g.id) + '"><legend><span>' + esc(L(g.label)) + '</span><span class="og-tag' + cls + '">' + esc(tag) + '</span></legend>' +
      '<div class="og-opts' + (single ? ' single-col' : '') + '">' +
      (g.options || []).map(function (o) {
        var price = (g.priceMode !== 'flat') ? (o.price != null ? o.price : g.price) : null;
        return '<label class="opt"><input type="' + type + '" name="g-' + esc(g.id) + '" value="' + esc(o.id) + '">' +
          '<span class="opt-box"><span>' + esc(L(o.label)) + '</span>' + (price ? '<span class="opt-price">+' + esc(money(price)) + '</span>' : '') + '</span></label>';
      }).join('') + '</div><p class="og-error" role="alert"></p></fieldset>';
  }

  function openOptions(id) {
    var p = Cart.getProduct(id);
    if (!p || !Cart.isOrderable(p)) return;
    opt = { id: id, sel: {}, qty: 1, attempted: false };
    var name = L(p.name), desc = L(p.description);
    var m = $('#options-modal');
    m.innerHTML = '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="opt-title">' +
      '<button type="button" class="icon-btn sheet-close" data-action="opt-close" aria-label="' + esc(t('options.close')) + '">' + ico('x', 22) + '</button>' +
      (p.image ? '<div class="sheet-img"><img src="' + esc(p.image) + '" alt="" width="640" height="480"></div>' : '') +
      '<div class="sheet-head"><h2 class="sheet-title" id="opt-title"><span class="card-icon">' + ico(p.icon, 16) + '</span><span>' + esc(name) + '</span></h2>' +
      (desc ? '<p class="sheet-desc">' + esc(desc) + '</p>' : '') + '</div>' +
      '<div class="sheet-body" id="opt-body">' + (p.optionGroups || []).map(function (g) { return groupHtml(g, p); }).join('') + '</div>' +
      '<div class="sheet-foot">' +
        '<div class="stepper" role="group" aria-label="' + esc(t('options.qty')) + '">' +
          '<button type="button" data-action="opt-dec" aria-label="' + esc(t('cart.dec', { name: name })) + '">' + ico('minus', 18) + '</button>' +
          '<span class="qty" id="opt-qty" aria-live="polite">1</span>' +
          '<button type="button" data-action="opt-inc" aria-label="' + esc(t('cart.inc', { name: name })) + '">' + ico('plus', 18) + '</button></div>' +
        '<button type="button" class="btn btn-primary" id="opt-add" data-action="opt-add"></button>' +
      '</div></div>';
    updateOptionsUI();
    pushLayer({ el: m, focus: '.og input', close: closeOptions });
  }

  function closeOptions() { popLayer($('#options-modal')); opt = null; }

  function readSelection() {
    var p = Cart.getProduct(opt.id), sel = {};
    (p.optionGroups || []).forEach(function (g) {
      var fs = $('#options-modal .og[data-gid="' + g.id + '"]');
      var ids = $all('input:checked', fs).map(function (i) { return i.value; });
      if (ids.length) sel[g.id] = ids;
    });
    return sel;
  }

  function updateOptionsUI() {
    if (!opt) return;
    var p = Cart.getProduct(opt.id);
    opt.sel = readSelection();
    /* límite máximo en grupos múltiples */
    (p.optionGroups || []).forEach(function (g) {
      if (g.type !== 'multi' || !g.max) return;
      var fs = $('#options-modal .og[data-gid="' + g.id + '"]');
      var n = ((opt.sel[g.id]) || []).length;
      $all('input', fs).forEach(function (i) { i.disabled = !i.checked && n >= g.max; });
    });
    /* errores */
    var v = Cart.validateSelection(p, opt.sel), firstErr = null;
    (p.optionGroups || []).forEach(function (g) {
      var fs = $('#options-modal .og[data-gid="' + g.id + '"]'), msg = '';
      var err = null;
      v.errors.forEach(function (e) { if (e.groupId === g.id) err = e; });
      if (err && opt.attempted) {
        msg = err.code === 'required' ? t('options.errRequired') : err.code === 'exact' ? t('options.errExact', { n: err.n }) : t('options.errMax', { n: err.n });
        if (!firstErr) firstErr = fs;
      }
      $('.og-error', fs).textContent = msg;
      fs.classList.toggle('has-error', !!msg);
    });
    $('#opt-qty').textContent = opt.qty;
    $('#opt-add').innerHTML = ico('shopping-bag', 18) + '<span>' + esc(t('options.addToOrder')) + ' · ' + esc(money2(Cart.unitCents(p, opt.sel) * opt.qty)) + '</span>';
    return firstErr;
  }

  function submitOptions() {
    var p = Cart.getProduct(opt.id);
    opt.sel = readSelection();
    var v = Cart.validateSelection(p, opt.sel);
    if (!v.ok) {
      opt.attempted = true;
      var first = updateOptionsUI();
      if (first && first.scrollIntoView) first.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    var res = Cart.add(opt.id, opt.sel, opt.qty), id = opt.id, name = L(p.name);
    if (!res.ok) return;
    closeOptions();
    showToast(t('toast.added', { name: name }));
    pulseCard(id); bumpFab();
  }

  /* --------------------------------------------------------- QR */
  function qrErrorMessage(e) {
    var m = e && e.message;
    if (m === 'QR_LIB_MISSING') return t('qr.errLib');
    if (m === 'QR_TOO_BIG') return t('qr.errTooBig');
    if (m === 'EMPTY') return t('qr.errEmpty');
    if (m === 'CANVAS') return t('qr.errCanvas');
    return t('qr.errGeneric');
  }

  function openQrModal(contentHtml, focusSel) {
    var m = $('#qr-modal');
    m.innerHTML = '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="qr-title">' +
      '<button type="button" class="icon-btn sheet-close" data-action="qr-close" aria-label="' + esc(t('qr.close')) + '">' + ico('x', 22) + '</button>' +
      contentHtml + '</div>';
    if (!layers.some(function (l) { return l.el === m; })) pushLayer({ el: m, focus: focusSel, close: closeQr });
  }
  function closeQr() { popLayer($('#qr-modal')); qrState = null; }

  function onGenerate() {
    if (Cart.isEmpty()) { showToast(t('qr.errEmpty')); return; }
    try {
      /* El personal lee en español, por eso el contenido del QR se arma siempre en español. */
      var order = OrderQR.buildOrder(Cart.lines('es'), cfg);
      var gen = OrderQR.generate(order, cfg);
      qrState = { order: order, parts: gen.parts, i: 0 };
      renderQrModal();
    } catch (e) {
      if (root.console) console.error(e);
      openQrModal('<div class="qr-body"><h2 id="qr-title">' + esc(t('qr.title')) + '</h2>' +
        '<div class="qr-error" role="alert">' + esc(qrErrorMessage(e)) + '</div></div>' +
        '<div class="qr-actions"><button type="button" class="btn btn-ghost" data-action="qr-close">' + esc(t('qr.close')) + '</button></div>', '[data-action="qr-close"]');
    }
  }

  function renderQrModal() {
    var s = qrState, n = s.parts.length;
    var html = '<div class="qr-body"><h2 id="qr-title">' + esc(t('qr.title')) + '</h2><p class="qr-hint">' + esc(t('qr.hint')) + '</p>' +
      '<div class="qr-box"><canvas id="qr-canvas" role="img" aria-label="' + esc(t('qr.title') + ' ' + s.order.id) + '"></canvas></div>' +
      (n > 1 ? '<div class="qr-part"><button type="button" class="icon-btn" data-action="qr-prev" aria-label="' + esc(t('qr.prev')) + '">' + ico('chevron-left', 22) + '</button>' +
        '<span id="qr-part-label"></span><button type="button" class="icon-btn" data-action="qr-next" aria-label="' + esc(t('qr.next')) + '">' + ico('chevron-right', 22) + '</button></div>' +
        '<div class="qr-info">' + esc(t('qr.splitInfo', { n: n })) + '</div>' : '') +
      '<div class="qr-meta"><span>' + esc(t('qr.order')) + ': <strong>' + esc(s.order.id) + '</strong></span>' +
        '<span>' + esc(t('qr.date')) + ': <strong>' + esc(Utils.formatDateTime(s.order.t, I18n.lang)) + '</strong></span></div>' +
      '<div class="qr-total">' + esc(t('qr.total')) + ': ' + esc(money2(s.order.totalCents)) + '</div></div>' +
      '<div class="qr-actions"><button type="button" class="btn btn-primary" data-action="qr-download">' + ico('download', 20) + '<span>' + esc(t('qr.download')) + '</span></button>' +
      '<button type="button" class="btn btn-ghost" data-action="qr-close">' + esc(t('qr.close')) + '</button></div>';
    /* Primero se dibuja el QR; el modal solo se muestra si el dibujo fue exitoso. */
    var m = $('#qr-modal');
    var wasOpen = layers.some(function (l) { return l.el === m; });
    openQrModal(html, '[data-action="qr-download"]');
    try { drawQrPart(); } catch (e) {
      if (root.console) console.error(e);
      $('.qr-body', m).innerHTML = '<h2 id="qr-title">' + esc(t('qr.title')) + '</h2><div class="qr-error" role="alert">' + esc(qrErrorMessage(e)) + '</div>';
      $('.qr-actions', m).innerHTML = '<button type="button" class="btn btn-ghost" data-action="qr-close">' + esc(t('qr.close')) + '</button>';
    }
    return wasOpen;
  }

  function drawQrPart() {
    var s = qrState, c = $('#qr-canvas');
    OrderQR.drawToCanvas(s.parts[s.i].qr, c, 560);
    if (!c.width || !c.height) throw new Error('CANVAS');
    var lab = $('#qr-part-label');
    if (lab) lab.textContent = t('qr.part', { k: s.i + 1, n: s.parts.length });
  }

  function downloadQr() {
    var s = qrState;
    if (!s) return;
    try {
      var c = doc.createElement('canvas'), n = s.parts.length;
      OrderQR.drawToCanvas(s.parts[s.i].qr, c, 900, { caption: s.order.id + (n > 1 ? '  ·  ' + (s.i + 1) + '/' + n : '') });
      var fname = t('qr.downloadName') + '-' + s.order.id + (n > 1 ? '-' + (s.i + 1) : '') + '.png';
      var trigger = function (href, revoke) {
        var a = doc.createElement('a');
        a.href = href; a.download = fname; a.rel = 'noopener';
        doc.body.appendChild(a); a.click(); a.remove();
        if (revoke) root.setTimeout(function () { root.URL.revokeObjectURL(href); }, 3000);
      };
      if (c.toBlob && root.URL && root.URL.createObjectURL) {
        c.toBlob(function (blob) {
          if (blob) trigger(root.URL.createObjectURL(blob), true); else trigger(c.toDataURL('image/png'), false);
        }, 'image/png');
      } else trigger(c.toDataURL('image/png'), false);
    } catch (e) {
      if (root.console) console.error(e);
      showToast(t('qr.errCanvas'));
    }
  }

  /* ------------------------------------------------------------ pie */
  function renderFooter() {
    $('#footer').innerHTML = '<p>' + esc(L(menu.footerNote)) + '</p><p>' + esc(t('footer.note')) + '</p>' +
      '<p><a href="mesera.html">' + esc(t('footer.staff')) + '</a></p>';
  }

  /* ------------------------------------------------------ eventos */
  function onClick(ev) {
    var el = ev.target.closest('[data-action]');
    if (el) {
      var a = el.getAttribute('data-action'), id = el.getAttribute('data-id'), key = el.getAttribute('data-key');
      switch (a) {
        case 'cat': setCategory(el.getAttribute('data-cat')); break;
        case 'lang': I18n.setLang(I18n.other()); break;
        case 'add': {
          var r = Cart.add(id, {}, 1);
          if (r.ok) { showToast(t('toast.added', { name: L(Cart.getProduct(id).name) })); pulseCard(id); bumpFab(); }
          break;
        }
        case 'customize': openOptions(id); break;
        case 'card-inc': Cart.inc(key); break;
        case 'card-dec': Cart.dec(key); break;
        case 'cart-inc': Cart.inc(key); break;
        case 'cart-dec': Cart.dec(key); break;
        case 'cart-del': Cart.remove(key); break;
        case 'open-cart': openCart(); break;
        case 'close-cart': closeCart(); break;
        case 'clear':
          confirmDialog(t('confirm.clearTitle'), t('confirm.clearText'), t('confirm.yes'), function () { Cart.clear(); });
          break;
        case 'confirm-yes': { var m = $('#confirm-modal'), fn = m._onYes; closeConfirm(); if (fn) fn(); break; }
        case 'confirm-no': closeConfirm(); break;
        case 'generate': onGenerate(); break;
        case 'opt-close': closeOptions(); break;
        case 'opt-inc': if (opt) { opt.qty = Math.min(cfg.order.maxQtyPerLine, opt.qty + 1); updateOptionsUI(); } break;
        case 'opt-dec': if (opt) { opt.qty = Math.max(1, opt.qty - 1); updateOptionsUI(); } break;
        case 'opt-add': submitOptions(); break;
        case 'qr-close': closeQr(); break;
        case 'qr-download': downloadQr(); break;
        case 'qr-prev': if (qrState) { qrState.i = (qrState.i + qrState.parts.length - 1) % qrState.parts.length; drawQrPart(); } break;
        case 'qr-next': if (qrState) { qrState.i = (qrState.i + 1) % qrState.parts.length; drawQrPart(); } break;
      }
      return;
    }
    /* clic en el fondo oscuro de un modal / del carrito */
    var top = topLayer();
    if (top && ev.target === top.el && top.el.classList.contains('modal')) top.close();
    if (ev.target.id === 'cart-backdrop') closeCart();
  }

  function onKeydown(ev) {
    var top = topLayer();
    if (!top) return;
    if (ev.key === 'Escape' || ev.key === 'Esc') { ev.preventDefault(); top.close(); return; }
    if (ev.key === 'Tab') {
      var f = focusables(top.el);
      if (!f.length) { ev.preventDefault(); return; }
      var first = f[0], last = f[f.length - 1];
      if (ev.shiftKey && (doc.activeElement === first || !top.el.contains(doc.activeElement))) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && (doc.activeElement === last || !top.el.contains(doc.activeElement))) { ev.preventDefault(); first.focus(); }
    }
  }

  function bindSearch() {
    var input = $('#search'), clear = $('#search-clear');
    input.addEventListener('input', function () {
      clear.classList.toggle('visible', !!input.value);
      root.clearTimeout(searchTimer);
      searchTimer = root.setTimeout(function () { state.q = input.value; renderMenu(true); }, 140);
    });
    clear.addEventListener('click', function () {
      input.value = ''; state.q = ''; clear.classList.remove('visible'); renderMenu(true); input.focus();
    });
  }

  /* ---------------------------------------------------- idioma/estado */
  function renderAll() {
    doc.title = cfg.business.name + ' · ' + t('site.menuTitle');
    I18n.apply(doc);
    renderHero();
    renderNav();
    renderMenu(true);
    renderCart();
    renderFooter();
    qtySeen.__init = true;
  }

  function setNavHeight() {
    var nav = $('#cat-nav');
    if (nav) doc.documentElement.style.setProperty('--nav-h', nav.offsetHeight + 'px');
  }

  function init() {
    try {
      applyTheme();
      I18n.init(cfg);
      var problems = menu.validate ? menu.validate() : [];
      if (problems.length && root.console) console.warn('[carta] Problemas en menu-data.js:\n- ' + problems.join('\n- '));
      Cart.init(menu, cfg);
      hydrateIcons(doc);
      bindSearch();
      doc.addEventListener('click', onClick);
      doc.addEventListener('keydown', onKeydown);
      /* Cambios en las opciones del producto: límites, errores y precio en vivo */
      $('#options-modal').addEventListener('change', function () { updateOptionsUI(); });
      I18n.onChange(function () { renderAll(); setNavHeight(); });
      Cart.onChange(function () { renderCart(); updateCardStates(); });
      renderAll();
      setNavHeight();
      root.addEventListener('resize', setNavHeight);
    } catch (e) {
      if (root.console) console.error(e);
      var main = $('#menu');
      if (main) main.innerHTML = '<div class="fatal" role="alert">' + esc(I18n.t('error.menu')) + '</div>';
    }
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})(window);
