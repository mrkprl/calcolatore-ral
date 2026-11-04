/**
 * Logica di calcolo RAL -> retribuzione netta (anno d'imposta 2026).
 *
 * Caso standard: impiegato a tempo indeterminato, anno intero, residenza
 * fiscale Milano (Lombardia), nessuna agevolazione.
 *
 * Solo funzioni pure: nessun import da React/Next, nessuna costante fiscale
 * hardcoded (tutte in parametri-2026.json, ognuna con fonte normativa e data
 * di verifica), nessun arrotondamento intermedio (gli arrotondamenti
 * avvengono solo in visualizzazione), salvo il troncamento dei rapporti
 * alla quarta cifra decimale imposto dagli art. 12 c. 4 e 13 c. 6 TUIR.
 */

/** Scaglione di un'imposta progressiva: `fino_a: null` = ultimo scaglione, senza tetto. */
export interface Scaglione {
  fino_a: number | null;
  aliquota: number;
}

/** Struttura di lib/parametri-2026.json. */
export interface Parametri {
  anno_imposta: number;
  parametri_verificati_il: string;
  profilo: string;
  mensilita: { valore: number; fonte: string; verificato_il: string };
  inps: { aliquota_dipendente: number; fonte: string; verificato_il: string };
  irpef: { scaglioni: Scaglione[]; fonte: string; verificato_il: string };
  detrazione_lavoro_dipendente: {
    fascia_1: { soglia_reddito: number; importo: number };
    fascia_2: {
      soglia_reddito: number;
      base: number;
      quota_variabile: number;
      denominatore: number;
    };
    fascia_3: { soglia_reddito: number; base: number; denominatore: number };
    /** Maggiorazione art. 13 c. 1.1: spetta se reddito_min < R <= reddito_max. */
    maggiorazione: { importo: number; reddito_min: number; reddito_max: number };
    /** Cifre decimali a cui si troncano i rapporti delle fasce 2 e 3 (art. 13 c. 6 TUIR). */
    decimali_rapporto: number;
    fonte: string;
    verificato_il: string;
  };
  cuneo_fiscale: {
    somma_esente: {
      soglia_reddito: number;
      fasce: { fino_a: number; percentuale: number }[];
    };
    ulteriore_detrazione: {
      importo_pieno: number;
      soglia_importo_pieno: number;
      soglia_azzeramento: number;
      denominatore: number;
    };
    fonte: string;
    verificato_il: string;
  };
  trattamento_integrativo: {
    importo: number;
    soglia_piena: number;
    soglia_max: number;
    riduzione_capienza: number;
    nota: string;
    fonte: string;
    verificato_il: string;
  };
  addizionale_regionale: {
    regione: string;
    scaglioni: Scaglione[];
    fonte: string;
    verificato_il: string;
  };
  addizionale_comunale: {
    comune: string;
    aliquota: number;
    soglia_esenzione: number;
    nota: string;
    fonte: string;
    verificato_il: string;
  };
  detrazioni_familiari: {
    coniuge: {
      fascia_1: { soglia_reddito: number; base: number; riduzione: number; denominatore: number };
      fascia_2: { soglia_reddito: number; importo: number };
      fascia_3: { soglia_reddito: number; base: number; denominatore: number };
      maggiorazioni: { reddito_oltre: number; fino_a: number; importo: number }[];
      reddito_max_familiare: number;
    };
    figli: {
      importo: number;
      base_reddito: number;
      incremento_per_figlio: number;
      eta_min: number;
      eta_max: number;
      reddito_max_familiare_fino_24_anni: number;
      nota: string;
    };
    decimali_rapporto: number;
    fonte: string;
    verificato_il: string;
  };
  costo_azienda: {
    contributi_datore: number;
    inail: number;
    tfr: number;
    nota: string;
    fonte: string;
    verificato_il: string;
  };
  fringe_benefit: {
    soglia: number;
    soglia_con_figli: number;
    nota: string;
    fonte: string;
    verificato_il: string;
  };
  buoni_pasto: {
    elettronico_giornaliero: number;
    cartaceo_giornaliero: number;
    giorni_lavorati: number;
    fonte: string;
    verificato_il: string;
  };
  welfare: { nota: string; fonte: string; verificato_il: string };
  premio_risultato: {
    aliquota_sostitutiva: number;
    limite_lordo: number;
    soglia_reddito: number;
    nota: string;
    fonte: string;
    verificato_il: string;
  };
}

