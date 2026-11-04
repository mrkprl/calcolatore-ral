/**
 * Confronto a parità di costo azienda: come dare al dipendente un budget
 * aggiuntivo. Scenario A, tutto come aumento di RAL; scenario B, pacchetto
 * ottimizzato con le leve esenti (fringe benefit, buoni pasto, welfare,
 * premio di risultato) e l'eventuale resto in RAL.
 * Solo funzioni pure, parametri da parametri-2026.json.
 */
import { calcolaNetto, validaProfilo, type Parametri, type ProfiloFamiliare } from "./calcolo";

export type Leva = "fringe" | "buoniPasto" | "welfare" | "premioRisultato" | "ral";

export interface LeveAttive {
  fringe: boolean;
  buoniPasto: boolean;
  welfare: boolean;
  premioRisultato: boolean;
}

export interface OpzioniPacchetto {
  /** Budget aggiuntivo annuo, espresso come costo totale per l'azienda. */
  budget: number;
  leve: LeveAttive;
}

/** Quota del budget assegnata a una leva. */
export interface Allocazione {
  leva: Leva;
  /** Quanto costa all'azienda questa quota. */
  costoAzienda: number;
  /** Importo lordo erogato (per fringe, buoni e welfare coincide con il costo). */
  lordo: number;
  /** Quanto arriva netto al dipendente. */
  netto: number;
}

export interface Scenario {
  allocazioni: Allocazione[];
  costoAzienda: number;
  nettoAggiuntivo: number;
  /** netto / costo, frazione 0-1: "su 100 euro spesi ne arrivano X". */
  efficienza: number;
}

export interface ConfrontoPacchetto {
  budget: number;
  /** Soglia fringe applicata al profilo: 1.000 o 2.000 euro con figli a carico. */
  sogliaFringe: number;
  /**
   * false se il reddito supera la soglia del premio di risultato (80.000).
   * Proxy del reddito di lavoro dipendente dell'anno precedente: imponibile
   * fiscale dell'anno corrente (RAL - INPS dipendente).
   */
  premioRisultatoAmmesso: boolean;
  /**
   * true se il premio di risultato compare nello scenario B scelto. false se
   * non è attivo o non ammesso, se il budget è già assorbito dalle leve
   * precedenti, o se a questa RAL l'aumento di RAL rende di più.
   */
  premioRisultatoConveniente?: boolean;
  /** Scenario A: tutto il budget in aumento di RAL. allocazioni contiene una sola voce "ral". */
  aumentoRal: Scenario & { ralAggiuntiva: number };
  /**
   * Scenario B: leve esenti nell'ordine fringe, buoni pasto, welfare, premio di risultato, resto in RAL.
   * Tra le combinazioni delle leve attive si tiene quella con il netto più alto, quindi non è mai
   * peggiore dello scenario A (che è la combinazione senza leve).
   */
  ottimizzato: Scenario;
  /** ottimizzato.nettoAggiuntivo - aumentoRal.nettoAggiuntivo. */
  guadagnoNetto: number;
  /** Costo azienda che servirebbe per dare lo stesso netto dello scenario B con un aumento di RAL. */
  costoEquivalenteRal: number;
  /** costoEquivalenteRal - budget: quanto l'azienda risparmia a parità di netto. */
  risparmioAzienda: number;
  /**
   * Netto aggiuntivo dello scenario B con il profilo opposto sui figli
   * (con figli se l'utente non ne ha, senza figli se ne ha), a parità di
   * budget e leve. Alimenta il messaggio "con figli a carico prendi X in più".
   */
  nettoProfiloAlternativo: { conFigli: number; senzaFigli: number };
}

/** Residui di budget sotto mezzo centesimo si considerano zero (errori di virgola mobile). */
const EPSILON_BUDGET = 0.005;

/** Differenze di netto sotto il millesimo di euro tra combinazioni di leve si considerano pari. */
const EPSILON_NETTO = 0.001;

/** Ampiezza in euro di RAL sotto la quale si ferma la bisezione del costo equivalente. */
const TOLLERANZA_BISEZIONE = 0.001;

/**
 * Costo per l'azienda di 1 euro di RAL: 1 + contributi datore + INAIL + TFR
 * (con i valori del JSON 1,3731).
 */
