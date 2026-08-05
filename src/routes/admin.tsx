import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";
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
    <div className="min-h-screen bg-background text-lg text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between">
          <Link to="/" className="no-underline">
            <BrandLogo textClassName="text-2xl md:text-3xl" />
          </Link>

          <div className="grid w-full grid-cols-3 gap-2 md:flex md:w-auto md:items-center">
            <Link
              to="/"
              className="rounded-xl border-2 border-border bg-background px-2 py-2 text-center text-xs font-semibold leading-tight whitespace-nowrap hover:bg-muted sm:px-3 sm:text-sm md:px-4 md:py-3 md:text-base"
            >
              Ver sitio
            </Link>
            <Link
              to="/admin"
              className="rounded-xl border-2 border-border bg-background px-2 py-2 text-center text-xs font-semibold leading-tight whitespace-nowrap hover:bg-muted sm:px-3 sm:text-sm md:px-4 md:py-3 md:text-base"
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
              className="rounded-xl border-2 border-border bg-background px-2 py-2 text-center text-xs font-semibold leading-tight whitespace-nowrap hover:bg-muted sm:px-3 sm:text-sm md:px-4 md:py-3 md:text-base"
            >
              Salir
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 pb-3 text-sm text-muted-foreground sm:px-5">
          Sesion: {user.email} - Rol:{" "}
          <strong className="text-foreground">{role === "due\u00F1o" ? "Dueño" : "Gestora"}</strong>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}
