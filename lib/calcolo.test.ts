/**
 * Test della logica di calcolo contro casi di riferimento calcolati a mano
 * dalle formule normative (art. 11 e 13 TUIR, L. 207/2024, addizionali
 * Lombardia e Milano) e contro gli edge case dei bordi di soglia.
 * Tolleranza: 1 euro su ogni voce intermedia.
 */
import { describe, expect, it } from "vitest";
import parametriJson from "./parametri-2026.json";
import {
  calcolaAddizionaleComunale,
  calcolaCostoAzienda,
  calcolaCuneoFiscale,
  calcolaDetrazioneConiuge,
  calcolaDetrazioneFigli,
  calcolaDetrazioneLavoro,
  calcolaIrpefLorda,
  calcolaNetto,
  calcolaTrattamentoIntegrativo,
  PROFILO_STANDARD,
  type Parametri,
  type ProfiloFamiliare,
} from "./calcolo";

const parametri: Parametri = parametriJson;

/** Verifica che il valore disti al massimo 1 euro dal riferimento. */
function attesoEntro1Euro(valore: number, atteso: number) {
  expect(Math.abs(valore - atteso), `atteso circa ${atteso}, ottenuto ${valore}`).toBeLessThanOrEqual(1);
}

describe("Casi di riferimento completi", () => {
  it("RAL 25.000: netto circa 20.570 (comunale esente, niente maggiorazione)", () => {
    const r = calcolaNetto(25000, parametri);
    attesoEntro1Euro(r.contributiInps, 2297.5);
    attesoEntro1Euro(r.imponibileFiscale, 22702.5);
    attesoEntro1Euro(r.irpefLorda, 5221.58);
    attesoEntro1Euro(r.detrazioneLavoro, 2394.93);
    attesoEntro1Euro(r.cuneo, 1000);
    expect(r.sommaEsente).toBe(0);
    attesoEntro1Euro(r.irpefNetta, 1826.65);
    attesoEntro1Euro(r.addizionaleRegionale, 306.2);
    expect(r.addizionaleComunale).toBe(0); // imponibile 22.702,50, sotto la soglia di 23.000
    attesoEntro1Euro(r.nettoAnnuo, 20569.65);
    attesoEntro1Euro(r.nettoMensile, 1582.28);
  });

  it("RAL 30.000: netto circa 23.426 (maggiorazione 65 euro, comunale dovuta)", () => {
    const r = calcolaNetto(30000, parametri);
    attesoEntro1Euro(r.contributiInps, 2757);
    attesoEntro1Euro(r.imponibileFiscale, 27243);
    attesoEntro1Euro(r.irpefLorda, 6265.89);
    // 1.910 + 1.190 x 0,0582 (rapporto troncato a 4 decimali, art. 13 c. 6) = 1.979,26, più 65
    expect(r.detrazioneLavoro).toBeCloseTo(1910 + 1190 * 0.0582 + 65, 6);
    attesoEntro1Euro(r.cuneo, 1000);
    expect(r.sommaEsente).toBe(0);
    attesoEntro1Euro(r.irpefNetta, 3221.6);
    attesoEntro1Euro(r.addizionaleRegionale, 377.94);
    attesoEntro1Euro(r.addizionaleComunale, 217.94);
    attesoEntro1Euro(r.nettoAnnuo, 23425.48);
    expect(r.nettoAnnuo).toBeCloseTo(23425.4846, 4);
    attesoEntro1Euro(r.nettoMensile, 1802);
  });

  it("RAL 50.000: netto circa 32.568 (secondo scaglione IRPEF, cuneo azzerato)", () => {
    const r = calcolaNetto(50000, parametri);
    attesoEntro1Euro(r.contributiInps, 4595);
    attesoEntro1Euro(r.imponibileFiscale, 45405);
    attesoEntro1Euro(r.irpefLorda, 12183.65);
    // 1.910 x 0,2088 (rapporto troncato), niente maggiorazione: reddito oltre 35.000
    expect(r.detrazioneLavoro).toBeCloseTo(1910 * 0.2088, 6);
    expect(r.cuneo).toBe(0); // reddito oltre 40.000
    expect(r.sommaEsente).toBe(0);
    attesoEntro1Euro(r.irpefNetta, 11784.72);
    attesoEntro1Euro(r.addizionaleRegionale, 689.27);
    attesoEntro1Euro(r.addizionaleComunale, 363.24);
    attesoEntro1Euro(r.nettoAnnuo, 32567.65);
    expect(r.nettoAnnuo).toBeCloseTo(32567.652, 4);
    attesoEntro1Euro(r.nettoMensile, 2505.21);
  });
});

