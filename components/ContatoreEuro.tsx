"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";
import { formattaEuro } from "@/lib/formato";

/**
 * Numero animato in count-up (circa 0,6 secondi) per i valori principali.
 * Parte dal valore reale, così l'HTML statico mostra già i numeri giusti;
 * l'animazione scatta ai cambi successivi.
 * Il valore mostrato è formattato in euro interi: l'arrotondamento
 * avviene solo qui, in visualizzazione.
 */
export default function ContatoreEuro({
  valore,
  className,
  conSegno = false,
}: {
  valore: number;
  className?: string;
  /** Antepone "+" ai valori positivi (per i delta). */
  conSegno?: boolean;
}) {
  const valoreAnimato = useMotionValue(valore);
  const testo = useTransform(valoreAnimato, (v) =>
    conSegno && Math.round(v) > 0 ? `+${formattaEuro(v)}` : formattaEuro(v)
  );

  useEffect(() => {
    const animazione = animate(valoreAnimato, valore, { duration: 0.6, ease: "easeOut" });
    return () => animazione.stop();
  }, [valoreAnimato, valore]);

  return <motion.span className={className}>{testo}</motion.span>;
}
