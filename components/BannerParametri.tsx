"use client";

import { useSyncExternalStore } from "react";
import parametri from "@/lib/parametri-2026.json";
import { formattaData } from "@/lib/formato";

const nessunaSottoscrizione = () => () => {};

/**
 * Banner di validità dei parametri, sempre visibile. Se l'anno corrente
 * supera l'anno d'imposta dei parametri, mostra un avviso evidente.
 * L'anno corrente è letto solo sul client (sul server vale null) per
 * mantenere la pagina statica senza rischi di mismatch di idratazione.
 */
export default function BannerParametri() {
  const annoCorrente = useSyncExternalStore(
    nessunaSottoscrizione,
    () => new Date().getFullYear(),
    () => null
  );

  const parametriObsoleti = annoCorrente !== null && annoCorrente > parametri.anno_imposta;

  return (
    <div className="w-full text-center text-xs">
      <p className="bg-inchiostro px-4 py-2.5 text-white/80">
        Parametri anno d&apos;imposta {parametri.anno_imposta}, verificati in data{" "}
        {formattaData(parametri.parametri_verificati_il)}.{" "}
        <a
          href="#assunzioni"
          className="font-semibold text-lime-500 underline underline-offset-2 hover:text-lime-300"
          onClick={() => document.getElementById("assunzioni")?.setAttribute("open", "")}
        >
          Fonti e assunzioni
        </a>
      </p>
      {parametriObsoleti && (
        <p role="alert" className="bg-ambra-chiaro px-4 py-2 font-medium text-ambra">
          Attenzione: l&apos;anno corrente ({annoCorrente}) è successivo all&apos;anno
          d&apos;imposta dei parametri. Verificare gli aggiornamenti normativi prima di usare i
          risultati.
        </p>
      )}
    </div>
  );
}