describe("IRPEF lorda: bordi degli scaglioni (art. 11 TUIR)", () => {
  it("imponibile 28.000: tutto al 23%", () => {
    attesoEntro1Euro(calcolaIrpefLorda(28000, parametri), 28000 * 0.23); // 6.440
  });

  it("imponibile 50.000: 23% fino a 28.000 più 33% sui 22.000 eccedenti", () => {
    attesoEntro1Euro(calcolaIrpefLorda(50000, parametri), 6440 + 22000 * 0.33); // 13.700
  });

  it("imponibile 50.001: l'aliquota 43% si applica solo all'euro eccedente", () => {
    attesoEntro1Euro(calcolaIrpefLorda(50001, parametri), 13700 + 1 * 0.43);
  });
});

describe("Addizionale comunale Milano: effetto scalino", () => {
  it("imponibile 23.000: esente (0 euro)", () => {
    expect(calcolaAddizionaleComunale(23000, parametri)).toBe(0);
  });

  it("imponibile 23.001: 0,8% sull'intero imponibile (circa 184 euro), non sull'eccedenza", () => {
    attesoEntro1Euro(calcolaAddizionaleComunale(23001, parametri), 184.01);
  });
});

describe("Cuneo fiscale: passaggio somma esente / detrazione (L. 207/2024)", () => {
  it("reddito 20.000: somma esente 4,8% (960 euro), nessuna detrazione", () => {
    const c = calcolaCuneoFiscale(20000, parametri);
    attesoEntro1Euro(c.sommaEsente, 960);
    expect(c.ulterioreDetrazione).toBe(0);
  });

  it("reddito 20.001: detrazione 1.000 euro, nessuna somma esente", () => {
    const c = calcolaCuneoFiscale(20001, parametri);
    expect(c.sommaEsente).toBe(0);
    attesoEntro1Euro(c.ulterioreDetrazione, 1000);
  });

  it("reddito 40.000: detrazione decrescente azzerata", () => {
    const c = calcolaCuneoFiscale(40000, parametri);
    expect(c.sommaEsente).toBe(0);
    expect(c.ulterioreDetrazione).toBe(0);
  });

  it("fasce somma esente: 8.500 al 7,1%; 8.501 al 5,3%; 15.001 al 4,8%", () => {
    attesoEntro1Euro(calcolaCuneoFiscale(8500, parametri).sommaEsente, 8500 * 0.071);
    attesoEntro1Euro(calcolaCuneoFiscale(8501, parametri).sommaEsente, 8501 * 0.053);
    attesoEntro1Euro(calcolaCuneoFiscale(15001, parametri).sommaEsente, 15001 * 0.048);
  });
});

