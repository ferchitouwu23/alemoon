import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, uploadProductImage, type Categoria } from "@/lib/alemoon";

export const Route = createFileRoute("/admin/nuevo")({
  component: NuevoWizard,
});

type Datos = {
  imagen_url: string;
  nombre: string;
  descripcion: string;
  precio: string;
  categoria_id: string | null;
  agotado: boolean;
};

function NuevoWizard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [datos, setDatos] = useState<Datos>({
    imagen_url: "",
    nombre: "",
    descripcion: "",
    precio: "",
    categoria_id: null,
    agotado: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const {
    data: cats = [],
    isLoading: isLoadingCategorias,
    isError: isCategoriasError,
    error: categoriasError,
    refetch: refetchCategorias,
  } = useQuery({
    queryKey: ["categorias"],
    retry: 1,
    queryFn: async (): Promise<Categoria[]> => {
      const { data, error } = await supabase.from("categorias").select("id, nombre").order("nombre");
      if (error) throw error;
      return data ?? [];
    },
  });

  const selectedCategoryName = useMemo(
    () => cats.find((categoria) => categoria.id === datos.categoria_id)?.nombre ?? "sin-categoria",
    [cats, datos.categoria_id],
  );

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  async function guardar() {
    if (!selectedFile) {
      toast.error("Debes elegir una foto antes de guardar.");
      return;
    }

    setSaving(true);

    try {
      const imageUrl = await uploadProductImage(selectedFile, selectedCategoryName);

      const { error } = await supabase.from("productos").insert({
        nombre: datos.nombre,
        descripcion: datos.descripcion.trim() || null,
        precio: Number(datos.precio),
        imagen_url: imageUrl,
        categoria_id: datos.categoria_id,
        agotado: datos.agotado,
        visible: true,
      });

      if (error) throw error;

      setDatos((current) => ({ ...current, imagen_url: imageUrl }));
      qc.invalidateQueries({ queryKey: ["admin-productos"] });
      qc.invalidateQueries({ queryKey: ["productos-publicos"] });
      setStep(5);
      toast.success("Producto guardado correctamente.");
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  const total = 4;
  const canNext =
    (step === 1 && datos.nombre.trim().length > 0) ||
    (step === 2 && !!selectedFile) ||
    (step === 3 && Number(datos.precio) > 0) ||
    step === 4;

  return (
    <div className="space-y-8">
      {step <= total && (
        <div>
          <div className="text-sm uppercase tracking-widest text-muted-foreground">
            Paso {step} de {total}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(step / total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <section className="space-y-6">
          <h1 className="font-display text-3xl">Primero, completa lo básico</h1>
          <label className="block">
            <span className="mb-2 block text-lg">¿Cómo se llama este producto?</span>
            <input
              autoFocus
              value={datos.nombre}
              onChange={(event) => setDatos({ ...datos, nombre: event.target.value })}
              placeholder="Ej: Aretes luna dorada"
              className="w-full rounded-xl border-2 border-border bg-card px-5 py-4 text-xl focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-lg">Descripción</span>
            <textarea
              rows={4}
              value={datos.descripcion}
              onChange={(event) => setDatos({ ...datos, descripcion: event.target.value })}
              placeholder="Describe brevemente la pieza, materiales, estilo o detalles importantes."
              className="w-full rounded-xl border-2 border-border bg-card px-5 py-4 text-lg focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-lg">Categoría</span>
            <select
              value={datos.categoria_id ?? ""}
              disabled={isLoadingCategorias || isCategoriasError}
              onChange={(event) =>
                setDatos({ ...datos, categoria_id: event.target.value || null, imagen_url: "" })
              }
              className="w-full rounded-xl border-2 border-border bg-card px-5 py-4 text-xl disabled:opacity-60"
            >
              <option value="">
                {isLoadingCategorias
                  ? "Cargando categorías..."
                  : isCategoriasError
                    ? "No se pudieron cargar las categorías"
                    : "Sin categoría"}
              </option>
              {cats.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border-2 border-border bg-card px-5 py-4">
            <input
              type="checkbox"
              checked={datos.agotado}
              onChange={(event) => setDatos({ ...datos, agotado: event.target.checked })}
              className="h-5 w-5"
            />
            <span className="text-lg font-medium">Marcar como agotado</span>
          </label>

          {isCategoriasError ? (
            <div className="rounded-2xl border-2 border-destructive/30 bg-card p-5">
              <p className="font-medium">Hubo un problema al cargar las categorías.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {getSupabaseErrorMessage(categoriasError)}
              </p>
              <button
                onClick={() => refetchCategorias()}
                className="btn-a11y btn-a11y-primary mt-4 min-h-12 px-5 text-base"
              >
                Intentar de nuevo
              </button>
            </div>
          ) : !isLoadingCategorias && cats.length === 0 ? (
            <div className="rounded-2xl border-2 border-border bg-card p-5 text-sm text-muted-foreground">
              No se encontraron categorías en la tabla <strong>categorias</strong>. Ahora mismo
              por eso solo aparece la opción <strong>Sin categoría</strong>.
            </div>
          ) : null}

          <p className="text-sm text-muted-foreground">
            La foto se subirá al bucket <strong>productos</strong> dentro de la carpeta de esta
            categoría.
          </p>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-6">
          <h1 className="font-display text-3xl">Ahora, elige la foto</h1>
          <p className="text-lg text-muted-foreground">Selecciona una imagen clara del producto.</p>
          <label className="inline-flex cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setSelectedFile(nextFile);
                setDatos((current) => ({ ...current, imagen_url: "" }));
              }}
            />
            <span className="btn-a11y btn-a11y-primary min-h-14 px-6 text-lg">Elegir foto</span>
          </label>

          <div className="rounded-2xl border-2 border-border bg-card p-5">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Vista previa del producto"
                className="mx-auto max-h-80 rounded-xl object-contain"
              />
            ) : (
              <div className="grid min-h-56 place-items-center rounded-xl border border-dashed border-border bg-background text-center text-muted-foreground">
                <p>La vista previa aparecerá aquí cuando elijas una foto.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-6">
          <h1 className="font-display text-3xl">Ahora, el precio</h1>
          <label className="block">
            <span className="mb-2 block text-lg">¿Cuánto cuesta? (en dólares)</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              autoFocus
              value={datos.precio}
              onChange={(event) => setDatos({ ...datos, precio: event.target.value })}
              placeholder="0.00"
              className="w-full rounded-xl border-2 border-border bg-card px-5 py-4 text-2xl focus:border-primary focus:outline-none"
            />
          </label>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-6">
          <h1 className="font-display text-3xl">Confirma y guarda</h1>
          <div className="space-y-4 rounded-2xl border-2 border-border bg-card p-5">
            {previewUrl && (
              <img src={previewUrl} alt="" className="max-h-64 w-full rounded-xl object-contain" />
            )}
            <div>
              <div className="text-sm text-muted-foreground">Nombre</div>
              <div className="text-xl font-semibold">{datos.nombre}</div>
            </div>
            {datos.descripcion.trim() && (
              <div>
                <div className="text-sm text-muted-foreground">Descripción</div>
                <div className="text-base text-foreground">{datos.descripcion}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-muted-foreground">Categoría</div>
              <div className="text-xl font-semibold">{selectedCategoryName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Precio</div>
              <div className="text-xl font-semibold">{formatPrice(datos.precio)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Estado</div>
              <div className="text-xl font-semibold">{datos.agotado ? "Agotado" : "Disponible"}</div>
            </div>
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="space-y-6 py-10 text-center">
          <div className="text-8xl">OK</div>
          <h1 className="font-display text-3xl">Listo. Guardado correctamente.</h1>
          <div className="grid gap-3">
            <button
              onClick={() => {
                setDatos({
                  imagen_url: "",
                  nombre: "",
                  descripcion: "",
                  precio: "",
                  categoria_id: null,
                  agotado: false,
                });
                setSelectedFile(null);
                setPreviewUrl("");
                setStep(1);
              }}
              className="btn-a11y btn-a11y-primary"
            >
              Agregar otro
            </button>
            <button
              onClick={() => navigate({ to: "/admin/productos" })}
              className="btn-a11y btn-a11y-secondary"
            >
              Ver mis productos
            </button>
          </div>
        </section>
      )}

      {step <= total && (
        <div className="grid grid-cols-2 gap-3 pt-4">
          <button
            disabled={step === 1 || saving}
            onClick={() => setStep(step - 1)}
            className="btn-a11y btn-a11y-secondary disabled:opacity-40"
          >
            Atrás
          </button>
          {step < total ? (
            <button
              disabled={!canNext || saving}
              onClick={() => setStep(step + 1)}
              className="btn-a11y btn-a11y-primary disabled:opacity-40"
            >
              Siguiente
            </button>
          ) : (
            <button
              disabled={saving}
              onClick={guardar}
              className="btn-a11y btn-a11y-primary disabled:opacity-40"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function getSupabaseErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = error.message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return "La consulta a la tabla categorias falló.";
}
