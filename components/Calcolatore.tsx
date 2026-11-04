"use client";

import { MotionConfig } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { calcolaNetto, PROFILO_STANDARD, type ProfiloFamiliare as Profilo } from "@/lib/calcolo";
import { confrontaPacchetto, type LeveAttive } from "@/lib/pacchetto";
import parametri from "@/lib/parametri-2026.json";
import { formattaEuro, interpretaImporto } from "@/lib/formato";
import BustaOggi from "@/components/BustaOggi";
import ConfrontoBudget from "@/components/ConfrontoBudget";
import ContatoreEuro from "@/components/ContatoreEuro";
import ProfiloFamiliare from "@/components/ProfiloFamiliare";

const RAL_INIZIALE = 35000;
const BUDGET_INIZIALE = 2000;
const LEVE_INIZIALI: LeveAttive = {
  fringe: true,
  buoniPasto: false,
  welfare: false,
  premioRisultato: false,
};

/**
 * Componente interattivo principale. Tiene RAL, profilo familiare, budget e
 * leve; ricalcola tutto a ogni modifica (funzioni pure, nessuna chiamata di
 * rete) e passa i risultati alle sezioni.
 */
export default function Calcolatore() {
  const [testoRal, setTestoRal] = useState(formattaIntero(RAL_INIZIALE));
  const [ral, setRal] = useState(RAL_INIZIALE);
  const [errore, setErrore] = useState<string | null>(null);
  const [profilo, setProfilo] = useState<Profilo>(PROFILO_STANDARD);
  const [budget, setBudget] = useState(BUDGET_INIZIALE);
  const [leve, setLeve] = useState<LeveAttive>(LEVE_INIZIALI);

  const risultato = useMemo(() => calcolaNetto(ral, parametri, profilo), [ral, profilo]);
  const confronto = useMemo(
    () => confrontaPacchetto(ral, profilo, { budget, leve }, parametri),
    [ral, profilo, budget, leve]
  );

  const riepilogo = `Netto annuo ${formattaEuro(risultato.nettoAnnuo)}, costo azienda ${formattaEuro(
    risultato.costoAzienda.totale
  )}. Con un budget di ${formattaEuro(budget)}: aumento in RAL ${formattaEuro(
    confronto.aumentoRal.nettoAggiuntivo
  )} netti, pacchetto ottimizzato ${formattaEuro(confronto.ottimizzato.nettoAggiuntivo)} netti.`;

  // Annuncio per screen reader solo quando l'utente si ferma, non a ogni tasto o passo del cursore
  const [annuncio, setAnnuncio] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setAnnuncio(riepilogo), 600);
    return () => clearTimeout(timer);
  }, [riepilogo]);

  function cambiaRal(testo: string) {
    setTestoRal(testo);
    const valore = interpretaImporto(testo);
    if (valore === null || valore <= 0) {
      setErrore("Inserisci una RAL valida: un importo in euro maggiore di zero, ad esempio 30.000.");
      return;
    }
    setErrore(null);
    setRal(valore);
  }

  function riformattaRal() {
    if (errore === null) setTestoRal(formattaIntero(ral));
  }

  return (
    <MotionConfig reducedMotion="user">
      <header className="grid gap-4 pt-7 pb-6 sm:pt-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end lg:gap-10 lg:pb-8">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-bordo bg-white px-3 py-1 text-xs font-semibold text-grigio-scuro">
            <span aria-hidden className="size-2 rounded-full bg-lime-600" />
            Simulatore busta paga {parametri.anno_imposta}, Milano
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[1.02] tracking-tight text-balance sm:text-5xl lg:text-[3.6rem]">
            Stesso costo per l&apos;azienda.{" "}
            <span className="relative whitespace-nowrap">
              <span
                className="absolute inset-x-[-0.1em] bottom-[0.06em] -z-10 h-[0.42em] rounded-sm bg-lime-500"
                aria-hidden
              />
              Più netto in busta.
            </span>
          </h1>
        </div>
        <p className="max-w-xl text-pretty text-grigio-scuro sm:text-lg lg:pb-1">
          Tra contributi e tasse, gran parte di ogni aumento non arriva in busta. Metti RAL e famiglia: vedi la tua
          busta di oggi e quanto netto in più arriva se lo stesso budget passa da fringe benefit,
          buoni pasto, welfare o premio di risultato.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:items-start">
        {/* Input: RAL e profilo familiare */}
        <div className="space-y-5 rounded-3xl border border-bordo bg-white p-5">
          <div>
            <label htmlFor="ral" className="text-sm font-semibold">
              La tua RAL
            </label>
            <p id="ral-aiuto" className="mt-0.5 text-xs text-grigio">
              Retribuzione Annua Lorda, quella scritta nel contratto.
            </p>
            <div
              className={`mt-2 flex items-center gap-2 rounded-2xl border bg-fondo px-4 focus-within:border-inchiostro ${
                errore ? "border-rosso" : "border-bordo-forte"
              }`}
            >
              <span aria-hidden className="font-display text-xl font-bold text-grigio">
                €
              </span>
              <input
                id="ral"
                name="ral"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={testoRal}
                onChange={(e) => cambiaRal(e.target.value)}
                onBlur={riformattaRal}
                className="w-full bg-transparent py-3 font-display text-2xl font-bold outline-none"
                aria-describedby={errore ? "ral-aiuto errore-ral" : "ral-aiuto"}
                aria-invalid={errore !== null}
              />
            </div>
            {errore && (
              <p id="errore-ral" role="alert" className="mt-2 text-sm font-medium text-rosso">
                {errore}
              </p>
            )}
          </div>

          <div className="border-t border-bordo pt-5">
            <ProfiloFamiliare profilo={profilo} onChange={setProfilo} />
          </div>
        </div>

        {/* La tua busta oggi, con anteprima del confronto */}
        <div className="space-y-3 lg:row-span-2">
          <div className="flex items-baseline justify-between gap-3 px-1">
            <h2 id="titolo-busta" className="font-display text-xl font-bold tracking-tight">
              La tua busta oggi
            </h2>
            {errore && <span className="text-xs text-grigio">ultima RAL valida: {formattaEuro(ral)}</span>}
          </div>
          <BustaOggi risultato={risultato} />
        </div>
        {confronto.guadagnoNetto > 1 && (
            <a
              href="#confronto"
              className="flex items-center justify-between gap-4 rounded-3xl bg-lime-500 px-5 py-4 text-inchiostro lg:col-start-1 lg:flex-col lg:items-start lg:p-6 transition-colors hover:bg-lime-600"
            >
              <span className="text-sm">
                Con {formattaEuro(budget)} di budget in più, a parità di costo:{" "}
                <ContatoreEuro
                  valore={confronto.guadagnoNetto}
                  conSegno
                  className="font-display text-lg font-bold lg:my-1 lg:block lg:text-4xl"
                />{" "}
                netti rispetto a un aumento in RAL.
              </span>
              <span className="shrink-0 text-sm font-semibold underline underline-offset-4">
                Vedi come
              </span>
            </a>
          )}
      </div>

      <p aria-live="polite" className="sr-only">
        {annuncio}
      </p>

      <div className="mt-16">
        <ConfrontoBudget
          confronto={confronto}
          budget={budget}
          onBudget={setBudget}
          leve={leve}
          onLeve={setLeve}
          profilo={profilo}
          onProvaConFiglio={() => setProfilo({ ...profilo, figliACarico: 1 })}
        />
      </div>
    </MotionConfig>
  );
}

function formattaIntero(valore: number): string {
  return valore.toLocaleString("it-IT", { maximumFractionDigits: 2, useGrouping: "always" });
}
