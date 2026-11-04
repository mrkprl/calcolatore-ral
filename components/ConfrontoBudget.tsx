"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { ProfiloFamiliare } from "@/lib/calcolo";
import type { Allocazione, ConfrontoPacchetto, Leva, LeveAttive } from "@/lib/pacchetto";
import parametri from "@/lib/parametri-2026.json";
import { formattaEuro, formattaEuroCentesimi, interpretaImporto } from "@/lib/formato";
import ContatoreEuro from "@/components/ContatoreEuro";
import Interruttore from "@/components/Interruttore";

export const BUDGET_MIN = 500;
export const BUDGET_MAX = 10000;
const BUDGET_STEP = 100;

const NOMI_LEVA: Record<Leva, string> = {
  fringe: "Fringe benefit",
  buoniPasto: "Buoni pasto elettronici",
  welfare: "Piano welfare",
  premioRisultato: "Premio di risultato",
  ral: "Resto in RAL",
};

const COLORI_LEVA: Record<Leva, string> = {
  fringe: "bg-lime-500",
  buoniPasto: "bg-salvia",
  welfare: "bg-lime-800",
  premioRisultato: "bg-grigio-scuro",
  ral: "bg-bordo-forte",
};

const TETTO_BUONI =
  parametri.buoni_pasto.elettronico_giornaliero * parametri.buoni_pasto.giorni_lavorati;

/**
 * Il cuore del prototipo: un budget aggiuntivo, espresso come costo per
 * l'azienda, dato tutto come aumento di RAL oppure come pacchetto con le
 * leve esenti. Mostra il netto in più, il risparmio per l'azienda a parità
 * di netto e l'effetto dei figli a carico sulla soglia dei fringe benefit.
 */
