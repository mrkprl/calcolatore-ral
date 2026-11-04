"use client";

import { motion } from "framer-motion";
import type { RisultatoCalcolo } from "@/lib/calcolo";
import { formattaEuro, formattaPercentuale } from "@/lib/formato";

/**
 * Barra proporzionale del costo azienda: contributi e accantonamenti del
 * datore, trattenute del dipendente e netto. La base è il costo azienda
 * totale più le quote non tassate che il netto include (somma esente del
 * cuneo e trattamento integrativo): così ogni segmento resta esatto anche
 * per i redditi bassi.
 */
export default function BarraRipartizione({ risultato }: { risultato: RisultatoCalcolo }) {
  const { costoAzienda } = risultato;
  const nettoEsente = risultato.sommaEsente + risultato.trattamentoIntegrativo;
  const base = costoAzienda.totale + nettoEsente;

  const segmenti = [
    { etichetta: "Netto tassato", valore: risultato.nettoAnnuo - nettoEsente, colore: "bg-lime-500" },
    { etichetta: "Netto non tassato", valore: nettoEsente, colore: "bg-lime-200" },
    { etichetta: "IRPEF netta", valore: risultato.irpefNetta, colore: "bg-grigio" },
    {
      etichetta: "Addizionali",
      valore: risultato.addizionaleRegionale + risultato.addizionaleComunale,
      colore: "bg-bordo-forte",
    },
    { etichetta: "INPS dipendente", valore: risultato.contributiInps, colore: "bg-grigio-scuro" },
    { etichetta: "INPS azienda", valore: costoAzienda.contributiDatore, colore: "bg-inchiostro" },
    { etichetta: "INAIL", valore: costoAzienda.inail, colore: "bg-lime-900" },
    { etichetta: "TFR accantonato", valore: costoAzienda.tfr, colore: "bg-salvia" },
  ].filter((segmento) => segmento.valore > 0.005);

  return (
    <div>
      <div
        className="flex h-5 w-full gap-0.5 overflow-hidden rounded-full bg-fondo-3"
        role="img"
        aria-label={`Ripartizione del costo azienda: ${segmenti
          .map((s) => `${s.etichetta} ${formattaPercentuale(s.valore / base)}`)
          .join(", ")}`}
      >
        {segmenti.map((segmento) => (
          <motion.div
            key={segmento.etichetta}
            className={`${segmento.colore} first:rounded-l-full last:rounded-r-full`}
            initial={false}
            animate={{ width: `${(segmento.valore / base) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-grigio">
        {segmenti.map((segmento) => (
          <li key={segmento.etichetta} className="flex items-center gap-1.5">
            <span
              className={`inline-block size-2.5 shrink-0 rounded-full ${segmento.colore}`}
              aria-hidden
            />
            {segmento.etichetta}
            <span className="font-semibold text-inchiostro tabular-nums">
              {formattaEuro(segmento.valore)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
