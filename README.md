# Calcolatore RAL: dalla RAL al netto, voce per voce

Simulatore web della busta paga 2026 per un dipendente residente a Milano
(Lombardia). Risponde a una domanda precisa: **a parità di costo per l'azienda,
quanto netto in più può arrivare in busta al dipendente?**

**Demo:** [calcolatore-ral.vercel.app](https://calcolatore-ral.vercel.app)

> È una stima: non sostituisce la busta paga reale.

## Cosa calcola

1. **La busta di oggi**: dalla RAL e dal profilo familiare calcola netto annuo,
   netto mensile, ogni trattenuta (INPS, IRPEF, addizionali, detrazioni,
   taglio del cuneo, trattamento integrativo) e il **costo azienda**, con la
   ripartizione di ogni 100 euro spesi dal datore di lavoro.
2. **Un budget in più, due modi di darlo**: lo stesso budget, espresso in costo
   azienda, dato come aumento di RAL oppure come pacchetto ottimizzato con le
   leve esenti o agevolate del 2026. Mostra il netto in più, quanto costerebbe
   dare lo stesso netto con un aumento e quindi quanto risparmia l'azienda.

Esempio, RAL 35.000 e budget 2.000 euro con un figlio a carico: l'aumento in RAL
lascia circa 600 euro netti, il fringe benefit ne lascia 2.000. Per dare lo stesso
netto con un aumento servirebbero circa 7.117 euro di costo azienda.

## Funzioni

- **Profilo familiare**: numero di figli a carico, quanti tra 21 e 29 anni,
  coniuge a carico, detrazione per i figli intera o divisa al 50% tra i genitori.
- **Costo azienda**: contributi INPS a carico del datore, INAIL e TFR, sommati
  alla RAL.
- **Confronto tra aumento in RAL e pacchetto** a parità di costo azienda, con:
  - **fringe benefit** fino a 1.000 euro, 2.000 euro con figli a carico;
  - **buoni pasto elettronici** esenti fino a 10 euro al giorno;
  - **welfare aziendale** (art. 51 c. 2 TUIR), esente senza tetto;
  - **premio di risultato** con imposta sostitutiva all'1% fino a 5.000 euro,
    per redditi fino a 80.000 euro.
- Calcolo dal vivo mentre si digita: la RAL inserita non lascia il browser.

## Regole fiscali 2026 coperte

- Contributi INPS a carico del dipendente al 9,19%.
- Scaglioni IRPEF 2026: 23%, 33%, 43%.
- Detrazione per lavoro dipendente, con la maggiorazione di 65 euro.
- Taglio del cuneo fiscale strutturale: somma esente o ulteriore detrazione
  secondo il reddito.
- Addizionale regionale Lombardia a scaglioni e addizionale comunale Milano
  (0,8% con esenzione fino a 23.000 euro), azzerate quando l'IRPEF netta è zero.
- Trattamento integrativo fino a 1.200 euro.
- Detrazioni per coniuge e per figli a carico dai 21 ai 29 anni, con i rapporti
  troncati alla quarta cifra decimale.
- Fringe benefit, buoni pasto, welfare e premio di risultato come sopra.

## Assunzioni e limiti

1. **Contributi INPS al 9,19% su tutta la RAL**. Ignorati: contributo aggiuntivo
   IVS dell'1% oltre la soglia annua, quota FIS/CIGS, massimale contributivo.
2. **Reddito complessivo uguale all'imponibile fiscale**: nessun altro reddito,
   nessun onere deducibile.
3. **13 mensilità**: il mensile mostrato è il netto annuo diviso 13. Nella realtà
   la tredicesima è tassata senza detrazioni mensili, quindi il suo netto è più
   basso delle mensilità ordinarie.
4. **Anno intero**: detrazioni non riproporzionate sui giorni, nessun conguaglio.
5. **Costo azienda con valori tipici** (impiegato, azienda con più di 15
   dipendenti, industria e servizi): INPS datore 30% (forchetta reale 29-31%),
   INAIL 0,4%, TFR 6,91%. Esclusi i fondi previsti dai contratti collettivi.
6. **Detrazioni familiari** solo per familiari fiscalmente a carico; in caso di
   incapienza la parte non usata si perde. Sotto i 21 anni il figlio non dà
   detrazione (c'è l'assegno unico, fuori busta) ma conta per la soglia fringe.
7. **Pacchetto**: vale per somme in più rispetto allo stipendio pattuito. Le leve
   si riempiono in ordine di convenienza (fringe, buoni pasto, welfare, premio,
   resto in RAL). Welfare e premio richiedono un regolamento o un accordo
   aziendale; per il premio l'imponibile dell'anno fa da proxy del reddito
   dell'anno precedente e non si calcola il TFR.
8. **Solo Milano e Lombardia**: nessun selettore di regione o comune.
9. Nel trattamento integrativo, tra 15.000 e 28.000 euro, la verifica di
   incapienza considera solo le detrazioni per lavoro e per familiari.

## Fonti normative

| Voce | Fonte | Verificato il |
|---|---|---|
| Contributi INPS 9,19% | L. 335/1995; Circolare INPS n. 14/2026 | 2026-08-07 |
| Scaglioni IRPEF 2026 (23%, 33%, 43%) | Art. 11 c. 1 TUIR, mod. L. 199/2025 (Bilancio 2026) | 2026-08-07 |
| Detrazione lavoro dipendente (con maggiorazione 65 euro) | Art. 13 c. 1 e c. 1.1 TUIR | 2026-11-04 |
| Taglio cuneo fiscale (somma esente o detrazione) | Art. 1 c. 4-9 L. 207/2024, strutturale dal 2026 | 2026-08-07 |
| Addizionale regionale Lombardia (scaglioni) | Art. 72 c. 1 l.r. 10/2003, scaglioni l.r. 5/2022 | 2026-08-08 |
| Addizionale comunale Milano (0,8%, esenzione fino a 23.000 euro) | Delib. C.C. Milano 46/2020 | 2026-08-07 |
| Addizionali azzerate con IRPEF zero | Art. 50 c. 2 D.Lgs. 446/1997 | 2026-11-04 |
| Trattamento integrativo fino a 1.200 euro | Art. 1 DL 3/2020, mod. L. 234/2021 | 2026-11-04 |
| Detrazioni coniuge e figli | Art. 12 TUIR (testo vigente); Circ. AdE 4/E 2025 | 2026-11-04 |
| Fringe benefit 1.000 / 2.000 euro con figli | Art. 51 c. 3 TUIR; art. 1 c. 390-391 L. 207/2024 | 2026-11-04 |
| Buoni pasto elettronici 10 euro al giorno | Art. 51 c. 2 lett. c TUIR, mod. art. 1 c. 14 L. 199/2025 | 2026-11-04 |
| Welfare aziendale senza tetto | Art. 51 c. 2 lett. f, f-bis, f-ter, d-bis TUIR | 2026-11-04 |
| Premio di risultato 1% fino a 5.000 euro | Art. 1 c. 9 L. 199/2025; L. 208/2015; Ris. AdE 22/E 2026 | 2026-11-04 |
| Costo azienda (valori tipici) | Voci contributive di legge; art. 2120 c.c.; L. 297/1982 | 2026-11-04 |

Ogni costante, con la sua fonte e la data di verifica, sta in
`lib/parametri-2026.json`. Gerarchia delle fonti: prima Normattiva, poi Agenzia
delle Entrate, INPS, Dipartimento delle Finanze e delibere locali.

## Stack e architettura

Next.js 16 (App Router), TypeScript, Tailwind CSS, Framer Motion, Vitest.
Nessun database e nessun backend: il calcolo è fatto da funzioni pure che girano
nel browser. L'unica chiamata di rete a runtime è il conteggio anonimo delle
visite, senza cookie.

```
lib/parametri-2026.json   costanti fiscali, ognuna con fonte e data di verifica
lib/calcolo.ts            netto, detrazioni familiari, costo azienda
lib/pacchetto.ts          confronto a parità di costo: aumento contro pacchetto
lib/*.test.ts             test sui casi di riferimento e sugli edge case
app/, components/         interfaccia: importa da lib/, mai il contrario
```

Regole: nessuna costante fiscale fuori dal JSON; arrotondamenti solo in
visualizzazione; le imposte ricevono sempre l'imponibile fiscale, mai la RAL.

## Avvio e test

Serve Node.js 20 o successivo.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # test Vitest, senza avviare Next
npm run build    # build di produzione
```

I test coprono tre casi completi calcolati a mano (RAL 25.000, 30.000 e 50.000),
i bordi degli scaglioni IRPEF e dello scalino dell'addizionale comunale, il
taglio del cuneo, il trattamento integrativo, le detrazioni familiari, il costo
azienda e il confronto a parità di costo, verificato anche contro una ricerca a
forza bruta. Il netto del profilo base è stato inoltre confrontato con due
calcolatori pubblici: con il primo lo scarto è di pochi centesimi, dovuto al
troncamento dei rapporti delle detrazioni; con il secondo le differenze (0,1-1%)
si spiegano con l'aliquota 2025 sul secondo scaglione e con addizionali
forfettarie.

## Aggiornare i parametri per un nuovo anno

1. Creare `lib/parametri-2027.json` copiando la struttura del 2026.
2. Verificare ogni costante sulla fonte primaria e aggiornare `fonte` e
   `verificato_il`.
3. Aggiornare i valori attesi dei test.
4. Puntare gli import dell'app al nuovo file.

## Autore

Marco Parolin