/**
 * Situazione familiare del dipendente. Tutti i familiari si intendono
 * fiscalmente a carico (art. 12 c. 2 TUIR).
 */
export interface ProfiloFamiliare {
  /** Numero totale di figli a carico, di qualunque età (conta per la soglia fringe benefit). */
  figliACarico: number;
  /** Di cui tra 21 e 29 anni: gli unici che danno ancora la detrazione in busta paga. Sempre <= figliACarico. */
  figli21a29: number;
  coniugeACarico: boolean;
  /** Quota della detrazione figli spettante: 0,5 (default di legge) oppure 1. */
  quotaDetrazioneFigli: 0.5 | 1;
}

export const PROFILO_STANDARD: ProfiloFamiliare = {
  figliACarico: 0,
  figli21a29: 0,
  coniugeACarico: false,
  quotaDetrazioneFigli: 0.5,
};

/** Costo del lavoro per l'azienda (valori tipici dichiarati nel JSON). */
export interface CostoAzienda {
  contributiDatore: number;
  inail: number;
  tfr: number;
  /** RAL + contributi datore + INAIL + TFR. */
  totale: number;
}

/** Esito del taglio del cuneo fiscale: al più uno dei due campi è maggiore di zero. */
export interface EsitoCuneo {
  sommaEsente: number;
  ulterioreDetrazione: number;
}

/** Risultato completo del calcolo, con tutte le voci intermedie. */
export interface RisultatoCalcolo {
  ral: number;
  contributiInps: number;
  imponibileFiscale: number;
  irpefLorda: number;
  detrazioneLavoro: number;
  /** Ulteriore detrazione "cuneo fiscale" portata in riduzione dell'IRPEF. */
  cuneo: number;
  irpefNetta: number;
  addizionaleRegionale: number;
  addizionaleComunale: number;
  /** Detrazione coniuge a carico, maggiorazioni comprese (art. 12 c.1 lett. a-b TUIR). */
  detrazioneConiuge: number;
  /** Detrazione figli 21-29 anni, già moltiplicata per la quota spettante, 100% se il coniuge è a carico (art. 12 c.1 lett. c TUIR). */
  detrazioneFigli: number;
  /** Somma esente per redditi fino a 20.000 euro, aggiunta al netto. */
  sommaEsente: number;
  /** Trattamento integrativo (ex bonus 100 euro): non è IRPEF, si aggiunge al netto. */
  trattamentoIntegrativo: number;
  nettoAnnuo: number;
  nettoMensile: number;
  /**
   * Contributi INPS + IRPEF netta + addizionali. Vale l'identità
   * nettoAnnuo = RAL - totaleTrattenute + sommaEsente + trattamentoIntegrativo.
   */
  totaleTrattenute: number;
  /** Frazione 0-1: totaleTrattenute / RAL (moltiplicare per 100 in visualizzazione). */
  aliquotaEffettiva: number;
  costoAzienda: CostoAzienda;
  profilo: ProfiloFamiliare;
}

/**
 * Applica un'imposta a scaglioni progressivi: ogni aliquota si applica solo
 * alla quota di imponibile che ricade nel proprio scaglione.
 * Riusata da IRPEF e addizionale regionale, che per legge seguono lo stesso
 * meccanismo.
 */