export function fattoreCostoRal(parametri: Parametri): number {
  const c = parametri.costo_azienda;
  return 1 + c.contributi_datore + c.inail + c.tfr;
}

/**
 * Soglia di esenzione dei fringe benefit per il profilo: 2.000 euro con
 * almeno un figlio fiscalmente a carico, altrimenti 1.000 (art. 51 c. 3
 * TUIR; art. 1 c. 390-391 L. 207/2024).
 */
export function sogliaFringeBenefit(profilo: ProfiloFamiliare, parametri: Parametri): number {
  const f = parametri.fringe_benefit;
  return profilo.figliACarico >= 1 ? f.soglia_con_figli : f.soglia;
}

/**
 * Netto aggiuntivo annuo di un aumento di RAL, a parità di profilo.
 * Può essere negativo (scalino dell'addizionale comunale di Milano).
 */
function nettoAumentoRal(
  ral: number,
  aumento: number,
  profilo: ProfiloFamiliare,
  parametri: Parametri,
  nettoBase: number
): number {
  if (aumento <= 0) return 0;
  return calcolaNetto(ral + aumento, parametri, profilo).nettoAnnuo - nettoBase;
}

function scenario(allocazioni: Allocazione[]): Scenario {
  const costoAzienda = allocazioni.reduce((s, a) => s + a.costoAzienda, 0);
  const nettoAggiuntivo = allocazioni.reduce((s, a) => s + a.netto, 0);
  return {
    allocazioni,
    costoAzienda,
    nettoAggiuntivo,
    efficienza: costoAzienda > 0 ? nettoAggiuntivo / costoAzienda : 0,
  };
}

/**
 * Riempimento greedy del budget con le leve indicate, nell'ordine dalla più
 * efficiente alla meno efficiente.
 * 1. Fringe benefit fino alla soglia (art. 51 c. 3 TUIR): esente da IRPEF e
 *    contributi, quindi costo = lordo = netto. La soglia non si supera mai:
 *    oltre, l'intero importo diventerebbe imponibile.
 * 2. Buoni pasto elettronici fino a 10 euro x giorni lavorati (art. 51 c. 2
 *    lett. c TUIR). Costo = lordo = netto.
 * 3. Welfare (art. 51 c. 2 lett. f, f-bis, f-ter, d-bis TUIR): senza tetto,
 *    assorbe tutto il residuo. Costo = lordo = netto.
 * 4. Premio di risultato (L. 208/2015 c. 182-189; L. 199/2025 art. 1 c. 9),
 *    solo se ammesso: contributi datore e INAIL dovuti, TFR non calcolato
 *    (semplificazione dichiarata); netto = (lordo - INPS dipendente) x
 *    (1 - imposta sostitutiva). Non entra nel reddito complessivo.
 * 5. Resto come aumento di RAL, con netto marginale da calcolaNetto.
 */
function scenarioGreedy(
  ral: number,
  profilo: ProfiloFamiliare,
  opzioni: OpzioniPacchetto,
  parametri: Parametri,
  premioAmmesso: boolean
): Scenario {
  const allocazioni: Allocazione[] = [];
  let residuo = opzioni.budget;

  const esente = (leva: Leva, tetto: number) => {
    if (residuo < EPSILON_BUDGET) return;
    const importo = Math.min(residuo, tetto);
    allocazioni.push({ leva, costoAzienda: importo, lordo: importo, netto: importo });
    residuo -= importo;
  };

  if (opzioni.leve.fringe) esente("fringe", sogliaFringeBenefit(profilo, parametri));
  if (opzioni.leve.buoniPasto) {
    const b = parametri.buoni_pasto;
    esente("buoniPasto", b.elettronico_giornaliero * b.giorni_lavorati);
  }
  if (opzioni.leve.welfare) esente("welfare", Infinity);

  if (opzioni.leve.premioRisultato && premioAmmesso && residuo >= EPSILON_BUDGET) {
    const c = parametri.costo_azienda;
    const p = parametri.premio_risultato;
    const caricoDatore = 1 + c.contributi_datore + c.inail;
    const lordo = Math.min(residuo / caricoDatore, p.limite_lordo);
    const costoAzienda = lordo * caricoDatore;
    const netto = (lordo - lordo * parametri.inps.aliquota_dipendente) * (1 - p.aliquota_sostitutiva);
    allocazioni.push({ leva: "premioRisultato", costoAzienda, lordo, netto });
    residuo -= costoAzienda;
  }

  if (residuo >= EPSILON_BUDGET) {
    const nettoBase = calcolaNetto(ral, parametri, profilo).nettoAnnuo;
    const lordo = residuo / fattoreCostoRal(parametri);
    allocazioni.push({
      leva: "ral",
      costoAzienda: residuo,
      lordo,
      netto: nettoAumentoRal(ral, lordo, profilo, parametri, nettoBase),
    });
  }

  return scenario(allocazioni);
}

