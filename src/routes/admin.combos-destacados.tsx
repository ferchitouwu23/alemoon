import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  prefilledWhatsappUrl,
  type ComboDestacado,
  uploadFeaturedComboImage,
} from "@/lib/alemoon";

export const Route = createFileRoute("/admin/combos-destacados")({
  component: CombosDestacadosAdmin,
});

function CombosDestacadosAdmin() {
  const qc = useQueryClient();
  const [nuevo, setNuevo] = useState({
    etiqueta: "",
    titulo: "",
    descripcion: "",
    mensaje_whatsapp: "",
  });
  const [archivoNuevo, setArchivoNuevo] = useState<File | null>(null);
  const [previewNueva, setPreviewNueva] = useState("");
  const [saving, setSaving] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editado, setEditado] = useState({
    etiqueta: "",
    titulo: "",
    descripcion: "",
    mensaje_whatsapp: "",
  });
  const [archivoEditado, setArchivoEditado] = useState<File | null>(null);
  const [previewEditada, setPreviewEditada] = useState("");
  const [confirm, setConfirm] = useState<ComboDestacado | null>(null);

  const { data: combos = [], isLoading } = useQuery({
    queryKey: ["admin-combos-destacados"],
    queryFn: async (): Promise<ComboDestacado[]> => {
      const { data, error } = await supabase
        .from("combos_destacados")
        .select("id, imagen_url, etiqueta, titulo, descripcion, mensaje_whatsapp, orden, activo, fecha_creacion")
        .order("orden", { ascending: true })
        .order("fecha_creacion", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });

  const combosLabel = useMemo(
    () => (combos.length === 1 ? "1 combo destacado" : `${combos.length} combos destacados`),
    [combos.length],
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

  async function refreshCombos() {
    await qc.invalidateQueries({ queryKey: ["admin-combos-destacados"] });
    await qc.invalidateQueries({ queryKey: ["home-combos-destacados"] });
  }

  async function agregarCombo() {
    if (!archivoNuevo) {
      toast.error("Elige una imagen antes de guardarla.");
      return;
    }

    if (!nuevo.titulo.trim()) {
      toast.error("El titulo es obligatorio.");
      return;
    }

    if (!nuevo.mensaje_whatsapp.trim()) {
      toast.error("El mensaje de WhatsApp es obligatorio.");
      return;
    }

    setSaving(true);
    try {
      const imagen_url = await uploadFeaturedComboImage(archivoNuevo);
      const orden = (combos[combos.length - 1]?.orden ?? 0) + 1;

      const { error } = await supabase.from("combos_destacados").insert({
        imagen_url,
        etiqueta: nuevo.etiqueta.trim() || null,
        titulo: nuevo.titulo.trim(),
        descripcion: nuevo.descripcion.trim() || null,
        mensaje_whatsapp: nuevo.mensaje_whatsapp.trim(),
        orden,
        activo: true,
      });

      if (error) throw error;

      setNuevo({ etiqueta: "", titulo: "", descripcion: "", mensaje_whatsapp: "" });
      setArchivoNuevo(null);
      await refreshCombos();
      toast.success("Combo destacado guardado.");
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo guardar el combo.");
    } finally {
      setSaving(false);
    }
  }

  function empezarEdicion(combo: ComboDestacado) {
    setEditandoId(combo.id);
    setEditado({
      etiqueta: combo.etiqueta ?? "",
      titulo: combo.titulo,
      descripcion: combo.descripcion ?? "",
      mensaje_whatsapp: combo.mensaje_whatsapp,
    });
    setArchivoEditado(null);
    setPreviewEditada("");
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setEditado({ etiqueta: "", titulo: "", descripcion: "", mensaje_whatsapp: "" });
    setArchivoEditado(null);
    setPreviewEditada("");
  }

  async function guardarEdicion(combo: ComboDestacado) {
    if (!editado.titulo.trim()) {
      toast.error("El titulo es obligatorio.");
      return;
    }

    if (!editado.mensaje_whatsapp.trim()) {
      toast.error("El mensaje de WhatsApp es obligatorio.");
      return;
    }

    setSaving(true);
    try {
      const cambios: Partial<ComboDestacado> = {
        etiqueta: editado.etiqueta.trim() || null,
        titulo: editado.titulo.trim(),
        descripcion: editado.descripcion.trim() || null,
        mensaje_whatsapp: editado.mensaje_whatsapp.trim(),
      };

      if (archivoEditado) {
        cambios.imagen_url = await uploadFeaturedComboImage(archivoEditado);
      }

      const { error } = await supabase.from("combos_destacados").update(cambios).eq("id", combo.id);
      if (error) throw error;

      cancelarEdicion();
      await refreshCombos();
      toast.success("Combo destacado actualizado.");
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo guardar el cambio.");
    } finally {
      setSaving(false);
    }
  }

  async function moverCombo(combo: ComboDestacado, direction: "up" | "down") {
    const currentIndex = combos.findIndex((item) => item.id === combo.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const target = combos[targetIndex];

    if (!target) return;

    setSaving(true);
    try {
      const updates = await Promise.all([
        supabase.from("combos_destacados").update({ orden: target.orden }).eq("id", combo.id),
        supabase.from("combos_destacados").update({ orden: combo.orden }).eq("id", target.id),
      ]);

      const firstError = updates.find((result) => result.error)?.error;
      if (firstError) throw firstError;

      await refreshCombos();
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo cambiar el orden.");
    } finally {
      setSaving(false);
    }
  }

  async function quitarCombo(combo: ComboDestacado) {
    setSaving(true);
    try {
      const { error } = await supabase.from("combos_destacados").delete().eq("id", combo.id);
      if (error) throw error;

      setConfirm(null);
      if (editandoId === combo.id) cancelarEdicion();
      await refreshCombos();
      toast.success("Combo destacado eliminado.");
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo quitar el combo.");
    } finally {
      setSaving(false);
    }
  }

  if (confirm) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl">Seguro que quieres quitar este combo destacado?</h1>
          <p className="mt-2 text-lg text-destructive">Esta accion no se puede deshacer.</p>
        </div>

        <div className="rounded-2xl border-2 border-border bg-card p-5">
          <img src={confirm.imagen_url} alt="" className="h-48 w-full rounded-xl object-cover" />
          <div className="mt-4 text-xl font-semibold">{confirm.titulo}</div>
        </div>

        <div className="grid gap-3">
          <button
            disabled={saving}
            onClick={() => quitarCombo(confirm)}
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
          <h1 className="font-display text-3xl">Combos destacados</h1>
          <p className="mt-2 text-muted-foreground">{combosLabel}</p>
        </div>

        <div className="rounded-2xl border-2 border-border bg-card p-5">
          <div className="grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm text-muted-foreground">Etiqueta opcional</span>
              <input
                value={nuevo.etiqueta}
                onChange={(event) => setNuevo((prev) => ({ ...prev, etiqueta: event.target.value }))}
                placeholder="Ej: Combo visual"
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-lg focus:border-primary focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-muted-foreground">Titulo</span>
              <input
                value={nuevo.titulo}
                onChange={(event) => setNuevo((prev) => ({ ...prev, titulo: event.target.value }))}
                placeholder="Ej: Combos listos para obsequiar"
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-lg focus:border-primary focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-muted-foreground">Descripcion</span>
              <textarea
                value={nuevo.descripcion}
                onChange={(event) => setNuevo((prev) => ({ ...prev, descripcion: event.target.value }))}
                placeholder="Texto breve para explicar el combo."
                rows={4}
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-base focus:border-primary focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-muted-foreground">Mensaje de WhatsApp</span>
              <textarea
                value={nuevo.mensaje_whatsapp}
                onChange={(event) =>
                  setNuevo((prev) => ({ ...prev, mensaje_whatsapp: event.target.value }))
                }
                placeholder="Hola Alemoon, quiero informacion sobre este combo."
                rows={3}
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-base focus:border-primary focus:outline-none"
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
            onClick={agregarCombo}
            className="btn-a11y btn-a11y-primary mt-4 min-h-12 px-5 text-base disabled:opacity-40"
          >
            Agregar combo nuevo
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando combos destacados...</p>
      ) : combos.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border py-12 text-center text-muted-foreground">
          Aun no hay combos destacados cargados.
        </div>
      ) : (
        <div className="grid gap-4">
          {combos.map((combo, index) => {
            const enEdicion = editandoId === combo.id;
            const imagenMostrada = previewEditada || combo.imagen_url;

            return (
              <article key={combo.id} className="space-y-4 rounded-2xl border-2 border-border bg-card p-5">
                <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                  <img src={imagenMostrada} alt="" className="h-48 w-full rounded-xl object-cover" />

                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">Posicion #{index + 1}</div>

                    {enEdicion ? (
                      <>
                        <label className="block">
                          <span className="mb-2 block text-sm text-muted-foreground">Etiqueta opcional</span>
                          <input
                            value={editado.etiqueta}
                            onChange={(event) =>
                              setEditado((prev) => ({ ...prev, etiqueta: event.target.value }))
                            }
                            className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-lg focus:border-primary focus:outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-sm text-muted-foreground">Titulo</span>
                          <input
                            value={editado.titulo}
                            onChange={(event) =>
                              setEditado((prev) => ({ ...prev, titulo: event.target.value }))
                            }
                            className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-lg focus:border-primary focus:outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-sm text-muted-foreground">Descripcion</span>
                          <textarea
                            value={editado.descripcion}
                            onChange={(event) =>
                              setEditado((prev) => ({ ...prev, descripcion: event.target.value }))
                            }
                            rows={4}
                            className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-base focus:border-primary focus:outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-sm text-muted-foreground">Mensaje de WhatsApp</span>
                          <textarea
                            value={editado.mensaje_whatsapp}
                            onChange={(event) =>
                              setEditado((prev) => ({ ...prev, mensaje_whatsapp: event.target.value }))
                            }
                            rows={3}
                            className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-base focus:border-primary focus:outline-none"
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
                            onClick={() => guardarEdicion(combo)}
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
                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                          {combo.etiqueta?.trim() || "Combo visual"}
                        </p>
                        <h2 className="text-2xl font-semibold">{combo.titulo}</h2>
                        {combo.descripcion?.trim() ? (
                          <p className="text-sm leading-relaxed text-muted-foreground">{combo.descripcion}</p>
                        ) : null}
                        <a
                          href={prefilledWhatsappUrl(combo.mensaje_whatsapp)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                        >
                          Vista previa del mensaje de WhatsApp
                        </a>
                        <div className="flex flex-wrap gap-3">
                          <button
                            disabled={saving || index === 0}
                            onClick={() => moverCombo(combo, "up")}
                            className="btn-a11y btn-a11y-secondary min-h-12 px-5 text-base disabled:opacity-40"
                          >
                            Subir
                          </button>
                          <button
                            disabled={saving || index === combos.length - 1}
                            onClick={() => moverCombo(combo, "down")}
                            className="btn-a11y btn-a11y-secondary min-h-12 px-5 text-base disabled:opacity-40"
                          >
                            Bajar
                          </button>
                          <button
                            onClick={() => empezarEdicion(combo)}
                            className="btn-a11y btn-a11y-secondary min-h-12 px-5 text-base"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setConfirm(combo)}
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
