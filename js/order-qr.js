/* ==========================================================================
   order-qr.js — Construcción, codificación, dibujo y lectura (parseo) del
   pedido en formato QR. Lo usan index.html (generar) y mesera.html (leer).

   FORMATO COMPACTO v1 (JSON en UTF-8):
   {
     "v": 1,                          versión del formato
     "id": "YW-K3F9-2QXA",            identificador del pedido
     "t": "2026-11-02T18:11:00-05:00" fecha y hora de generación
     "c": "PEN",                      moneda
     "T": 57,                         total del pedido
     "p": [1, 2],                     (solo si el pedido se divide) parte k de n
     "i": [                           líneas: [idProducto, nombre, cant, p.unit, subtotal, opciones]
       ["wok-001", "Arma tu wok", 1, 30, 30, [["Base","Fideos artesanales"], ...]]
     ]
   }
   ========================================================================== */
(function (root) {
  'use strict';

  var Utils = root.Utils || (typeof require !== 'undefined' ? require('./utils.js') : null);
  var qrcodeLib = root.qrcode || (typeof require !== 'undefined' ? require('./vendor/qrcode.js') : null);

  var FORMAT_VERSION = 1;
  var LIMITS = { maxText: 12000, maxItems: 200, maxQty: 999, maxPrice: 1000000, maxStr: 300 };

  function getLib() {
    var lib = qrcodeLib || root.qrcode;
    if (!lib) throw new Error('QR_LIB_MISSING');
    /* Imprescindible para tildes, eñes y símbolos: codificar los bytes en UTF-8 */
    if (lib.stringToBytesFuncs && lib.stringToBytesFuncs['UTF-8']) lib.stringToBytes = lib.stringToBytesFuncs['UTF-8'];
    return lib;
  }

  function num(cents) { return Utils.fromCents(cents); }

  var OrderQR = {
    FORMAT_VERSION: FORMAT_VERSION,

    /* --------------------------------------------------- construir pedido */
    /* lines: resultado de Cart.lines('es'). El personal lee siempre en español. */
    buildOrder: function (lines, cfg, date) {
      var items = lines.map(function (l) {
        return {
          pid: l.id, name: l.name, qty: l.qty,
          unitCents: l.unitCents, subCents: l.subtotalCents,
          opts: (l.options || []).map(function (o) { return [o.group, o.values]; })
        };
      });
      var total = items.reduce(function (t, i) { return t + i.subCents; }, 0);
      return {
        id: Utils.randomId(cfg.order.prefix),
        t: Utils.isoLocal(date || new Date()),
        c: cfg.currency.code,
        totalCents: total,
        items: items
      };
    },

    _itemToArray: function (i) { return [i.pid, i.name, i.qty, num(i.unitCents), num(i.subCents), i.opts]; },

    _payload: function (order, items, part) {
      var o = { v: FORMAT_VERSION, id: order.id, t: order.t, c: order.c, T: num(order.totalCents) };
      if (part) o.p = part;
      o.i = items.map(OrderQR._itemToArray);
      return JSON.stringify(o);
    },

    /* Divide las líneas en grupos cuyo JSON no supere maxBytes (UTF-8). */
    toPayloads: function (order, maxBytes) {
      var single = OrderQR._payload(order, order.items, null);
      if (Utils.utf8Length(single) <= maxBytes) return [single];
      var groups = [], cur = [];
      order.items.forEach(function (item) {
        var test = cur.concat([item]);
        var size = Utils.utf8Length(OrderQR._payload(order, test, [99, 99]));
        if (cur.length && size > maxBytes) { groups.push(cur); cur = [item]; } else cur = test;
      });
      if (cur.length) groups.push(cur);
      return groups.map(function (g, idx) { return OrderQR._payload(order, g, [idx + 1, groups.length]); });
    },

    /* ----------------------------------------------------------- generar */
    /* Crea el objeto QR de un texto: nivel M y, si no cabe, L. Lanza 'QR_TOO_BIG' si no entra. */
    makeQr: function (text) {
      var lib = getLib(), levels = ['M', 'L'], lastErr = null;
      for (var i = 0; i < levels.length; i++) {
        try {
          var qr = lib(0, levels[i]);
          qr.addData(text, 'Byte');
          qr.make();
          return qr;
        } catch (e) { lastErr = e; }
      }
      var err = new Error('QR_TOO_BIG');
      err.cause = lastErr;
      throw err;
    },

    /* Genera 1..n códigos para un pedido. Devuelve { parts: [{ text, qr }], split }. */
    generate: function (order, cfg) {
      if (!order || !order.items || !order.items.length) throw new Error('EMPTY');
      var payloads = OrderQR.toPayloads(order, cfg.order.qrMaxBytes);
      var parts = payloads.map(function (text) { return { text: text, qr: OrderQR.makeQr(text) }; });
      return { parts: parts, split: parts.length > 1 };
    },

    /* Dibuja el QR en un canvas con zona de silencio blanca. Devuelve el tamaño en píxeles. */
    drawToCanvas: function (qr, canvas, targetPx, extra) {
      var n = qr.getModuleCount(), quiet = 4;
      var scale = Math.max(2, Math.floor(targetPx / (n + quiet * 2)));
      var size = (n + quiet * 2) * scale;
      var captionH = extra && extra.caption ? Math.round(scale * 7) : 0;
      canvas.width = size; canvas.height = size + captionH;
      var ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('CANVAS');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000000';
      for (var r = 0; r < n; r++) {
        for (var c = 0; c < n; c++) {
          if (qr.isDark(r, c)) ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
        }
      }
      if (captionH) {
        ctx.fillStyle = '#000000';
        ctx.font = 'bold ' + Math.round(scale * 3.2) + 'px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(extra.caption, size / 2, size + captionH / 2 - scale);
      }
      return size;
    },

    /* ------------------------------------------------------------ leer */
    /* Interpreta el texto de un QR. Devuelve { ok:true, order } o { ok:false, code }.
       code: 'invalid' | 'unreadable' | 'empty' */
    parse: function (text) {
      var data;
      if (typeof text !== 'string' || !text || text.length > LIMITS.maxText) return { ok: false, code: 'invalid' };
      try { data = JSON.parse(text); } catch (e) { return { ok: false, code: 'invalid' }; }
      if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, code: 'invalid' };
      if (data.v !== FORMAT_VERSION || typeof data.id !== 'string' || !data.id || !Array.isArray(data.i)) return { ok: false, code: 'invalid' };
      if (data.i.length === 0) return { ok: false, code: 'empty' };
      if (data.i.length > LIMITS.maxItems) return { ok: false, code: 'unreadable' };
      if (typeof data.t !== 'string' || typeof data.c !== 'string' || !isFinite(Number(data.T))) return { ok: false, code: 'unreadable' };
      if (data.id.length > 40 || data.t.length > 40 || data.c.length > 8) return { ok: false, code: 'unreadable' };

      var part = null;
      if (data.p != null) {
        if (!Array.isArray(data.p) || data.p.length !== 2 || !(data.p[0] >= 1) || !(data.p[1] >= data.p[0]) || data.p[1] > 50) return { ok: false, code: 'unreadable' };
        part = [data.p[0] | 0, data.p[1] | 0];
      }

      var items = [];
      for (var k = 0; k < data.i.length; k++) {
        var a = data.i[k];
        if (!Array.isArray(a) || a.length < 5) return { ok: false, code: 'unreadable' };
        var pid = a[0], name = a[1], qty = a[2], unit = Number(a[3]), sub = Number(a[4]), opts = a[5] || [];
        if (typeof pid !== 'string' || typeof name !== 'string' || pid.length > LIMITS.maxStr || name.length > LIMITS.maxStr) return { ok: false, code: 'unreadable' };
        if (typeof qty !== 'number' || qty % 1 !== 0 || qty < 1 || qty > LIMITS.maxQty) return { ok: false, code: 'unreadable' };
        if (!isFinite(unit) || !isFinite(sub) || unit < 0 || sub < 0 || unit > LIMITS.maxPrice || sub > LIMITS.maxPrice * LIMITS.maxQty) return { ok: false, code: 'unreadable' };
        if (!Array.isArray(opts)) return { ok: false, code: 'unreadable' };
        var cleanOpts = [];
        for (var j = 0; j < opts.length && j < 30; j++) {
          var o = opts[j];
          if (!Array.isArray(o) || typeof o[0] !== 'string' || typeof o[1] !== 'string') return { ok: false, code: 'unreadable' };
          cleanOpts.push([o[0].slice(0, LIMITS.maxStr), o[1].slice(0, LIMITS.maxStr)]);
        }
        items.push({
          pid: pid, name: name, qty: qty,
          unitCents: Utils.toCents(unit), subCents: Utils.toCents(sub), opts: cleanOpts
        });
      }
      return {
        ok: true,
        order: { id: data.id, t: data.t, c: data.c, totalCents: Utils.toCents(data.T), part: part, items: items }
      };
    },

    /* Junta las partes de un pedido dividido (todas con el mismo id y total). */
    mergeParts: function (parts) {
      var first = parts[0];
      var items = [];
      parts.slice().sort(function (a, b) { return a.part[0] - b.part[0]; }).forEach(function (p) { items = items.concat(p.items); });
      return { id: first.id, t: first.t, c: first.c, totalCents: first.totalCents, part: null, items: items };
    },

    /* Verificación de coherencia: subtotal = cant × p.unit y total = suma de subtotales. */
    check: function (order) {
      var calc = 0, linesOk = true;
      order.items.forEach(function (i) {
        calc += i.subCents;
        if (i.qty * i.unitCents !== i.subCents) linesOk = false;
      });
      return {
        calcTotalCents: calc,
        units: order.items.reduce(function (n, i) { return n + i.qty; }, 0),
        consistent: linesOk && calc === order.totalCents
      };
    }
  };

  root.OrderQR = OrderQR;
  if (typeof module !== 'undefined' && module.exports) module.exports = OrderQR;
})(typeof window !== 'undefined' ? window : globalThis);
