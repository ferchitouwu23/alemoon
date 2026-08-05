import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type LoginSearch = {
  redirect?: string;
};

export const Route = createFileRoute("/admin-login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { loading, initialized, user, refreshAuth } = useAuth();
  const { redirect: redirectTarget } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!initialized || loading || !user) return;

    navigate({
      to: "/admin",
      replace: true,
    });
  }, [initialized, loading, navigate, user]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      await refreshAuth();

      toast.success("Sesión iniciada.");

      if (redirectTarget) {
        window.location.assign(redirectTarget);
      } else {
        navigate({ to: "/admin", replace: true });
      }
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo iniciar sesión.");
    } finally {
      setBusy(false);
    }
  }

  if (!initialized || loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-5 py-10 text-foreground">
        <p className="text-lg text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-5 py-10 text-foreground">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="font-display text-3xl tracking-tight md:text-4xl">
            Alemoon
          </Link>
          <p className="mt-2 text-muted-foreground">Inicia sesión para entrar al panel</p>
        </div>

        <div className="mb-4">
          <Link to="/" className="btn-a11y btn-a11y-secondary w-full justify-center px-6">
            Volver al sitio
          </Link>
        </div>

        <form onSubmit={submit} className="space-y-5 rounded-2xl border-2 border-border bg-card p-6">
          <h1 className="font-display text-2xl">Acceso al panel</h1>

          <label className="block">
            <span className="mb-2 block text-base font-medium">Correo</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-lg focus:border-primary focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-base font-medium">Contraseña</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-lg focus:border-primary focus:outline-none"
            />
          </label>

          <button disabled={busy} className="btn-a11y btn-a11y-primary w-full">
            {busy ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
