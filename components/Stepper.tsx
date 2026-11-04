"use client";

/**
 * Contatore intero con pulsanti meno e più, limitato tra min e max.
 * Il valore è annunciato dagli screen reader a ogni modifica.
 */
export default function Stepper({
  id,
  etichetta,
  descrizione,
  valore,
  min,
  max,
  onChange,
}: {
  id: string;
  etichetta: string;
  descrizione?: string;
  valore: number;
  min: number;
  max: number;
  onChange: (valore: number) => void;
}) {
  const pulsante =
    "grid size-9 place-items-center rounded-full border border-bordo-forte bg-white text-lg font-semibold leading-none text-inchiostro transition-colors hover:bg-fondo-2 disabled:cursor-not-allowed disabled:opacity-35";

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p id={`${id}-etichetta`} className="text-sm font-semibold">
          {etichetta}
        </p>
        {descrizione && (
          <p id={`${id}-descrizione`} className="mt-0.5 text-xs leading-snug text-grigio">
            {descrizione}
          </p>
        )}
      </div>
      <div
        role="group"
        aria-labelledby={`${id}-etichetta`}
        aria-describedby={descrizione ? `${id}-descrizione` : undefined}
        className="flex shrink-0 items-center gap-2"
      >
        <button
          type="button"
          className={pulsante}
          onClick={() => onChange(Math.max(min, valore - 1))}
          disabled={valore <= min}
          aria-label={`${etichetta}: diminuisci`}
        >
          -
        </button>
        <output aria-live="polite" className="w-6 text-center font-display text-lg font-bold">
          {valore}
        </output>
        <button
          type="button"
          className={pulsante}
          onClick={() => onChange(Math.min(max, valore + 1))}
          disabled={valore >= max}
          aria-label={`${etichetta}: aumenta`}
        >
          +
        </button>
      </div>
    </div>
  );
}
