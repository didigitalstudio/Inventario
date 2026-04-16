# 📦 Inventario App

App de inventario con fotos, precios, ubicación y fechas. Guardado en la nube con Supabase.

---

## Configuración paso a paso

### 1. Crear proyecto en Supabase (gratis)

1. Andá a [supabase.com](https://supabase.com) y creá una cuenta con Google
2. Hacé clic en **"New Project"**
3. Ponele nombre (ej: `inventario-papa`) y elegí una contraseña
4. Región: elegí la más cercana (ej: South America - São Paulo)
5. Esperá 1-2 minutos a que se cree

### 2. Crear la tabla en Supabase

1. En tu proyecto, andá a **SQL Editor** (menú de la izquierda)
2. Hacé clic en **"New Query"**
3. Copiá TODO el contenido del archivo `supabase-setup.sql`
4. Pegalo en el editor y hacé clic en **"Run"**
5. Debería decir "Success. No rows returned" — eso está bien

### 3. Obtener las claves de Supabase

1. Andá a **Settings** > **API** (menú de la izquierda)
2. Copiá estos dos valores:
   - **Project URL** → es tu `VITE_SUPABASE_URL`
   - **anon public key** → es tu `VITE_SUPABASE_ANON_KEY`

### 4. Subir a Vercel

1. Subí esta carpeta a un repositorio en GitHub
2. En [vercel.com/new](https://vercel.com/new), importá el repositorio
3. Vercel detecta Vite automáticamente (Build command = `npm run build`, Output = `dist`)
4. En **Environment Variables**, agregá:
   - `VITE_SUPABASE_URL` = tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` = tu anon key
5. Hacé clic en **Deploy**

### 5. ¡Listo!

Vercel te da una URL tipo `tu-nombre.vercel.app`. Compartile esa URL a tu papá y puede usarla desde el iPhone como una app.

**Tip para iPhone:** Tu papá puede agregar la app a la pantalla de inicio:
1. Abrir la URL en Safari
2. Tocar el botón de compartir (cuadrado con flecha)
3. "Agregar a pantalla de inicio"
4. Listo, la tiene como si fuera una app

---

## Estructura del proyecto

```
inventario-app/
├── index.html              # HTML principal (con meta tags para iPhone)
├── package.json            # Dependencias
├── vite.config.js          # Config de Vite
├── supabase-setup.sql      # SQL para crear la tabla
├── .env.example            # Template de variables de entorno
└── src/
    ├── main.jsx            # Entry point
    ├── supabaseClient.js   # Conexión a Supabase
    └── App.jsx             # App completa
```
