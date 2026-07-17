import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

function AdminHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl md:text-4xl">¿Qué quieres hacer?</h1>
        <p className="mt-2 text-muted-foreground">Elige una opción.</p>
      </div>
      <div className="grid gap-4">
        <Link to="/admin/productos" className="btn-a11y btn-a11y-primary w-full justify-start px-6">
          <span>Ver mis productos</span>
        </Link>
        <Link to="/admin/nuevo" className="btn-a11y btn-a11y-secondary w-full justify-start px-6">
          <span>Agregar producto nuevo</span>
        </Link>
        <Link to="/admin/ofertas" className="btn-a11y btn-a11y-secondary w-full justify-start px-6">
          <span>Ver ofertas activas</span>
        </Link>
        <Link
          to="/admin/categorias"
          className="btn-a11y btn-a11y-secondary w-full justify-start px-6"
        >
          <span>Categorías</span>
        </Link>
      </div>
    </div>
  );
}
