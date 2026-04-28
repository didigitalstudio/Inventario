# 📦 Inventario App

App de inventario con fotos, precios, ubicación y fechas. Multi-tenant (cada usuario ve solo sus productos), guardada en la nube con Supabase.

---

## Producción

- **App viva**: https://inventario-mu-one.vercel.app
- **Backend**: Supabase, org *Di Digital Studio*, proyecto `inventario` (`ontlvjfnykmukfakxwuq`)
- **Auto-deploy**: cada push a `main` deploya automáticamente a producción.

Dashboards (sólo el owner):
- Supabase: https://supabase.com/dashboard/project/ontlvjfnykmukfakxwuq
- Vercel: https://vercel.com/didigitalstudio/inventario

---

## Desarrollo local

```bash
git clone https://github.com/didigitalstudio/Inventario.git
cd Inventario
npm install
```

Conseguí las env vars (una de las dos):

**A) Si tenés acceso a Vercel** (recomendado):
```bash
npx vercel link        # linkear al proyecto inventario
npx vercel env pull .env
```

**B) Pedile el `.env` al owner** y copialo a la raíz del repo. Las dos variables son:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Levantá el dev server:
```bash
npm run dev
```

Abre en http://localhost:5173. La primera vez creá una cuenta (botón "¿No tenés cuenta? Creá una"). El email confirmation está desactivado, así que entrás directo después del signup.

---

## Stack

- **Frontend**: React 18 + Vite, sin librería de UI (estilos inline). Hosted en Vercel.
- **Backend**: Supabase
  - Postgres con tabla `productos` y RLS por `owner_id` (cada user ve solo lo suyo)
  - Auth email/password
  - Storage bucket público `fotos-productos`
- **Categorías**: guardadas en `auth.users.user_metadata.categorias` (no hay tabla aparte)

---

## Recrear el backend desde cero

Sólo si en el futuro hay que migrar a otro proyecto Supabase. Pasos:

1. Crear proyecto nuevo en la org Di Digital Studio
2. SQL Editor → New Query → pegar todo `supabase-setup.sql` → Run
3. Authentication → Settings: deshabilitar *Confirm email*; setear *Site URL* a la URL de producción
4. Settings → API: copiar Project URL y anon key
5. Vercel → Settings → Environment Variables: actualizar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (production + preview + development)
6. Redeploy

El SQL es idempotente, se puede correr varias veces sin romper nada.

---

## Estructura del proyecto

```
Inventario/
├── index.html              # HTML principal (con meta tags para iPhone)
├── package.json            # Dependencias
├── vite.config.js          # Config de Vite
├── supabase-setup.sql      # Schema completo de la DB (idempotente)
├── .env.example            # Template de env vars
└── src/
    ├── main.jsx            # Entry point
    ├── supabaseClient.js   # Cliente Supabase
    ├── App.jsx             # App completa (auth + CRUD + import/export)
    └── lib/
        ├── dolarApi.js     # Cotización del dólar
        └── excelImport.js  # Import/export de Excel
```

---

## Tip para iPhone

Tu papá puede agregar la app a la pantalla de inicio:
1. Abrir la URL en Safari
2. Tocar el botón de compartir (cuadrado con flecha)
3. "Agregar a pantalla de inicio"
4. Listo, la tiene como si fuera una app
