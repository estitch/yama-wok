/* ==========================================================================
   i18n.js — Textos de la interfaz en español (por defecto) e inglés.
   Los nombres/descripciones de productos viven en menu-data.js.
   ========================================================================== */
(function (root) {
  'use strict';

  var STRINGS = {
    es: {
      'lang.toggle': 'English',
      'lang.toggleLabel': 'Cambiar idioma a inglés',
      'site.menuTitle': 'Carta digital',
      'nav.all': 'Toda la carta',
      'nav.label': 'Categorías de la carta',
      'search.label': 'Buscar un producto',
      'search.placeholder': 'Buscar en la carta…',
      'search.clear': 'Borrar búsqueda',
      'search.none': 'No encontramos productos con “{q}”.',
      'search.noneHint': 'Prueba con otra palabra o elige “Toda la carta”.',
      'product.add': 'Agregar',
      'product.customize': 'Elegir',
      'product.unavailable': 'No disponible',
      'product.inOrder': '{n} en tu pedido',
      'product.addAria': 'Agregar {name} al pedido',
      'product.customizeAria': 'Elegir opciones de {name}',
      'toast.added': 'Agregado: {name}',
      'cart.open': 'Ver mi pedido',
      'cart.title': 'Mi pedido',
      'cart.close': 'Cerrar pedido',
      'cart.empty': 'Tu pedido está vacío',
      'cart.emptyHint': 'Agrega productos de la carta para armarlo.',
      'cart.unit': 'Precio unitario',
      'cart.subtotal': 'Subtotal',
      'cart.total': 'Total',
      'cart.items': '{n} unidad(es)',
      'cart.inc': 'Aumentar cantidad de {name}',
      'cart.dec': 'Disminuir cantidad de {name}',
      'cart.remove': 'Eliminar {name}',
      'cart.qty': 'Cantidad',
      'cart.clear': 'Vaciar pedido',
      'cart.generate': 'GENERAR QR DE MI PEDIDO',
      'cart.hint': 'Muestra el QR a la mesera para que registre tu pedido.',
      'confirm.clearTitle': '¿Vaciar el pedido?',
      'confirm.clearText': 'Se eliminarán todos los productos de tu pedido.',
      'confirm.yes': 'Sí, vaciar',
      'confirm.no': 'Cancelar',
      'options.required': 'Obligatorio',
      'options.optional': 'Opcional',
      'options.chooseOne': 'Elige 1',
      'options.upTo': 'Hasta {n}',
      'options.errRequired': 'Elige una opción.',
      'options.errExact': 'Elige {n} opciones o ninguna.',
      'options.errMax': 'Máximo {n}.',
      'options.addToOrder': 'Agregar al pedido',
      'options.close': 'Cerrar',
      'options.qty': 'Cantidad',
      'qr.title': 'Tu pedido en QR',
      'qr.hint': 'Muéstrale este código a la mesera.',
      'qr.order': 'Pedido',
      'qr.date': 'Fecha',
      'qr.total': 'Total',
      'qr.download': 'Descargar QR',
      'qr.close': 'Volver a la carta',
      'qr.part': 'Código {k} de {n}',
      'qr.prev': 'Código anterior',
      'qr.next': 'Código siguiente',
      'qr.splitInfo': 'Tu pedido es grande, así que lo dividimos en {n} códigos QR. Muestra todos a la mesera.',
      'qr.errEmpty': 'Agrega al menos un producto para generar el QR.',
      'qr.errLib': 'No se pudo cargar el generador de QR. Revisa tu conexión y recarga la página.',
      'qr.errTooBig': 'El pedido es demasiado grande para un código QR. Reduce la cantidad de productos o genera dos pedidos por separado.',
      'qr.errGeneric': 'No se pudo generar el QR. Intenta nuevamente.',
      'qr.errCanvas': 'No se pudo dibujar el QR en este dispositivo.',
      'qr.downloadName': 'pedido',
      'footer.note': 'Los precios del QR son referenciales; la mesera confirmará tu pedido.',
      'footer.staff': 'Acceso del personal',
      'contact.call': 'Llamar',
      'a11y.skip': 'Ir a la carta',
      'noscript': 'Esta carta necesita JavaScript para funcionar.',
      'error.menu': 'No se pudo cargar la carta. Recarga la página.',

      /* ---- mesera.html ---- */
      'staff.title': 'Lector de pedidos',
      'staff.subtitle': 'Escanea el QR del cliente',
      'staff.start': 'Activar cámara',
      'staff.stop': 'Detener cámara',
      'staff.scanning': 'Apunta la cámara al código QR del cliente.',
      'staff.starting': 'Iniciando cámara…',
      'staff.upload': 'Leer QR desde una imagen',
      'staff.noQr': 'No se detectó ningún código QR en la imagen. Intenta con una foto más nítida.',
      'staff.invalid': 'Este código QR no es un pedido válido de esta carta.',
      'staff.empty': 'El pedido no contiene productos.',
      'staff.unreadable': 'No se pudo interpretar la información del código.',
      'staff.camNoSupport': 'Este dispositivo o navegador no permite usar la cámara. Puedes leer el QR desde una imagen.',
      'staff.camInsecure': 'La cámara solo funciona en una conexión segura (HTTPS) o en localhost. Publica la página con HTTPS.',
      'staff.camDenied': 'Se denegó el permiso de cámara. Actívalo en la configuración del navegador y vuelve a intentarlo.',
      'staff.camNotFound': 'No se encontró ninguna cámara en este dispositivo.',
      'staff.camBusy': 'La cámara está siendo usada por otra aplicación.',
      'staff.camGeneric': 'No se pudo iniciar la cámara. Intenta nuevamente.',
      'staff.partProgress': 'Pedido dividido: leído {k} de {n}. Escanea el código que falta.',
      'staff.partDup': 'Ese código ya fue leído. Escanea el siguiente.',
      'staff.order': 'Pedido',
      'staff.date': 'Fecha y hora',
      'staff.currency': 'Moneda',
      'staff.product': 'Producto',
      'staff.qty': 'Cant.',
      'staff.unit': 'P. unit.',
      'staff.subtotal': 'Subtotal',
      'staff.total': 'TOTAL',
      'staff.units': 'Unidades',
      'staff.print': 'Imprimir pedido',
      'staff.again': 'Escanear otro QR',
      'staff.mismatch': 'Atención: los importes del QR no coinciden entre sí. Verifica el pedido con el cliente.',
      'staff.disclaimer': 'Precios tomados del QR, solo referenciales. Confirmar con la carta vigente.',
      'staff.back': 'Ir a la carta',
      'staff.scanned': 'Pedido leído correctamente',
      'staff.noscript': 'Esta página necesita JavaScript para funcionar.'
    },

    en: {
      'lang.toggle': 'Español',
      'lang.toggleLabel': 'Switch language to Spanish',
      'site.menuTitle': 'Digital menu',
      'nav.all': 'Full menu',
      'nav.label': 'Menu categories',
      'search.label': 'Search for a product',
      'search.placeholder': 'Search the menu…',
      'search.clear': 'Clear search',
      'search.none': 'No products found for “{q}”.',
      'search.noneHint': 'Try another word or choose “Full menu”.',
      'product.add': 'Add',
      'product.customize': 'Choose',
      'product.unavailable': 'Unavailable',
      'product.inOrder': '{n} in your order',
      'product.addAria': 'Add {name} to your order',
      'product.customizeAria': 'Choose options for {name}',
      'toast.added': 'Added: {name}',
      'cart.open': 'View my order',
      'cart.title': 'My order',
      'cart.close': 'Close order',
      'cart.empty': 'Your order is empty',
      'cart.emptyHint': 'Add items from the menu to build it.',
      'cart.unit': 'Unit price',
      'cart.subtotal': 'Subtotal',
      'cart.total': 'Total',
      'cart.items': '{n} item(s)',
      'cart.inc': 'Increase quantity of {name}',
      'cart.dec': 'Decrease quantity of {name}',
      'cart.remove': 'Remove {name}',
      'cart.qty': 'Quantity',
      'cart.clear': 'Clear order',
      'cart.generate': 'GENERATE MY ORDER QR',
      'cart.hint': 'Show the QR to the waitstaff so they can register your order.',
      'confirm.clearTitle': 'Clear your order?',
      'confirm.clearText': 'All items will be removed from your order.',
      'confirm.yes': 'Yes, clear',
      'confirm.no': 'Cancel',
      'options.required': 'Required',
      'options.optional': 'Optional',
      'options.chooseOne': 'Choose 1',
      'options.upTo': 'Up to {n}',
      'options.errRequired': 'Please choose an option.',
      'options.errExact': 'Choose {n} options or none.',
      'options.errMax': 'Maximum {n}.',
      'options.addToOrder': 'Add to order',
      'options.close': 'Close',
      'options.qty': 'Quantity',
      'qr.title': 'Your order as QR',
      'qr.hint': 'Show this code to the waitstaff.',
      'qr.order': 'Order',
      'qr.date': 'Date',
      'qr.total': 'Total',
      'qr.download': 'Download QR',
      'qr.close': 'Back to the menu',
      'qr.part': 'Code {k} of {n}',
      'qr.prev': 'Previous code',
      'qr.next': 'Next code',
      'qr.splitInfo': 'Your order is large, so we split it into {n} QR codes. Show all of them to the waitstaff.',
      'qr.errEmpty': 'Add at least one item to generate the QR.',
      'qr.errLib': 'The QR generator could not be loaded. Check your connection and reload the page.',
      'qr.errTooBig': 'The order is too large for a QR code. Reduce the number of items or place two separate orders.',
      'qr.errGeneric': 'The QR could not be generated. Please try again.',
      'qr.errCanvas': 'The QR could not be drawn on this device.',
      'qr.downloadName': 'order',
      'footer.note': 'Prices in the QR are indicative; the waitstaff will confirm your order.',
      'footer.staff': 'Staff access',
      'contact.call': 'Call',
      'a11y.skip': 'Skip to the menu',
      'noscript': 'This menu needs JavaScript to work.',
      'error.menu': 'The menu could not be loaded. Please reload the page.',

      'staff.title': 'Order reader',
      'staff.subtitle': 'Scan the customer’s QR',
      'staff.start': 'Start camera',
      'staff.stop': 'Stop camera',
      'staff.scanning': 'Point the camera at the customer’s QR code.',
      'staff.starting': 'Starting camera…',
      'staff.upload': 'Read QR from an image',
      'staff.noQr': 'No QR code was detected in the image. Try a sharper photo.',
      'staff.invalid': 'This QR code is not a valid order from this menu.',
      'staff.empty': 'The order contains no items.',
      'staff.unreadable': 'The information in the code could not be interpreted.',
      'staff.camNoSupport': 'This device or browser cannot use the camera. You can read the QR from an image.',
      'staff.camInsecure': 'The camera only works over a secure connection (HTTPS) or on localhost. Publish the page with HTTPS.',
      'staff.camDenied': 'Camera permission was denied. Enable it in the browser settings and try again.',
      'staff.camNotFound': 'No camera was found on this device.',
      'staff.camBusy': 'The camera is being used by another application.',
      'staff.camGeneric': 'The camera could not be started. Please try again.',
      'staff.partProgress': 'Split order: read {k} of {n}. Scan the missing code.',
      'staff.partDup': 'That code was already read. Scan the next one.',
      'staff.order': 'Order',
      'staff.date': 'Date and time',
      'staff.currency': 'Currency',
      'staff.product': 'Item',
      'staff.qty': 'Qty',
      'staff.unit': 'Unit',
      'staff.subtotal': 'Subtotal',
      'staff.total': 'TOTAL',
      'staff.units': 'Units',
      'staff.print': 'Print order',
      'staff.again': 'Scan another QR',
      'staff.mismatch': 'Warning: the amounts in the QR do not match each other. Please verify the order with the customer.',
      'staff.disclaimer': 'Prices come from the QR and are indicative only. Confirm against the current menu.',
      'staff.back': 'Go to the menu',
      'staff.scanned': 'Order read successfully',
      'staff.noscript': 'This page needs JavaScript to work.'
    }
  };

  var I18n = {
    lang: 'es',
    _cb: [],

    init: function (cfg) {
      cfg = cfg || {};
      var saved = null;
      try { saved = root.localStorage.getItem(cfg.langKey || 'carta.lang.v1'); } catch (e) { saved = null; }
      var fallback = cfg.defaultLanguage || 'es';
      var langs = cfg.languages || ['es', 'en'];
      this._key = cfg.langKey || 'carta.lang.v1';
      this.lang = (saved && langs.indexOf(saved) !== -1) ? saved : fallback;
      this._langs = langs;
      this._setHtmlLang();
      return this.lang;
    },

    _setHtmlLang: function () {
      if (typeof document !== 'undefined') document.documentElement.setAttribute('lang', this.lang);
    },

    setLang: function (l) {
      if (!STRINGS[l] || l === this.lang) return;
      this.lang = l;
      try { root.localStorage.setItem(this._key || 'carta.lang.v1', l); } catch (e) { /* ignorar */ }
      this._setHtmlLang();
      this._cb.forEach(function (fn) { try { fn(l); } catch (e) { /* ignorar */ } });
    },

    other: function () { return this.lang === 'es' ? 'en' : 'es'; },
    onChange: function (fn) { this._cb.push(fn); },

    /* Traduce una clave de interfaz con variables {nombre}. */
    t: function (key, vars, lang) {
      var s = (STRINGS[lang || this.lang] && STRINGS[lang || this.lang][key]) || STRINGS.es[key] || key;
      if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
      return s;
    },

    /* Resuelve un texto de datos: string o { es, en }. */
    loc: function (value, lang) {
      if (value == null) return '';
      if (typeof value === 'string') return value;
      return value[lang || this.lang] || value.es || value.en || '';
    },

    /* Aplica data-i18n="clave" y data-i18n-attr="atributo:clave;atributo2:clave2" dentro de un nodo. */
    apply: function (rootEl) {
      var self = this;
      rootEl = rootEl || document;
      Array.prototype.forEach.call(rootEl.querySelectorAll('[data-i18n]'), function (el) {
        el.textContent = self.t(el.getAttribute('data-i18n'));
      });
      Array.prototype.forEach.call(rootEl.querySelectorAll('[data-i18n-attr]'), function (el) {
        el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
          var p = pair.split(':');
          if (p.length === 2) el.setAttribute(p[0].trim(), self.t(p[1].trim()));
        });
      });
    }
  };

  root.I18n = I18n;
  if (typeof module !== 'undefined' && module.exports) module.exports = I18n;
})(typeof window !== 'undefined' ? window : globalThis);