describe("Detrazione lavoro dipendente: maggiorazione 65 euro (art. 13 c. 1.1 TUIR)", () => {
  it("reddito 25.000 senza maggiorazione; 25.001 con maggiorazione (superiore a 25.000)", () => {
    const senza = calcolaDetrazioneLavoro(25000, parametri);
    const con = calcolaDetrazioneLavoro(25001, parametri);
    // le due formule base distano meno di 1 euro: la differenza è la maggiorazione
    attesoEntro1Euro(con - senza, 65);
  });

  it("reddito 35.000 con maggiorazione; 35.001 senza", () => {
    attesoEntro1Euro(calcolaDetrazioneLavoro(35000, parametri) - calcolaDetrazioneLavoro(35001, parametri), 65);
  });

  it("rapporti delle fasce 2 e 3 troncati alla quarta cifra decimale (art. 13 c. 6 TUIR)", () => {
    // (28.000 - 27.243) / 13.000 = 0,058230... troncato 0,0582
    expect(calcolaDetrazioneLavoro(27243, parametri)).toBeCloseTo(1910 + 1190 * 0.0582 + 65, 6);
    // (50.000 - 45.405) / 22.000 = 0,208863... troncato 0,2088 (arrotondato sarebbe 0,2089)
    expect(calcolaDetrazioneLavoro(45405, parametri)).toBeCloseTo(1910 * 0.2088, 6);
  });

  it("reddito 50.000 e oltre: detrazione zero", () => {
    expect(calcolaDetrazioneLavoro(50000, parametri)).toBe(0);
    expect(calcolaDetrazioneLavoro(60000, parametri)).toBe(0);
  });
});

describe("IRPEF netta mai negativa", () => {
  it("RAL 8.000: lorda 1.670,90 minore della detrazione 1.955, IRPEF netta 0", () => {
    const r = calcolaNetto(8000, parametri);
    expect(r.irpefNetta).toBe(0);
    expect(r.sommaEsente).toBeGreaterThan(0); // reddito sotto 8.500: somma esente al 7,1%
    expect(r.nettoAnnuo).toBeGreaterThan(0);
  });
});

describe("Addizionali dovute solo se è dovuta l'IRPEF netta (art. 50 c. 2 D.Lgs. 446/1997, art. 1 c. 4 D.Lgs. 360/1998)", () => {
  it("RAL 8.000: IRPEF netta 0, quindi regionale e comunale 0", () => {
    const r = calcolaNetto(8000, parametri);
    expect(r.addizionaleRegionale).toBe(0);
    expect(r.addizionaleComunale).toBe(0);
    // 7.264,80 + somma esente 7,1% = 515,80: netto 7.780,60
    attesoEntro1Euro(r.nettoAnnuo, 7780.6);
  });

  it("RAL 12.000: IRPEF netta positiva, regionale dovuta su tutto l'imponibile", () => {
    const r = calcolaNetto(12000, parametri);
    expect(r.irpefNetta).toBeGreaterThan(0);
    expect(r.addizionaleRegionale).toBeCloseTo(10897.2 * 0.0123, 6);
  });
});

describe("Input non validi", () => {
  it.each([0, -1, -30000, NaN, Infinity, -Infinity])("RAL %p: errore", (ral) => {
    expect(() => calcolaNetto(ral, parametri)).toThrowError(/RAL non valida/);
  });
});

describe("Coerenza interna del risultato", () => {
  it.each([8000, 9500, 12000, 20000, 30000, 50000])(
    "RAL %p: trattenute = INPS + IRPEF netta + addizionali; netto = RAL - trattenute + somma esente + trattamento",
    (ral) => {
      const r = calcolaNetto(ral, parametri);
      expect(r.totaleTrattenute).toBeCloseTo(
        r.contributiInps + r.irpefNetta + r.addizionaleRegionale + r.addizionaleComunale,
        6
      );
      expect(r.nettoAnnuo).toBeCloseTo(r.ral - r.totaleTrattenute + r.sommaEsente + r.trattamentoIntegrativo, 6);
      expect(r.aliquotaEffettiva).toBeCloseTo(r.totaleTrattenute / r.ral, 10);
      expect(r.totaleTrattenute).toBeGreaterThanOrEqual(0);
    }
  );

  it("RAL 9.500: trattenute mai negative anche quando somma esente e trattamento superano le imposte", () => {
    const r = calcolaNetto(9500, parametri);
    expect(r.totaleTrattenute).toBeGreaterThan(0);
    expect(r.nettoAnnuo).toBeGreaterThan(r.ral - r.totaleTrattenute);
  });
});

