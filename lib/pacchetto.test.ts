/**
 * Test del confronto a parità di costo azienda: scenario A (tutto in RAL)
 * contro scenario B (leve esenti in ordine, resto in RAL).
 * Valori di riferimento calcolati a mano dalle formule; tolleranza 1 euro
 * sui casi di riferimento, più stretta sulle identità.
 */
import { describe, expect, it } from "vitest";
import parametriJson from "./parametri-2026.json";
import { calcolaNetto, PROFILO_STANDARD, type Parametri, type ProfiloFamiliare } from "./calcolo";
import { confrontaPacchetto, type LeveAttive, type Leva } from "./pacchetto";

const parametri: Parametri = parametriJson;

/** Fattore di costo di 1 euro di RAL: 1 + 30% + 0,4% + 6,91%. */
const K = 1.3731;

const NESSUNA_LEVA: LeveAttive = {
  fringe: false,
  buoniPasto: false,
  welfare: false,
  premioRisultato: false,
};

const UN_FIGLIO: ProfiloFamiliare = { ...PROFILO_STANDARD, figliACarico: 1 };

function attesoEntro1Euro(valore: number, atteso: number) {
  expect(Math.abs(valore - atteso), `atteso circa ${atteso}, ottenuto ${valore}`).toBeLessThanOrEqual(1);
}

function nettoAumento(ral: number, aumento: number, profilo: ProfiloFamiliare = PROFILO_STANDARD) {
  return calcolaNetto(ral + aumento, parametri, profilo).nettoAnnuo - calcolaNetto(ral, parametri, profilo).nettoAnnuo;
}

function leve(c: ReturnType<typeof confrontaPacchetto>): Leva[] {
  return c.ottimizzato.allocazioni.map((a) => a.leva);
}

describe("Scenario A: tutto il budget in aumento di RAL", () => {
  it("RAL 35.000, budget 2.000: RAL aggiuntiva 2.000 / 1,3731, netto circa 599,62", () => {
    const c = confrontaPacchetto(35000, PROFILO_STANDARD, { budget: 2000, leve: NESSUNA_LEVA }, parametri);
    expect(c.aumentoRal.ralAggiuntiva).toBeCloseTo(2000 / K, 6);
    expect(c.aumentoRal.allocazioni).toHaveLength(1);
    expect(c.aumentoRal.allocazioni[0].leva).toBe("ral");
    expect(c.aumentoRal.costoAzienda).toBeCloseTo(2000, 6);
    // imponibile da 31.783,50 a 33.106,17: 33% IRPEF, detrazione lavoro e cuneo in calo,
    // addizionali 1,72% e 0,8%
    attesoEntro1Euro(c.aumentoRal.nettoAggiuntivo, 599.62);
    expect(c.aumentoRal.nettoAggiuntivo).toBeCloseTo(nettoAumento(35000, 2000 / K), 6);
    expect(c.aumentoRal.efficienza).toBeCloseTo(c.aumentoRal.nettoAggiuntivo / 2000, 10);
  });
});

