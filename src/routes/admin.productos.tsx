import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, type Categoria, type Producto } from "@/lib/alemoon";

export const Route = createFileRoute("/admin/productos")({
  component: ProductosAdmin,
});

function ProductosAdmin() {
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState<Producto | null>(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("todas");
  const [busqueda, setBusqueda] = useState("");
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<string>("todos");

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

  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-productos"],
    retry: 1,
    queryFn: async (): Promise<Producto[]> => {
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .order("fecha_creacion", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Producto[];
    },
  });

  const productosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return data.filter((producto) => {
      const coincideCategoria =
        categoriaSeleccionada === "todas" || producto.categoria_id === categoriaSeleccionada;
      const coincideBusqueda =
        termino.length === 0 ||
        producto.nombre.toLowerCase().includes(termino) ||
        producto.descripcion?.toLowerCase().includes(termino);
      const coincideEstado =
        estadoSeleccionado === "todos" ||
        (estadoSeleccionado === "visibles" && producto.visible) ||
        (estadoSeleccionado === "ocultos" && !producto.visible) ||
        (estadoSeleccionado === "agotados" && producto.agotado) ||
        (estadoSeleccionado === "ofertas" && producto.en_oferta);

      return coincideCategoria && coincideBusqueda && coincideEstado;
    });
  }, [busqueda, categoriaSeleccionada, data, estadoSeleccionado]);

  async function borrar(producto: Producto) {
    const { error } = await supabase.from("productos").delete().eq("id", producto.id);
    if (error) return toast.error(error.message);

    toast.success("Producto eliminado.");
    setConfirm(null);
    qc.invalidateQueries({ queryKey: ["admin-productos"] });
    qc.invalidateQueries({ queryKey: ["productos-publicos"] });
  }

  if (confirm) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl">¿Seguro que quieres borrar este producto?</h1>
          <p className="mt-2 text-lg text-destructive">Esta acción no se puede deshacer.</p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border-2 border-border bg-card p-5">
          {confirm.imagen_url && (
            <img src={confirm.imagen_url} alt="" className="h-20 w-20 rounded-xl object-cover" />
          )}
          <div>
            <div className="text-xl font-semibold">{confirm.nombre}</div>
            <div className="text-muted-foreground">{formatPrice(confirm.precio)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            className="btn-a11y btn-a11y-danger min-h-14 text-lg"
            onClick={() => borrar(confirm)}
          >
            Sí, borrar
          </button>
          <button
            className="btn-a11y btn-a11y-secondary min-h-14 text-lg"
            onClick={() => setConfirm(null)}
          >
            No, cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Mis productos</h1>
        <Link to="/admin/nuevo" className="btn-a11y btn-a11y-primary min-h-12 px-5 text-base">
          Agregar
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <input
          type="search"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar producto por nombre o descripcion"
          className="min-h-12 rounded-2xl border-2 border-border bg-background px-4 text-base outline-none transition focus:border-primary"
        />
        <select
          value={estadoSeleccionado}
          onChange={(event) => setEstadoSeleccionado(event.target.value)}
          className="min-h-12 rounded-2xl border-2 border-border bg-background px-4 text-base outline-none transition focus:border-primary"
        >
          <option value="todos">Todos los estados</option>
          <option value="visibles">Solo visibles</option>
          <option value="ocultos">Solo ocultos</option>
          <option value="agotados">Solo agotados</option>
          <option value="ofertas">Solo ofertas</option>
        </select>
      </div>

      <p className="text-sm text-muted-foreground">
        Mostrando {productosFiltrados.length} producto{productosFiltrados.length === 1 ? "" : "s"}.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategoriaSeleccionada("todas")}
          className={`rounded-full border px-4 py-2 text-sm transition ${
            categoriaSeleccionada === "todas"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:border-primary"
          }`}
        >
          Todas
        </button>
        {categorias.map((categoria) => (
          <button
            key={categoria.id}
            type="button"
            onClick={() => setCategoriaSeleccionada(categoria.id)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              categoriaSeleccionada === categoria.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:border-primary"
            }`}
          >
            {categoria.nombre}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando productos...</p>
      ) : isError ? (
        <div className="rounded-2xl border-2 border-destructive/30 bg-card p-6">
          <h2 className="font-display text-2xl">Hubo un problema al cargar, intenta de nuevo</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "No se pudieron cargar los productos."}
          </p>
          <button
            onClick={() => refetch()}
            className="btn-a11y btn-a11y-primary mt-4 min-h-12 px-5 text-base"
          >
            Intentar de nuevo
          </button>
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border py-12 text-center">
          <p className="text-lg">Todavía no hay productos con esos filtros.</p>
          <Link to="/admin/nuevo" className="btn-a11y btn-a11y-primary mt-5 inline-flex">
            Agregar el primero
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {productosFiltrados.map((producto) => (
            <div
              key={producto.id}
              className="flex flex-col gap-4 rounded-2xl border-2 border-border bg-card p-4 md:flex-row md:items-center"
            >
              <div className="flex flex-1 items-center gap-4">
                {producto.imagen_url ? (
                  <img src={producto.imagen_url} alt="" className="h-24 w-24 rounded-xl object-cover" />
                ) : (
                  <div className="grid h-24 w-24 place-items-center rounded-xl bg-muted text-3xl">
                    P
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-xl font-semibold">{producto.nombre}</div>
                    {producto.agotado && (
                      <span className="rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground">
                        Agotado
                      </span>
                    )}
                  </div>
                  <div className="text-lg">
                    {producto.en_oferta && producto.precio_oferta != null ? (
                      <>
                        <span className="font-semibold">{formatPrice(producto.precio_oferta)}</span>{" "}
                        <span className="text-base text-muted-foreground line-through">
                          {formatPrice(producto.precio)}
                        </span>
                      </>
                    ) : (
                      formatPrice(producto.precio)
                    )}
                  </div>
                  {!producto.visible && (
                    <span className="text-sm text-destructive">Oculto del catálogo</span>
                  )}
                  {producto.visible && producto.en_oferta && (
                    <span className="text-sm text-muted-foreground">Visible con oferta activa</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  to="/admin/editar/$id"
                  params={{ id: producto.id }}
                  className="btn-a11y btn-a11y-secondary min-h-12 px-5 text-base"
                >
                  Editar
                </Link>
                <button
                  onClick={() => setConfirm(producto)}
                  className="btn-a11y btn-a11y-danger min-h-12 px-5 text-base"
                >
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
