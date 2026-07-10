import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice, type Producto } from "@/lib/alemoon";

export const Route = createFileRoute("/admin/productos")({
  component: ProductosAdmin,
});

function ProductosAdmin() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState<Producto | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-productos"],
    queryFn: async (): Promise<Producto[]> => {
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .order("fecha_creacion", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Producto[];
    },
  });

  async function borrar(p: Producto) {
    // Gestora: soft delete (visible=false). Dueña: eliminar de verdad.
    if (role === "gestora") {
      const { error } = await supabase
        .from("productos")
        .update({ visible: false })
        .eq("id", p.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("productos").delete().eq("id", p.id);
      if (error) return toast.error(error.message);
    }
    toast.success("¡Listo! Producto eliminado.");
    setConfirm(null);
    qc.invalidateQueries({ queryKey: ["admin-productos"] });
    qc.invalidateQueries({ queryKey: ["productos-publicos"] });
  }

  if (confirm) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl">¿Seguro que quieres borrar este producto?</h1>
        <div className="bg-card border-2 border-border rounded-2xl p-5 flex items-center gap-4">
          {confirm.imagen_url && (
            <img src={confirm.imagen_url} alt="" className="w-20 h-20 rounded-xl object-cover" />
          )}
          <div>
            <div className="font-semibold text-xl">{confirm.nombre}</div>
            <div className="text-muted-foreground">{formatPrice(confirm.precio)}</div>
          </div>
        </div>
        <p className="text-lg text-destructive">Esta acción no se puede deshacer.</p>
        <div className="grid grid-cols-1 gap-3">
          <button className="btn-a11y btn-a11y-danger" onClick={() => borrar(confirm)}>
            🗑️ Sí, borrar
          </button>
          <button className="btn-a11y btn-a11y-secondary" onClick={() => setConfirm(null)}>
            ✖ No, cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Mis productos</h1>
        <Link to="/admin/nuevo" className="btn-a11y btn-a11y-primary text-base min-h-12 px-5">
          ➕ Agregar
        </Link>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : data.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
          <p className="text-lg">Todavía no hay productos.</p>
          <Link to="/admin/nuevo" className="btn-a11y btn-a11y-primary mt-5 inline-flex">
            ➕ Agregar el primero
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((p) => (
            <div key={p.id} className="bg-card border-2 border-border rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                {p.imagen_url ? (
                  <img src={p.imagen_url} alt="" className="w-24 h-24 rounded-xl object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-muted grid place-items-center text-3xl">📷</div>
                )}
                <div className="flex-1">
                  <div className="font-semibold text-xl">{p.nombre}</div>
                  <div className="text-lg">
                    {p.en_oferta && p.precio_oferta != null ? (
                      <>
                        <span className="font-semibold">{formatPrice(p.precio_oferta)}</span>{" "}
                        <span className="text-muted-foreground line-through text-base">{formatPrice(p.precio)}</span>
                      </>
                    ) : (
                      formatPrice(p.precio)
                    )}
                  </div>
                  {!p.visible && <span className="text-sm text-destructive">Oculto del catálogo</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/admin/editar/$id"
                  params={{ id: p.id }}
                  className="btn-a11y btn-a11y-secondary text-base min-h-12 px-5"
                >
                  ✏️ Editar
                </Link>
                <button
                  onClick={() => setConfirm(p)}
                  className="btn-a11y btn-a11y-danger text-base min-h-12 px-5"
                >
                  🗑️ Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}