describe("Scenario B: fringe benefit", () => {
  it("RAL 35.000, budget 2.000, senza figli: 1.000 di fringe e resto in RAL", () => {
    const c = confrontaPacchetto(35000, PROFILO_STANDARD, { budget: 2000, leve: { ...NESSUNA_LEVA, fringe: true } }, parametri);
    expect(c.sogliaFringe).toBe(1000);
    expect(leve(c)).toEqual(["fringe", "ral"]);
    const [fringe, ral] = c.ottimizzato.allocazioni;
    expect(fringe).toEqual({ leva: "fringe", costoAzienda: 1000, lordo: 1000, netto: 1000 });
    expect(ral.costoAzienda).toBeCloseTo(1000, 6);
    expect(ral.lordo).toBeCloseTo(1000 / K, 6);
    expect(ral.netto).toBeCloseTo(nettoAumento(35000, 1000 / K), 6);
    // marginale sui 661,34 euro di imponibile in più: circa 313,34 (rapporti della detrazione lavoro troncati a 4 decimali)
    attesoEntro1Euro(c.ottimizzato.nettoAggiuntivo, 1313.34);
    expect(c.ottimizzato.costoAzienda).toBeCloseTo(2000, 6);
    expect(c.guadagnoNetto).toBeCloseTo(c.ottimizzato.nettoAggiuntivo - c.aumentoRal.nettoAggiuntivo, 10);
  });

  it("RAL 35.000, budget 2.000, con un figlio: 2.000 di fringe, netto 2.000, efficienza 1", () => {
    const c = confrontaPacchetto(35000, UN_FIGLIO, { budget: 2000, leve: { ...NESSUNA_LEVA, fringe: true } }, parametri);
    expect(c.sogliaFringe).toBe(2000);
    expect(leve(c)).toEqual(["fringe"]);
    expect(c.ottimizzato.nettoAggiuntivo).toBeCloseTo(2000, 10);
    expect(c.ottimizzato.efficienza).toBeCloseTo(1, 10);
    attesoEntro1Euro(c.guadagnoNetto, 2000 - 599.62);
  });

  it("budget sotto la soglia: fringe pari al budget, nessuna quota in RAL", () => {
    const c = confrontaPacchetto(35000, PROFILO_STANDARD, { budget: 600, leve: { ...NESSUNA_LEVA, fringe: true } }, parametri);
    expect(leve(c)).toEqual(["fringe"]);
    expect(c.ottimizzato.allocazioni[0].netto).toBe(600);
  });

  it("nettoProfiloAlternativo: uno dei due valori coincide con lo scenario corrente", () => {
    const opzioni = { budget: 2000, leve: { ...NESSUNA_LEVA, fringe: true } };
    const senza = confrontaPacchetto(35000, PROFILO_STANDARD, opzioni, parametri);
    const con = confrontaPacchetto(35000, UN_FIGLIO, opzioni, parametri);
    expect(senza.nettoProfiloAlternativo.senzaFigli).toBeCloseTo(senza.ottimizzato.nettoAggiuntivo, 10);
    expect(senza.nettoProfiloAlternativo.conFigli).toBeCloseTo(2000, 10);
    expect(con.nettoProfiloAlternativo.conFigli).toBeCloseTo(con.ottimizzato.nettoAggiuntivo, 10);
    expect(con.nettoProfiloAlternativo.senzaFigli).toBeCloseTo(senza.ottimizzato.nettoAggiuntivo, 10);
  });
});

describe("Scenario B: buoni pasto e welfare", () => {
  it("budget 10.000 con fringe, buoni e welfare: 1.000 + 2.200 + 6.800, tutto netto", () => {
    const c = confrontaPacchetto(
      35000,
      PROFILO_STANDARD,
      { budget: 10000, leve: { fringe: true, buoniPasto: true, welfare: true, premioRisultato: true } },
      parametri
    );
    expect(c.ottimizzato.allocazioni).toEqual([
      { leva: "fringe", costoAzienda: 1000, lordo: 1000, netto: 1000 },
      { leva: "buoniPasto", costoAzienda: 2200, lordo: 2200, netto: 2200 },
      { leva: "welfare", costoAzienda: 6800, lordo: 6800, netto: 6800 },
    ]);
    expect(c.ottimizzato.nettoAggiuntivo).toBeCloseTo(10000, 10);
    expect(c.ottimizzato.efficienza).toBeCloseTo(1, 10);
  });

  it("solo buoni pasto: tetto 10 x 220 = 2.200, resto in RAL", () => {
    const c = confrontaPacchetto(35000, PROFILO_STANDARD, { budget: 3000, leve: { ...NESSUNA_LEVA, buoniPasto: true } }, parametri);
    expect(leve(c)).toEqual(["buoniPasto", "ral"]);
    expect(c.ottimizzato.allocazioni[0].netto).toBe(2200);
    expect(c.ottimizzato.allocazioni[1].costoAzienda).toBeCloseTo(800, 6);
  });
});

