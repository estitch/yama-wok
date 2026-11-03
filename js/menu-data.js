/* ==========================================================================
   menu-data.js — La carta completa. Es el ÚNICO archivo que hay que editar
   para agregar, quitar o modificar productos, precios y categorías.

   Textos: pueden ser un string simple o un objeto { es: '...', en: '...' }.
   (Si falta la traducción 'en', se muestra la 'es'.)

   CATEGORÍA
     id            identificador único (sin espacios)
     name          nombre visible
     description   texto breve bajo el título (opcional)
     icon          nombre de icono Lucide incluido en js/icons.js
     theme         'red' | 'sand' | 'ink' | 'cream'  (color de la cabecera)
     banner        imagen opcional bajo el título (ruta relativa)
     note          aviso opcional (ej. horarios)
     products      lista de productos

   PRODUCTO
     id            identificador único en TODA la carta (ej. 'ent-001')
     name, description
     price         número positivo (en la moneda de config.js)
     icon          icono Lucide (se muestra a la izquierda del nombre)
     image         imagen opcional (assets/images/...)
     detail        etiqueta pequeña opcional (ej. '8 uds.')
     schedule      aviso opcional en la tarjeta (ej. horario)
     available     false => se muestra como "No disponible" y no se puede pedir
     optionGroups  opciones configurables (opcional, ver abajo)

   GRUPO DE OPCIONES (optionGroups)
     id            único dentro del producto
     label         título del grupo
     type          'single' (elige una) | 'multi' (elige varias)
     required      true => obligatorio (solo 'single')
     max           máximo de opciones ('multi')
     price         recargo por opción elegida (se suma al precio base)
     priceMode     'each' (recargo por cada opción, por defecto) | 'flat' (recargo único si hay alguna)
     minIfAny      con 'flat': si elige alguna debe elegir al menos esta cantidad
     options       [{ id, label, price? }]   (price propio de la opción pisa al del grupo)
   ========================================================================== */
