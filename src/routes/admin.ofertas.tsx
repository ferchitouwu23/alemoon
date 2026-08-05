import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, type Categoria, type Producto } from "@/lib/alemoon";

export const Route = createFileRoute("/admin/ofertas")({
  component: Ofertas,
});

function Ofertas() {
  const qc = useQueryClient();
  const [precios, setPrecios] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("todas");

  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: async (): Promise<Categoria[]> => {
      const { data, error } = await supabase
        .from("categorias")
        .select("id, nombre")
        .order("nombre", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-productos", categoriaSeleccionada],
    queryFn: async (): Promise<Producto[]> => {
      let query = supabase
        .from("productos")
        .select("*")
        .eq("visible", true)
        .order("fecha_creacion", { ascending: false });

      if (categoriaSeleccionada !== "todas") {
        query = query.eq("categoria_id", categoriaSeleccionada);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Producto[];
    },
  });

  async function toggle(p: Producto, en: boolean) {
    setSaving(p.id);
    const patch: Partial<Producto> & { en_oferta: boolean } = { en_oferta: en };

    if (en) {
      const raw = precios[p.id] ?? p.precio_oferta ?? "";
      const v = Number(raw);

      if (!v || v <= 0 || v >= Number(p.precio)) {
        setSaving(null);
        toast.error("El precio de oferta debe ser menor al precio normal.");
        return;
      }

      patch.precio_oferta = v;
    }

    const { error } = await supabase.from("productos").update(patch).eq("id", p.id);
    setSaving(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(en ? "Listo. Oferta activada." : "Listo. Oferta desactivada.");
    qc.invalidateQueries({ queryKey: ["admin-productos"] });
    qc.invalidateQueries({ queryKey: ["productos-publicos"] });
  }

  async function guardarPrecio(p: Producto) {
    const v = Number(precios[p.id]);

    if (!v || v <= 0 || v >= Number(p.precio)) {
      toast.error("El precio de oferta debe ser menor al precio normal.");
      return;
    }

    setSaving(p.id);
    const { error } = await supabase
      .from("productos")
      .update({ precio_oferta: v, en_oferta: true })
      .eq("id", p.id);
    setSaving(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Listo. Precio de oferta guardado.");
    qc.invalidateQueries({ queryKey: ["admin-productos"] });
    qc.invalidateQueries({ queryKey: ["productos-publicos"] });
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Ofertas</h1>
      <p className="text-lg text-muted-foreground">
        Activa la oferta con el interruptor y escribe el precio nuevo.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategoriaSeleccionada("todas")}
          className={`btn-a11y rounded-xl border-2 border-border px-4 py-2 ${
            categoriaSeleccionada === "todas" ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          Todas
        </button>
        {categorias.map((categoria) => (
          <button
            key={categoria.id}
            type="button"
            onClick={() => setCategoriaSeleccionada(categoria.id)}
            className={`btn-a11y rounded-xl border-2 border-border px-4 py-2 ${
              categoriaSeleccionada === categoria.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            {categoria.nombre}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p>Cargando...</p>
      ) : data.length === 0 ? (
        <p className="text-lg">Aun no tienes productos visibles.</p>
      ) : (
        <div className="space-y-4">
          {data.map((p) => {
            const valor = precios[p.id] ?? (p.precio_oferta?.toString() ?? "");

            return (
              <div key={p.id} className="space-y-4 rounded-2xl border-2 border-border bg-card p-4">
                <div className="flex items-center gap-4">
                  {p.imagen_url ? (
                    <img
                      src={p.imagen_url}
                      alt=""
                      className="h-20 w-20 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-muted text-2xl">
                      Foto
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="break-words text-xl font-semibold">{p.nombre}</div>
                    <div className="break-words text-muted-foreground">
                      Precio normal: {formatPrice(p.precio)}
                    </div>
                  </div>
                </div>

                <label className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <span className="text-lg font-medium">Oferta:</span>
                  <button
                    type="button"
                    disabled={saving === p.id}
                    onClick={() => toggle(p, !p.en_oferta)}
                    className={`relative inline-flex h-12 w-24 shrink-0 items-center rounded-full transition ${
                      p.en_oferta ? "bg-primary" : "border-2 border-border bg-muted"
                    }`}
                  >
                    <span
                      className="inline-block h-10 w-10 rounded-full bg-background shadow transition-transform"
                      style={{ transform: p.en_oferta ? "translateX(3.25rem)" : "translateX(0.25rem)" }}
                    />
                  </button>
                  <span className="text-lg font-semibold">{p.en_oferta ? "Si" : "No"}</span>
                </label>

                <div>
                  <label className="mb-2 block text-lg">Precio de oferta</label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={valor}
                      onChange={(e) => setPrecios({ ...precios, [p.id]: e.target.value })}
                      className="w-full min-w-0 flex-1 rounded-xl border-2 border-border bg-background px-4 py-3 text-xl"
                    />
                    <button
                      onClick={() => guardarPrecio(p)}
                      disabled={saving === p.id}
                      className="btn-a11y btn-a11y-primary min-h-12 w-full px-5 text-base sm:w-auto"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
