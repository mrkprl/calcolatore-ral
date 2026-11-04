"use client";

import type { ProfiloFamiliare as Profilo } from "@/lib/calcolo";
import Interruttore from "@/components/Interruttore";
import Stepper from "@/components/Stepper";

const MAX_FIGLI = 6;

/**
 * Situazione familiare: figli a carico, di cui tra 21 e 29 anni, coniuge a
 * carico e ripartizione della detrazione figli tra i genitori.
 */
export default function ProfiloFamiliare({
  profilo,
  onChange,
}: {
  profilo: Profilo;
  onChange: (profilo: Profilo) => void;
}) {
  function impostaFigli(figliACarico: number) {
    onChange({
      ...profilo,
      figliACarico,
      figli21a29: Math.min(profilo.figli21a29, figliACarico),
    });
  }

  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-grigio">
        La tua famiglia
      </legend>

      <Stepper
        id="figli"
        etichetta="Figli a carico"
        descrizione="Di qualunque età: contano per la soglia dei fringe benefit."
        valore={profilo.figliACarico}
        min={0}
        max={MAX_FIGLI}
        onChange={impostaFigli}
      />

      {profilo.figliACarico > 0 && (
        <Stepper
          id="figli-21-29"
          etichetta="Di cui tra 21 e 29 anni"
          descrizione="Solo loro danno la detrazione in busta. Sotto i 21 anni c'è l'assegno unico INPS, che non passa dalla busta paga."
          valore={profilo.figli21a29}
          min={0}
          max={profilo.figliACarico}
          onChange={(figli21a29) => onChange({ ...profilo, figli21a29 })}
        />
      )}

      {profilo.figli21a29 > 0 && profilo.coniugeACarico && (
        <p className="rounded-2xl bg-fondo-2 px-3 py-2 text-xs leading-snug text-grigio-scuro">
          Con il coniuge a carico la detrazione figli spetta a te per intero.
        </p>
      )}

      {profilo.figli21a29 > 0 && !profilo.coniugeACarico && (
        <div>
          <p id="quota-figli" className="text-sm font-semibold">
            Detrazione figli che ti spetta
          </p>
          <div
            role="radiogroup"
            aria-labelledby="quota-figli"
            className="mt-2 inline-flex rounded-full border border-bordo-forte bg-fondo-2 p-1"
          >
            {([0.5, 1] as const).map((quota) => {
              const selezionata = profilo.quotaDetrazioneFigli === quota;
              return (
                <label
                  key={quota}
                  className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-inchiostro ${
                    selezionata ? "bg-inchiostro text-white" : "text-grigio-scuro hover:text-inchiostro"
                  }`}
                >
                  <input
                    type="radio"
                    name="quota-figli"
                    value={quota}
                    checked={selezionata}
                    onChange={() => onChange({ ...profilo, quotaDetrazioneFigli: quota })}
                    className="sr-only"
                  />
                  {quota === 0.5 ? "50%, divisa" : "100%, tutta a te"}
                </label>
              );
            })}
          </div>
        </div>
      )}

      <Interruttore
        id="coniuge"
        etichetta="Coniuge a carico"
        descrizione="Reddito del coniuge entro 2.840,51 € annui."
        attivo={profilo.coniugeACarico}
        onChange={(coniugeACarico) => onChange({ ...profilo, coniugeACarico })}
      />
    </fieldset>
  );
}