describe("Detrazione coniuge a carico (art. 12 c.1 lett. a-b TUIR)", () => {
  it("R 10.000: 800 - 110 x 0,6666 (rapporto troncato a 4 decimali) = 726,67", () => {
    expect(calcolaDetrazioneConiuge(10000, parametri)).toBeCloseTo(800 - 110 * 0.6666, 6);
  });

  it("rapporti esatti non perdono l'ultima cifra per errori di virgola mobile", () => {
    // (80.000 - 52.000) / 40.000 = 0,7 esatto
    expect(calcolaDetrazioneConiuge(52000, parametri)).toBeCloseTo(690 * 0.7, 6);
  });

  it("R 30.000: 690 più maggiorazione di 20 = 710", () => {
    expect(calcolaDetrazioneConiuge(30000, parametri)).toBeCloseTo(710, 6);
  });

  it("R 34.800: 690 più maggiorazione di 30 = 720", () => {
    expect(calcolaDetrazioneConiuge(34800, parametri)).toBeCloseTo(720, 6);
  });

  it("R 60.000: 690 x 0,5 = 345", () => {
    expect(calcolaDetrazioneConiuge(60000, parametri)).toBeCloseTo(345, 6);
  });

  it("R 80.000 e oltre: zero", () => {
    expect(calcolaDetrazioneConiuge(80000, parametri)).toBe(0);
    expect(calcolaDetrazioneConiuge(90000, parametri)).toBe(0);
  });

  it("bordo maggiorazioni: 29.000 senza (690), 29.001 con +10 (700)", () => {
    expect(calcolaDetrazioneConiuge(29000, parametri)).toBeCloseTo(690, 6);
    expect(calcolaDetrazioneConiuge(29001, parametri)).toBeCloseTo(700, 6);
  });

  it("continuità ai bordi di fascia: 15.000 e 40.000 valgono 690", () => {
    expect(calcolaDetrazioneConiuge(15000, parametri)).toBeCloseTo(690, 6);
    expect(calcolaDetrazioneConiuge(40000, parametri)).toBeCloseTo(690, 6);
  });
});

describe("Detrazione figli 21-29 anni (art. 12 c.1 lett. c TUIR)", () => {
  it("1 figlio, R 27.243: 950 x 0,7132 = 677,54", () => {
    // (95.000 - 27.243) / 95.000 = 0,713231... arrotondato a 0,7132
    expect(calcolaDetrazioneFigli(27243, 1, parametri)).toBeCloseTo(950 * 0.7132, 6);
  });

  it("2 figli, R 27.243: base 110.000, 2 x 950 x 0,7523 = 1.429,37", () => {
    // (110.000 - 27.243) / 110.000 = 0,752336... arrotondato a 0,7523
    expect(calcolaDetrazioneFigli(27243, 2, parametri)).toBeCloseTo(2 * 950 * 0.7523, 6);
  });

  it("0 figli: zero", () => {
    expect(calcolaDetrazioneFigli(27243, 0, parametri)).toBe(0);
  });

  it("reddito oltre la base: zero, mai negativa", () => {
    expect(calcolaDetrazioneFigli(95000, 1, parametri)).toBe(0);
    expect(calcolaDetrazioneFigli(120000, 1, parametri)).toBe(0);
  });
});

describe("Costo del lavoro per l'azienda", () => {
  it("RAL 30.000: 30.000 + 9.000 INPS + 120 INAIL + 2.073 TFR = 41.193", () => {
    const c = calcolaCostoAzienda(30000, parametri);
    expect(c.contributiDatore).toBeCloseTo(9000, 6);
    expect(c.inail).toBeCloseTo(120, 6);
    expect(c.tfr).toBeCloseTo(2073, 6);
    expect(c.totale).toBeCloseTo(41193, 6);
  });
});