describe("Scenario B: premio di risultato", () => {
  it("budget 3.000: lordo 3.000 / 1,304 = 2.300,61, netto x 0,9081 x 0,99 = 2.068,32", () => {
    const c = confrontaPacchetto(35000, PROFILO_STANDARD, { budget: 3000, leve: { ...NESSUNA_LEVA, premioRisultato: true } }, parametri);
    expect(c.premioRisultatoAmmesso).toBe(true);
    expect(leve(c)).toEqual(["premioRisultato"]);
    const premio = c.ottimizzato.allocazioni[0];
    expect(premio.lordo).toBeCloseTo(3000 / 1.304, 6);
    expect(premio.costoAzienda).toBeCloseTo(3000, 6);
    expect(premio.netto).toBeCloseTo((3000 / 1.304) * (1 - 0.0919) * (1 - 0.01), 6);
    attesoEntro1Euro(premio.netto, 2068.32);
    expect(c.premioRisultatoConveniente).toBe(true);
  });

  it("budget 10.000: premio al limite di 5.000 lordi (costo 6.520), resto 3.480 in RAL", () => {
    const c = confrontaPacchetto(35000, PROFILO_STANDARD, { budget: 10000, leve: { ...NESSUNA_LEVA, premioRisultato: true } }, parametri);
    expect(leve(c)).toEqual(["premioRisultato", "ral"]);
    const [premio, ral] = c.ottimizzato.allocazioni;
    expect(premio.lordo).toBeCloseTo(5000, 6);
    expect(premio.costoAzienda).toBeCloseTo(6520, 6);
    attesoEntro1Euro(premio.netto, 4495.1);
    expect(ral.costoAzienda).toBeCloseTo(3480, 6);
    expect(ral.netto).toBeCloseTo(nettoAumento(35000, 3480 / K), 6);
  });

  it("RAL 85.000: imponibile 77.188,50 sotto 80.000, premio ammesso", () => {
    const c = confrontaPacchetto(85000, PROFILO_STANDARD, { budget: 3000, leve: { ...NESSUNA_LEVA, premioRisultato: true } }, parametri);
    expect(c.premioRisultatoAmmesso).toBe(true);
    expect(leve(c)).toEqual(["premioRisultato"]);
    expect(c.premioRisultatoConveniente).toBe(true);
  });

  it("RAL 6.000: il premio rende meno dell'aumento di RAL, lo scenario B lo scarta", () => {
    // premio: 3.000 / 1,304 x 0,9081 x 0,99 = 2.068,32; RAL: imponibile esente da IRPEF
    // con somma esente al 7,1%, circa 2.101 netti
    const c = confrontaPacchetto(6000, PROFILO_STANDARD, { budget: 3000, leve: { ...NESSUNA_LEVA, premioRisultato: true } }, parametri);
    expect(c.premioRisultatoAmmesso).toBe(true);
    expect(c.premioRisultatoConveniente).toBe(false);
    expect(leve(c)).toEqual(["ral"]);
    expect(c.ottimizzato.nettoAggiuntivo).toBeCloseTo(c.aumentoRal.nettoAggiuntivo, 10);
  });

  it("RAL 90.000: imponibile 81.729 oltre 80.000, premio non ammesso, tutto in RAL come lo scenario A", () => {
    const c = confrontaPacchetto(90000, PROFILO_STANDARD, { budget: 3000, leve: { ...NESSUNA_LEVA, premioRisultato: true } }, parametri);
    expect(c.premioRisultatoAmmesso).toBe(false);
    expect(leve(c)).toEqual(["ral"]);
    expect(c.ottimizzato.nettoAggiuntivo).toBeCloseTo(c.aumentoRal.nettoAggiuntivo, 10);
    expect(c.guadagnoNetto).toBeCloseTo(0, 10);
    expect(Math.abs(c.risparmioAzienda)).toBeLessThanOrEqual(0.02);
  });
});

describe("Costo equivalente in RAL e risparmio azienda", () => {
  it.each([
    { ral: 35000, profilo: PROFILO_STANDARD },
    { ral: 35000, profilo: UN_FIGLIO },
    { ral: 25000, profilo: PROFILO_STANDARD }, // a cavallo dello scalino comunale di Milano
    { ral: 60000, profilo: UN_FIGLIO },
  ])("RAL $ral: l'aumento equivalente dà almeno il netto B, 1 centesimo in meno no", ({ ral, profilo }) => {
    const c = confrontaPacchetto(ral, profilo, { budget: 2000, leve: { ...NESSUNA_LEVA, fringe: true, buoniPasto: true } }, parametri);
    const x = c.costoEquivalenteRal / K;
    const target = c.ottimizzato.nettoAggiuntivo;
    expect(nettoAumento(ral, x, profilo)).toBeGreaterThanOrEqual(target);
    expect(nettoAumento(ral, x - 0.01, profilo)).toBeLessThan(target);
    expect(c.risparmioAzienda).toBeCloseTo(c.costoEquivalenteRal - 2000, 10);
    expect(c.risparmioAzienda).toBeGreaterThan(0);
  });

  it("scalino comunale: imponibile poco sotto 23.000, il minimo x salta oltre la perdita dei 184 euro", () => {
    // RAL 25.300: imponibile 22.974,93. Netto B = 100 (fringe): un aumento di RAL piccolo
    // supera 23.000 e fa scattare lo 0,8% su tutto l'imponibile, quindi serve un x più grande
    const c = confrontaPacchetto(25300, PROFILO_STANDARD, { budget: 100, leve: { ...NESSUNA_LEVA, fringe: true } }, parametri);
    expect(c.aumentoRal.nettoAggiuntivo).toBeLessThan(0);
    const x = c.costoEquivalenteRal / K;
    expect(nettoAumento(25300, x, PROFILO_STANDARD)).toBeGreaterThanOrEqual(100);
    expect(nettoAumento(25300, x - 0.01, PROFILO_STANDARD)).toBeLessThan(100);
  });
});

