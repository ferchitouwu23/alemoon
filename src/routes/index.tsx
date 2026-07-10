import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  STORE_NAME,
  formatPrice,
  whatsappUrl,
  type Categoria,
  type Producto,
} from "@/lib/alemoon";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [cat, setCat] = useState<string | null>(null);

  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: async (): Promise<Categoria[]> => {
      const { data, error } = await supabase
        .from("categorias")
        .select("id, nombre")
        .order("nombre");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: productos = [], isLoading } = useQuery({
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
  const filtrados = cat ? productos.filter((p) => p.categoria_id === cat) : productos;

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl tracking-tight">
            {STORE_NAME}
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <a href="#catalogo" className="hover:opacity-70">Catálogo</a>
            <Link to="/admin" className="text-muted-foreground hover:opacity-70">Admin</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-28 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="uppercase tracking-[0.25em] text-xs text-muted-foreground mb-4">
            Bisutería hecha a mano
          </p>
          <h1 className="font-display text-5xl md:text-7xl leading-[1.05]">
            Piezas pequeñas,<br/>
            <span className="italic text-[color:var(--alemoon-charcoal)]">gestos grandes.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-md">
            Aretes, collares, pulseras y anillos diseñados uno por uno. Elige tu favorito y
            pídelo directo por WhatsApp.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#catalogo" className="btn-a11y btn-a11y-primary text-base min-h-12 px-6">
              Ver el catálogo
            </a>
            <a
              href={whatsappUrl("Hola, quiero saber más")}
              target="_blank" rel="noreferrer"
              className="btn-a11y btn-a11y-secondary text-base min-h-12 px-6"
            >
              Escribir por WhatsApp
            </a>
          </div>
        </div>
        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-[color:var(--alemoon-sage)]">
          {destacados[0]?.imagen_url ? (
            <img src={destacados[0].imagen_url} alt={destacados[0].nombre} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center">
              <div className="text-center px-6">
                <div className="font-display italic text-4xl md:text-5xl text-[color:var(--alemoon-ink)]">
                  hecho a mano
                </div>
                <div className="mt-2 text-sm tracking-[0.3em] uppercase text-[color:var(--alemoon-charcoal)]">
                  Ediciones limitadas
                </div>
              </div>
            </div>
          )}
          {destacados.length > 0 && (
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-background/90 text-xs font-medium tracking-wide">
              ✦ Ofertas activas
            </div>
          )}
        </div>
      </section>

      {/* Destacados en oferta */}
      {destacados.length > 0 && (
        <section className="border-y border-border/50 bg-[color:var(--alemoon-sage)]/30">
          <div className="mx-auto max-w-6xl px-5 py-10">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-display text-2xl md:text-3xl">En oferta ahora</h2>
              <a href="#catalogo" className="text-sm underline underline-offset-4">Ver todo</a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {destacados.map((p) => (
                <ProductoCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Catálogo */}
      <section id="catalogo" className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Catálogo</p>
            <h2 className="font-display text-3xl md:text-4xl">Todas las piezas</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCat(null)}
              className={`px-4 py-2 rounded-full text-sm border transition ${
                cat === null
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:border-primary"
              }`}
            >
              Todas
            </button>
            {categorias.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`px-4 py-2 rounded-full text-sm border transition ${
                  cat === c.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary"
                }`}
              >
                {c.nombre}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Cargando piezas...</p>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            Pronto habrá piezas nuevas en esta categoría 🌿
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtrados.map((p) => (
              <ProductoCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-border/60 mt-8">
        <div className="mx-auto max-w-6xl px-5 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="font-display text-lg text-foreground">{STORE_NAME}</div>
          <div>Pedidos por WhatsApp · +593 99 031 2477</div>
          <Link to="/admin" className="hover:text-foreground">Acceso al panel</Link>
        </div>
      </footer>
    </main>
  );
}

function ProductoCard({ p }: { p: Producto }) {
  return (
    <Link
      to="/producto/$id"
      params={{ id: p.id }}
      className="group block rounded-2xl overflow-hidden bg-card border border-border/60 hover:shadow-lg transition"
    >
      <div className="relative aspect-square bg-[color:var(--alemoon-sage)]/40">
        {p.imagen_url ? (
          <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full grid place-items-center font-display italic text-2xl text-[color:var(--alemoon-charcoal)]">
            {p.nombre[0]}
          </div>
        )}
        {p.en_oferta && (
          <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
            Oferta
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium truncate">{p.nombre}</h3>
        <div className="mt-1 flex items-baseline gap-2">
          {p.en_oferta && p.precio_oferta != null ? (
            <>
              <span className="font-semibold">{formatPrice(p.precio_oferta)}</span>
              <span className="text-sm text-muted-foreground line-through">{formatPrice(p.precio)}</span>
            </>
          ) : (
            <span className="font-semibold">{formatPrice(p.precio)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