function calcolaImpostaAScaglioni(imponibile: number, scaglioni: Scaglione[]): number {
  let imposta = 0;
  let sogliaPrecedente = 0;
  for (const scaglione of scaglioni) {
    const tetto = scaglione.fino_a ?? Infinity;
    const quotaNelloScaglione = Math.min(imponibile, tetto) - sogliaPrecedente;
    if (quotaNelloScaglione <= 0) break;
    imposta += quotaNelloScaglione * scaglione.aliquota;
    sogliaPrecedente = tetto;
  }
  return imposta;
}

/**
 * Contributi previdenziali INPS a carico del dipendente: aliquota flat 9,19%
 * su tutta la RAL (L. 335/1995; Circolare INPS n. 14/2026). Semplificazione
 * dichiarata: ignorati il contributo aggiuntivo IVS dell'1%, la quota
 * FIS/CIGS e il massimale contributivo.
 * Unica funzione della pipeline che riceve la RAL anziché l'imponibile fiscale.
 */
export function calcolaContributiInps(ral: number, parametri: Parametri): number {
  return ral * parametri.inps.aliquota_dipendente;
}

/**
 * IRPEF lorda sugli scaglioni 2026: 23% fino a 28.000 euro, 33% da 28.000,01
 * a 50.000 euro, 43% oltre (art. 11 c.1 TUIR, come modificato dalla
 * L. 199/2025, Legge di Bilancio 2026).
 */
export function calcolaIrpefLorda(imponibile: number, parametri: Parametri): number {
  return calcolaImpostaAScaglioni(imponibile, parametri.irpef.scaglioni);
}

/**
 * Detrazione per redditi da lavoro dipendente (art. 13 c.1 TUIR).
 * `reddito` = reddito complessivo, qui coincidente con l'imponibile fiscale
 * (semplificazione dichiarata: unico reddito, nessun onere deducibile).
 * Include la maggiorazione di 65 euro per redditi superiori a 25.000 e
 * fino a 35.000 euro (art. 13 c. 1.1 TUIR, inserito dalla L. 234/2021).
 * I rapporti delle fasce 2 e 3 si troncano alla quarta cifra decimale
 * (art. 13 c. 6 TUIR).
 */
export function calcolaDetrazioneLavoro(reddito: number, parametri: Parametri): number {
  const m = parametri.detrazione_lavoro_dipendente.maggiorazione;
  const maggiorazione = reddito > m.reddito_min && reddito <= m.reddito_max ? m.importo : 0;
  return detrazioneLavoroComma1(reddito, parametri) + maggiorazione;
}

/** Detrazione art. 13 c.1 TUIR senza la maggiorazione di 65 euro del c. 1.1. */
function detrazioneLavoroComma1(reddito: number, parametri: Parametri): number {
  const d = parametri.detrazione_lavoro_dipendente;
  if (reddito <= d.fascia_1.soglia_reddito) return d.fascia_1.importo;
  if (reddito <= d.fascia_2.soglia_reddito) {
    // 1.910 + 1.190 x (28.000 - R) / 13.000
    return (
      d.fascia_2.base +
      d.fascia_2.quota_variabile *
        troncaRapporto((d.fascia_2.soglia_reddito - reddito) / d.fascia_2.denominatore, d.decimali_rapporto)
    );
  }
  if (reddito <= d.fascia_3.soglia_reddito) {
    // 1.910 x (50.000 - R) / 22.000
    return (
      d.fascia_3.base *
      troncaRapporto((d.fascia_3.soglia_reddito - reddito) / d.fascia_3.denominatore, d.decimali_rapporto)
    );
  }
  return 0;
}

/**
 * Taglio del cuneo fiscale (art. 1 c. 4-9 L. 207/2024, reso strutturale
 * dal 2026; spetta ai soli redditi di lavoro dipendente).
 * Due meccanismi ALTERNATIVI in base al reddito:
 * (a) fino a 20.000 euro: somma esente, percentuale del reddito che non
 *     concorre all'IRPEF;
 * (b) da 20.000 a 40.000 euro: ulteriore detrazione IRPEF, 1.000 euro pieni
 *     fino a 32.000, poi decrescente fino ad azzerarsi a 40.000.
 * Al più uno dei due campi restituiti è maggiore di zero.
 */
