# Alemoon

Sitio web y panel administrativo para la marca de joyeria Alemoon.

Incluye:

- Home publico con catalogo y productos destacados
- Catalogo filtrable por categorias
- Vista de detalle por producto
- Panel `/admin` con login usando Supabase Auth
- Gestion de productos, categorias, ofertas, promociones e imagenes destacadas
- Integracion con Supabase Storage para subir imagenes

## Stack

- React 19
- TanStack Start
- Vite
- Tailwind CSS
- Supabase
- Vercel

## Variables de entorno

Para desarrollo del frontend:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SITE_URL=
```

Para scripts locales que usan permisos elevados de Supabase:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Importante:

- `VITE_SUPABASE_PUBLISHABLE_KEY` es la unica key que debe usarse en el navegador.
- `SUPABASE_SERVICE_ROLE_KEY` no debe subirse al repositorio ni configurarse en el frontend.

## Instalacion local

```bash
npm install
npm run dev
```

## Scripts disponibles

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run format
npm run import:productos
```

## Supabase

Tablas principales usadas por el proyecto:

- `productos`
- `categorias`
- `perfiles`
- `promociones`
- `combos_destacados`

Bucket principal:

- `productos`

## Despliegue en Vercel

Variables minimas para produccion y preview:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SITE_URL=
```

No configures `SUPABASE_SERVICE_ROLE_KEY` en Vercel para este frontend.

## Flujo recomendado de trabajo

Para hacer cambios sin tocar produccion directamente:

```bash
git checkout main
git pull origin main
git checkout -b nombre-de-tu-rama
```

Cuando termines:

```bash
git add .
git commit -m "Tu mensaje"
git push -u origin nombre-de-tu-rama
```

## Contacto de la marca

- WhatsApp: `+593 98 930 3761`
- Facebook: `https://www.facebook.com/alemoon.ec`
- Instagram: `https://www.instagram.com/alemoon.ec?igsh=MWY4cHVkc2gzNjhzOA==`
