import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  formatPrice,
  uploadProductImage,
  type Categoria,
  type Producto,
} from "@/lib/alemoon";

export const Route = createFileRoute("/admin/editar/$id")({
  component: EditarProducto,
});

type Campo = "foto" | "nombre" | "precio" | "descripcion" | "categoria";

function EditarProducto() {
  const { id } = useParams({ from: "/admin/editar/$id" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [campo, setCampo] = useState<Campo | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<Partial<Producto>>({});

  const { data } = useQuery({
    queryKey: ["admin-producto", id],
    queryFn: async (): Promise<Producto | null> => {
      const { data, error } = await supabase.from("productos").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Producto | null;
    },
  });
  const { data: cats = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: async (): Promise<Categoria[]> => {
      const { data } = await supabase.from("categorias").select("id, nombre").order("nombre");
      return data ?? [];
    },
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  async function guardarCampo(patch: Partial<Producto>) {
    setSaving(true);
    try {
      const { error } = await supabase.from("productos").update(patch).eq("id", id);
      if (error) throw error;
      setForm((f) => ({ ...f, ...patch }));
      qc.invalidateQueries({ queryKey: ["admin-productos"] });
      qc.invalidateQueries({ queryKey: ["productos-publicos"] });
      qc.invalidateQueries({ queryKey: ["admin-producto", id] });
      toast.success("¡Listo! Guardado correctamente.");
      setCampo(null);
    } catch (e: any) {
      toast.error(e.message ?? "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  if (!data) return <p className="text-lg text-muted-foreground">Cargando...</p>;

  if (campo === "foto") {
    return (
      <EditWrap titulo="Cambiar la foto" onCancel={() => setCampo(null)}>
        <label className="block cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setUploading(true);
              try {
                const url = await uploadProductImage(f);
                await guardarCampo({ imagen_url: url });
              } catch (er: any) {
                toast.error(er.message);
              } finally {
                setUploading(false);
              }
            }}
          />
          <div className="border-4 border-dashed border-border rounded-2xl p-8 text-center bg-card">
            {uploading ? "Subiendo..." : "📷 Toca aquí para elegir una foto nueva"}
          </div>
        </label>
      </EditWrap>
    );
  }

  if (campo === "nombre") {
    return (
      <EditWrap titulo="Cambiar el nombre" onCancel={() => setCampo(null)}>
        <input
          autoFocus
          value={form.nombre ?? ""}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          className="w-full px-5 py-4 text-xl rounded-xl border-2 border-border bg-card"
        />
        <SaveBtn saving={saving} onClick={() => guardarCampo({ nombre: form.nombre })} />
      </EditWrap>
    );
  }

  if (campo === "precio") {
    return (
      <EditWrap titulo="Cambiar el precio" onCancel={() => setCampo(null)}>
        <input
          type="number" min="0" step="0.01" autoFocus
          value={form.precio ?? 0}
          onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })}
          className="w-full px-5 py-4 text-2xl rounded-xl border-2 border-border bg-card"
        />
        <SaveBtn saving={saving} onClick={() => guardarCampo({ precio: Number(form.precio) })} />
      </EditWrap>
    );
  }

  if (campo === "descripcion") {
    return (
      <EditWrap titulo="Cambiar la descripción" onCancel={() => setCampo(null)}>
        <textarea
          rows={6}
          autoFocus
          value={form.descripcion ?? ""}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          className="w-full px-5 py-4 text-lg rounded-xl border-2 border-border bg-card"
        />
        <SaveBtn saving={saving} onClick={() => guardarCampo({ descripcion: form.descripcion })} />
      </EditWrap>
    );
  }

  if (campo === "categoria") {
    return (
      <EditWrap titulo="Cambiar la categoría" onCancel={() => setCampo(null)}>
        <select
          value={form.categoria_id ?? ""}
          onChange={(e) => setForm({ ...form, categoria_id: e.target.value || null })}
          className="w-full px-5 py-4 text-xl rounded-xl border-2 border-border bg-card"
        >
          <option value="">Sin categoría</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <SaveBtn saving={saving} onClick={() => guardarCampo({ categoria_id: form.categoria_id ?? null })} />
      </EditWrap>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Editar producto</h1>
      <p className="text-muted-foreground">Elige qué quieres cambiar. Se guarda uno a la vez.</p>

      <button onClick={() => setCampo("foto")} className="w-full bg-card border-2 border-border rounded-2xl p-4 flex items-center gap-4 hover:bg-muted text-left">
        {data.imagen_url ? (
          <img src={data.imagen_url} alt="" className="w-20 h-20 rounded-xl object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-muted grid place-items-center text-2xl">📷</div>
        )}
        <div className="flex-1">
          <div className="text-sm text-muted-foreground">Foto</div>
          <div className="text-lg font-semibold">Cambiar foto</div>
        </div>
        <span className="text-2xl">✏️</span>
      </button>

      <EditRow label="Nombre" value={data.nombre} onClick={() => setCampo("nombre")} />
      <EditRow label="Precio" value={formatPrice(data.precio)} onClick={() => setCampo("precio")} />
      <EditRow
        label="Descripción"
        value={data.descripcion || "(sin descripción)"}
        onClick={() => setCampo("descripcion")}
      />
      <EditRow
        label="Categoría"
        value={cats.find((c) => c.id === data.categoria_id)?.nombre || "Sin categoría"}
        onClick={() => setCampo("categoria")}
      />

      <button
        onClick={() => navigate({ to: "/admin/productos" })}
        className="btn-a11y btn-a11y-secondary w-full mt-4"
      >
        ← Volver a mis productos
      </button>
    </div>
  );
}

function EditRow({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-card border-2 border-border rounded-2xl p-4 flex items-center gap-4 hover:bg-muted text-left"
    >
      <div className="flex-1">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold truncate">{value}</div>
      </div>
      <span className="text-2xl">✏️</span>
    </button>
  );
}

function EditWrap({
  titulo,
  onCancel,
  children,
}: {
  titulo: string;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">{titulo}</h1>
      {children}
      <button onClick={onCancel} className="btn-a11y btn-a11y-secondary w-full">
        ← Cancelar
      </button>
    </div>
  );
}

function SaveBtn({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button disabled={saving} onClick={onClick} className="btn-a11y btn-a11y-primary w-full">
      {saving ? "Guardando..." : "💾 Guardar"}
    </button>
  );
}