export function calcolaCuneoFiscale(reddito: number, parametri: Parametri): EsitoCuneo {
  const c = parametri.cuneo_fiscale;

  if (reddito <= c.somma_esente.soglia_reddito) {
    // reddito entro la soglia garantisce che una fascia esista sempre
    // (l'ultima fascia ha fino_a uguale alla soglia)
    const fascia = c.somma_esente.fasce.find((f) => reddito <= f.fino_a);
    return { sommaEsente: reddito * (fascia?.percentuale ?? 0), ulterioreDetrazione: 0 };
  }

  const u = c.ulteriore_detrazione;
  if (reddito <= u.soglia_importo_pieno) {
    return { sommaEsente: 0, ulterioreDetrazione: u.importo_pieno };
  }
  if (reddito <= u.soglia_azzeramento) {
    // 1.000 x (40.000 - R) / 8.000
    return {
      sommaEsente: 0,
      ulterioreDetrazione: (u.importo_pieno * (u.soglia_azzeramento - reddito)) / u.denominatore,
    };
  }
  return { sommaEsente: 0, ulterioreDetrazione: 0 };
}

/**
 * Addizionale regionale IRPEF della Lombardia (art. 72 c.1 l.r. 10/2003,
 * scaglioni adeguati dalla l.r. 5/2022): scaglioni propri con applicazione
 * progressiva, come l'IRPEF nazionale.
 * Importo teorico sull'imponibile: è dovuta solo se è dovuta l'IRPEF al
 * netto delle detrazioni (art. 50 c. 2 D.Lgs. 446/1997), condizione
 * applicata in calcolaNetto.
 */
export function calcolaAddizionaleRegionale(imponibile: number, parametri: Parametri): number {
  return calcolaImpostaAScaglioni(imponibile, parametri.addizionale_regionale.scaglioni);
}

/**
 * Addizionale comunale IRPEF di Milano (Delib. C.C. 46/2020): aliquota unica
 * 0,8% con soglia di esenzione a 23.000 euro di imponibile.
 * ATTENZIONE: è una soglia di esenzione secca, non una franchigia: a
 * 23.001 euro si paga lo 0,8% sull'intero imponibile (effetto scalino).
 * Importo teorico: è dovuta solo se è dovuta l'IRPEF al netto delle
 * detrazioni (art. 1 c. 4 D.Lgs. 360/1998), condizione applicata in
 * calcolaNetto.
 */
export function calcolaAddizionaleComunale(imponibile: number, parametri: Parametri): number {
  const a = parametri.addizionale_comunale;
  return imponibile <= a.soglia_esenzione ? 0 : imponibile * a.aliquota;
}

/** Tolleranza contro gli errori di virgola mobile nel troncamento (es. 0,7 calcolato come 0,69999...). */
const EPSILON_TRONCAMENTO = 1e-9;

/**
 * Rapporto "assunto nelle prime quattro cifre decimali" (art. 12 c. 4 e
 * art. 13 c. 6 TUIR): la prassi dell'Agenzia delle Entrate (istruzioni 730,
 * es. 0,98456 diventa 0,9845) è il troncamento, non l'arrotondamento.
 * La norma lo prevede per i rapporti maggiori di zero.
 */
function troncaRapporto(rapporto: number, decimali: number): number {
  if (rapporto <= 0) return rapporto;
  const fattore = 10 ** decimali;
  return Math.floor(rapporto * fattore + EPSILON_TRONCAMENTO) / fattore;
}

