import type { Metadata } from "next";
import { Mona_Sans, Wix_Madefor_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const monaSans = Mona_Sans({
  variable: "--font-mona",
  subsets: ["latin"],
  axes: ["wdth"],
});

const wixMadefor = Wix_Madefor_Display({
  variable: "--font-wix",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stesso costo per l'azienda, più netto in busta - Simulatore 2026",
  description:
    "Dalla RAL al netto 2026 e al costo azienda, con figli e coniuge a carico. Poi confronta come dare un budget in più: aumento in RAL oppure fringe benefit, buoni pasto, welfare e premio di risultato, a parità di costo per l'azienda. Prototipo dimostrativo, Milano.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className={`${monaSans.variable} ${wixMadefor.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
