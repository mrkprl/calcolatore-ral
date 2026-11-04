"use client";

import type { RisultatoCalcolo } from "@/lib/calcolo";
import parametri from "@/lib/parametri-2026.json";
import { formattaEuro, formattaEuroCentesimi } from "@/lib/formato";
import BarraRipartizione from "@/components/BarraRipartizione";
import ContatoreEuro from "@/components/ContatoreEuro";

/**
 * "La tua busta oggi": netto annuo e mensile, costo azienda totale, barra
 * di ripartizione del costo azienda e dettaglio voce per voce, nello stesso
 * ordine della busta paga.
 */
export default function BustaOggi({ risultato }: { risultato: RisultatoCalcolo }) {
  const { costoAzienda } = risultato;
  const suCento = Math.round((risultato.nettoAnnuo / costoAzienda.totale) * 100);
  const tfrSuCento = Math.round((costoAzienda.tfr / costoAzienda.totale) * 100);
  const nonTassato = risultato.sommaEsente + risultato.trattamentoIntegrativo;

  return (
    <section aria-labelledby="titolo-busta" className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 rounded-3xl bg-inchiostro p-5 text-white sm:p-6">
          <p className="text-sm font-medium text-white/70">Netto annuo, oggi</p>
          <ContatoreEuro
            valore={risultato.nettoAnnuo}
            className="mt-1 block font-display text-5xl font-bold tracking-tight sm:text-6xl"
          />
          <p className="mt-1 text-xs text-white/60 tabular-nums">
            esatto: {formattaEuroCentesimi(risultato.nettoAnnuo)}
          </p>
        </div>
        <div className="rounded-3xl border border-bordo bg-white p-4 sm:p-5">
          <p className="text-xs font-medium text-grigio">
            Netto al mese{" "}
            <span className="whitespace-nowrap">({parametri.mensilita.valore} mensilità)</span>
          </p>
          <ContatoreEuro
            valore={risultato.nettoMensile}
            className="mt-1 block font-display text-2xl font-bold sm:text-3xl"
          />
        </div>
        <div className="rounded-3xl border border-bordo bg-white p-4 sm:p-5">
          <p className="text-xs font-medium text-grigio">Costo per l&apos;azienda</p>
          <ContatoreEuro
            valore={costoAzienda.totale}
            className="mt-1 block font-display text-2xl font-bold sm:text-3xl"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-bordo bg-white p-5">
        <p className="text-sm text-grigio-scuro">
          Di <strong className="text-inchiostro">100 €</strong> spesi dall&apos;azienda, in busta
          te ne arrivano{" "}
          <mark className="rounded-md bg-lime-500 px-1.5 py-0.5 font-display font-bold text-inchiostro">
            {suCento} €
          </mark>
          . Altri {tfrSuCento} € restano tuoi come TFR accantonato (lordo, tassato a parte quando
          lo ricevi); il resto va in contributi e tasse.
        </p>
        <div className="mt-4">
          <BarraRipartizione risultato={risultato} />
        </div>
      </div>

      <details className="group rounded-3xl border border-bordo bg-white px-5 py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold [&::-webkit-details-marker]:hidden">
          Il calcolo, voce per voce
          <Freccina />
        </summary>
        <dl className="mt-3 text-sm">
          <RigaVoce nome="RAL (Retribuzione Annua Lorda)" valore={risultato.ral} evidenza />
          <RigaVoce
            nome="Contributi INPS a carico tuo"
            dettaglio="9,19% della RAL"
            valore={-risultato.contributiInps}
          />
          <RigaVoce nome="Imponibile fiscale" valore={risultato.imponibileFiscale} subtotale />

          <div className="my-1 ml-2 border-l-2 border-bordo pl-3">
            <RigaVoce
              nome="IRPEF lorda"
              dettaglio="scaglioni progressivi"
              valore={risultato.irpefLorda}
              attenuata
            />
            <RigaVoce
              nome="Detrazione lavoro dipendente"
              dettaglio="art. 13 TUIR"
              valore={-risultato.detrazioneLavoro}
              attenuata
            />
            {risultato.cuneo > 0 && (
              <RigaVoce
                nome="Detrazione taglio cuneo fiscale"
                dettaglio="L. 207/2024"
                valore={-risultato.cuneo}
                attenuata
              />
            )}
            {risultato.detrazioneConiuge > 0 && (
              <RigaVoce
                nome="Detrazione coniuge a carico"
                dettaglio="art. 12 TUIR"
                valore={-risultato.detrazioneConiuge}
                attenuata
              />
            )}
            {risultato.detrazioneFigli > 0 && (
              <RigaVoce
                nome="Detrazione figli 21-29 anni"
                dettaglio={`art. 12 TUIR, quota ${
                  risultato.profilo.coniugeACarico || risultato.profilo.quotaDetrazioneFigli === 1
                    ? "100"
                    : "50"
                }%`}
                valore={-risultato.detrazioneFigli}
                attenuata
              />
            )}
          </div>

          <RigaVoce nome="IRPEF netta" dettaglio="mai negativa" valore={-risultato.irpefNetta} subtotale />
          <RigaVoce
            nome="Addizionale regionale Lombardia"
            dettaglio="scaglioni progressivi propri"
            valore={-risultato.addizionaleRegionale}
          />
          <RigaVoce
            nome="Addizionale comunale Milano"
            dettaglio={
              risultato.addizionaleComunale === 0
                ? "esente: imponibile fino a 23.000 €"
                : "0,8% sull'intero imponibile"
            }
            valore={-risultato.addizionaleComunale}
          />
          {risultato.sommaEsente > 0 && (
            <RigaVoce
              nome="Somma esente taglio cuneo"
              dettaglio="integrazione non tassata, L. 207/2024"
              valore={risultato.sommaEsente}
              positiva
            />
          )}
          {risultato.trattamentoIntegrativo > 0 && (
            <RigaVoce
              nome="Trattamento integrativo (ex bonus Renzi)"
              dettaglio="non tassato, art. 1 DL 3/2020"
              valore={risultato.trattamentoIntegrativo}
              positiva
            />
          )}
          <RigaVoce nome="Netto annuo" valore={risultato.nettoAnnuo} totale />
        </dl>

        <h3 className="mt-6 text-sm font-semibold">Quanto costi all&apos;azienda</h3>
        <dl className="mt-2 text-sm">
          <RigaVoce nome="RAL" valore={risultato.ral} evidenza />
          <RigaVoce
            nome="Contributi INPS a carico azienda"
            dettaglio={`circa ${formattaPercentualeSemplice(parametri.costo_azienda.contributi_datore)} della RAL`}
            valore={costoAzienda.contributiDatore}
            aggiunta
          />
          <RigaVoce
            nome="Premio INAIL"
            dettaglio={`${formattaPercentualeSemplice(parametri.costo_azienda.inail)}, lavoro d'ufficio`}
            valore={costoAzienda.inail}
            aggiunta
          />
          <RigaVoce
            nome="Accantonamento TFR"
            dettaglio={formattaPercentualeSemplice(parametri.costo_azienda.tfr)}
            valore={costoAzienda.tfr}
            aggiunta
          />
          <RigaVoce nome="Costo azienda totale" valore={costoAzienda.totale} totale neutro />
        </dl>

        <p className="mt-3 border-t border-bordo pt-3 text-xs leading-relaxed text-grigio">
          Nota sull&apos;addizionale comunale: Milano applica una{" "}
          <strong>soglia di esenzione secca</strong> a 23.000 € di imponibile, non una franchigia.
          Superata la soglia anche di un solo euro, lo 0,8% si paga sull&apos;intero imponibile.
          Il costo azienda usa valori tipici per un impiegato in azienda con più di 15 dipendenti:
          il tuo CCNL può spostarlo di qualche punto. In tutto:{" "}
          {formattaEuro(risultato.totaleTrattenute)} di trattenute sulla tua RAL.
          {nonTassato > 0 &&
            ` In più ricevi ${formattaEuro(nonTassato)} non tassati (somma esente del cuneo e trattamento integrativo).`}
        </p>
      </details>
    </section>
  );
}

