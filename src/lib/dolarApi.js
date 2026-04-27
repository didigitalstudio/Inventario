// Integración con dolarapi.com (cotización actual) y argentinadatos.com (histórica).
// Ambas APIs son públicas, sin auth, soportan CORS.
// Default tipo: blue (mercado informal — el más usado para antigüedades).

const CURRENT_API = "https://dolarapi.com/v1/dolares";
const HISTORICAL_API = "https://api.argentinadatos.com/v1/cotizaciones/dolares";
const CURRENT_TTL_MS = 60 * 60 * 1000; // 1h

// Cache en memoria
const cacheCurrent = new Map(); // tipo -> { rate, ts }
const cacheHistorical = new Map(); // `${tipo}-${date}` -> rate

// Persistencia en localStorage para no perder cache entre reloads
const LS_KEY = "casty:dolar:current";
try {
  const stored = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  Object.entries(stored).forEach(([tipo, entry]) => {
    if (entry && entry.ts && Date.now() - entry.ts < CURRENT_TTL_MS) {
      cacheCurrent.set(tipo, entry);
    }
  });
} catch {}

function persistCurrent() {
  const obj = {};
  cacheCurrent.forEach((v, k) => { obj[k] = v; });
  try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch {}
}

// ----- Cotización actual -----

export async function getCurrentDolar(tipo = "blue") {
  const cached = cacheCurrent.get(tipo);
  if (cached && Date.now() - cached.ts < CURRENT_TTL_MS) return cached.rate;
  const res = await fetch(`${CURRENT_API}/${tipo}`);
  if (!res.ok) throw new Error("No se pudo obtener cotización actual");
  const data = await res.json();
  const rate = {
    tipo,
    compra: Number(data.compra),
    venta: Number(data.venta),
    fechaActualizacion: data.fechaActualizacion,
  };
  cacheCurrent.set(tipo, { rate, ts: Date.now() });
  persistCurrent();
  return rate;
}

// ----- Cotización histórica -----

function shiftDate(dateStr, deltaDays) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + deltaDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function fetchSingleHistorical(date, tipo) {
  const [yyyy, mm, dd] = date.split("-");
  const res = await fetch(`${HISTORICAL_API}/${tipo}/${yyyy}/${mm}/${dd}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || data.compra == null) return null;
  return {
    tipo,
    fecha: data.fecha || date,
    fechaSolicitada: date,
    compra: Number(data.compra),
    venta: Number(data.venta),
    aproximada: data.fecha && data.fecha !== date,
  };
}

// Fechas de fin de semana / feriados pueden no tener cotización: probamos hasta 7 días atrás.
export async function getDolarForDate(date, tipo = "blue") {
  if (!date) return null;
  const cacheKey = `${tipo}-${date}`;
  if (cacheHistorical.has(cacheKey)) return cacheHistorical.get(cacheKey);
  for (let i = 0; i <= 7; i++) {
    const tryDate = i === 0 ? date : shiftDate(date, -i);
    try {
      const rate = await fetchSingleHistorical(tryDate, tipo);
      if (rate) {
        rate.fechaSolicitada = date;
        rate.aproximada = i > 0;
        cacheHistorical.set(cacheKey, rate);
        return rate;
      }
    } catch {}
  }
  throw new Error(`No se encontró cotización ${tipo} para ${date} ni los 7 días anteriores`);
}

// ----- Helpers de formateo -----

export function formatUSD(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);
}

export function arsToUsd(ars, cotizacion) {
  if (!ars || !cotizacion) return null;
  return ars / cotizacion;
}
