import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Categoria, Producto } from "@/lib/alemoon";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const { data } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async (): Promise<{ productos: Producto[]; categorias: Categoria[] }> => {
      const [productosResult, categoriasResult] = await Promise.all([
        supabase.from("productos").select("*"),
        supabase.from("categorias").select("id, nombre"),
      ]);

      if (productosResult.error) throw productosResult.error;
      if (categoriasResult.error) throw categoriasResult.error;

      return {
        productos: (productosResult.data ?? []) as Producto[],
        categorias: (categoriasResult.data ?? []) as Categoria[],
      };
    },
  });

  const productos = data?.productos ?? [];
  const categorias = data?.categorias ?? [];
  const visibles = productos.filter((producto) => producto.visible).length;
  const agotados = productos.filter((producto) => producto.agotado).length;
  const ofertas = productos.filter((producto) => producto.en_oferta).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl md:text-4xl">Que quieres hacer?</h1>
        <p className="mt-2 text-muted-foreground">Elige una opcion.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-border bg-card px-5 py-6">
          <p className="text-sm text-muted-foreground">Productos cargados</p>
          <p className="mt-3 font-display text-4xl leading-none">{productos.length}</p>
        </div>
        <div className="rounded-2xl border-2 border-border bg-card px-5 py-6">
          <p className="text-sm text-muted-foreground">Categorias activas</p>
          <p className="mt-3 font-display text-4xl leading-none">{categorias.length}</p>
        </div>
        <div className="rounded-2xl border-2 border-border bg-card px-5 py-6">
          <p className="text-sm text-muted-foreground">Productos visibles</p>
          <p className="mt-3 font-display text-4xl leading-none">{visibles}</p>
        </div>
        <div className="rounded-2xl border-2 border-border bg-card px-5 py-6">
          <p className="text-sm text-muted-foreground">Agotados / ofertas</p>
          <p className="mt-3 font-display text-4xl leading-none">
            {agotados} / {ofertas}
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <Link to="/admin/productos" className="btn-a11y btn-a11y-primary w-full justify-start px-6">
          <span>Ver mis productos</span>
        </Link>
        <Link to="/admin/nuevo" className="btn-a11y btn-a11y-secondary w-full justify-start px-6">
          <span>Agregar producto nuevo</span>
        </Link>
        <Link to="/admin/ofertas" className="btn-a11y btn-a11y-secondary w-full justify-start px-6">
          <span>Ver ofertas activas</span>
        </Link>
        <Link to="/admin/categorias" className="btn-a11y btn-a11y-secondary w-full justify-start px-6">
          <span>Categorias</span>
        </Link>
        <Link to="/admin/promociones" className="btn-a11y btn-a11y-secondary w-full justify-start px-6">
          <span>Imagenes destacadas</span>
        </Link>
        <Link
          to="/admin/combos-destacados"
          className="btn-a11y btn-a11y-secondary w-full justify-start px-6"
        >
          <span>Combos destacados</span>
        </Link>
      </div>
    </div>
  );
}