(function (root) {
  'use strict';

  /* ---- Bloques reutilizables ---- */
  var PROTEINS = [
    { id: 'pollo', label: { es: 'Pollo', en: 'Chicken' } },
    { id: 'cerdo', label: { es: 'Cerdo', en: 'Pork' } },
    { id: 'tofu',  label: { es: 'Tofu',  en: 'Tofu' } }
  ];

  var VEGGIES = [
    { id: 'frijol-chino',  label: { es: 'Frijol chino',  en: 'Bean sprouts' } },
    { id: 'champinon',     label: { es: 'Champiñón',     en: 'Mushroom' } },
    { id: 'zanahoria',     label: { es: 'Zanahoria',     en: 'Carrot' } },
    { id: 'col-china',     label: { es: 'Col china',     en: 'Chinese cabbage' } },
    { id: 'brocoli',       label: { es: 'Brócoli',       en: 'Broccoli' } },
    { id: 'pimiento',      label: { es: 'Pimiento',      en: 'Bell pepper' } },
    { id: 'espinaca',      label: { es: 'Espinaca',      en: 'Spinach' } },
    { id: 'cebolla-morada', label: { es: 'Cebolla morada', en: 'Red onion' } }
  ];

  /* "Súmale a tu ramen" */
  var RAMEN_EXTRAS = {
    id: 'sumale',
    label: { es: 'Súmale a tu ramen', en: 'Add to your ramen' },
    short: { es: 'Extras', en: 'Extras' },
    type: 'multi',
    max: 3,
    options: [
      { id: 'huevo', label: { es: 'Huevo',  en: 'Egg' },     price: 4 },
      { id: 'fideo', label: { es: 'Fideo',  en: 'Noodles' }, price: 5 },
      { id: 'arroz', label: { es: 'Arroz',  en: 'Rice' },    price: 6 }
    ]
  };

  var menuData = {
    categories: [

      /* ------------------------------------------------------------ WOK */
      {
        id: 'wok',
        name: { es: 'Arma tu wok', en: 'Build your wok' },
        description: { es: 'Elige base, proteína, vegetales y salsa.', en: 'Choose base, protein, vegetables and sauce.' },
        icon: 'cooking-pot',
        theme: 'red',
        products: [
          {
            id: 'wok-001',
            name: { es: 'Arma tu wok', en: 'Build your wok' },
            description: {
              es: 'Una base, una proteína, hasta 3 vegetales y tu salsa.',
              en: 'One base, one protein, up to 3 vegetables and your sauce.'
            },
            price: 30,
            icon: 'cooking-pot',
            image: 'assets/images/wok.jpg',
            available: true,
            optionGroups: [
              {
                id: 'base', label: { es: '1. Elige una base', en: '1. Choose a base' }, short: { es: 'Base', en: 'Base' },
                type: 'single', required: true,
                options: [
                  { id: 'arroz-frito', label: { es: 'Arroz frito con huevo', en: 'Egg fried rice' } },
                  { id: 'fideos', label: { es: 'Fideos artesanales', en: 'Artisan noodles' } }
                ]
              },
              {
                id: 'proteina', label: { es: '2. Ahora, una proteína', en: '2. Now, a protein' }, short: { es: 'Proteína', en: 'Protein' },
                type: 'single', required: true,
                options: PROTEINS
              },
              {
                id: 'proteina-extra', label: { es: 'Una proteína extra (+S/5)', en: 'One extra protein (+S/5)' }, short: { es: 'Proteína extra', en: 'Extra protein' },
                type: 'multi', max: 1, price: 5,
                options: PROTEINS
              },
              {
                id: 'vegetales', label: { es: '3. Escoge hasta 3 vegetales', en: '3. Choose up to 3 vegetables' }, short: { es: 'Vegetales', en: 'Vegetables' },
                type: 'multi', max: 3,
                options: VEGGIES
              },
              {
                id: 'vegetales-extra', label: { es: 'Dos vegetales extra (+S/4)', en: 'Two extra vegetables (+S/4)' }, short: { es: 'Vegetales extra', en: 'Extra vegetables' },
                type: 'multi', max: 2, price: 4, priceMode: 'flat', minIfAny: 2,
                options: VEGGIES
              },
              {
                id: 'salsa', label: { es: '4. No olvides, la salsa', en: '4. Don’t forget the sauce' }, short: { es: 'Salsa', en: 'Sauce' },
                type: 'single', required: true,
                options: [
                  { id: 'soya', label: { es: 'Soya', en: 'Soy' } },
                  { id: 'teriyaki', label: { es: 'Teriyaki (dulce)', en: 'Teriyaki (sweet)' } },
                  { id: 'curry', label: { es: 'Curry', en: 'Curry' } },
                  { id: 'mani', label: { es: 'Maní (picante)', en: 'Peanut (spicy)' } }
                ]
              }
            ]
          }
        ]
      },

      /* --------------------------------------------------------- ENTRADAS */
      {
        id: 'entradas',
        name: { es: 'Entradas', en: 'Starters' },
        description: { es: 'Para comenzar.', en: 'To get you started.' },
        icon: 'utensils',
        theme: 'sand',
        products: [
          {
            id: 'ent-001',
            name: 'Takoyakis',
            description: { es: 'Harina, dashi, huevo y pulpo.', en: 'Flour, dashi, egg and octopus.' },
            detail: { es: '8 uds.', en: '8 pcs.' },
            price: 19, icon: 'circle-dot', image: 'assets/images/takoyakis.jpg', available: true
          },
          {
            id: 'ent-002',
            name: 'Gyozas',
            description: { es: 'Harina, dashi, huevo y pollo, cerdo o veggie.', en: 'Flour, dashi, egg and chicken, pork or veggie.' },
            detail: { es: '4 uds.', en: '4 pcs.' },
            price: 15, icon: 'shell', image: 'assets/images/gyozas.jpg', available: true,
            optionGroups: [
              {
                id: 'relleno', label: { es: 'Relleno', en: 'Filling' },
                type: 'single', required: true,
                options: [
                  { id: 'pollo', label: { es: 'Pollo', en: 'Chicken' } },
                  { id: 'cerdo', label: { es: 'Cerdo', en: 'Pork' } },
                  { id: 'veggie', label: 'Veggie' }
                ]
              }
            ]
          },
          {
            id: 'ent-003',
            name: 'Onigiris',
            description: { es: 'Arroz, alga y relleno.', en: 'Rice, seaweed and filling.' },
            detail: { es: '2 uds.', en: '2 pcs.' },
            price: 14, icon: 'wheat', image: 'assets/images/onigiris.jpg', available: true
          }
        ]
      },

      /* ------------------------------------------------------------ RAMEN */
      {
        id: 'ramen',
        name: { es: 'Ramen y sopa', en: 'Ramen & soup' },
        description: { es: 'Ramen con fondo concentrado de cerdo.', en: 'Ramen with concentrated pork broth.' },
        icon: 'soup',
        theme: 'ink',
        products: [
          {
            id: 'ram-001',
            name: 'Miso Ramen',
            description: { es: 'Caldo, miso, fideos, espinaca, chasu y huevo.', en: 'Broth, miso, noodles, spinach, chashu and egg.' },
            price: 34, icon: 'soup', image: 'assets/images/miso-ramen.jpg', available: true,
            optionGroups: [RAMEN_EXTRAS]
          },
          {
            id: 'ram-002',
            name: 'Shoyu Ramen',
            description: { es: 'Caldo, fideos, frijol chino, chasu y huevo.', en: 'Broth, noodles, bean sprouts, chashu and egg.' },
            price: 34, icon: 'soup', image: 'assets/images/shoyu-ramen.jpg', available: true,
            optionGroups: [RAMEN_EXTRAS]
          },
          {
            id: 'ram-003',
            name: 'Shio Ramen',
            description: { es: 'Caldo, pollo, fideos, frijol chino y huevo.', en: 'Broth, chicken, noodles, bean sprouts and egg.' },
            price: 34, icon: 'soup', image: 'assets/images/shio-ramen.jpg', available: true,
            optionGroups: [RAMEN_EXTRAS]
          },
          {
            id: 'ram-004',
            name: 'Tan Tan Ramen',
            description: { es: 'Caldo con cerdo molido, espinaca y maní picante.', en: 'Broth with ground pork, spinach and spicy peanut.' },
            price: 34, icon: 'flame', image: 'assets/images/tantan-ramen.jpg', available: true,
            optionGroups: [RAMEN_EXTRAS]
          },
          {
            id: 'ram-005',
            name: { es: 'Sopa Miso', en: 'Miso Soup' },
            description: { es: 'Caldo miso, fideos, col, cebolla, zanahoria y tofu.', en: 'Miso broth, noodles, cabbage, onion, carrot and tofu.' },
            price: 30, icon: 'leaf', image: 'assets/images/sopa-miso.jpg', available: true
          }
        ]
      },

      /* ----------------------------------------------------------- PLATOS */
      {
        id: 'platos',
        name: { es: 'Platos', en: 'Mains' },
        description: { es: 'Para compartir o disfrutar solo.', en: 'To share or enjoy on your own.' },
        icon: 'drumstick',
        theme: 'red',
        products: [
          {
            id: 'pla-001',
            name: { es: 'Pollo Karaage', en: 'Chicken Karaage' },
            description: { es: 'Pollo frito con ensalada y arroz.', en: 'Fried chicken with salad and rice.' },
            price: 28, icon: 'drumstick', image: 'assets/images/karaage.jpg', available: true
          }
        ]
      },

      /* ----------------------------------------------------------- POSTRES */
      {
        id: 'postres',
        name: { es: 'Postres', en: 'Desserts' },
        description: { es: 'Un dulce te “YAMA”.', en: 'A sweet “YAMA” treat.' },
        icon: 'cookie',
        theme: 'cream',
        products: [
          {
            id: 'pos-001',
            name: 'Taiyakis',
            description: { es: 'Crujiente por fuera, suave por dentro. Harina, huevo y relleno del día.', en: 'Crispy outside, soft inside. Flour, egg and filling of the day.' },
            price: 8, icon: 'cookie', image: 'assets/images/taiyakis.jpg', available: true
          }
        ]
      },

      /* --------------------------------------------------------- ALMUERZOS */
      {
        id: 'almuerzos',
        name: { es: 'Almuerzos', en: 'Lunch menu' },
        description: { es: 'Elige una entrada, un plato de fondo y disfrútalo con tu bebida.', en: 'Choose a starter and a main, and enjoy it with your drink.' },
        icon: 'utensils-crossed',
        theme: 'red',
        note: { es: 'Lunes a viernes de 1 PM a 4 PM', en: 'Monday to Friday, 1 PM to 4 PM' },
        products: [
          {
            id: 'alm-001',
            name: { es: 'Almuerzo', en: 'Lunch set' },
            description: { es: 'Entrada + plato de fondo + bebida.', en: 'Starter + main + drink.' },
            schedule: { es: 'Lun a vie, 1 PM a 4 PM', en: 'Mon to Fri, 1 to 4 PM' },
            price: 27, icon: 'utensils-crossed', image: 'assets/images/almuerzos.jpg', available: true,
            optionGroups: [
              {
                id: 'entrada', label: { es: 'Entrada', en: 'Starter' },
                type: 'single', required: true,
                options: [
                  { id: 'gyozas', label: { es: '2 Gyozas', en: '2 Gyozas' } },
                  { id: 'takoyakis', label: { es: '2 bolitas de Takoyakis', en: '2 Takoyaki balls' } }
                ]
              },
              {
                id: 'fondo', label: { es: 'Plato de fondo', en: 'Main course' },
                type: 'single', required: true,
                options: [
                  { id: 'teriyaki', label: { es: 'Fondo: Teriyaki', en: 'Main: Teriyaki' } },
                  { id: 'tallarin-saltado', label: { es: 'Fondo: Tallarín saltado', en: 'Main: Stir-fried noodles' } }
                ]
              },
              {
                id: 'bebida', label: { es: 'Bebida', en: 'Drink' },
                type: 'single', required: true,
                options: [
                  { id: 'maracuyeah', label: 'Maracuyeah' }
                ]
              },
              {
                id: 'postre', label: { es: 'Postre (+S/5)', en: 'Dessert (+S/5)' }, short: { es: 'Postre', en: 'Dessert' },
                type: 'multi', max: 1, price: 5,
                options: [
                  { id: 'postre', label: { es: 'Agregar postre', en: 'Add dessert' } }
                ]
              }
            ]
          }
        ]
      },

      /* ----------------------------------------------------------- BEBIDAS */
      {
        id: 'bebidas',
        name: { es: 'Bebidas', en: 'Drinks' },
        description: { es: 'Sodas, infusiones y más.', en: 'Sodas, infusions and more.' },
        icon: 'cup-soda',
        theme: 'red',
        banner: 'assets/images/bebidas.jpg',
        products: [
          { id: 'beb-001', name: 'Lemony Matcha Soda', price: 14, icon: 'cup-soda', available: true },
          { id: 'beb-002', name: 'Jazmin Soda',        price: 12, icon: 'cup-soda', available: true },
          { id: 'beb-003', name: 'Maracuyeah',         price: 12, icon: 'cup-soda', available: true },
          { id: 'beb-004', name: { es: 'Soda de Jamaica', en: 'Hibiscus Soda' }, price: 12, icon: 'cup-soda', available: true },
          { id: 'beb-005', name: { es: 'Infusiones', en: 'Infusions' }, price: 9, icon: 'coffee', available: true },
          { id: 'beb-006', name: { es: 'Sidra “Chancho Cojo”', en: 'Cider “Chancho Cojo”' }, price: 20, icon: 'wine', available: true },
          { id: 'beb-007', name: { es: 'Cerveza “Servus”', en: 'Beer “Servus”' }, price: 19, icon: 'beer', available: true },
          {
            id: 'beb-008',
            name: { es: 'Agua personal', en: 'Personal water' },
            price: 7, icon: 'glass-water', available: true,
            optionGroups: [
              {
                id: 'gas', label: { es: 'Tipo', en: 'Type' },
                type: 'single', required: true,
                options: [
                  { id: 'con-gas', label: { es: 'Con gas', en: 'Sparkling' } },
                  { id: 'sin-gas', label: { es: 'Sin gas', en: 'Still' } }
                ]
              }
            ]
          },
          { id: 'beb-009', name: { es: 'Gaseosa personal', en: 'Personal soda' }, price: 10, icon: 'cup-soda', available: true }
        ]
      }
    ],

    /* Aviso general al pie de la carta (de la carta original) */
    footerNote: {
      es: 'Si eres alérgico a algún alimento y tienes dudas sobre lo que contiene alguno de nuestros platos, consúltanos. Los precios están expresados en Soles (S/).',
      en: 'If you are allergic to any food and have doubts about what any of our dishes contain, please ask us. Prices are in Soles (S/).'
    }
  };

  /* ---- Validación básica (se ejecuta al cargar; avisa por consola) ---- */
  function validateMenu(menu) {
    var problems = [], seen = {};
    (menu.categories || []).forEach(function (cat) {
      if (!cat.id) problems.push('Categoría sin id');
      (cat.products || []).forEach(function (p) {
        if (!p.id) { problems.push('Producto sin id en categoría ' + cat.id); return; }
        if (seen[p.id]) problems.push('Id de producto duplicado: ' + p.id);
        seen[p.id] = true;
        if (typeof p.price !== 'number' || !isFinite(p.price) || p.price <= 0) problems.push('Precio inválido en ' + p.id);
        var gseen = {};
        (p.optionGroups || []).forEach(function (g) {
          if (gseen[g.id]) problems.push('Grupo duplicado ' + g.id + ' en ' + p.id);
          gseen[g.id] = true;
          var oseen = {};
          (g.options || []).forEach(function (o) {
            if (oseen[o.id]) problems.push('Opción duplicada ' + o.id + ' en ' + p.id + '/' + g.id);
            oseen[o.id] = true;
            if (o.price != null && (typeof o.price !== 'number' || o.price < 0)) problems.push('Precio de opción inválido: ' + p.id + '/' + g.id + '/' + o.id);
          });
        });
      });
    });
    return problems;
  }

  menuData.validate = function () { return validateMenu(menuData); };

  root.menuData = menuData;
  if (typeof module !== 'undefined' && module.exports) module.exports = menuData;
})(typeof window !== 'undefined' ? window : globalThis);
