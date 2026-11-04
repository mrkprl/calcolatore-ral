import AssunzioniLimiti from "@/components/AssunzioniLimiti";
import BannerParametri from "@/components/BannerParametri";
import Calcolatore from "@/components/Calcolatore";

export default function Home() {
  return (
    <>
      <BannerParametri />

      <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 pb-16 sm:px-6">
        <Calcolatore />

        <div className="mt-16">
          <AssunzioniLimiti />
        </div>
      </main>

      <footer className="border-t border-bordo px-4 py-6 text-center text-xs leading-relaxed text-grigio">
        Prototipo dimostrativo: non sostituisce un calcolo professionale. Il calcolo avviene
        interamente nel browser: la RAL e i dati familiari che inserisci non lasciano il tuo
        dispositivo. Le visite sono contate in forma anonima con Vercel Web Analytics, senza
        cookie.
      </footer>
    </>
  );
}
