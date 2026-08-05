import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { type Promocion, uploadPromotionImage } from "@/lib/alemoon";

export const Route = createFileRoute("/admin/promociones")({
  component: PromocionesAdmin,
});

function PromocionesAdmin() {
  const qc = useQueryClient();
  const [tituloNuevo, setTituloNuevo] = useState("");
  const [archivoNuevo, setArchivoNuevo] = useState<File | null>(null);
  const [previewNueva, setPreviewNueva] = useState("");
  const [saving, setSaving] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [tituloEditado, setTituloEditado] = useState("");
  const [archivoEditado, setArchivoEditado] = useState<File | null>(null);
  const [previewEditada, setPreviewEditada] = useState("");
  const [confirm, setConfirm] = useState<Promocion | null>(null);

  const { data: promociones = [], isLoading } = useQuery({
    queryKey: ["admin-promociones"],
    queryFn: async (): Promise<Promocion[]> => {
      const { data, error } = await supabase
        .from("promociones")
        .select("id, imagen_url, titulo, orden, activo, fecha_creacion")
        .order("orden", { ascending: true })
        .order("fecha_creacion", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });

  const promotionsLabel = useMemo(
    () => (promociones.length === 1 ? "1 imagen destacada" : `${promociones.length} imagenes destacadas`),
    [promociones.length],
  );

  useEffect(() => {
    if (!archivoNuevo) {
      setPreviewNueva("");
      return;
    }

    const objectUrl = URL.createObjectURL(archivoNuevo);
    setPreviewNueva(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [archivoNuevo]);

  useEffect(() => {
    if (!archivoEditado) {
      setPreviewEditada("");
      return;
    }

    const objectUrl = URL.createObjectURL(archivoEditado);
    setPreviewEditada(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [archivoEditado]);

  async function refreshPromotions() {
    await qc.invalidateQueries({ queryKey: ["admin-promociones"] });
    await qc.invalidateQueries({ queryKey: ["home-promociones"] });
  }

  async function agregarPromocion() {
    if (!archivoNuevo) {
      toast.error("Elige una imagen antes de subirla.");
      return;
    }

    setSaving(true);
    try {
      const imagen_url = await uploadPromotionImage(archivoNuevo);
      const orden = (promociones[promociones.length - 1]?.orden ?? 0) + 1;

      const { error } = await supabase.from("promociones").insert({
        imagen_url,
        titulo: tituloNuevo.trim() || null,
        orden,
        activo: true,
      });

      if (error) throw error;

      setTituloNuevo("");
      setArchivoNuevo(null);
      await refreshPromotions();
      toast.success("Imagen destacada guardada.");
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo subir la imagen.");
    } finally {
      setSaving(false);
    }
  }

  function empezarEdicion(promocion: Promocion) {
    setEditandoId(promocion.id);
    setTituloEditado(promocion.titulo ?? "");
    setArchivoEditado(null);
    setPreviewEditada("");
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setTituloEditado("");
    setArchivoEditado(null);
    setPreviewEditada("");
  }

  async function guardarEdicion(promocion: Promocion) {
    setSaving(true);
    try {
      const cambios: Partial<Promocion> = {
        titulo: tituloEditado.trim() || null,
      };

      if (archivoEditado) {
        cambios.imagen_url = await uploadPromotionImage(archivoEditado);
      }

      const { error } = await supabase.from("promociones").update(cambios).eq("id", promocion.id);
      if (error) throw error;

      cancelarEdicion();
      await refreshPromotions();
      toast.success("Imagen destacada actualizada.");
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo guardar el cambio.");
    } finally {
      setSaving(false);
    }
  }

  async function moverPromocion(promocion: Promocion, direction: "up" | "down") {
    const currentIndex = promociones.findIndex((item) => item.id === promocion.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const target = promociones[targetIndex];

    if (!target) return;

    setSaving(true);
    try {
      const updates = await Promise.all([
        supabase.from("promociones").update({ orden: target.orden }).eq("id", promocion.id),
        supabase.from("promociones").update({ orden: promocion.orden }).eq("id", target.id),
      ]);

      const firstError = updates.find((result) => result.error)?.error;
      if (firstError) throw firstError;

      await refreshPromotions();
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo cambiar el orden.");
    } finally {
      setSaving(false);
    }
  }

  async function quitarPromocion(promocion: Promocion) {
    setSaving(true);
    try {
      const { error } = await supabase.from("promociones").delete().eq("id", promocion.id);
      if (error) throw error;

      setConfirm(null);
      if (editandoId === promocion.id) cancelarEdicion();
      await refreshPromotions();
      toast.success("Imagen destacada eliminada.");
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo quitar la imagen.");
    } finally {
      setSaving(false);
    }
  }

  if (confirm) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl">Seguro que quieres quitar esta imagen destacada?</h1>
          <p className="mt-2 text-lg text-destructive">Esta accion no se puede deshacer.</p>
        </div>

        <div className="rounded-2xl border-2 border-border bg-card p-5">
          <img src={confirm.imagen_url} alt="" className="h-48 w-full rounded-xl object-cover" />
          {confirm.titulo && <div className="mt-4 text-xl font-semibold">{confirm.titulo}</div>}
        </div>

        <div className="grid gap-3">
          <button
            disabled={saving}
            onClick={() => quitarPromocion(confirm)}
            className="btn-a11y btn-a11y-danger min-h-14 text-lg disabled:opacity-40"
          >
            Si, quitar
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
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="font-display text-3xl">Imagenes destacadas</h1>
          <p className="mt-2 text-muted-foreground">{promotionsLabel}</p>
        </div>

        <div className="rounded-2xl border-2 border-border bg-card p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <label className="block">
              <span className="mb-2 block text-sm text-muted-foreground">Titulo opcional</span>
              <input
                value={tituloNuevo}
                onChange={(event) => setTituloNuevo(event.target.value)}
                placeholder="Ej: Opcion 1"
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-lg focus:border-primary focus:outline-none"
              />
            </label>

            <label className="inline-flex cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => setArchivoNuevo(event.target.files?.[0] ?? null)}
              />
              <span className="btn-a11y btn-a11y-secondary min-h-12 px-5 text-base">Elegir imagen</span>
            </label>
          </div>

          {previewNueva ? (
            <img src={previewNueva} alt="Vista previa" className="mt-4 h-56 w-full rounded-xl object-cover" />
          ) : (
            <div className="mt-4 grid min-h-40 place-items-center rounded-xl border border-dashed border-border bg-background text-center text-muted-foreground">
              <p>La vista previa aparecera aqui.</p>
            </div>
          )}

          <button
            disabled={saving}
            onClick={agregarPromocion}
            className="btn-a11y btn-a11y-primary mt-4 min-h-12 px-5 text-base disabled:opacity-40"
          >
            Subir imagen nueva
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando imagenes destacadas...</p>
      ) : promociones.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border py-12 text-center text-muted-foreground">
          Aun no hay imagenes destacadas cargadas.
        </div>
      ) : (
        <div className="grid gap-4">
          {promociones.map((promocion, index) => {
            const enEdicion = editandoId === promocion.id;
            const imagenMostrada = previewEditada || promocion.imagen_url;

            return (
              <article
                key={promocion.id}
                className="space-y-4 rounded-2xl border-2 border-border bg-card p-5"
              >
                <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                  <img src={imagenMostrada} alt="" className="h-48 w-full rounded-xl object-cover" />

                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">Posicion #{index + 1}</div>

                    {enEdicion ? (
                      <>
                        <label className="block">
                          <span className="mb-2 block text-sm text-muted-foreground">Titulo opcional</span>
                          <input
                            value={tituloEditado}
                            onChange={(event) => setTituloEditado(event.target.value)}
                            placeholder="Ej: Opcion 1"
                            className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-lg focus:border-primary focus:outline-none"
                          />
                        </label>
                        <label className="inline-flex cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => setArchivoEditado(event.target.files?.[0] ?? null)}
                          />
                          <span className="btn-a11y btn-a11y-secondary min-h-12 px-5 text-base">
                            Cambiar imagen
                          </span>
                        </label>
                        <div className="flex flex-wrap gap-3">
                          <button
                            disabled={saving}
                            onClick={() => guardarEdicion(promocion)}
                            className="btn-a11y btn-a11y-primary min-h-12 px-5 text-base disabled:opacity-40"
                          >
                            Guardar cambio
                          </button>
                          <button
                            disabled={saving}
                            onClick={cancelarEdicion}
                            className="btn-a11y btn-a11y-secondary min-h-12 px-5 text-base disabled:opacity-40"
                          >
                            Cancelar
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <h2 className="text-2xl font-semibold">
                          {promocion.titulo?.trim() || "Sin titulo"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Carpeta de storage: <strong>productos/promociones</strong>
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <button
                            disabled={saving || index === 0}
                            onClick={() => moverPromocion(promocion, "up")}
                            className="btn-a11y btn-a11y-secondary min-h-12 px-5 text-base disabled:opacity-40"
                          >
                            Subir
                          </button>
                          <button
                            disabled={saving || index === promociones.length - 1}
                            onClick={() => moverPromocion(promocion, "down")}
                            className="btn-a11y btn-a11y-secondary min-h-12 px-5 text-base disabled:opacity-40"
                          >
                            Bajar
                          </button>
                          <button
                            onClick={() => empezarEdicion(promocion)}
                            className="btn-a11y btn-a11y-secondary min-h-12 px-5 text-base"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setConfirm(promocion)}
                            className="btn-a11y btn-a11y-danger min-h-12 px-5 text-base"
                          >
                            Quitar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
