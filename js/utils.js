/* ==========================================================================
   utils.js — Utilidades compartidas (escape HTML, dinero, fechas, UTF-8).
   ========================================================================== */
(function (root) {
  'use strict';

  var Utils = {
    /* Escapa texto para insertarlo de forma segura en HTML (previene inyección). */
    esc: function (value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    /* Trabajamos el dinero en céntimos enteros para evitar errores de coma flotante. */
    toCents: function (n) { return Math.round(Number(n) * 100); },
    fromCents: function (c) { return c / 100; },

    /* Formatea importe: money(30) -> "S/30" (compacto) / money(30, true) -> "S/30.00" */
    money: function (amount, fixed, cfg) {
      cfg = cfg || root.AppConfig || { currency: { symbol: 'S/', decimals: 2 } };
      var sym = cfg.currency.symbol, dec = cfg.currency.decimals;
      var n = Number(amount) || 0;
      var isWhole = Math.abs(n - Math.round(n)) < 1e-9;
      var txt = (fixed || !isWhole) ? n.toFixed(dec) : String(Math.round(n));
      return sym + txt;
    },

    /* Fecha local con desfase horario ISO 8601, sin milisegundos: 2026-11-02T18:11:00-05:00 */
    isoLocal: function (d) {
      d = d || new Date();
      function p(n) { return (n < 10 ? '0' : '') + n; }
      var off = -d.getTimezoneOffset(), sign = off >= 0 ? '+' : '-';
      off = Math.abs(off);
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' +
        p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()) +
        sign + p(Math.floor(off / 60)) + ':' + p(off % 60);
    },

    /* Muestra una fecha ISO de forma legible (usa la hora que trae el propio pedido). */
    formatDateTime: function (iso, lang) {
      var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso || '');
      if (!m) return iso || '';
      return lang === 'en'
        ? m[2] + '/' + m[3] + '/' + m[1] + ' ' + m[4] + ':' + m[5]
        : m[3] + '/' + m[2] + '/' + m[1] + ' ' + m[4] + ':' + m[5];
    },

    /* Texto -> "cadena binaria" UTF-8 (cada carácter = 1 byte). qrcode-generator la codifica byte a byte. */
    utf8Binary: function (str) { return unescape(encodeURIComponent(str)); },
    utf8Length: function (str) { return unescape(encodeURIComponent(str)).length; },

    /* Identificador corto, legible y único para el pedido, p. ej. YW-K3F9-2QXA */
    randomId: function (prefix) {
      var alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', out = '', i;
      var buf = null;
      try {
        if (root.crypto && root.crypto.getRandomValues) { buf = new Uint8Array(8); root.crypto.getRandomValues(buf); }
      } catch (e) { buf = null; }
      for (i = 0; i < 8; i++) {
        var r = buf ? buf[i] : Math.floor(Math.random() * 256);
        out += alphabet.charAt(r % alphabet.length);
        if (i === 3) out += '-';
      }
      return (prefix ? prefix + '-' : '') + out;
    },

    safeStorage: {
      get: function (k) { try { return root.localStorage.getItem(k); } catch (e) { return null; } },
      set: function (k, v) { try { root.localStorage.setItem(k, v); return true; } catch (e) { return false; } },
      remove: function (k) { try { root.localStorage.removeItem(k); } catch (e) { /* ignorar */ } }
    }
  };

  root.Utils = Utils;
  if (typeof module !== 'undefined' && module.exports) module.exports = Utils;
})(typeof window !== 'undefined' ? window : globalThis);
