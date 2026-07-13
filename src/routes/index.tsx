import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { STORE_NAME, whatsappUrl, type Producto } from "@/lib/alemoon";
import { promoCollections, promoCombos, promoHeroImages } from "@/lib/promo-gallery";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { data: productos = [] } = useQuery({
    queryKey: ["productos-publicos"],
    queryFn: async (): Promise<Producto[]> => {
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .eq("visible", true)
        .order("fecha_creacion", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Producto[];
    },
  });

  const destacados = productos.filter((p) => p.en_oferta).slice(0, 3);
  const heroImage = destacados[0]?.imagen_url || promoHeroImages[0];

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
            Anillos, cadenas, pulseras y combos con identidad propia. Usa las fotos del
            catalogo para descubrir colecciones y pedir tu pieza favorita directo por
            WhatsApp.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/catalogo" className="btn-a11y btn-a11y-primary min-h-12 px-6 text-base">
              Ver el catalogo
            </Link>
            <a
              href={whatsappUrl("Quiero asesoramiento para elegir un regalo")}
              target="_blank"
              rel="noreferrer"
              className="btn-a11y btn-a11y-secondary min-h-12 px-6 text-base"
            >
              Escribir por WhatsApp
            </a>
          </div>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 text-sm">
            <div className="rounded-2xl border border-border/60 bg-white/50 px-4 py-4">
              <div className="font-display text-2xl">15</div>
              <div className="text-muted-foreground">imagenes promocionales listas</div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-white/50 px-4 py-4">
              <div className="font-display text-2xl">4</div>
              <div className="text-muted-foreground">bloques visuales para vender mejor</div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-white/50 px-4 py-4">
              <div className="font-display text-2xl">1 clic</div>
              <div className="text-muted-foreground">para llevar clientas a WhatsApp</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:gap-5">
          <div className="relative col-span-2 aspect-[4/3] overflow-hidden rounded-[2rem] bg-[color:var(--alemoon-sage)]">
            <img src={heroImage} alt="Destacado Alemoon" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-background/88 px-4 py-3 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Seleccion de la semana
              </div>
              <div className="mt-1 font-display text-2xl">
                {destacados[0]?.nombre || "Colecciones listas para promocionar"}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {destacados[0]
                  ? "Aprovecha este producto como portada principal mientras alimentas mas el catalogo."
                  : "Ya puedes vender con material visual real mientras completas la carga de productos."}
              </div>
            </div>
          </div>

          {promoHeroImages.slice(1).map((image, index) => (
            <div
              key={image}
              className="relative aspect-square overflow-hidden rounded-[1.5rem] border border-border/40"
            >
              <img
                src={image}
                alt={`Coleccion Alemoon ${index + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}

          <div className="flex flex-col justify-between rounded-[1.5rem] border border-border/60 bg-[color:var(--alemoon-sage)]/30 p-5">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Promocion visual
              </div>
              <div className="mt-2 font-display text-3xl">Contenido que ya vende mejor</div>
              <p className="mt-3 text-sm text-muted-foreground">
                Tus fotos ya estan separadas por categoria, asi que podemos usarlas para
                portada, estados y campanas sin depender solo del admin.
              </p>
            </div>
            <a
              href={whatsappUrl("Quiero recibir sugerencias de colecciones destacadas")}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex w-fit rounded-full border border-border px-4 py-2 text-sm hover:bg-background"
            >
              Pedir recomendacion
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-4">
        <div className="rounded-[2rem] border border-border/60 bg-[linear-gradient(135deg,rgba(198,206,188,0.32),rgba(255,255,255,0.7))] px-6 py-8 md:px-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Colecciones visuales
              </p>
              <h2 className="font-display text-3xl md:text-4xl">
                Fotos listas para promocionar
              </h2>
            </div>
            <a
              href={whatsappUrl("Quiero ayuda para elegir que coleccion promocionar primero")}
              target="_blank"
              rel="noreferrer"
              className="text-sm underline underline-offset-4"
            >
              Quiero una recomendacion
            </a>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {promoCollections.map((collection) => (
              <article
                key={collection.id}
                className="overflow-hidden rounded-[1.75rem] border border-border/50 bg-background shadow-sm"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={collection.image}
                    alt={collection.title}
                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    {collection.eyebrow}
                  </p>
                  <h3 className="mt-2 font-display text-2xl">{collection.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {collection.description}
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <Link
                      to="/catalogo"
                      className="text-sm font-medium underline underline-offset-4"
                    >
                      Explorar catalogo
                    </Link>
                    <a
                      href={whatsappUrl(collection.whatsappMessage)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
                    >
                      {collection.ctaLabel}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-between rounded-[2rem] bg-[color:var(--alemoon-ink)] p-8 text-[color:var(--alemoon-cream)]">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/65">
                Combos y temporadas
              </p>
              <h2 className="mt-3 font-display text-4xl leading-tight">
                Usa tus sets como piezas de venta rapida.
              </h2>
              <p className="mt-4 max-w-md text-sm text-white/75">
                Los combos tienen mucho potencial para campanas de regalo, fechas
                especiales y promociones en estados de WhatsApp.
              </p>
            </div>
            <div className="mt-8 space-y-3">
              <div className="rounded-2xl border border-white/15 px-4 py-3">
                Resaltan mejor el valor percibido cuando la clienta ve dos piezas coordinadas.
              </div>
              <div className="rounded-2xl border border-white/15 px-4 py-3">
                Tambien sirven para destacar temporadas y mensajes especiales.
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {promoCombos.map((combo) => (
              <article
                key={combo.image}
                className="overflow-hidden rounded-[1.75rem] border border-border/50 bg-background"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={combo.image}
                    alt={combo.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-display text-2xl">{combo.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">{combo.description}</p>
                </div>
              </article>
            ))}
          </div>
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
            Separamos el catalogo para que la portada se enfoque en promocion y la tienda
            tenga un espacio mas limpio para navegar productos y categorias.
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
