import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, type Producto } from "@/lib/alemoon";

export const Route = createFileRoute("/admin/ofertas")({
  component: Ofertas,
});

function Ofertas() {
  const qc = useQueryClient();
  const [precios, setPrecios] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-productos"],
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

  async function toggle(p: Producto, en: boolean) {
    setSaving(p.id);
    const patch: any = { en_oferta: en };
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
    if (error) return toast.error(error.message);
    toast.success(en ? "¡Listo! Oferta activada." : "¡Listo! Oferta desactivada.");
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
    if (error) return toast.error(error.message);
    toast.success("¡Listo! Precio de oferta guardado.");
    qc.invalidateQueries({ queryKey: ["admin-productos"] });
    qc.invalidateQueries({ queryKey: ["productos-publicos"] });
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Ofertas</h1>
      <p className="text-lg text-muted-foreground">
        Activa la oferta con el interruptor y escribe el precio nuevo.
      </p>

      {isLoading ? (
        <p>Cargando...</p>
      ) : data.length === 0 ? (
        <p className="text-lg">Aún no tienes productos visibles.</p>
      ) : (
        <div className="space-y-4">
          {data.map((p) => {
            const valor = precios[p.id] ?? (p.precio_oferta?.toString() ?? "");
            return (
              <div key={p.id} className="bg-card border-2 border-border rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-4">
                  {p.imagen_url ? (
                    <img src={p.imagen_url} alt="" className="w-20 h-20 rounded-xl object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-muted grid place-items-center text-2xl">📷</div>
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-xl">{p.nombre}</div>
                    <div className="text-muted-foreground">Precio normal: {formatPrice(p.precio)}</div>
                  </div>
                </div>

                <label className="flex items-center gap-4 cursor-pointer">
                  <span className="text-lg font-medium">Oferta:</span>
                  <button
                    type="button"
                    disabled={saving === p.id}
                    onClick={() => toggle(p, !p.en_oferta)}
                    className={`relative inline-flex items-center h-12 w-24 rounded-full transition ${
                      p.en_oferta ? "bg-primary" : "bg-muted border-2 border-border"
                    }`}
                  >
                    <span
                      className={`inline-block h-10 w-10 rounded-full bg-background shadow transition-transform ${
                        p.en_oferta ? "translate-x-13" : "translate-x-1"
                      }`}
                      style={{ transform: p.en_oferta ? "translateX(3.25rem)" : "translateX(0.25rem)" }}
                    />
                  </button>
                  <span className="text-lg font-semibold">{p.en_oferta ? "Sí" : "No"}</span>
                </label>

                <div>
                  <label className="block text-lg mb-2">Precio de oferta</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={valor}
                      onChange={(e) => setPrecios({ ...precios, [p.id]: e.target.value })}
                      className="flex-1 px-4 py-3 text-xl rounded-xl border-2 border-border bg-background"
                    />
                    <button
                      onClick={() => guardarPrecio(p)}
                      disabled={saving === p.id}
                      className="btn-a11y btn-a11y-primary text-base min-h-12 px-5"
                    >
                      💾 Guardar
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