describe("calcolaNetto con profilo familiare", () => {
  const conFamiglia: ProfiloFamiliare = {
    figliACarico: 1,
    figli21a29: 1,
    coniugeACarico: true,
    quotaDetrazioneFigli: 1,
  };

  it("profilo standard di default: risultato identico al terzo argomento esplicito", () => {
    const a = calcolaNetto(30000, parametri);
    const b = calcolaNetto(30000, parametri, PROFILO_STANDARD);
    expect(a.nettoAnnuo).toBe(b.nettoAnnuo);
    expect(a.detrazioneConiuge).toBe(0);
    expect(a.detrazioneFigli).toBe(0);
    expect(a.profilo).toEqual(PROFILO_STANDARD);
  });

  it("RAL 30.000 con coniuge e un figlio 21-29 al 100%: netto più alto della somma delle detrazioni", () => {
    const standard = calcolaNetto(30000, parametri);
    const r = calcolaNetto(30000, parametri, conFamiglia);
    // R = 27.243: coniuge 690 (sotto 29.000, niente maggiorazione), figlio 950 x 0,7132
    expect(r.detrazioneConiuge).toBeCloseTo(690, 6);
    expect(r.detrazioneFigli).toBeCloseTo(677.54, 6);
    // IRPEF capiente (3.221,60 > 1.367,54): il netto sale esattamente delle detrazioni
    expect(r.nettoAnnuo - standard.nettoAnnuo).toBeCloseTo(690 + 677.54, 6);
    attesoEntro1Euro(r.irpefNetta, 3221.6 - 1367.54);
    expect(r.profilo).toEqual(conFamiglia);
  });

  it("quota 50% senza coniuge a carico: la detrazione figli si dimezza", () => {
    const r = calcolaNetto(30000, parametri, { ...conFamiglia, coniugeACarico: false, quotaDetrazioneFigli: 0.5 });
    expect(r.detrazioneFigli).toBeCloseTo(677.54 / 2, 6);
  });

  it("coniuge a carico: detrazione figli per intero anche con quota 50% (art. 12 c.1 lett. c TUIR)", () => {
    const r = calcolaNetto(30000, parametri, { ...conFamiglia, quotaDetrazioneFigli: 0.5 });
    expect(r.detrazioneFigli).toBeCloseTo(677.54, 6);
  });

  it("figli sotto i 21 anni: nessuna detrazione in busta paga", () => {
    const r = calcolaNetto(30000, parametri, { ...conFamiglia, figli21a29: 0, coniugeACarico: false });
    expect(r.detrazioneFigli).toBe(0);
    expect(r.nettoAnnuo).toBe(calcolaNetto(30000, parametri).nettoAnnuo);
  });

  it("IRPEF netta mai negativa anche con detrazioni familiari incapienti", () => {
    const r = calcolaNetto(16000, parametri, { ...conFamiglia, figliACarico: 3, figli21a29: 3 });
    expect(r.irpefNetta).toBe(0);
  });

  it("costo azienda popolato nel risultato", () => {
    expect(calcolaNetto(30000, parametri).costoAzienda.totale).toBeCloseTo(41193, 6);
  });

  it.each([
    { ...PROFILO_STANDARD, figliACarico: -1 },
    { ...PROFILO_STANDARD, figliACarico: 1.5 },
    { ...PROFILO_STANDARD, figliACarico: 1, figli21a29: 2 },
    { ...PROFILO_STANDARD, figli21a29: NaN },
  ])("profilo non valido %o: errore", (profilo) => {
    expect(() => calcolaNetto(30000, parametri, profilo)).toThrowError(/Profilo familiare non valido/);
  });
});

