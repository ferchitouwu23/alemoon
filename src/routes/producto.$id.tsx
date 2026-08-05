import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BrandLogo } from "@/components/brand-logo";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, getProductDetailUrl, whatsappUrl, type Producto } from "@/lib/alemoon";

export const Route = createFileRoute("/producto/$id")({
  component: ProductoDetalle,
});

function ProductoDetalle() {
  const { id } = useParams({ from: "/producto/$id" });
  const { data, isLoading } = useQuery({
    queryKey: ["producto", id],
    queryFn: async (): Promise<Producto | null> => {
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .eq("id", id)
        .eq("visible", true)
        .maybeSingle();
      if (error) throw error;
      return data as Producto | null;
    },
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between">
          <Link to="/" className="no-underline">
            <BrandLogo textClassName="text-2xl md:text-3xl" />
          </Link>
          <Link to="/" className="text-sm underline underline-offset-4">← Volver al catálogo</Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10 md:py-16">
        {isLoading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : !data ? (
          <div className="text-center py-16">
            <h1 className="font-display text-3xl">Producto no disponible</h1>
            <Link to="/" className="mt-4 inline-block underline">Ver catálogo</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-10">
            <div className="aspect-square rounded-3xl overflow-hidden bg-[color:var(--alemoon-sage)]/40">
              {data.imagen_url ? (
                <img src={data.imagen_url} alt={data.nombre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center font-display italic text-6xl text-[color:var(--alemoon-charcoal)]">
                  {data.nombre[0]}
                </div>
              )}
            </div>
            <div>
              {data.en_oferta && (
                <span className="inline-block bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  En oferta
                </span>
              )}
              <h1 className="font-display text-4xl md:text-5xl">{data.nombre}</h1>
              <div className="mt-4 flex items-baseline gap-3">
                {data.en_oferta && data.precio_oferta != null ? (
                  <>
                    <span className="text-3xl font-semibold">{formatPrice(data.precio_oferta)}</span>
                    <span className="text-lg text-muted-foreground line-through">{formatPrice(data.precio)}</span>
                  </>
                ) : (
                  <span className="text-3xl font-semibold">{formatPrice(data.precio)}</span>
                )}
              </div>
              {data.descripcion && (
                <p className="mt-6 text-muted-foreground leading-relaxed whitespace-pre-line">
                  {data.descripcion}
                </p>
              )}
              <a
                href={whatsappUrl(
                  data.nombre,
                  data.en_oferta ? data.precio_oferta : data.precio,
                  getProductDetailUrl(data.id),
                )}
                target="_blank"
                rel="noreferrer"
                className="btn-a11y btn-a11y-primary mt-8 w-full md:w-auto"
              >
                🟢 Pedir por WhatsApp
              </a>
              <p className="mt-3 text-sm text-muted-foreground">
                Te responderemos personalmente para coordinar el envío.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
