"use client";

/**
 * Interruttore on/off accessibile (role="switch"), con etichetta,
 * descrizione e un eventuale motivo di disattivazione.
 */
export default function Interruttore({
  id,
  etichetta,
  descrizione,
  attivo,
  onChange,
  disabilitato = false,
  extra,
}: {
  id: string;
  etichetta: string;
  descrizione?: React.ReactNode;
  attivo: boolean;
  onChange: (attivo: boolean) => void;
  disabilitato?: boolean;
  extra?: React.ReactNode;
}) {
  const acceso = attivo && !disabilitato;
  return (
    <div className={`flex items-start justify-between gap-4 ${disabilitato ? "opacity-70" : ""}`}>
      <div className="min-w-0">
        <label htmlFor={id} className={`text-sm font-semibold ${disabilitato ? "" : "cursor-pointer"}`}>
          {etichetta}
        </label>
        {extra}
        {descrizione && (
          <p id={`${id}-descrizione`} className="mt-0.5 text-xs leading-snug text-grigio">
            {descrizione}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={acceso}
        aria-describedby={descrizione ? `${id}-descrizione` : undefined}
        disabled={disabilitato}
        onClick={() => onChange(!attivo)}
        className={`relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors disabled:cursor-not-allowed ${
          acceso ? "border-inchiostro bg-inchiostro" : "border-bordo-forte bg-fondo-3"
        }`}
      >
        <span
          aria-hidden
          className={`inline-block size-5 rounded-full shadow-sm transition-transform motion-reduce:transition-none ${
            acceso ? "translate-x-[22px] bg-lime-500" : "translate-x-[3px] bg-white"
          }`}
        />
      </button>
    </div>
  );
}