function formattaPercentualeSemplice(frazione: number): string {
  return `${(frazione * 100).toLocaleString("it-IT", { maximumFractionDigits: 2, useGrouping: "always" })}%`;
}

export function Freccina() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="size-4 shrink-0 text-grigio transition-transform group-open:rotate-180"
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
  );
}

function RigaVoce({
  nome,
  dettaglio,
  valore,
  evidenza = false,
  subtotale = false,
  totale = false,
  attenuata = false,
  positiva = false,
  aggiunta = false,
  neutro = false,
}: {
  nome: string;
  dettaglio?: string;
  valore: number;
  evidenza?: boolean;
  subtotale?: boolean;
  totale?: boolean;
  attenuata?: boolean;
  positiva?: boolean;
  aggiunta?: boolean;
  neutro?: boolean;
}) {
  const negativa = valore < 0;
  return (
    <div
      className={`flex items-baseline justify-between gap-4 py-1.5 ${
        subtotale || totale ? "border-t border-bordo font-semibold" : ""
      } ${totale ? "text-base" : ""}`}
    >
      <dt className={attenuata ? "text-grigio" : ""}>
        {nome}
        {dettaglio && <span className="ml-1.5 text-xs font-normal text-grigio">{dettaglio}</span>}
      </dt>
      <dd
        className={`shrink-0 tabular-nums ${evidenza || subtotale ? "font-semibold" : ""} ${
          (totale && !neutro) || positiva ? "font-bold text-verde-testo" : ""
        } ${totale && neutro ? "font-bold" : ""} ${attenuata ? "text-grigio" : ""}`}
      >
        {negativa ? "- " : positiva || aggiunta ? "+ " : ""}
        {formattaEuroCentesimi(Math.abs(valore))}
      </dd>
    </div>
  );
}
