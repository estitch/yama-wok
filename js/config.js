/* ==========================================================================
   config.js — Información comercial y ajustes generales del establecimiento.
   Para reutilizar el proyecto en otro local, edite SOLO este archivo,
   js/menu-data.js y la carpeta assets/.
   ========================================================================== */
(function (root) {
  'use strict';

  var AppConfig = {
    /* ---- Establecimiento ---- */
    business: {
      name: 'Yama Wok',
      tagline: { es: 'Fast Nikkei', en: 'Fast Nikkei' },
      /* Descripción breve (opcional). Deje '' para ocultarla. */
      description: {
        es: 'Elige, combina y disfruta: woks, ramen y más.',
        en: 'Pick, mix and enjoy: woks, ramen and more.'
      },
      address: '',            // Ej.: 'Calle Mercaderes 123, Arequipa'. '' = no se muestra
      phone: '',              // Ej.: '+51 900 000 000'. '' = no se muestra
      social: {               // URL completa; '' = no se muestra
        facebook: '',
        instagram: '',
        tiktok: ''
      }
    },

    /* ---- Imágenes de marca ---- */
    assets: {
      logo: 'assets/logo.png',            // Logotipo original (fondo rojo #d20824)
      mascot: 'assets/images/mascota.png' // Opcional, '' para ocultar
    },

    /* ---- Moneda ---- */
    currency: {
      code: 'PEN',
      symbol: 'S/',
      decimals: 2
    },

    /* ---- Idiomas ---- */
    defaultLanguage: 'es',
    languages: ['es', 'en'],

    /* ---- Pedido / QR ---- */
    order: {
      prefix: 'YW',            // Prefijo del identificador del pedido
      storageKey: 'carta.cart.v1',
      langKey: 'carta.lang.v1',
      maxQtyPerLine: 20,
      /* Si el QR no cabe, el pedido se divide automáticamente en varios QR de este tamaño máximo (bytes). */
      qrMaxBytes: 1100
    },

    /* ---- Colores corporativos (se aplican como variables CSS) ---- */
    theme: {
      primary: '#d20824',     // rojo del logotipo
      primaryDark: '#a10019',
      cream: '#f9efd9',
      sand: '#decd9f',
      ink: '#1a1410'
    }
  };

  root.AppConfig = AppConfig;
  if (typeof module !== 'undefined' && module.exports) module.exports = AppConfig;
})(typeof window !== 'undefined' ? window : globalThis);