/**
 * Detrazione per coniuge a carico (art. 12 c.1 lett. a TUIR), con le
 * maggiorazioni della lett. b) per redditi tra 29.000 e 35.200 euro.
 * `reddito` = reddito complessivo, qui coincidente con l'imponibile fiscale.
 * - R fino a 15.000: 800 - 110 x R / 15.000
 * - 15.000 < R fino a 40.000: 690, più l'eventuale maggiorazione
 * - 40.000 < R fino a 80.000: 690 x (80.000 - R) / 40.000
 * - oltre 80.000: 0
 * I rapporti si troncano alla quarta cifra decimale (art. 12 c. 4 TUIR).
 * Il limite di reddito del coniuge per essere a carico (c. 2) è un
 * presupposto del profilo, non un calcolo.
 */
export function calcolaDetrazioneConiuge(reddito: number, parametri: Parametri): number {
  const c = parametri.detrazioni_familiari.coniuge;
  const decimali = parametri.detrazioni_familiari.decimali_rapporto;

  let detrazione: number;
  if (reddito <= c.fascia_1.soglia_reddito) {
    detrazione = c.fascia_1.base - c.fascia_1.riduzione * troncaRapporto(reddito / c.fascia_1.denominatore, decimali);
  } else if (reddito <= c.fascia_2.soglia_reddito) {
    detrazione = c.fascia_2.importo;
  } else if (reddito <= c.fascia_3.soglia_reddito) {
    detrazione =
      c.fascia_3.base *
      troncaRapporto((c.fascia_3.soglia_reddito - reddito) / c.fascia_3.denominatore, decimali);
  } else {
    detrazione = 0;
  }

  // Maggiorazioni (lett. b): intervalli con estremo inferiore escluso e superiore incluso
  const maggiorazione = c.maggiorazioni.find((m) => reddito > m.reddito_oltre && reddito <= m.fino_a);
  return detrazione + (maggiorazione?.importo ?? 0);
}

/**
 * Detrazione per figli a carico dai 21 ai 29 anni (art. 12 c.1 lett. c
 * TUIR): 950 x (B - R) / B per ciascun figlio, con B = 95.000 aumentato di
 * 15.000 per ogni figlio dopo il primo (contando solo i figli che danno
 * diritto alla detrazione). Il rapporto si tronca alla quarta cifra
 * decimale (art. 12 c. 4 TUIR); la detrazione non è mai negativa.
 * Restituisce l'importo pieno: la ripartizione tra i genitori (50% di
 * default o 100%) si applica in calcolaNetto.
 * Sotto i 21 anni spetta l'assegno unico INPS, fuori dalla busta paga.
 */
export function calcolaDetrazioneFigli(reddito: number, numeroFigli21a29: number, parametri: Parametri): number {
  if (numeroFigli21a29 <= 0) return 0;
  const f = parametri.detrazioni_familiari.figli;
  const base = f.base_reddito + f.incremento_per_figlio * (numeroFigli21a29 - 1);
  const rapporto = troncaRapporto((base - reddito) / base, parametri.detrazioni_familiari.decimali_rapporto);
  return Math.max(0, numeroFigli21a29 * f.importo * rapporto);
}

/**
 * Costo del lavoro annuo per l'azienda: RAL più contributi INPS a carico del
 * datore, premio INAIL e accantonamento TFR (art. 2120 c.c., al netto dello
 * 0,50% già compreso nell'IVS, art. 3 L. 297/1982). Aliquote tipiche
 * dichiarate nel JSON per un impiegato del terziario; esclusi i fondi da CCNL.
 */
export function calcolaCostoAzienda(ral: number, parametri: Parametri): CostoAzienda {
  const c = parametri.costo_azienda;
  const contributiDatore = ral * c.contributi_datore;
  const inail = ral * c.inail;
  const tfr = ral * c.tfr;
  return { contributiDatore, inail, tfr, totale: ral + contributiDatore + inail + tfr };
}

/**
 * Detrazioni per familiari a carico spettanti al profilo. Se il coniuge è
 * fiscalmente a carico, la detrazione figli spetta per intero all'altro
 * genitore (art. 12 c.1 lett. c TUIR): la quota scelta viene ignorata.
 */