/** Ordine di riempimento delle leve esenti. */
const ORDINE_LEVE: (keyof LeveAttive)[] = ["fringe", "buoniPasto", "welfare", "premioRisultato"];

/**
 * Scenario B: il riempimento greedy non è sempre il migliore. Con RAL bassa
 * il premio di risultato (gravato dai contributi) rende meno della RAL
 * marginale, e vicino agli scalini del netto (trattamento integrativo,
 * maggiorazioni, cuneo) un piccolo aumento di RAL può rendere più del suo
 * costo. Si valuta quindi il greedy su ogni sottoinsieme delle leve attive,
 * compreso quello vuoto (tutto in RAL, cioè lo scenario A), e si tiene il
 * netto più alto. A parità di netto vince il sottoinsieme con tutte le leve
 * attive, valutato per primo. Al massimo 16 combinazioni.
 */
function scenarioOttimizzato(
  ral: number,
  profilo: ProfiloFamiliare,
  opzioni: OpzioniPacchetto,
  parametri: Parametri,
  premioAmmesso: boolean
): Scenario {
  const attive = ORDINE_LEVE.filter((l) => opzioni.leve[l]);
  let migliore: Scenario | null = null;
  // maschera da tutte le leve attive (valutata per prima) fino a nessuna
  for (let maschera = (1 << attive.length) - 1; maschera >= 0; maschera--) {
    const leve: LeveAttive = { fringe: false, buoniPasto: false, welfare: false, premioRisultato: false };
    attive.forEach((l, i) => {
      if (maschera & (1 << i)) leve[l] = true;
    });
    const candidato = scenarioGreedy(ral, profilo, { ...opzioni, leve }, parametri, premioAmmesso);
    if (migliore === null || candidato.nettoAggiuntivo > migliore.nettoAggiuntivo + EPSILON_NETTO) {
      migliore = candidato;
    }
  }
  return migliore as Scenario;
}

/** Reddito al quale l'IRPEF lorda a scaglioni raggiunge l'importo dato (inversa della progressiva). */
function redditoPerImposta(imposta: number, parametri: Parametri): number {
  let sogliaPrecedente = 0;
  let impostaCumulata = 0;
  for (const s of parametri.irpef.scaglioni) {
    const tetto = s.fino_a ?? Infinity;
    const impostaScaglione = (tetto - sogliaPrecedente) * s.aliquota;
    if (impostaCumulata + impostaScaglione >= imposta) {
      return sogliaPrecedente + (imposta - impostaCumulata) / s.aliquota;
    }
    impostaCumulata += impostaScaglione;
    sogliaPrecedente = tetto;
  }
  return sogliaPrecedente;
}

/**
 * Soglie di reddito (imponibile fiscale) dove il netto può saltare: limiti
 * di scaglioni, fasce di detrazione, cuneo, maggiorazioni, trattamento
 * integrativo e soglia di esenzione comunale. Includerne qualcuna in più è innocuo.
 */
