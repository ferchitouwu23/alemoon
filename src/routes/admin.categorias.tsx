import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { type Categoria } from "@/lib/alemoon";

export const Route = createFileRoute("/admin/categorias")({
  component: CategoriasAdmin,
});

type CategoriaConConteo = Categoria & {
  productCount: number;
};

function CategoriasAdmin() {
  const qc = useQueryClient();
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<CategoriaConConteo | null>(null);

  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ["admin-categorias"],
    queryFn: async (): Promise<CategoriaConConteo[]> => {
      const [{ data: categories, error: categoriesError }, { data: products, error: productsError }] =
        await Promise.all([
          supabase.from("categorias").select("id, nombre").order("nombre"),
          supabase.from("productos").select("id, categoria_id"),
        ]);

      if (categoriesError) throw categoriesError;
      if (productsError) throw productsError;

      const productCountByCategory = new Map<string, number>();
      for (const product of products ?? []) {
        if (!product.categoria_id) continue;
        productCountByCategory.set(
          product.categoria_id,
          (productCountByCategory.get(product.categoria_id) ?? 0) + 1,
        );
      }

      return (categories ?? []).map((categoria) => ({
        ...categoria,
        productCount: productCountByCategory.get(categoria.id) ?? 0,
      }));
    },
  });

  const categoriesLabel = useMemo(
    () => (categorias.length === 1 ? "1 categoría" : `${categorias.length} categorías`),
    [categorias.length],
  );

  async function agregarCategoria() {
    const nombre = nombreNuevo.trim();
    if (!nombre) {
      toast.error("Escribe un nombre para la categoría.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("categorias").insert({ nombre });
      if (error) throw error;

      toast.success("Categoría creada.");
      setNombreNuevo("");
      qc.invalidateQueries({ queryKey: ["categorias"] });
      qc.invalidateQueries({ queryKey: ["admin-categorias"] });
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo crear la categoría.");
    } finally {
      setSaving(false);
    }
  }

  async function intentarBorrar(categoria: CategoriaConConteo) {
    const { count, error } = await supabase
      .from("productos")
      .select("id", { count: "exact", head: true })
      .eq("categoria_id", categoria.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    if ((count ?? 0) > 0) {
      toast.error("No se puede borrar, todavía tiene productos en esta categoría");
      return;
    }

    setConfirm({ ...categoria, productCount: 0 });
  }

  async function borrarCategoria(categoria: CategoriaConConteo) {
    setSaving(true);
    try {
      const { error } = await supabase.from("categorias").delete().eq("id", categoria.id);
      if (error) throw error;

      toast.success("Categoría eliminada.");
      setConfirm(null);
      qc.invalidateQueries({ queryKey: ["categorias"] });
      qc.invalidateQueries({ queryKey: ["admin-categorias"] });
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo borrar la categoría.");
    } finally {
      setSaving(false);
    }
  }

  if (confirm) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl">¿Seguro que quieres borrar esta categoría?</h1>
          <p className="mt-2 text-lg text-destructive">Esta acción no se puede deshacer.</p>
        </div>

        <div className="rounded-2xl border-2 border-border bg-card p-5">
          <div className="text-xl font-semibold">{confirm.nombre}</div>
        </div>

        <div className="grid gap-3">
          <button
            disabled={saving}
            onClick={() => borrarCategoria(confirm)}
            className="btn-a11y btn-a11y-danger min-h-14 text-lg disabled:opacity-40"
          >
            Sí, borrar
          </button>
          <button
            disabled={saving}
            onClick={() => setConfirm(null)}
            className="btn-a11y btn-a11y-secondary min-h-14 text-lg disabled:opacity-40"
          >
            No, cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl">Categorías</h1>
          <p className="mt-2 text-muted-foreground">{categoriesLabel}</p>
        </div>

        <div className="flex w-full flex-col gap-3 md:w-auto md:min-w-96">
          <label className="block">
            <span className="mb-2 block text-sm text-muted-foreground">Nombre de la categoría</span>
            <input
              value={nombreNuevo}
              onChange={(event) => setNombreNuevo(event.target.value)}
              placeholder="Ej: collares"
              className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-lg focus:border-primary focus:outline-none"
            />
          </label>
          <button
            disabled={saving}
            onClick={agregarCategoria}
            className="btn-a11y btn-a11y-primary min-h-12 px-5 disabled:opacity-40"
          >
            Agregar categoría nueva
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando categorías...</p>
      ) : categorias.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border py-12 text-center text-muted-foreground">
          Aún no hay categorías creadas.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {categorias.map((categoria) => (
            <article
              key={categoria.id}
              className="space-y-4 rounded-2xl border-2 border-border bg-card p-5"
            >
              <div>
                <h2 className="text-2xl font-semibold">{categoria.nombre}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {categoria.productCount === 0
                    ? "Sin productos asociados"
                    : `${categoria.productCount} producto${categoria.productCount === 1 ? "" : "s"} asociado${categoria.productCount === 1 ? "" : "s"}`}
                </p>
              </div>
              <button
                onClick={() => intentarBorrar(categoria)}
                className="btn-a11y btn-a11y-danger min-h-12 px-5 text-base"
              >
                Borrar
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