export function calcolaDetrazioniFamiliari(
  reddito: number,
  profilo: ProfiloFamiliare,
  parametri: Parametri
): { coniuge: number; figli: number } {
  const quota = profilo.coniugeACarico ? 1 : profilo.quotaDetrazioneFigli;
  return {
    coniuge: profilo.coniugeACarico ? calcolaDetrazioneConiuge(reddito, parametri) : 0,
    figli: calcolaDetrazioneFigli(reddito, profilo.figli21a29, parametri) * quota,
  };
}

/**
 * Trattamento integrativo dei redditi di lavoro dipendente (art. 1 DL
 * 3/2020, conv. L. 21/2020, come modificato dall'art. 1 c. 3 L. 234/2021).
 * Non è IRPEF: è una somma aggiunta al netto, come la somma esente.
 * - R fino a 15.000: 1.200 euro se l'imposta lorda supera la detrazione
 *   art. 13 c.1 TUIR diminuita di 75 euro, altrimenti zero;
 * - 15.000 < R fino a 28.000: la differenza, se positiva, tra la somma
 *   delle detrazioni (art. 12 per i familiari, art. 13 c.1 per il lavoro) e
 *   l'imposta lorda, nel limite di 1.200 euro;
 * - oltre 28.000: zero.
 * Scelta prudente dichiarata: nella somma delle detrazioni non entrano
 * l'ulteriore detrazione del cuneo fiscale (L. 207/2024) né la
 * maggiorazione di 65 euro dell'art. 13 c. 1.1, perché la norma richiama
 * solo l'art. 13 c.1. Ignorate le detrazioni per oneri (art. 15), fuori
 * dal modello.
 */
export function calcolaTrattamentoIntegrativo(
  reddito: number,
  parametri: Parametri,
  profilo: ProfiloFamiliare = PROFILO_STANDARD
): number {
  const t = parametri.trattamento_integrativo;
  if (reddito > t.soglia_max) return 0;
  const irpefLorda = calcolaIrpefLorda(reddito, parametri);
  const detrazioneLavoro = detrazioneLavoroComma1(reddito, parametri);
  if (reddito <= t.soglia_piena) {
    return irpefLorda > detrazioneLavoro - t.riduzione_capienza ? t.importo : 0;
  }
  const familiari = calcolaDetrazioniFamiliari(reddito, profilo, parametri);
  const differenza = familiari.coniuge + familiari.figli + detrazioneLavoro - irpefLorda;
  return Math.min(t.importo, Math.max(0, differenza));
}

/**
 * Verifica la coerenza del profilo familiare: numeri di figli interi non
 * negativi, figli 21-29 non più dei figli a carico, quota 0,5 o 1.
 * @throws Error con messaggio in italiano se il profilo non è valido.
 */
export function validaProfilo(profilo: ProfiloFamiliare): void {
  const intero = (n: unknown) => typeof n === "number" && Number.isInteger(n) && n >= 0;
  if (!intero(profilo.figliACarico) || !intero(profilo.figli21a29)) {
    throw new Error("Profilo familiare non valido: il numero di figli deve essere un intero maggiore o uguale a zero.");
  }
  if (profilo.figli21a29 > profilo.figliACarico) {
    throw new Error("Profilo familiare non valido: i figli tra 21 e 29 anni non possono superare i figli a carico.");
  }
  if (typeof profilo.coniugeACarico !== "boolean") {
    throw new Error("Profilo familiare non valido: indicare se il coniuge è a carico.");
  }
  if (profilo.quotaDetrazioneFigli !== 0.5 && profilo.quotaDetrazioneFigli !== 1) {
    throw new Error("Profilo familiare non valido: la quota della detrazione figli deve essere 50% o 100%.");
  }
}

/**
 * Orchestratore del calcolo completo, nello stesso ordine della busta paga:
 * contributi, imponibile, IRPEF, detrazioni, addizionali, netto.
 * IRPEF e addizionali si calcolano sull'imponibile fiscale, mai sulla RAL.
 * Il profilo familiare è opzionale: senza, si applica il caso standard
 * (nessun familiare a carico).
 * @throws Error se la RAL non è un numero finito maggiore di zero o se il
 * profilo familiare non è coerente.
 */
