import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BrandLogo } from "@/components/brand-logo";
import { supabase } from "@/integrations/supabase/client";
import {
  prefilledWhatsappUrl,
  whatsappUrl,
  type ComboDestacado,
  type Promocion,
} from "@/lib/alemoon";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { data: promociones = [] } = useQuery({
    queryKey: ["home-promociones"],
    queryFn: async (): Promise<Promocion[]> => {
      const { data, error } = await supabase
        .from("promociones")
        .select("id, imagen_url, titulo, orden, activo, fecha_creacion")
        .eq("activo", true)
        .order("orden", { ascending: true })
        .order("fecha_creacion", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: combosDestacados = [] } = useQuery({
    queryKey: ["home-combos-destacados"],
    queryFn: async (): Promise<ComboDestacado[]> => {
      const { data, error } = await supabase
        .from("combos_destacados")
        .select("id, imagen_url, etiqueta, titulo, descripcion, mensaje_whatsapp, orden, activo, fecha_creacion")
        .eq("activo", true)
        .order("orden", { ascending: true })
        .order("fecha_creacion", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });
  const heroPromotions = promociones.slice(0, 3);

  return (
    <main className="alemoon-home-gradient min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link
            to="/"
            className="no-underline outline-none ring-0 shadow-none focus-visible:outline-none focus-visible:ring-0"
          >
            <BrandLogo textClassName="text-2xl md:text-3xl" />
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

      <section
        className={`mx-auto grid max-w-6xl gap-12 px-5 py-18 md:py-28 lg:items-center ${
          heroPromotions.length > 0 ? "lg:grid-cols-[1.1fr_0.9fr]" : ""
        }`}
      >
        <div className="flex flex-col justify-center lg:min-h-[42rem] lg:py-8">
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
          <p className="mt-8 max-w-md text-sm leading-relaxed text-muted-foreground">
            Encuentra piezas listas para regalar, combinar o pedir por encargo desde el catalogo
            completo, con atencion directa por WhatsApp cuando quieras asesoramiento.
          </p>
        </div>

        {heroPromotions.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:gap-5">
            {heroPromotions.map((promocion, index) => (
            <div
              key={promocion.id}
              className={`group relative overflow-hidden border border-border/40 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                index === 0
                  ? "col-span-2 aspect-[4/3] rounded-[2rem]"
                  : "aspect-square rounded-[1.5rem]"
              }`}
            >
              <img
                src={promocion.imagen_url}
                alt={promocion.titulo?.trim() || `Promocion Alemoon ${index + 1}`}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
            ))}
          </div>
        )}
      </section>

      {combosDestacados.length > 0 && (
        <section className="border-y border-border/50 bg-muted/40">
          <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  Combos destacados
                </p>
                <h2 className="mt-3 font-display text-3xl md:text-4xl">
                  Sets pensados para regalar o vender con mas impacto
                </h2>
              </div>
              <Link
                to="/catalogo"
                className="hidden text-sm text-muted-foreground hover:text-foreground md:inline"
              >
                Ver todo el catalogo
              </Link>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              {combosDestacados.slice(0, 2).map((combo, index) => (
                <article
                  key={combo.id}
                  className={`group overflow-hidden rounded-[2rem] border border-border/60 bg-card/90 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    index === 0 ? "lg:grid lg:grid-cols-[1fr_0.9fr]" : ""
                  }`}
                >
                  <div
                    className={`overflow-hidden ${index === 0 ? "min-h-[320px]" : "aspect-[4/3]"}`}
                  >
                    <img
                      src={combo.imagen_url}
                      alt={combo.titulo}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-col justify-center p-6 md:p-8">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      {combo.etiqueta?.trim() || "Combo visual"}
                    </p>
                    <h3 className="mt-3 font-display text-2xl md:text-3xl">{combo.titulo}</h3>
                    {combo.descripcion?.trim() ? (
                      <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted-foreground md:text-base">
                        {combo.descripcion}
                      </p>
                    ) : null}
                    <div className="mt-6 flex flex-wrap gap-3">
                      <a
                        href={prefilledWhatsappUrl(combo.mensaje_whatsapp)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-a11y btn-a11y-secondary min-h-12 px-5 text-base"
                      >
                        Consultar por WhatsApp
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-10 md:pt-16">
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
          <BrandLogo textClassName="text-lg" iconClassName="h-9 w-9" className="gap-2.5" />
          <div>Pedidos por WhatsApp · +593 99 031 2477</div>
          <Link to="/admin" className="hover:text-foreground">
            Acceso al panel
          </Link>
        </div>
      </footer>
    </main>
  );
}