function soglieDiReddito(parametri: Parametri): number[] {
  const d = parametri.detrazione_lavoro_dipendente;
  const c = parametri.cuneo_fiscale;
  const coniuge = parametri.detrazioni_familiari.coniuge;
  const t = parametri.trattamento_integrativo;
  const soglie: (number | null)[] = [
    ...parametri.irpef.scaglioni.map((s) => s.fino_a),
    ...parametri.addizionale_regionale.scaglioni.map((s) => s.fino_a),
    parametri.addizionale_comunale.soglia_esenzione,
    d.fascia_1.soglia_reddito,
    d.fascia_2.soglia_reddito,
    d.fascia_3.soglia_reddito,
    d.maggiorazione.reddito_min,
    d.maggiorazione.reddito_max,
    c.somma_esente.soglia_reddito,
    ...c.somma_esente.fasce.map((f) => f.fino_a),
    c.ulteriore_detrazione.soglia_importo_pieno,
    c.ulteriore_detrazione.soglia_azzeramento,
    coniuge.fascia_1.soglia_reddito,
    coniuge.fascia_2.soglia_reddito,
    coniuge.fascia_3.soglia_reddito,
    ...coniuge.maggiorazioni.flatMap((m) => [m.reddito_oltre, m.fino_a]),
    t.soglia_piena,
    t.soglia_max,
    // fino a 15.000 il trattamento integrativo scatta quando l'imposta lorda supera la detrazione - 75
    redditoPerImposta(d.fascia_1.importo - t.riduzione_capienza, parametri),
  ];
  return soglie.filter((s): s is number => s !== null);
}

/**
 * Redditi dove cambia il troncamento a 4 decimali di un rapporto lineare
 * q = alfa + beta x R (art. 12 c. 4 e art. 13 c. 6 TUIR), compresi tra `da`
 * e `a`: sono i punti in cui q x 10.000 è intero. Ogni cambio produce un
 * micro scalino del netto (centesimi o decimi di euro).
 */
function puntiTroncamento(alfa: number, beta: number, da: number, a: number, decimali: number): number[] {
  if (a <= da) return [];
  const scala = 10 ** decimali;
  const q1 = (alfa + beta * da) * scala;
  const q2 = (alfa + beta * a) * scala;
  const punti: number[] = [];
  for (let j = Math.floor(Math.min(q1, q2)); j <= Math.ceil(Math.max(q1, q2)); j++) {
    const reddito = (j / scala - alfa) / beta;
    if (reddito > da && reddito < a) punti.push(reddito);
  }
  return punti;
}

/**
 * Micro scalini da troncamento tra due redditi: detrazione lavoro (fasce 2
 * e 3, per tutti) e detrazioni familiari che spettano al profilo.
 */
function soglieDiTroncamento(da: number, a: number, profilo: ProfiloFamiliare, parametri: Parametri): number[] {
  const dl = parametri.detrazione_lavoro_dipendente;
  const df = parametri.detrazioni_familiari;
  const punti: number[] = [];
  // lavoro fascia 2: rapporto (28.000 - R) / 13.000; fascia 3: (50.000 - R) / 22.000
  punti.push(
    ...puntiTroncamento(
      dl.fascia_2.soglia_reddito / dl.fascia_2.denominatore,
      -1 / dl.fascia_2.denominatore,
      Math.max(da, dl.fascia_1.soglia_reddito),
      Math.min(a, dl.fascia_2.soglia_reddito),
      dl.decimali_rapporto
    ),
    ...puntiTroncamento(
      dl.fascia_3.soglia_reddito / dl.fascia_3.denominatore,
      -1 / dl.fascia_3.denominatore,
      Math.max(da, dl.fascia_2.soglia_reddito),
      Math.min(a, dl.fascia_3.soglia_reddito),
      dl.decimali_rapporto
    )
  );
  if (profilo.coniugeACarico) {
    const f1 = df.coniuge.fascia_1;
    const f3 = df.coniuge.fascia_3;
    // fascia 1: rapporto R / 15.000
    punti.push(...puntiTroncamento(0, 1 / f1.denominatore, da, Math.min(a, f1.soglia_reddito), df.decimali_rapporto));
    // fascia 3: rapporto (80.000 - R) / 40.000
    punti.push(
      ...puntiTroncamento(
        f3.soglia_reddito / f3.denominatore,
        -1 / f3.denominatore,
        Math.max(da, df.coniuge.fascia_2.soglia_reddito),
        Math.min(a, f3.soglia_reddito),
        df.decimali_rapporto
      )
    );
  }
  if (profilo.figli21a29 > 0) {
    // rapporto (B - R) / B
    const base = df.figli.base_reddito + df.figli.incremento_per_figlio * (profilo.figli21a29 - 1);
    punti.push(...puntiTroncamento(1, -1 / base, da, Math.min(a, base), df.decimali_rapporto));
  }
  return punti;
}