export default function ConfrontoBudget({
  confronto,
  budget,
  onBudget,
  leve,
  onLeve,
  profilo,
  onProvaConFiglio,
}: {
  confronto: ConfrontoPacchetto;
  budget: number;
  onBudget: (budget: number) => void;
  leve: LeveAttive;
  onLeve: (leve: LeveAttive) => void;
  profilo: ProfiloFamiliare;
  onProvaConFiglio: () => void;
}) {
  const [testoBudget, setTestoBudget] = useState(() => formattaNumero(budget));
  const [budgetFuoriRange, setBudgetFuoriRange] = useState(false);

  function cambiaTestoBudget(testo: string) {
    setTestoBudget(testo);
    const valore = interpretaImporto(testo);
    const valido = valore !== null && valore >= BUDGET_MIN && valore <= BUDGET_MAX;
    setBudgetFuoriRange(!valido);
    if (valido) onBudget(valore);
  }

  function normalizzaTestoBudget() {
    const valore = interpretaImporto(testoBudget);
    const corretto =
      valore === null ? budget : Math.min(BUDGET_MAX, Math.max(BUDGET_MIN, Math.round(valore)));
    onBudget(corretto);
    setTestoBudget(formattaNumero(corretto));
    setBudgetFuoriRange(false);
  }

  function cambiaCursore(valore: number) {
    onBudget(valore);
    setTestoBudget(formattaNumero(valore));
    setBudgetFuoriRange(false);
  }

  const { aumentoRal, ottimizzato } = confronto;
  const haGuadagno = confronto.guadagnoNetto > 1;
  const nessunaLeva = !Object.values(leve).some(Boolean);
  const attraversaSoglia =
    aumentoRal.efficienza < 0 ||
    aumentoRal.efficienza > 1 ||
    ottimizzato.allocazioni.some((a) => a.leva === "ral" && a.netto < 0);
  const riempimento = ((budget - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100;

  return (
    <section id="confronto" aria-labelledby="titolo-confronto" className="scroll-mt-6">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-grigio">
          Il punto della questione
        </p>
        <h2
          id="titolo-confronto"
          className="mt-1 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl"
        >
          Hai un budget in più? Confronta come darlo.
        </h2>
        <p className="mt-2 text-pretty text-grigio-scuro">
          Un aumento in RAL passa da contributi e IRPEF:{" "}
          {attraversaSoglia
            ? "con la tua RAL attraversa anche una soglia fiscale, quindi il conto non è lineare (vedi la nota sotto il confronto)."
            : `con la tua RAL, di 100 € spesi dall'azienda te ne arrivano ${Math.round(
                aumentoRal.efficienza * 100
              )}.`}{" "}
          Fringe
          benefit, buoni pasto e welfare sono esenti da tasse e contributi; il premio di
          risultato paga i contributi ma solo l&apos;1% di imposta. Stesso costo per
          l&apos;azienda, conti diversi in tasca.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start">
        {/* Controlli: budget e leve */}
        <div className="space-y-5 rounded-3xl border border-bordo bg-white p-5 lg:sticky lg:top-4">
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="budget" className="text-sm font-semibold">
                Budget annuo in più
              </label>
              <div className="flex items-center gap-1 rounded-full border border-bordo-forte bg-fondo px-3 py-1 focus-within:border-inchiostro">
                <span aria-hidden className="text-sm font-semibold text-grigio">
                  €
                </span>
                <input
                  id="budget-testo"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-label="Budget annuo in più, in euro di costo azienda"
                  value={testoBudget}
                  onChange={(e) => cambiaTestoBudget(e.target.value)}
                  onBlur={normalizzaTestoBudget}
                  aria-invalid={budgetFuoriRange}
                  aria-describedby={budgetFuoriRange ? "errore-budget" : undefined}
                  className="w-16 bg-transparent text-right font-display font-bold outline-none"
                />
              </div>
            </div>
            <p className="mt-0.5 text-xs text-grigio">
              Quanto spende l&apos;azienda in tutto, contributi compresi.
            </p>
            {budgetFuoriRange && (
              <p id="errore-budget" role="alert" className="mt-1 text-xs font-medium text-rosso">
                Inserisci un importo tra {formattaEuro(BUDGET_MIN)} e {formattaEuro(BUDGET_MAX)}.
              </p>
            )}
            <input
              id="budget"
              type="range"
              min={BUDGET_MIN}
              max={BUDGET_MAX}
              step={BUDGET_STEP}
              value={budget}
              onChange={(e) => cambiaCursore(Number(e.target.value))}
              aria-valuetext={formattaEuro(budget)}
              className="cursore mt-4 w-full"
              style={{ "--riempimento": `${riempimento}%` } as React.CSSProperties}
            />
            <div className="mt-1 flex justify-between text-xs text-grigio tabular-nums">
              <span>{formattaEuro(BUDGET_MIN)}</span>
              <span>{formattaEuro(BUDGET_MAX)}</span>
            </div>
          </div>

          <fieldset className="space-y-4 border-t border-bordo pt-5">
            <legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-grigio">
              Leve nel pacchetto
            </legend>
            <Interruttore
              id="leva-fringe"
              etichetta="Fringe benefit"
              extra={<ChipTetto>tetto {formattaEuro(confronto.sogliaFringe)}</ChipTetto>}
              descrizione={`Beni e servizi, utenze domestiche (acqua, luce, gas), affitto o interessi del mutuo dell'abitazione principale. Esenti fino a ${formattaEuro(
                parametri.fringe_benefit.soglia
              )}, ${formattaEuro(parametri.fringe_benefit.soglia_con_figli)} con figli a carico.`}
              attivo={leve.fringe}
              onChange={(fringe) => onLeve({ ...leve, fringe })}
            />
            <Interruttore
              id="leva-buoni"
              etichetta="Buoni pasto elettronici"
              extra={<ChipTetto>tetto {formattaEuro(TETTO_BUONI)}</ChipTetto>}
              descrizione={`Esenti fino a ${parametri.buoni_pasto.elettronico_giornaliero} € al giorno per ${parametri.buoni_pasto.giorni_lavorati} giorni lavorati.`}
              attivo={leve.buoniPasto}
              onChange={(buoniPasto) => onLeve({ ...leve, buoniPasto })}
            />
            <Interruttore
              id="leva-welfare"
              etichetta="Piano welfare"
              extra={<ChipTetto>senza tetto</ChipTetto>}
              descrizione="Scuola e libri dei figli, assistenza ai familiari anziani o non autosufficienti, abbonamento ai mezzi. Esente senza limiti, ma serve un regolamento aziendale."
              attivo={leve.welfare}
              onChange={(welfare) => onLeve({ ...leve, welfare })}
            />
            <Interruttore
              id="leva-premio"
              etichetta="Premio di risultato"
              extra={
                <ChipTetto>tetto {formattaEuro(parametri.premio_risultato.limite_lordo)}</ChipTetto>
              }
              descrizione={
                confronto.premioRisultatoAmmesso
                  ? `Paga i contributi come lo stipendio, ma solo l'1% di imposta invece degli scaglioni IRPEF, fino a ${formattaEuro(
                      parametri.premio_risultato.limite_lordo
                    )} lordi. Serve un accordo aziendale.${
                      leve.welfare && leve.premioRisultato
                        ? " Con il welfare attivo il budget va prima lì, che è esente anche dai contributi."
                        : ""
                    }${
                      leve.premioRisultato && !confronto.premioRisultatoConveniente
                        ? " Con la tua RAL un aumento in busta rende più del premio, quindi il calcolo lo lascia fuori."
                        : ""
                    }`
                  : `Non disponibile: con un reddito di lavoro dipendente oltre ${formattaEuro(
                      parametri.premio_risultato.soglia_reddito
                    )} (anno precedente) il premio agevolato non spetta.`
              }
              attivo={leve.premioRisultato}
              disabilitato={!confronto.premioRisultatoAmmesso}
              onChange={(premioRisultato) => onLeve({ ...leve, premioRisultato })}
            />
          </fieldset>
        </div>

        {/* Risultato del confronto */}
        <div className="space-y-4">
          <div className="rounded-3xl bg-lime-500 p-5 text-inchiostro sm:p-7">
            {haGuadagno ? (
              <>
                <p className="text-sm font-semibold">
                  Pacchetto contro aumento in RAL, stesso budget di {formattaEuro(confronto.budget)}
                </p>
                <p className="mt-1 font-display text-4xl font-bold leading-none tracking-tight sm:text-6xl">
                  <ContatoreEuro valore={confronto.guadagnoNetto} conSegno />
                  <span className="mt-2 block text-xl font-semibold tracking-normal sm:mt-1 sm:text-2xl">
                    netti all&apos;anno in più, a parità di costo
                  </span>
                </p>
                <p className="mt-3 text-sm text-pretty">
                  Esatto: +{formattaEuroCentesimi(confronto.guadagnoNetto)}.
                  {confronto.risparmioAzienda > 1 && (
                    <>
                      {" "}
                      Per dare lo stesso netto con un aumento in RAL servirebbero{" "}
                      <strong className="tabular-nums">
                        {formattaEuro(confronto.costoEquivalenteRal)}
                      </strong>
                      : l&apos;azienda risparmia{" "}
                      <strong className="tabular-nums">
                        {formattaEuro(confronto.risparmioAzienda)}
                      </strong>
                      .
                    </>
                  )}
                </p>
              </>
            ) : nessunaLeva ? (
              <>
                <p className="font-display text-2xl font-bold tracking-tight">
                  Nessuna leva attiva: il pacchetto è un aumento in RAL.
                </p>
                <p className="mt-2 text-sm">
                  Accendine almeno una per vedere quanto netto in più arriva con lo stesso budget.
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-2xl font-bold tracking-tight">
                  Con queste leve non c&apos;è vantaggio sull&apos;aumento in RAL.
                </p>
                <p className="mt-2 text-sm">
                  Per il tuo caso le leve accese non rendono più della busta paga: prova ad
                  accenderne altre.
                </p>
              </>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SchedaScenario
              titolo="Aumento in RAL"
              netto={aumentoRal.nettoAggiuntivo}
              efficienza={aumentoRal.efficienza}
              sotto={`${formattaEuro(aumentoRal.ralAggiuntiva)} di RAL lorda in più`}
            />
            <SchedaScenario
              titolo="Pacchetto ottimizzato"
              netto={ottimizzato.nettoAggiuntivo}
              efficienza={ottimizzato.efficienza}
              evidenziata
            >
              <Composizione allocazioni={ottimizzato.allocazioni} totale={ottimizzato.costoAzienda} />
              {ottimizzato.allocazioni.some((a) => a.leva !== "ral" && a.leva !== "premioRisultato" && a.costoAzienda > 0.5) && (
                <p className="mt-3 text-xs leading-snug text-white/70">
                  Fringe, buoni pasto e welfare arrivano come beni e servizi, non come contante in
                  busta.
                </p>
              )}
            </SchedaScenario>
          </div>

          {attraversaSoglia && (
            <p className="rounded-2xl border border-bordo bg-white px-4 py-3 text-xs leading-relaxed text-grigio-scuro">
              Qui l&apos;aumento attraversa una soglia fiscale (somma esente del cuneo, trattamento
              integrativo o esenzione dell&apos;addizionale comunale di Milano): per questo il
              netto cambia più o meno del lordo, e può anche scendere.
            </p>
          )}

          <CalloutFigli
            confronto={confronto}
            profilo={profilo}
            fringeAttivo={leve.fringe}
            welfareAttivo={leve.welfare}
            onProvaConFiglio={onProvaConFiglio}
          />

          {leve.fringe && (
            <p className="flex gap-3 rounded-2xl bg-ambra-chiaro px-4 py-3 text-xs leading-relaxed text-ambra">
              <span aria-hidden className="font-display text-base font-bold leading-none">
                !
              </span>
              <span>
                <strong>Occhio allo scalino dei fringe benefit.</strong> Se superi la soglia di{" "}
                {formattaEuro(confronto.sogliaFringe)} anche di 1 €, tutto il fringe diventa
                imponibile, non solo l&apos;eccedenza. Qui il calcolo si ferma sempre alla soglia.
              </span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function formattaNumero(valore: number): string {
  return valore.toLocaleString("it-IT", { maximumFractionDigits: 0, useGrouping: "always" });
}

function ChipTetto({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-2 inline-block rounded-full bg-fondo-2 px-2 py-0.5 align-middle text-[11px] font-semibold text-grigio-scuro tabular-nums">
      {children}
    </span>
  );
}

function SchedaScenario({
  titolo,
  netto,
  efficienza,
  sotto,
  evidenziata = false,
  children,
}: {
  titolo: string;
  netto: number;
  efficienza: number;
  sotto?: string;
  evidenziata?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-3xl p-5 ${
        evidenziata ? "bg-inchiostro text-white" : "border border-bordo bg-white"
      }`}
    >
      <p className={`text-sm font-semibold ${evidenziata ? "text-lime-500" : "text-grigio-scuro"}`}>
        {titolo}
      </p>
      <ContatoreEuro
        valore={netto}
        conSegno
        className="mt-2 block font-display text-4xl font-bold tracking-tight"
      />
      <p className={`text-xs ${evidenziata ? "text-white/70" : "text-grigio"}`}>
        {netto < 0 ? "netti in meno all'anno" : "netti in più all'anno"}, esatto{" "}
        {formattaEuroCentesimi(netto)}
      </p>
      <div className="mt-4">
        <div className={`h-2 overflow-hidden rounded-full ${evidenziata ? "bg-white/15" : "bg-fondo-3"}`}>
          <motion.div
            className={`h-full rounded-full ${evidenziata ? "bg-lime-500" : "bg-grigio"}`}
            initial={false}
            animate={{ width: `${Math.min(1, Math.max(0, efficienza)) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <p className={`mt-1.5 text-sm ${evidenziata ? "text-white" : "text-grigio-scuro"}`}>
          Su 100 € spesi ne arrivano{" "}
          <strong className="font-display">{Math.round(efficienza * 100)} €</strong>
        </p>
      </div>
      {sotto && <p className="mt-3 text-xs text-grigio">{sotto}</p>}
      {children}
    </div>
  );
}

function Composizione({ allocazioni, totale }: { allocazioni: Allocazione[]; totale: number }) {
  const voci = allocazioni.filter((a) => a.costoAzienda > 0.5);
  if (voci.length === 0 || totale <= 0) return null;
  return (
    <div className="mt-4 border-t border-white/15 pt-4">
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full" aria-hidden>
        {voci.map((a) => (
          <motion.div
            key={a.leva}
            className={`${COLORI_LEVA[a.leva]} h-full`}
            initial={false}
            animate={{ width: `${(a.costoAzienda / totale) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        ))}
      </div>
      <ul className="mt-3 space-y-1.5 text-xs">
        <AnimatePresence initial={false}>
          {voci.map((a) => (
            <motion.li
              key={a.leva}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <span className={`size-2.5 shrink-0 rounded-full ${COLORI_LEVA[a.leva]}`} aria-hidden />
              <span className="text-white/85">{NOMI_LEVA[a.leva]}</span>
              <span className="ml-auto text-right tabular-nums text-white/70">
                costa {formattaEuro(a.costoAzienda)}, netto{" "}
                <strong className="text-white">{formattaEuro(a.netto)}</strong>
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

function CalloutFigli({
  confronto,
  profilo,
  fringeAttivo,
  welfareAttivo,
  onProvaConFiglio,
}: {
  confronto: ConfrontoPacchetto;
  profilo: ProfiloFamiliare;
  fringeAttivo: boolean;
  welfareAttivo: boolean;
  onProvaConFiglio: () => void;
}) {
  const nettoOra = confronto.ottimizzato.nettoAggiuntivo;
  const { conFigli, senzaFigli } = confronto.nettoProfiloAlternativo;
  const senza = profilo.figliACarico === 0;
  const delta = senza ? conFigli - nettoOra : nettoOra - senzaFigli;
  const sogliaFigli = formattaEuro(parametri.fringe_benefit.soglia_con_figli);
  const sogliaBase = formattaEuro(parametri.fringe_benefit.soglia);
  const sopraSoglia = confronto.budget > parametri.fringe_benefit.soglia;

  let testo: React.ReactNode;
  if (!fringeAttivo) {
    testo = (
      <>
        Accendi il fringe benefit: è la leva che premia chi ha figli a carico, con una soglia
        esente che sale da {sogliaBase} a {sogliaFigli}.
      </>
    );
  } else if (senza && delta > 1) {
    testo = (
      <>
        <strong>Con un figlio a carico la soglia fringe raddoppia.</strong> Lo stesso budget
        renderebbe <strong className="tabular-nums">{formattaEuro(conFigli)}</strong> netti (
        <span className="tabular-nums">+{formattaEuro(delta)}</span>).
      </>
    );
  } else if (senza) {
    testo = (
      <>
        <strong>Con un figlio a carico la soglia fringe raddoppia</strong> da {sogliaBase} a{" "}
        {sogliaFigli}.{" "}
        {sopraSoglia || welfareAttivo
          ? "Qui le altre leve accese coprono già il budget, quindi il netto non cambierebbe."
          : `Con un budget sopra ${sogliaBase} la differenza si vede subito.`}
      </>
    );
  } else if (delta > 1) {
    testo = (
      <>
        <strong>Grazie ai figli a carico la tua soglia fringe è {sogliaFigli}.</strong> Senza,
        prenderesti <span className="tabular-nums">{formattaEuro(delta)}</span> in meno.
      </>
    );
  } else {
    testo = (
      <>
        <strong>Grazie ai figli a carico la tua soglia fringe è {sogliaFigli}.</strong>{" "}
        {sopraSoglia || welfareAttivo
          ? "Qui le altre leve accese coprono già il budget: senza figli il netto non cambierebbe."
          : `Con un budget sopra ${sogliaBase} la usi davvero.`}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-salvia bg-salvia-chiaro p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-relaxed text-inchiostro text-pretty">{testo}</p>
      {senza && fringeAttivo && (
        <button
          type="button"
          onClick={onProvaConFiglio}
          className="shrink-0 rounded-full bg-inchiostro px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-oliva"
        >
          Prova con un figlio
        </button>
      )}
    </div>
  );
}
