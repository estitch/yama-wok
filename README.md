# Carta digital con pedido por QR — Yama Wok (Fast Nikkei)

Aplicación web **estática** (HTML + CSS + JavaScript, sin backend) para que los clientes de un bar o restaurante:

1. consulten la carta desde el celular (Mobile First, español por defecto e inglés),
2. armen su pedido (con opciones como las del *Arma tu wok*),
3. generen un **código QR** con el pedido,

y para que el personal lo **escanee** en `mesera.html` y vea el detalle completo (con opción de imprimir).

La carta incluida está basada en el PDF "Carta en español nueva": categorías Arma tu wok, Entradas, Ramen y sopa, Platos, Postres, Almuerzos y Bebidas, con sus precios en soles (S/).

---

## 1. Estructura de carpetas

```text
carta-digital/
├── index.html          Carta del cliente (carrito + generador de QR)
├── mesera.html         Lector de pedidos para el personal
├── README.md
├── assets/
│   ├── logo.png        Logotipo original (recortado de la carta, fondo rojo #d20824)
│   ├── favicon.png     Icono "YW"
│   └── images/         Fotos de productos y mascota (jpg/png)
├── css/
│   ├── styles.css      Estilos base y componentes
│   ├── responsive.css  Puntos de ruptura (2 col. móvil · 3 · 4 · 5 en escritorio)
│   └── animations.css  Animaciones (respeta prefers-reduced-motion)
└── js/
    ├── config.js       Datos del local, moneda, colores, ajustes del pedido
    ├── menu-data.js    LA CARTA: categorías, productos, precios, opciones
    ├── i18n.js         Textos de la interfaz en español / inglés
    ├── utils.js        Utilidades (escape HTML, dinero, fechas)
    ├── icons.js        Iconos Lucide incrustados
    ├── cart.js         Lógica del carrito (precios, cantidades, localStorage)
    ├── order-qr.js     Formato del pedido, generación y lectura del QR
    ├── app.js          Interfaz de index.html
    ├── waitress.js     Interfaz y cámara de mesera.html
    └── vendor/         qrcode.js (qrcode-generator 1.4.4) y jsQR.js (lectura) + licencias
```

## 2. Tecnologías

