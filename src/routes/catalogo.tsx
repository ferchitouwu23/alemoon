import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { STORE_NAME, formatPrice, type Categoria, type Producto } from "@/lib/alemoon";

export const Route = createFileRoute("/catalogo")({
  component: CatalogoPage,
});

const FILTER_OPTIONS = [
  { label: "Anillos", categoryName: "anillos" },
  { label: "Aretes", categoryName: "aretes" },
  { label: "Collares", categoryName: "collares" },
  { label: "Cadenas", categoryName: "cadenas" },
  { label: "Pulseras", categoryName: "pulseras" },
] as const;

function CatalogoPage() {
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

  const selectedCategoryId =
    cat == null
      ? null
      : categorias.find((categoria) => categoria.nombre.toLowerCase() === cat)?.id ?? "__missing__";
  const filtrados =
    selectedCategoryId == null
      ? productos
      : productos.filter((p) => p.categoria_id === selectedCategoryId);

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

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Catalogo
            </p>
            <h1 className="font-display text-3xl md:text-5xl">Todas las piezas</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCat(null)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                cat === null
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:border-primary"
              }`}
            >
              Todas
            </button>
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.label}
                onClick={() => setCat(option.categoryName)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  cat === option.categoryName
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Cargando piezas...</p>
        ) : filtrados.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            Pronto habra piezas nuevas en esta categoria.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {filtrados.map((p) => (
              <ProductoCard key={p.id} p={p} />
            ))}
          </div>
        )}
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

function ProductoCard({ p }: { p: Producto }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const precioMostrar = p.en_oferta && p.precio_oferta != null ? p.precio_oferta : p.precio;
  const descripcionCorta = p.descripcion?.trim()
    ? p.descripcion.trim()
    : "Descubre esta pieza en detalle y consulta disponibilidad.";

  return (
    <article className="overflow-hidden rounded-2xl border border-border/60 bg-card transition hover:shadow-lg">
      <div className="group relative aspect-square [perspective:1200px]">
        <div
          className={`relative h-full w-full transition-transform duration-400 [transform-style:preserve-3d] ${
            isFlipped ? "[transform:rotateY(180deg)]" : ""
          } group-hover:[transform:rotateY(180deg)]`}
        >
          <button
            type="button"
            aria-label={isFlipped ? `Volver a la imagen de ${p.nombre}` : `Ver detalles de ${p.nombre}`}
            onClick={() => setIsFlipped((current) => !current)}
            className="absolute inset-0 block [backface-visibility:hidden]"
          >
            <div className="relative h-full w-full bg-[color:var(--alemoon-sage)]/40">
              {p.imagen_url ? (
                <img
                  src={p.imagen_url}
                  alt={p.nombre}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-full w-full place-items-center font-display text-2xl italic text-[color:var(--alemoon-charcoal)]">
                  {p.nombre[0]}
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
              <div className="absolute left-3 top-3 flex flex-col gap-2">
                {p.en_oferta && (
                  <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                    Oferta
                  </span>
                )}
                {p.agotado && (
                  <span className="rounded-full border border-white/40 bg-[color:var(--alemoon-ink)] px-3 py-1 text-xs font-semibold tracking-[0.2em] text-white">
                    SOLD OUT
                  </span>
                )}
              </div>
            </div>
          </button>

          <div className="absolute inset-0 rounded-2xl bg-card p-4 text-left [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="flex h-full flex-col justify-between rounded-[1.2rem] border border-border/70 bg-background/75 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Detalles
                </p>
                <h3 className="mt-2 font-display text-2xl leading-tight">{p.nombre}</h3>
                <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                  {descripcionCorta}
                </p>
              </div>

              <div className="mt-4">
                <div className="mb-4 flex items-baseline gap-2">
                  <span className="font-semibold">{formatPrice(precioMostrar)}</span>
                  {p.en_oferta && p.precio_oferta != null && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(p.precio)}
                    </span>
                  )}
                </div>
                <Link
                  to="/producto/$id"
                  params={{ id: p.id }}
                  onClick={(event) => event.stopPropagation()}
                  className="btn-a11y btn-a11y-primary min-h-11 w-full px-4 py-3 text-base"
                >
                  Ver producto
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="truncate font-medium">{p.nombre}</h3>
        <div className="mt-1 flex items-baseline gap-2">
          {p.en_oferta && p.precio_oferta != null ? (
            <>
              <span className="font-semibold">{formatPrice(p.precio_oferta)}</span>
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(p.precio)}
              </span>
            </>
          ) : (
            <span className="font-semibold">{formatPrice(p.precio)}</span>
          )}
        </div>
      </div>
    </article>
  );
}