describe("Trattamento integrativo (art. 1 DL 3/2020, L. 234/2021)", () => {
  it("RAL 12.000: imposta lorda 2.506,36 oltre 1.955 - 75, spettano 1.200 euro", () => {
    const r = calcolaNetto(12000, parametri);
    expect(r.trattamentoIntegrativo).toBe(1200);
    // 10.897,20 - IRPEF netta 551,36 - regionale 134,04 + somma esente 577,55 + 1.200
    attesoEntro1Euro(r.nettoAnnuo, 11989.36);
  });

  it("reddito fino a 15.000: condizione di capienza imposta lorda > detrazione art. 13 - 75", () => {
    // 8.000 x 23% = 1.840, sotto 1.880: niente; 8.200 x 23% = 1.886, sopra: 1.200
    expect(calcolaTrattamentoIntegrativo(8000, parametri)).toBe(0);
    expect(calcolaTrattamentoIntegrativo(8200, parametri)).toBe(1200);
  });

  it("imponibile esattamente 15.000: 1.200; 15.000,01 senza familiari: 0", () => {
    expect(calcolaTrattamentoIntegrativo(15000, parametri)).toBe(1200);
    // detrazione circa 3.100 meno imposta lorda circa 3.450: negativo, non spetta
    expect(calcolaTrattamentoIntegrativo(15000.01, parametri)).toBe(0);
  });

  it("RAL 16.500 contro 16.520: niente più salto di oltre 1.000 euro di netto", () => {
    const a = calcolaNetto(16500, parametri);
    const b = calcolaNetto(16520, parametri);
    expect(a.trattamentoIntegrativo).toBe(1200); // imponibile 14.983,65
    expect(b.trattamentoIntegrativo).toBe(0); // imponibile 15.001,81
    attesoEntro1Euro(b.nettoAnnuo - a.nettoAnnuo, -115.46);
  });

  it("RAL 20.000 incapiente con coniuge e 2 figli 21-29: trattamento pari all'incapienza, 909,33", () => {
    const r = calcolaNetto(20000, parametri, {
      figliACarico: 2,
      figli21a29: 2,
      coniugeACarico: true,
      quotaDetrazioneFigli: 0.5, // coniuge a carico: quota forzata al 100%
    });
    // R 18.162, rapporti troncati: lavoro 1.910 + 1.190 x 0,7567 = 2.810,47, coniuge 690,
    // figli 2 x 950 x 0,8348 = 1.586,12; imposta lorda 4.177,26: differenza 909,33
    expect(r.detrazioneFigli).toBeCloseTo(2 * 950 * 0.8348, 6);
    expect(r.irpefNetta).toBe(0);
    attesoEntro1Euro(r.trattamentoIntegrativo, 909.33);
    // IRPEF netta 0: niente addizionali. 18.162 + somma esente 871,78 + 909,33
    expect(r.addizionaleRegionale).toBe(0);
    expect(r.addizionaleComunale).toBe(0);
    attesoEntro1Euro(r.nettoAnnuo, 19943.11);
  });

  it("tra 15.000 e 28.000: mai oltre 1.200", () => {
    const famiglia: ProfiloFamiliare = { figliACarico: 3, figli21a29: 3, coniugeACarico: true, quotaDetrazioneFigli: 1 };
    // R 16.000: detrazioni 3.008,46 + 690 + 2.485,20 contro imposta 3.680, differenza 2.503,66
    expect(calcolaTrattamentoIntegrativo(16000, parametri, famiglia)).toBe(1200);
  });

  it("oltre 28.000: zero anche con familiari", () => {
    const famiglia: ProfiloFamiliare = { figliACarico: 3, figli21a29: 3, coniugeACarico: true, quotaDetrazioneFigli: 1 };
    expect(calcolaTrattamentoIntegrativo(28000.01, parametri, famiglia)).toBe(0);
  });

  it("casi di riferimento RAL 25.000, 30.000, 50.000: nessun trattamento integrativo", () => {
    for (const ral of [25000, 30000, 50000]) {
      expect(calcolaNetto(ral, parametri).trattamentoIntegrativo).toBe(0);
    }
  });
});