export function calcolaNetto(
  ral: number,
  parametri: Parametri,
  profilo: ProfiloFamiliare = PROFILO_STANDARD
): RisultatoCalcolo {
  if (typeof ral !== "number" || !Number.isFinite(ral) || ral <= 0) {
    throw new Error("RAL non valida: inserire un importo maggiore di zero.");
  }
  validaProfilo(profilo);

  // (1) Contributi INPS dipendente
  const contributiInps = calcolaContributiInps(ral, parametri);
  // (2) Imponibile fiscale
  const imponibileFiscale = ral - contributiInps;
  // (3) IRPEF lorda
  const irpefLorda = calcolaIrpefLorda(imponibileFiscale, parametri);
  // (4) Detrazione lavoro dipendente
  const detrazioneLavoro = calcolaDetrazioneLavoro(imponibileFiscale, parametri);
  // (5) Cuneo fiscale: somma esente OPPURE ulteriore detrazione
  const { sommaEsente, ulterioreDetrazione } = calcolaCuneoFiscale(imponibileFiscale, parametri);
  // (5-bis) Detrazioni per familiari a carico (art. 12 TUIR), sullo stesso reddito
  const { coniuge: detrazioneConiuge, figli: detrazioneFigli } = calcolaDetrazioniFamiliari(
    imponibileFiscale,
    profilo,
    parametri
  );
  // (6) IRPEF netta, mai negativa
  const irpefNetta = Math.max(
    0,
    irpefLorda - detrazioneLavoro - ulterioreDetrazione - detrazioneConiuge - detrazioneFigli
  );
  // (7-8) Addizionali regionale Lombardia e comunale Milano: dovute solo se è dovuta
  // l'IRPEF al netto delle detrazioni (art. 50 c. 2 D.Lgs. 446/1997; art. 1 c. 4
  // D.Lgs. 360/1998). Quando dovute, si applicano all'intero imponibile.
  const irpefDovuta = irpefNetta > 0;
  const addizionaleRegionale = irpefDovuta ? calcolaAddizionaleRegionale(imponibileFiscale, parametri) : 0;
  const addizionaleComunale = irpefDovuta ? calcolaAddizionaleComunale(imponibileFiscale, parametri) : 0;
  // (8-bis) Trattamento integrativo, somma aggiunta al netto (non riduce l'IRPEF)
  const trattamentoIntegrativo = calcolaTrattamentoIntegrativo(imponibileFiscale, parametri, profilo);
  // (9) Netto annuo
  const nettoAnnuo =
    imponibileFiscale -
    irpefNetta -
    addizionaleRegionale -
    addizionaleComunale +
    sommaEsente +
    trattamentoIntegrativo;
  // (10) Netto mensile su 13 mensilità
  const nettoMensile = nettoAnnuo / parametri.mensilita.valore;

  // Solo le voci effettivamente trattenute: somma esente e trattamento integrativo
  // sono somme aggiunte e restano fuori (con loro RAL - netto può essere negativo)
  const totaleTrattenute = contributiInps + irpefNetta + addizionaleRegionale + addizionaleComunale;
  const aliquotaEffettiva = totaleTrattenute / ral;

  return {
    ral,
    contributiInps,
    imponibileFiscale,
    irpefLorda,
    detrazioneLavoro,
    cuneo: ulterioreDetrazione,
    irpefNetta,
    addizionaleRegionale,
    addizionaleComunale,
    detrazioneConiuge,
    detrazioneFigli,
    sommaEsente,
    trattamentoIntegrativo,
    nettoAnnuo,
    nettoMensile,
    totaleTrattenute,
    aliquotaEffettiva,
    costoAzienda: calcolaCostoAzienda(ral, parametri),
    profilo,
  };
}