- HTML5, CSS3 (Grid, variables CSS), JavaScript moderno sin framework ni paso de compilación.
- [qrcode-generator 1.4.4](https://github.com/kazuhikoarase/qrcode-generator) (MIT) para **generar** el QR, con codificación UTF-8.
- [jsQR 1.4.0](https://github.com/cozmo/jsQR) (Apache-2.0) para **leer** el QR desde la cámara o una imagen.
- Iconos [Lucide](https://lucide.dev) (ISC) incrustados en `js/icons.js`.
- Todas las librerías están **dentro del proyecto** (no dependen de ninguna CDN). Funciona sin conexión una vez cargado.

## 3. Ejecutar en local

Basta con abrir `index.html` con doble clic. Para probar también la **cámara** de `mesera.html` hace falta `localhost` o HTTPS, así que lo recomendado es un servidor local:

```bash
cd carta-digital
python3 -m http.server 8000      # o:  npx serve .
```

Luego abre `http://localhost:8000/index.html` y `http://localhost:8000/mesera.html`.
Para probar desde tu celular en la misma red, la cámara no funcionará con `http://192.168.x.x` (no es una conexión segura); usa la lectura "desde una imagen" o publica la página con HTTPS (sección 12).

## 4. Cambiar el logotipo y los datos del local

- **Logotipo**: reemplaza `assets/logo.png` (mantén el mismo nombre o cambia la ruta en `js/config.js → assets.logo`). La cabecera es roja (`#d20824`) para que el logotipo original se integre sin bordes; si tu logo tiene otro fondo, cambia `theme.primary` en `config.js`.
- **Mascota** (opcional): `assets/images/mascota.png`; pon `mascot: ''` en `config.js` para ocultarla.
- **Icono de pestaña**: `assets/favicon.png`.
- **Datos del local** (`js/config.js`): `business.name`, `tagline`, `description`, `address`, `phone`, `social.facebook/instagram/tiktok` (los campos vacíos no se muestran), `currency` (código, símbolo, decimales), colores y prefijo de los pedidos (`order.prefix`).
- Si cambias el nombre, actualiza también el `<title>` de `index.html` y `mesera.html` (los scripts ya lo reemplazan al cargar).

## 5. Agregar productos

Edita **solo** `js/menu-data.js`. Dentro de la categoría que corresponda, añade un objeto a `products`:

```javascript
{
  id: 'ent-004',                         // ÚNICO en toda la carta
  name: { es: 'Edamame', en: 'Edamame' },// o un string simple: 'Edamame'
  description: { es: 'Con sal de mar.', en: 'With sea salt.' },
  detail: { es: '1 porción', en: '1 portion' },   // opcional
  price: 12,                             // número positivo
  icon: 'leaf',                          // icono Lucide de js/icons.js
  image: 'assets/images/edamame.jpg',    // opcional (sin imagen, la tarjeta es compacta)
  available: true                        // false = "No disponible"
}
```

**Productos con opciones** (como el wok o el ramen): añade `optionGroups`. Cada grupo es `single` (elige una) o `multi` (varias, con `max`), puede ser `required`, y puede cobrar un recargo (`price` por opción, o `priceMode: 'flat'` para un cargo único). El archivo documenta todos los campos en su cabecera y el wok, el ramen, las gyozas y el almuerzo sirven de ejemplo. El precio se calcula solo: base + recargos.

**Iconos**: usa un nombre de `js/icons.js` (p. ej. `soup`, `salad`, `cup-soda`, `wine`, `beer`, `coffee`, `cookie`, `drumstick`, `fish`, `utensils`). Para otro icono, copia el contenido interno del SVG desde [lucide.dev](https://lucide.dev) y añádelo al objeto `PATHS` de `icons.js`.

## 6. Eliminar o desactivar productos

- **Eliminar**: borra el objeto del producto de `menu-data.js`.
- **Desactivar temporalmente**: `available: false` (se ve atenuado como "No disponible" y no se puede pedir; si ya estaba en un carrito guardado, se descarta al recargar).

## 7. Modificar precios y textos

Cambia `price` (o el `price` de una opción/grupo) y los textos `name` / `description` en `menu-data.js`. Los precios del carrito se **recalculan siempre desde la carta**, nunca desde datos guardados. Al cargar, `menuData.validate()` avisa por consola de ids duplicados o precios no numéricos / no positivos.

## 8. Crear categorías

Añade un objeto a `menuData.categories`:

```javascript
{
  id: 'sopas',                 // único
  name: { es: 'Sopas', en: 'Soups' },
  description: { es: 'Para entrar en calor.', en: 'To warm you up.' },
  icon: 'soup',
  theme: 'ink',                // 'red' | 'sand' | 'ink' | 'cream'  (color de la cabecera)
  banner: 'assets/images/sopas.jpg',   // opcional
  note: { es: 'Solo de noche', en: 'Evenings only' },   // opcional
  products: [ /* ... */ ]
}
```

El chip de navegación, la cabecera de sección y el filtro se crean solos. El orden del archivo es el orden en pantalla.

## 9. Generar el QR del pedido (cliente)

1. Agrega productos (los que tienen opciones abren una ventana para elegirlas).
2. Abre el pedido con el botón flotante (panel lateral derecho): ajusta cantidades, elimina líneas o vacía (con confirmación). El pedido se conserva al recargar (`localStorage`).
3. Pulsa **GENERAR QR DE MI PEDIDO**. Se muestra el QR con el identificador, la fecha y el total; **Descargar QR** lo guarda como PNG.

El contenido del QR es un JSON compacto y siempre está **en español** (para el personal): id del pedido, fecha/hora con zona horaria, moneda, total y, por línea, id de producto, nombre, cantidad, precio unitario, subtotal y opciones elegidas. Si un pedido es demasiado grande para un solo QR (más de ~1100 bytes), se **divide automáticamente en varios QR** (se navega con ‹ ›) que la mesera escanea uno a uno; nunca se genera un QR inválido. Si algo falla se muestra un mensaje claro, no un modal vacío.

## 10. Usar la página de la mesera

1. Abre `mesera.html` (puede ponerse como acceso directo en el celular o tablet del personal).
2. **Activar cámara** (el navegador pedirá permiso) y apunta al QR del cliente. Al leerlo, la cámara se apaga y se muestra el ticket: id, fecha y hora, cada producto con cantidad y opciones, precios unitarios, subtotales y total.
3. **Imprimir pedido** (la hoja de impresión muestra solo el ticket) o **Escanear otro QR**.
4. Si no hay cámara o no hay HTTPS, se muestra un mensaje y se puede usar **Leer QR desde una imagen** (captura o foto del QR). También avisa si el QR no es un pedido válido, está vacío o no se puede interpretar, y si los importes del QR no cuadran entre sí.

## 11. Limitaciones de esta versión estática (sin backend ni base de datos)

- Los pedidos **no se envían ni se guardan en ningún servidor**: viajan solo dentro del QR. No hay historial, ni estados del pedido, ni cierre de mesas.
- Los precios del QR son **referenciales**: cualquiera podría fabricar un QR con precios alterados. La mesera debe confirmar con la carta vigente; para cobrar con seguridad haría falta un backend que valide el pedido contra la carta.
- El carrito vive en el navegador del cliente (`localStorage`); si borra los datos del sitio, se pierde.
- No hay pagos, ni identificación de mesa, ni notas libres del cliente.
- Cambiar la carta implica editar `menu-data.js` y volver a publicar los archivos.
- Una evolución natural es añadir un backend (por ejemplo una API que reciba el pedido, lo asocie a una mesa y lo muestre en cocina).

## 12. Publicar con HTTPS

La cámara del navegador solo funciona en **HTTPS** (o `localhost`). Cualquier hosting estático con HTTPS sirve; sube **toda la carpeta** respetando la estructura:

- **Netlify**: arrastra la carpeta en *app.netlify.com/drop*. HTTPS automático.
- **GitHub Pages**: sube el proyecto a un repositorio → *Settings → Pages* → rama `main`, carpeta `/ (root)`. HTTPS automático.
- **Cloudflare Pages / Firebase Hosting / Vercel**: despliegue estático, HTTPS incluido.
- **Hosting tradicional (cPanel)**: sube los archivos a `public_html` y activa el certificado SSL (Let's Encrypt).

Después imprime un QR que apunte a `https://tu-dominio/index.html` y colócalo en las mesas; guarda `https://tu-dominio/mesera.html` en los dispositivos del personal.

---

## Notas sobre los datos de la carta

Todo se tomó del PDF; no se inventaron productos ni precios. Algunas interpretaciones que conviene confirmar:

- **Ramen**: el PDF muestra "Ramen con fondo concentrado de cerdo S/34" en una página y los cuatro sabores (Miso, Shoyu, Shio, Tan Tan) en las siguientes sin precio propio; se asumió **S/34 para los cuatro**. *Súmale a tu ramen*: huevo +S/4, fideo +S/5, arroz +S/6.
- **Sopa Miso** (S/30) se agrupó con los ramen; **Pollo Karaage** (S/28) está en "Platos" y **Taiyakis** (S/8) en "Postres". Esos nombres de categoría no figuran en el PDF.
- **Arma tu wok** (S/30): base, proteína, hasta 3 vegetales y salsa; proteína extra +S/5; "dos vegetales extra" +S/4 (se pide 0 o 2).
- **Almuerzos** (S/27, lunes a viernes 1 PM a 4 PM): entrada (2 gyozas o 2 bolitas de takoyakis) + fondo (teriyaki o tallarín saltado) + bebida (Maracuyeah, la única que muestra el PDF); postre +S/5.
- **Gyozas**: se eligió el relleno (pollo, cerdo o veggie); **Agua personal**: con o sin gas.
- Las **traducciones al inglés** de descripciones y de algunos nombres son propias; edítalas en `menu-data.js` si prefieres otra redacción.
- Dirección, teléfono y redes sociales no vienen en el PDF: quedan vacíos en `config.js` (no se muestran) hasta que los completes.
- Las fotos de productos se recortaron de las imágenes incluidas en el PDF (reducidas a 640×480 px).

## Pruebas realizadas

Se ejecutaron en Chrome 153 sin interfaz gráfica, con viewports emulados (320, 390, 768 y 1280 px) y servidor local:

- Lógica en Node: cálculo de precios con opciones y extras, validaciones, línea acumulada, total (verificado a mano: S/172), generación de QR → lectura con jsQR → comparación campo por campo, UTF-8 (ñ, tildes, comillas tipográficas), pedido grande dividido en 2 QR y reconstruido, rechazo de QR inválidos / vacíos / mal formados, y error controlado cuando el texto supera la capacidad del QR.
- Navegador: 21 productos y 7 categorías, 2 columnas en móvil (sin desplazamiento horizontal), icono a la izquierda del nombre, filtros, buscador (mayúsculas y tildes), ventana de opciones con límites y errores, carrito (panel desde la derecha, Escape, cantidades, subtotales, total, vaciar con confirmación, persistencia al recargar), QR visible y descargado como PNG, cambio ES/EN, y lectura del QR descargado en `mesera.html`, estilos de impresión y ausencia de errores en consola.
- Cámara: se probó con una **cámara simulada** de Chrome que muestra el QR del pedido (lectura correcta en < 1 s, apagado de la cámara, reactivación, botón Detener) y el caso "sin cámara".

**No se probó** en teléfonos reales (iPhone/Android), con una cámara física, ni con una impresora; conviene hacer una prueba rápida con tus dispositivos tras publicar con HTTPS.

## Licencias de terceros

`js/vendor/` incluye qrcode-generator (MIT), jsQR (Apache-2.0) e iconos Lucide (ISC); sus licencias están en esa carpeta. Las fotos, el logotipo y la mascota pertenecen a Yama Wok.
