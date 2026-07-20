import { createFileRoute, Link } from "@tanstack/react-router";
import { STORE_NAME, whatsappUrl } from "@/lib/alemoon";
import { promoHeroImages } from "@/lib/promo-gallery";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="font-display text-2xl tracking-tight">
            {STORE_NAME}
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/catalogo" className="hover:opacity-70">
              Catalogo
            </Link>
            <Link to="/admin" className="text-muted-foreground hover:opacity-70">
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:py-24 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Bisuteria hecha a mano
          </p>
          <h1 className="font-display text-5xl leading-[1.05] md:text-7xl">
            Joyeria para regalar,
            <br />
            <span className="italic text-[color:var(--alemoon-charcoal)]">lucir y recordar.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            Anillos, cadenas, pulseras y piezas especiales con identidad propia. Explora el
            catalogo y escribe por WhatsApp para pedir tu favorita.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/catalogo" className="btn-a11y btn-a11y-primary min-h-12 px-6 text-base">
              Ver el catalogo
            </Link>
            <a
              href={whatsappUrl("Quiero asesoramiento para elegir una pieza")}
              target="_blank"
              rel="noreferrer"
              className="btn-a11y btn-a11y-secondary min-h-12 px-6 text-base"
            >
              Escribir por WhatsApp
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:gap-5">
          {promoHeroImages.map((image, index) => (
            <div
              key={image}
              className={`relative overflow-hidden border border-border/40 ${
                index === 0
                  ? "col-span-2 aspect-[4/3] rounded-[2rem]"
                  : "aspect-square rounded-[1.5rem]"
              }`}
            >
              <img
                src={image}
                alt={`Coleccion Alemoon ${index + 1}`}
                className="h-full w-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-4">
        <div className="rounded-[2rem] border border-border/60 bg-background px-6 py-8 text-center shadow-sm md:px-8">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Catalogo completo
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl">
            Explora todas las piezas en una pagina dedicada
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
            Navega el catalogo completo para ver productos disponibles, descubrir categorias y
            pedir tus piezas favoritas.
          </p>
          <Link
            to="/catalogo"
            className="btn-a11y btn-a11y-primary mt-6 inline-flex min-h-12 px-6 text-base"
          >
            Ver catalogo completo
          </Link>
        </div>
      </section>

      <footer className="mt-8 border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 text-sm text-muted-foreground md:flex-row">
          <div className="font-display text-lg text-foreground">{STORE_NAME}</div>
          <div>Pedidos por WhatsApp · +593 99 031 2477</div>
          <Link to="/admin" className="hover:text-foreground">
            Acceso al panel
          </Link>
        </div>
      </footer>
    </main>
  );
}
