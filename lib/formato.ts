/**
 * Formattazione per la visualizzazione (locale it-IT).
 * Gli arrotondamenti avvengono SOLO qui: la pipeline di calcolo
 * (lib/calcolo.ts) lavora sempre su valori non arrotondati.
 */

const formatoIntero = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  useGrouping: "always",
  maximumFractionDigits: 0,
});

const formatoCentesimi = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  useGrouping: "always",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatoPercento = new Intl.NumberFormat("it-IT", {
  style: "percent",
  useGrouping: "always",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Es. 23425.52 diventa "23.426 €" (per i numeri grandi in evidenza). */
export function formattaEuro(valore: number): string {
  return formatoIntero.format(valore);
}

/** Es. 217.944 diventa "217,94 €" (per le voci del dettaglio). */
export function formattaEuroCentesimi(valore: number): string {
  return formatoCentesimi.format(valore);
}

/** Riceve una frazione tra 0 e 1, es. 0.219 diventa "21,9%". */
export function formattaPercentuale(frazione: number): string {
  return formatoPercento.format(frazione);
}

/** Es. "2026-08-08" diventa "8 agosto 2026" (parsing manuale: nessuna sorpresa di fuso orario). */
export function formattaData(isoData: string): string {
  const [anno, mese, giorno] = isoData.split("-").map(Number);
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(anno, mese - 1, giorno));
}

/** Dopo la pulizia: solo cifre, con al più una virgola seguita da una o due cifre decimali. */
const FORMATO_IMPORTO = /^\d+(,\d{1,2})?$/;

/**
 * Interpreta l'input RAL digitato dall'utente in convenzione italiana:
 * i punti sono separatori delle migliaia, la virgola è il decimale
 * ("30.000" diventa 30000, "30000,50" diventa 30000.5).
 * Restituisce null se il testo non è un importo in questo formato:
 * "30,000" (virgola con tre cifre), "1e3", "0x10" o segni non sono accettati.
 */
export function interpretaImporto(testo: string): number | null {
  const pulito = testo.replace(/[€\s.]/g, "");
  if (!FORMATO_IMPORTO.test(pulito)) return null;
  return Number(pulito.replace(",", "."));
}
