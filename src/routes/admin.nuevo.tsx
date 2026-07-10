import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  formatPrice,
  uploadProductImage,
  type Categoria,
} from "@/lib/alemoon";

export const Route = createFileRoute("/admin/nuevo")({
  component: NuevoWizard,
});

type Datos = {
  imagen_url: string;
  nombre: string;
  precio: string;
  categoria_id: string | null;
};

function NuevoWizard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [datos, setDatos] = useState<Datos>({
    imagen_url: "",
    nombre: "",
    precio: "",
    categoria_id: null,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: cats = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: async (): Promise<Categoria[]> => {
      const { data } = await supabase.from("categorias").select("id, nombre").order("nombre");
      return data ?? [];
    },
  });

  async function handleFile(f: File | null) {
    if (!f) return;
    setUploading(true);
    try {
      const url = await uploadProductImage(f);
      setDatos((d) => ({ ...d, imagen_url: url }));
      toast.success("¡Listo! Foto subida.");
    } catch (e: any) {
      toast.error(e.message ?? "No se pudo subir la foto");
    } finally {
      setUploading(false);
    }
  }

  async function guardar() {
    setSaving(true);
    try {
      const { error } = await supabase.from("productos").insert({
        nombre: datos.nombre,
        precio: Number(datos.precio),
        imagen_url: datos.imagen_url,
        categoria_id: datos.categoria_id,
        visible: true,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["admin-productos"] });
      qc.invalidateQueries({ queryKey: ["productos-publicos"] });
      setStep(5);
    } catch (e: any) {
      toast.error(e.message ?? "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  const total = 4;
  const canNext =
    (step === 1 && !!datos.imagen_url) ||
    (step === 2 && datos.nombre.trim().length > 0) ||
    (step === 3 && Number(datos.precio) > 0) ||
    step === 4;

  return (
    <div className="space-y-8">
      {step <= total && (
        <div>
          <div className="text-sm uppercase tracking-widest text-muted-foreground">
            Paso {step} de {total}
          </div>
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(step / total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <section className="space-y-6">
          <h1 className="font-display text-3xl">Primero, sube una foto</h1>
          <p className="text-lg text-muted-foreground">
            Elige una foto clara del producto.
          </p>
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <div className="border-4 border-dashed border-border rounded-2xl p-8 text-center bg-card hover:bg-muted transition">
              {uploading ? (
                <p className="text-lg">Subiendo...</p>
              ) : datos.imagen_url ? (
                <img src={datos.imagen_url} alt="" className="mx-auto max-h-64 rounded-xl" />
              ) : (
                <>
                  <div className="text-6xl">📷</div>
                  <div className="mt-3 text-lg font-medium">Toca aquí para elegir una foto</div>
                </>
              )}
            </div>
          </label>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-6">
          <h1 className="font-display text-3xl">Ahora, el nombre</h1>
          <label className="block">
            <span className="block text-lg mb-2">¿Cómo se llama este producto?</span>
            <input
              autoFocus
              value={datos.nombre}
              onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
              placeholder="Ej: Aretes luna dorada"
              className="w-full px-5 py-4 text-xl rounded-xl border-2 border-border bg-card focus:outline-none focus:border-primary"
            />
          </label>
          {cats.length > 0 && (
            <label className="block">
              <span className="block text-lg mb-2">Categoría (opcional)</span>
              <select
                value={datos.categoria_id ?? ""}
                onChange={(e) =>
                  setDatos({ ...datos, categoria_id: e.target.value || null })
                }
                className="w-full px-5 py-4 text-xl rounded-xl border-2 border-border bg-card"
              >
                <option value="">Sin categoría</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
        </section>
      )}

      {step === 3 && (
        <section className="space-y-6">
          <h1 className="font-display text-3xl">Ahora, el precio</h1>
          <label className="block">
            <span className="block text-lg mb-2">¿Cuánto cuesta? (en dólares)</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              autoFocus
              value={datos.precio}
              onChange={(e) => setDatos({ ...datos, precio: e.target.value })}
              placeholder="0.00"
              className="w-full px-5 py-4 text-2xl rounded-xl border-2 border-border bg-card focus:outline-none focus:border-primary"
            />
          </label>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-6">
          <h1 className="font-display text-3xl">Confirma y guarda</h1>
          <div className="bg-card border-2 border-border rounded-2xl p-5 space-y-4">
            {datos.imagen_url && (
              <img src={datos.imagen_url} alt="" className="w-full max-h-64 object-contain rounded-xl" />
            )}
            <div>
              <div className="text-sm text-muted-foreground">Nombre</div>
              <div className="text-xl font-semibold">{datos.nombre}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Precio</div>
              <div className="text-xl font-semibold">{formatPrice(datos.precio)}</div>
            </div>
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="text-center py-10 space-y-6">
          <div className="text-8xl">✅</div>
          <h1 className="font-display text-3xl">¡Listo! Guardado correctamente.</h1>
          <div className="grid gap-3">
            <button
              onClick={() => {
                setDatos({ imagen_url: "", nombre: "", precio: "", categoria_id: null });
                setStep(1);
              }}
              className="btn-a11y btn-a11y-primary"
            >
              ➕ Agregar otro
            </button>
            <button
              onClick={() => navigate({ to: "/admin/productos" })}
              className="btn-a11y btn-a11y-secondary"
            >
              📦 Ver mis productos
            </button>
          </div>
        </section>
      )}

      {step <= total && (
        <div className="grid grid-cols-2 gap-3 pt-4">
          <button
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className="btn-a11y btn-a11y-secondary disabled:opacity-40"
          >
            ← Atrás
          </button>
          {step < total ? (
            <button
              disabled={!canNext}
              onClick={() => setStep(step + 1)}
              className="btn-a11y btn-a11y-primary disabled:opacity-40"
            >
              Siguiente →
            </button>
          ) : (
            <button
              disabled={saving}
              onClick={guardar}
              className="btn-a11y btn-a11y-primary disabled:opacity-40"
            >
              {saving ? "Guardando..." : "💾 Guardar"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}