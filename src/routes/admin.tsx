import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, role, loading, initialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!initialized || loading) return;
    if (user) return;

    navigate({
      to: "/admin-login",
      search: { redirect: window.location.href },
      replace: true,
    });
  }, [initialized, loading, navigate, user]);

  if (!initialized || loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="text-lg text-muted-foreground">Cargando panel...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="text-lg text-muted-foreground">Redirigiendo al login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground text-lg">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-4">
          <Link to="/" className="font-display text-2xl">
            Alemoon
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="rounded-xl border-2 border-border bg-background px-4 py-3 text-base font-semibold hover:bg-muted"
            >
              Ver sitio publico
            </Link>
            <Link
              to="/admin"
              className="rounded-xl border-2 border-border bg-background px-4 py-3 text-base font-semibold hover:bg-muted"
            >
              Inicio
            </Link>
            <button
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) {
                  toast.error(error.message);
                  return;
                }
                toast.success("Sesion cerrada.");
                navigate({ to: "/admin-login", replace: true });
              }}
              className="rounded-xl border-2 border-border bg-background px-4 py-3 text-base font-semibold hover:bg-muted"
            >
              Cerrar sesion
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-5 pb-3 text-sm text-muted-foreground">
          Sesion: {user.email} · Rol:{" "}
          <strong className="text-foreground">{role === "dueno" ? "Dueño" : "Gestora"}</strong>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}