describe("Lo scenario B non è mai peggiore dello scenario A", () => {
  const TUTTE_LE_COMBINAZIONI: LeveAttive[] = Array.from({ length: 16 }, (_, i) => ({
    fringe: (i & 1) > 0,
    buoniPasto: (i & 2) > 0,
    welfare: (i & 4) > 0,
    premioRisultato: (i & 8) > 0,
  }));
  const RAL = [5000, 6000, 8000, 8500, 9000, 12900, 15000, 16200, 16500, 20000, 22000, 25300, 27000, 35000, 50000, 85000, 88000, 90000, 120000];
  const BUDGET = [500, 1000, 2000, 5000, 10000];
  const PROFILI: ProfiloFamiliare[] = [
    PROFILO_STANDARD,
    UN_FIGLIO,
    { figliACarico: 2, figli21a29: 2, coniugeACarico: true, quotaDetrazioneFigli: 1 },
  ];

  it("griglia di RAL, budget, profili e tutte le combinazioni di leve", () => {
    for (const profilo of PROFILI)
      for (const ral of RAL)
        for (const budget of BUDGET)
          for (const l of TUTTE_LE_COMBINAZIONI) {
            const c = confrontaPacchetto(ral, profilo, { budget, leve: l }, parametri);
            expect(
              c.ottimizzato.nettoAggiuntivo,
              `RAL ${ral}, budget ${budget}, leve ${JSON.stringify(l)}`
            ).toBeGreaterThanOrEqual(c.aumentoRal.nettoAggiuntivo - 0.01);
            expect(c.ottimizzato.costoAzienda).toBeCloseTo(budget, 6);
          }
  });

  it("RAL 16.200, budget 500, solo fringe: l'aumento di RAL non batte più il fringe", () => {
    const c = confrontaPacchetto(16200, PROFILO_STANDARD, { budget: 500, leve: { ...NESSUNA_LEVA, fringe: true } }, parametri);
    expect(c.aumentoRal.nettoAggiuntivo).toBeLessThan(500);
    expect(leve(c)).toEqual(["fringe"]);
    expect(c.guadagnoNetto).toBeGreaterThan(0);
  });
});

describe("Casi limite e validazione", () => {
  it("budget 0: scenari a zero, nessun NaN", () => {
    const c = confrontaPacchetto(
      35000,
      PROFILO_STANDARD,
      { budget: 0, leve: { fringe: true, buoniPasto: true, welfare: true, premioRisultato: true } },
      parametri
    );
    expect(c.aumentoRal.ralAggiuntiva).toBe(0);
    expect(c.aumentoRal.nettoAggiuntivo).toBe(0);
    expect(c.aumentoRal.efficienza).toBe(0);
    expect(c.ottimizzato.allocazioni).toEqual([]);
    expect(c.ottimizzato.nettoAggiuntivo).toBe(0);
    expect(c.ottimizzato.efficienza).toBe(0);
    expect(c.guadagnoNetto).toBe(0);
    expect(c.costoEquivalenteRal).toBe(0);
    expect(c.risparmioAzienda).toBe(0);
    expect(c.nettoProfiloAlternativo).toEqual({ conFigli: 0, senzaFigli: 0 });
  });

  it.each([0, -1, NaN, Infinity])("RAL %p: errore", (ral) => {
    expect(() => confrontaPacchetto(ral, PROFILO_STANDARD, { budget: 1000, leve: NESSUNA_LEVA }, parametri)).toThrowError(
      /RAL non valida/
    );
  });

  it.each([-1, NaN, Infinity])("budget %p: errore", (budget) => {
    expect(() => confrontaPacchetto(35000, PROFILO_STANDARD, { budget, leve: NESSUNA_LEVA }, parametri)).toThrowError(
      /Budget non valido/
    );
  });

  it("profilo non valido: errore", () => {
    expect(() =>
      confrontaPacchetto(35000, { ...PROFILO_STANDARD, figli21a29: 1 }, { budget: 1000, leve: NESSUNA_LEVA }, parametri)
    ).toThrowError(/Profilo familiare non valido/);
  });
});