/**
 * Minimo aumento di RAL x tale che netto(ral + x) - netto(ral) >= obiettivo.
 *
 * La funzione netto(RAL) non è monotona: ha scalini, il principale è
 * l'addizionale comunale di Milano (a 23.000 euro di imponibile lo 0,8% si
 * applica a tutto l'imponibile), più quelli di somma esente, maggiorazioni,
 * cuneo e trattamento integrativo, il punto in cui l'IRPEF netta diventa
 * positiva (scattano entrambe le addizionali sull'intero imponibile; dipende
 * dal profilo) e i micro scalini del troncamento a 4 decimali dei rapporti
 * (art. 12 c. 4 e art. 13 c. 6 TUIR). Una bisezione semplice troverebbe un
 * punto qualunque in cui la condizione diventa vera, non il primo.
 *
 * Approccio:
 * 1. si trova un x che soddisfa la condizione raddoppiando l'ampiezza: il
 *    minimo cercato non può stare oltre;
 * 2. si convertono in euro di RAL tutte le soglie di reddito tra la RAL base
 *    e quel valore (soglie dei parametri e cambi di troncamento). Dentro
 *    ogni tratto tra soglie dei parametri l'IRPEF netta è non decrescente,
 *    quindi diventa positiva al più una volta: quel punto si trova con una
 *    bisezione e si aggiunge alle soglie. Tra due soglie consecutive il
 *    netto è continuo e crescente, perché l'aliquota marginale effettiva
 *    resta sotto il 100%;
 * 3. si scorrono i tratti in ordine: nel primo in cui la condizione è vera
 *    all'estremo destro si fa una bisezione, lì esatta perché la funzione è
 *    monotona. Si restituisce l'estremo che soddisfa la condizione, con
 *    tolleranza sotto il centesimo.
 */
export function minimoAumentoRal(
  ral: number,
  obiettivo: number,
  profilo: ProfiloFamiliare,
  parametri: Parametri
): number {
  if (obiettivo <= 0) return 0;
  const nettoBase = calcolaNetto(ral, parametri, profilo).nettoAnnuo;
  const soddisfa = (x: number) => nettoAumentoRal(ral, x, profilo, parametri, nettoBase) >= obiettivo;

  let limite = Math.max(obiettivo, 1);
  for (let i = 0; i < 64 && !soddisfa(limite); i++) limite *= 2;

  const quotaImponibile = 1 - parametri.inps.aliquota_dipendente;
  const redditoBase = ral * quotaImponibile;
  const redditoLimite = (ral + limite) * quotaImponibile;
  const inEuroDiRal = (soglie: number[]) =>
    [...new Set(soglie.map((r) => r / quotaImponibile - ral))].filter((x) => x > 0 && x < limite).sort((x, y) => x - y);

  /** Primo punto di [basso, alto] che soddisfa un predicato monotono, vero in alto e falso in basso. */
  const bisezione = (basso: number, alto: number, predicato: (x: number) => boolean = soddisfa) => {
    while (alto - basso > TOLLERANZA_BISEZIONE) {
      const medio = (basso + alto) / 2;
      if (predicato(medio)) alto = medio;
      else basso = medio;
    }
    return alto;
  };

  // Punti in cui l'IRPEF netta passa da zero a positiva, uno al più per tratto
  const irpefDovuta = (x: number) => calcolaNetto(ral + x, parametri, profilo).irpefNetta > 0;
  const tratti = [0, ...inEuroDiRal(soglieDiReddito(parametri)), limite];
  const inizioImposta: number[] = [];
  for (let i = 0; i + 1 < tratti.length; i++) {
    const da = tratti[i] + TOLLERANZA_BISEZIONE;
    const a = tratti[i + 1] - TOLLERANZA_BISEZIONE;
    if (a > da && !irpefDovuta(da) && irpefDovuta(a)) {
      inizioImposta.push((ral + bisezione(da, a, irpefDovuta)) * quotaImponibile);
    }
  }

  const bordi = inEuroDiRal([
    ...soglieDiReddito(parametri),
    ...inizioImposta,
    ...soglieDiTroncamento(redditoBase, redditoLimite, profilo, parametri),
  ]);
  bordi.push(limite + TOLLERANZA_BISEZIONE);

  let inizio = 0;
  for (const bordo of bordi) {
    if (soddisfa(inizio)) return inizio;
    const fine = bordo - TOLLERANZA_BISEZIONE;
    if (fine > inizio && soddisfa(fine)) return bisezione(inizio, fine);
    inizio = bordo;
  }
  return limite;
}

