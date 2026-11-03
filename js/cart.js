/* ==========================================================================
   cart.js — Lógica del carrito: selección de opciones, precios, cantidades
   y persistencia en localStorage. No toca el DOM.
   Todos los importes se calculan en céntimos enteros.
   ========================================================================== */
(function (root) {
  'use strict';

  var Utils = root.Utils || (typeof require !== 'undefined' ? require('./utils.js') : null);
  var I18n = root.I18n || (typeof require !== 'undefined' ? require('./i18n.js') : null);

  var Cart = {
    _lines: [],        // [{ key, id, qty, sel: { groupId: [optionId, ...] } }]
    _products: {},     // id -> product
    _cfg: null,
    _listeners: [],

    /* ------------------------------------------------------------ init */
    init: function (menu, cfg, opts) {
      var self = this;
      opts = opts || {};
      this._cfg = cfg;
      this._products = {};
      this._lines = [];
      (menu.categories || []).forEach(function (cat) {
        (cat.products || []).forEach(function (p) {
          p._categoryId = cat.id;
          self._products[p.id] = p;
        });
      });
      this._persist = opts.persist !== false;
      if (this._persist) this._load();
      return this;
    },

    onChange: function (fn) { this._listeners.push(fn); },
    _emit: function () {
      var self = this;
      if (this._persist) this._save();
      this._listeners.forEach(function (fn) { try { fn(self); } catch (e) { if (root.console) console.error(e); } });
    },

    getProduct: function (id) { return this._products[id] || null; },
    isOrderable: function (p) { return !!p && p.available !== false; },

    /* ------------------------------------------------------ selecciones */
    _groupOf: function (p, gid) {
      var gs = p.optionGroups || [];
      for (var i = 0; i < gs.length; i++) if (gs[i].id === gid) return gs[i];
      return null;
    },

    /* Elimina de una selección todo lo que no exista en el producto (datos antiguos o manipulados). */
    sanitizeSelection: function (p, sel) {
      var clean = {};
      (p.optionGroups || []).forEach(function (g) {
        var raw = (sel && Array.isArray(sel[g.id])) ? sel[g.id] : [];
        var valid = {}, ids = [];
        (g.options || []).forEach(function (o) { valid[o.id] = true; });
        raw.forEach(function (oid) { if (valid[oid] && ids.indexOf(oid) === -1) ids.push(oid); });
        if (g.type === 'single') ids = ids.slice(0, 1);
        else if (g.max) ids = ids.slice(0, g.max);
        if (ids.length) clean[g.id] = ids;
      });
      return clean;
    },

    /* Devuelve { ok, errors: [{ groupId, code, n }] } */
    validateSelection: function (p, sel) {
      var errors = [];
      (p.optionGroups || []).forEach(function (g) {
        var n = ((sel && sel[g.id]) || []).length;
        if (g.type === 'single') {
          if (g.required && n !== 1) errors.push({ groupId: g.id, code: 'required' });
        } else {
          if (g.max && n > g.max) errors.push({ groupId: g.id, code: 'max', n: g.max });
          if (g.priceMode === 'flat' && g.minIfAny && n > 0 && n < g.minIfAny) errors.push({ groupId: g.id, code: 'exact', n: g.minIfAny });
          if (g.required && n < 1) errors.push({ groupId: g.id, code: 'required' });
        }
      });
      return { ok: errors.length === 0, errors: errors };
    },

    /* Precio unitario en céntimos = base + recargos de opciones. */
    unitCents: function (p, sel) {
      var c = Utils.toCents(p.price);
      (p.optionGroups || []).forEach(function (g) {
        var ids = (sel && sel[g.id]) || [];
        if (!ids.length) return;
        if (g.priceMode === 'flat') {
          c += Utils.toCents(g.price || 0);
          return;
        }
        ids.forEach(function (oid) {
          var opt = null;
          (g.options || []).forEach(function (o) { if (o.id === oid) opt = o; });
          if (!opt) return;
          c += Utils.toCents(opt.price != null ? opt.price : (g.price || 0));
        });
      });
      return c;
    },

    /* Descripción de opciones por grupo, en el idioma pedido: [{ group, values }] */
    describeSelection: function (p, sel, lang) {
      var out = [];
      (p.optionGroups || []).forEach(function (g) {
        var ids = (sel && sel[g.id]) || [];
        if (!ids.length) return;
        var labels = [];
        ids.forEach(function (oid) {
          (g.options || []).forEach(function (o) { if (o.id === oid) labels.push(I18n.loc(o.label, lang)); });
        });
        out.push({ group: Cart.groupShort(g, lang), values: labels.join(', ') });
      });
      return out;
    },

    /* Título corto de un grupo: usa g.short o limpia numeración y "(+S/x)" de la etiqueta. */
    groupShort: function (g, lang) {
      if (g.short) return I18n.loc(g.short, lang);
      return I18n.loc(g.label, lang).replace(/^\d+\.\s*/, '').replace(/\s*\(.*\)\s*$/, '');
    },

    _keyFor: function (id, sel) {
      var parts = Object.keys(sel || {}).sort().map(function (gid) {
        return gid + '=' + sel[gid].slice().sort().join('+');
      });
      return id + (parts.length ? '|' + parts.join('|') : '');
    },

    /* ------------------------------------------------------- mutaciones */
    /* Agrega (o suma a) una línea. Devuelve { ok, key?, errors? } */
    add: function (productId, sel, qty) {
      var p = this._products[productId];
      if (!this.isOrderable(p)) return { ok: false, errors: [{ code: 'unavailable' }] };
      sel = this.sanitizeSelection(p, sel);
      var v = this.validateSelection(p, sel);
      if (!v.ok) return { ok: false, errors: v.errors };
      qty = Math.max(1, Math.floor(Number(qty) || 1));
      var max = this._cfg.order.maxQtyPerLine;
      var key = this._keyFor(productId, sel), line = this._find(key);
      if (line) line.qty = Math.min(max, line.qty + qty);
      else this._lines.push({ key: key, id: productId, qty: Math.min(max, qty), sel: sel });
      this._emit();
      return { ok: true, key: key };
    },

    _find: function (key) {
      for (var i = 0; i < this._lines.length; i++) if (this._lines[i].key === key) return this._lines[i];
      return null;
    },

    setQty: function (key, qty) {
      var line = this._find(key);
      if (!line) return;
      qty = Math.floor(Number(qty) || 0);
      if (qty <= 0) return this.remove(key);
      line.qty = Math.min(this._cfg.order.maxQtyPerLine, qty);
      this._emit();
    },
    inc: function (key) { var l = this._find(key); if (l) this.setQty(key, l.qty + 1); },
    dec: function (key) { var l = this._find(key); if (l) this.setQty(key, l.qty - 1); },

    remove: function (key) {
      this._lines = this._lines.filter(function (l) { return l.key !== key; });
      this._emit();
    },

    clear: function () { this._lines = []; this._emit(); },

    /* ------------------------------------------------------- consultas */
    isEmpty: function () { return this._lines.length === 0; },

    /* Total de unidades (suma de cantidades). */
    count: function () { return this._lines.reduce(function (n, l) { return n + l.qty; }, 0); },
    countFor: function (productId) {
      return this._lines.reduce(function (n, l) { return n + (l.id === productId ? l.qty : 0); }, 0);
    },

    /* Líneas resueltas con precios y descripciones (en idioma lang). Los precios SIEMPRE se recalculan desde la carta. */
    lines: function (lang) {
      var self = this;
      return this._lines.map(function (l) {
        var p = self._products[l.id];
        var unit = self.unitCents(p, l.sel);
        return {
          key: l.key, id: l.id, qty: l.qty, sel: l.sel, product: p,
          name: I18n.loc(p.name, lang),
          options: self.describeSelection(p, l.sel, lang),
          unitCents: unit,
          subtotalCents: unit * l.qty
        };
      });
    },

    totalCents: function () {
      var self = this;
      return this._lines.reduce(function (t, l) {
        return t + self.unitCents(self._products[l.id], l.sel) * l.qty;
      }, 0);
    },

    /* ------------------------------------------------------ persistencia */
    _save: function () {
      var data = this._lines.map(function (l) { return { id: l.id, qty: l.qty, sel: l.sel }; });
      Utils.safeStorage.set(this._cfg.order.storageKey, JSON.stringify(data));
    },

    _load: function () {
      var raw = Utils.safeStorage.get(this._cfg.order.storageKey), data;
      if (!raw) return;
      try { data = JSON.parse(raw); } catch (e) { Utils.safeStorage.remove(this._cfg.order.storageKey); return; }
      if (!Array.isArray(data)) return;
      var self = this, max = this._cfg.order.maxQtyPerLine;
      data.forEach(function (d) {
        var p = d && self._products[d.id];
        if (!self.isOrderable(p)) return;
        var sel = self.sanitizeSelection(p, d.sel);
        if (!self.validateSelection(p, sel).ok) return;
        var qty = Math.min(max, Math.max(1, Math.floor(Number(d.qty) || 1)));
        var key = self._keyFor(p.id, sel), line = self._find(key);
        if (line) line.qty = Math.min(max, line.qty + qty);
        else self._lines.push({ key: key, id: p.id, qty: qty, sel: sel });
      });
    }
  };

  root.Cart = Cart;
  if (typeof module !== 'undefined' && module.exports) module.exports = Cart;
})(typeof window !== 'undefined' ? window : globalThis);
