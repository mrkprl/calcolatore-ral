import parametri from "@/lib/parametri-2026.json";

const FONTI_LEVE = [
  { titolo: "Trattamento integrativo", testo: parametri.trattamento_integrativo.fonte },
  { titolo: "Detrazioni familiari", testo: parametri.detrazioni_familiari.fonte },
  { titolo: "Costo azienda", testo: parametri.costo_azienda.fonte },
  { titolo: "Fringe benefit", testo: parametri.fringe_benefit.fonte },
  { titolo: "Buoni pasto", testo: parametri.buoni_pasto.fonte },
  { titolo: "Welfare", testo: parametri.welfare.fonte },
  { titolo: "Premio di risultato", testo: parametri.premio_risultato.fonte },
];

/**
 * Sezione collassabile con le assunzioni del calcolo, i limiti dichiarati
 * e le fonti normative principali. Server component: nessuna interattività
 * oltre al details nativo.
 */
export default function AssunzioniLimiti() {
  return (
    <details
      id="assunzioni"
      className="group scroll-mt-6 rounded-3xl border border-bordo bg-white p-5 open:pb-6 sm:p-6"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg font-bold tracking-tight [&::-webkit-details-marker]:hidden">
        <h2>Assunzioni, limiti e fonti</h2>
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="size-4 text-grigio transition-transform group-open:rotate-180"
        >
          <path
            d="M4 6l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>

      <div className="mt-4 space-y-5 text-sm leading-relaxed text-grigio-scuro md:columns-2 md:gap-10 [&>div]:break-inside-avoid">
        <div>
          <h3 className="font-semibold text-inchiostro">Profilo simulato</h3>
          <p>
            {parametri.profilo}. Il profilo familiare (figli, coniuge) si imposta nel simulatore:
            tutti i familiari si intendono fiscalmente a carico.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-inchiostro">Semplificazioni adottate</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>
              Contributi INPS al 9,19% flat su tutta la RAL: ignorati il contributo aggiuntivo IVS
              dell&apos;1% oltre la soglia annua, il contributo CIGS 0,30% a carico del dipendente
              (aziende oltre 15 dipendenti) e il massimale contributivo.
            </li>
            <li>
              Reddito complessivo uguale all&apos;imponibile fiscale: nessun altro reddito, nessun
              onere deducibile (es. previdenza complementare).
            </li>
            <li>
              13 mensilità (profilo industria, CCNL metalmeccanico-tipo): il mensile mostrato è il netto annuo diviso
              13. Nella realtà la tredicesima è tassata senza detrazioni mensili, quindi il suo
              netto reale è più basso delle mensilità ordinarie.
            </li>
            <li>Detrazioni non riproporzionate sui giorni: assunto anno intero (365 giorni).</li>
            <li>
              Costo azienda con valori tipici per un impiegato in azienda con più di 15 dipendenti:
              INPS a carico azienda circa 30%
              (forchetta 29-31% secondo settore e dimensione), INAIL 0,4% per lavoro
              d&apos;ufficio, TFR 6,91% della RAL. Esclusi fondi contrattuali da CCNL.
            </li>
            <li>
              Detrazioni per coniuge e figli: se l&apos;IRPEF non basta ad assorbirle, la parte
              eccedente (incapienza) va persa, come per legge in busta paga.
            </li>
            <li>
              Figli sotto i 21 anni: nessuna detrazione, perché c&apos;è l&apos;assegno unico INPS
              (non calcolato, non passa dalla busta paga). Contano però per la soglia fringe
              benefit.
            </li>
            <li>
              Premio di risultato: nessun TFR sul premio, contributi del dipendente e
              dell&apos;azienda dovuti; l&apos;imponibile fiscale dell&apos;anno (RAL meno contributi) fa da proxy del
              reddito di lavoro dipendente dell&apos;anno precedente,
              che è quello che conta per la soglia di 80.000 €.
            </li>
            <li>
              Il pacchetto ottimizzato vale per un <strong>budget aggiuntivo</strong>: non si può
              convertire in benefit uno stipendio già pattuito.
            </li>
            <li>
              Trattamento integrativo (ex bonus Renzi): tra 15.000 e 28.000 € di reddito si
              considerano solo le detrazioni per lavoro dipendente e per familiari a carico, non
              altre detrazioni (mutuo, spese sanitarie, ristrutturazioni).
            </li>
            <li>
              Welfare da regolamento volontario: per l&apos;azienda è deducibile solo nel limite del
              5 per mille delle spese per il personale (art. 100 TUIR); se previsto da contratto o
              accordo aziendale, è deducibile per intero.
            </li>
            <li>
              Fringe benefit, buoni pasto e welfare arrivano come beni e servizi, non come
              contante in busta: valgono quanto la spesa che coprono.
            </li>
            <li>
              Welfare e premio di risultato richiedono un regolamento o un accordo aziendale (o
              territoriale); il welfare va offerto alla generalità o a categorie di dipendenti.
            </li>
            <li>
              Fringe benefit sempre entro la soglia: superarla anche di 1 € rende imponibile
              l&apos;intero importo.
            </li>
            <li>Ignorati: buoni pasto cartacei, auto aziendale, conguagli di fine anno.</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-inchiostro">Limiti dichiarati</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Solo caso standard Milano/Lombardia: nessun altro comune o regione.</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-inchiostro">Fonti principali</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>
              Art. 11 e 13 TUIR (DPR 917/1986), testo vigente su Normattiva: scaglioni IRPEF e
              detrazione lavoro dipendente
            </li>
            <li>
              L. 199/2025 (Legge di Bilancio 2026) e L. 207/2024: scaglioni 2026 e taglio del
              cuneo fiscale
            </li>
            <li>Circolare INPS n. 14/2026: aliquote contributive</li>
            <li>
              Regione Lombardia (art. 72 l.r. 10/2003) e Comune di Milano (Delib. C.C. 46/2020):
              addizionali
            </li>
            <li>Dipartimento delle Finanze: database addizionali regionali e comunali</li>
            {FONTI_LEVE.map((fonte) => (
              <li key={fonte.titolo}>
                {fonte.titolo}: {fonte.testo}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-2 rounded-2xl bg-fondo-2 px-4 py-3 text-xs font-medium text-grigio [column-span:all]">
          Prototipo dimostrativo: non sostituisce un calcolo professionale (consulente del lavoro
          o CAF). Parametri anno d&apos;imposta {parametri.anno_imposta}.
        </p>
      </div>
    </details>
  );
}
