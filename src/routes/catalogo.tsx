import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { SocialLinks } from "@/components/social-links";
import { supabase } from "@/integrations/supabase/client";
import { WHATSAPP_DISPLAY, formatPrice, type Categoria, type Producto } from "@/lib/alemoon";

export const Route = createFileRoute("/catalogo")({
  component: CatalogoPage,
});

function CatalogoPage() {
  const [cat, setCat] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("nuevos");

  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: async (): Promise<Categoria[]> => {
      const { data, error } = await supabase.from("categorias").select("id, nombre").order("nombre");
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

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    const base = productos.filter((producto) => {
      const coincideCategoria = cat == null ? true : producto.categoria_id === cat;
      const coincideBusqueda =
        termino.length === 0 ||
        producto.nombre.toLowerCase().includes(termino) ||
        producto.descripcion?.toLowerCase().includes(termino);

      return coincideCategoria && coincideBusqueda;
    });

    const ordenados = [...base];

    switch (orden) {
      case "precio-asc":
        ordenados.sort((a, b) => getPrecioActual(a) - getPrecioActual(b));
        break;
      case "precio-desc":
        ordenados.sort((a, b) => getPrecioActual(b) - getPrecioActual(a));
        break;
      case "nombre":
        ordenados.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
        break;
      default:
        break;
    }

    return ordenados;
  }, [busqueda, cat, orden, productos]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="no-underline">
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

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Catalogo</p>
            <h1 className="font-display text-3xl md:text-5xl">Todas las piezas</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {filtrados.length} producto{filtrados.length === 1 ? "" : "s"} para descubrir o
              consultar por WhatsApp.
            </p>
          </div>
          <div className="grid gap-3 md:min-w-[360px]">
            <div className="grid gap-3 md:grid-cols-[1fr_180px]">
              <input
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar por nombre o descripcion"
                className="min-h-12 rounded-2xl border border-border bg-card px-4 text-sm outline-none transition focus:border-primary"
              />
              <select
                value={orden}
                onChange={(event) => setOrden(event.target.value)}
                className="min-h-12 rounded-2xl border border-border bg-card px-4 text-sm outline-none transition focus:border-primary"
              >
                <option value="nuevos">Mas nuevos</option>
                <option value="precio-asc">Precio: menor a mayor</option>
                <option value="precio-desc">Precio: mayor a menor</option>
                <option value="nombre">Nombre A-Z</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
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
          {categorias.map((categoria) => (
            <button
              key={categoria.id}
              onClick={() => setCat(categoria.id)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                cat === categoria.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:border-primary"
              }`}
            >
              {categoria.nombre}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Cargando piezas...</p>
        ) : filtrados.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            No encontramos piezas con esos filtros. Prueba otra categoria o busqueda.
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
          <BrandLogo textClassName="text-lg" iconClassName="h-9 w-9" className="gap-2.5" />
          <div className="flex flex-col items-center gap-3 text-center md:items-end md:text-right">
            <div>Pedidos por WhatsApp · {WHATSAPP_DISPLAY}</div>
            <SocialLinks />
            <Link to="/admin" className="hover:text-foreground">
              Acceso al panel
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ProductoCard({ p }: { p: Producto }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const precioMostrar = getPrecioActual(p);

  return (
    <article className="overflow-hidden rounded-2xl border border-border/60 bg-card transition hover:shadow-lg">
      <div className="sm:hidden">
        <div className="relative aspect-square overflow-hidden bg-[color:var(--alemoon-sage)]/40">
          {p.imagen_url ? (
            <img src={p.imagen_url} alt={p.nombre} className="h-full w-full object-cover" loading="lazy" />
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

        <div className="space-y-3 p-4">
          <div>
            <h3 className="truncate font-medium">{p.nombre}</h3>
          </div>
          <div className="flex items-baseline gap-2">
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
          <Link
            to="/producto/$id"
            params={{ id: p.id }}
            className="btn-a11y btn-a11y-primary min-h-11 w-full px-4 py-3 text-base"
          >
            Ver producto
          </Link>
        </div>
      </div>

      <div className="hidden sm:block">
        <div className="group relative aspect-square overflow-hidden [perspective:1200px]">
          <div
            className={`absolute inset-0 h-full w-full transition-transform duration-400 [transform-style:preserve-3d] ${
              isFlipped ? "[transform:rotateY(180deg)]" : ""
            } group-hover:[transform:rotateY(180deg)]`}
          >
            <button
              type="button"
              aria-label={isFlipped ? `Volver a la imagen de ${p.nombre}` : `Ver detalles de ${p.nombre}`}
              onClick={() => setIsFlipped((current) => !current)}
              className="absolute inset-0 block h-full w-full overflow-hidden [backface-visibility:hidden]"
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

            <div className="absolute inset-0 h-full w-full overflow-hidden bg-card p-4 text-left [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <div className="flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-[1.2rem] border border-border/70 bg-background/75 p-4">
                <div className="min-h-0 overflow-hidden">
                  <h3 className="font-display text-2xl leading-tight">{p.nombre}</h3>
                </div>

                <div className="mt-4 shrink-0">
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
      </div>
    </article>
  );
}

function getPrecioActual(producto: Producto) {
  return producto.en_oferta && producto.precio_oferta != null ? producto.precio_oferta : producto.precio;
}