/**
 * Confronto a parità di costo azienda tra scenario A (tutto il budget in
 * aumento di RAL) e scenario B (pacchetto ottimizzato con le leve attive).
 * Restituisce anche quanto costerebbe all'azienda dare lo stesso netto del
 * pacchetto con un aumento di RAL, e il netto del pacchetto con il profilo
 * opposto sui figli.
 * Semplificazione dichiarata: l'ammissione al premio di risultato usa
 * l'imponibile fiscale corrente come approssimazione del reddito di lavoro
 * dipendente dell'anno precedente.
 * @throws Error se RAL, budget o profilo non sono validi.
 */
export function confrontaPacchetto(
  ral: number,
  profilo: ProfiloFamiliare,
  opzioni: OpzioniPacchetto,
  parametri: Parametri
): ConfrontoPacchetto {
  if (typeof ral !== "number" || !Number.isFinite(ral) || ral <= 0) {
    throw new Error("RAL non valida: inserire un importo maggiore di zero.");
  }
  const budget = opzioni.budget;
  if (typeof budget !== "number" || !Number.isFinite(budget) || budget < 0) {
    throw new Error("Budget non valido: inserire un importo maggiore o uguale a zero.");
  }
  validaProfilo(profilo);

  const k = fattoreCostoRal(parametri);
  // Proxy del reddito di lavoro dipendente dell'anno precedente: imponibile fiscale corrente
  const imponibile = ral * (1 - parametri.inps.aliquota_dipendente);
  const premioRisultatoAmmesso = imponibile <= parametri.premio_risultato.soglia_reddito;

  // Scenario A
  const nettoBase = calcolaNetto(ral, parametri, profilo).nettoAnnuo;
  const ralAggiuntiva = budget / k;
  const nettoA = nettoAumentoRal(ral, ralAggiuntiva, profilo, parametri, nettoBase);
  const aumentoRal = {
    ...scenario([{ leva: "ral", costoAzienda: budget, lordo: ralAggiuntiva, netto: nettoA }]),
    ralAggiuntiva,
  };

  // Scenario B
  const ottimizzato = scenarioOttimizzato(ral, profilo, opzioni, parametri, premioRisultatoAmmesso);

  const costoEquivalenteRal = minimoAumentoRal(ral, ottimizzato.nettoAggiuntivo, profilo, parametri) * k;

  const profiloConFigli = { ...profilo, figliACarico: Math.max(1, profilo.figliACarico) };
  const profiloSenzaFigli = { ...profilo, figliACarico: 0, figli21a29: 0 };
  const nettoProfiloAlternativo = {
    conFigli: scenarioOttimizzato(ral, profiloConFigli, opzioni, parametri, premioRisultatoAmmesso).nettoAggiuntivo,
    senzaFigli: scenarioOttimizzato(ral, profiloSenzaFigli, opzioni, parametri, premioRisultatoAmmesso)
      .nettoAggiuntivo,
  };

  return {
    budget,
    sogliaFringe: sogliaFringeBenefit(profilo, parametri),
    premioRisultatoAmmesso,
    premioRisultatoConveniente: ottimizzato.allocazioni.some((a) => a.leva === "premioRisultato"),
    aumentoRal,
    ottimizzato,
    guadagnoNetto: ottimizzato.nettoAggiuntivo - aumentoRal.nettoAggiuntivo,
    costoEquivalenteRal,
    risparmioAzienda: costoEquivalenteRal - budget,
    nettoProfiloAlternativo,
  };
}
