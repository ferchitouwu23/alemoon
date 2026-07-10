import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <p className="text-lg text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-background text-foreground text-lg">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-5 py-4 flex items-center justify-between gap-3">
          <Link to="/admin" className="font-display text-2xl">Panel Alemoon</Link>
          <div className="flex items-center gap-2">
            <Link
              to="/admin"
              className="px-4 py-3 rounded-xl border-2 border-border font-semibold text-base bg-background hover:bg-muted"
            >
              🏠 Inicio
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                toast.success("¡Listo! Sesión cerrada.");
                navigate({ to: "/" });
              }}
              className="px-4 py-3 rounded-xl border-2 border-border font-semibold text-base bg-background hover:bg-muted"
            >
              Salir
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-5 pb-3 text-sm text-muted-foreground">
          Sesión: {user.email} · Rol: <strong className="text-foreground">{role === "dueno" ? "Dueña" : "Gestora"}</strong>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function LoginScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [nombre, setNombre] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        toast.success("¡Bienvenida!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: { data: { nombre }, emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        toast.success("¡Cuenta creada!");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Error al ingresar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground grid place-items-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-display text-3xl">Alemoon</Link>
          <p className="mt-2 text-muted-foreground">Panel privado</p>
        </div>
        <form onSubmit={submit} className="bg-card border-2 border-border rounded-2xl p-6 space-y-5">
          <h1 className="font-display text-2xl">
            {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </h1>
          {mode === "signup" && (
            <label className="block">
              <span className="block text-base font-medium mb-2">Tu nombre</span>
              <input
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-3 text-lg rounded-xl border-2 border-border bg-background focus:outline-none focus:border-primary"
              />
            </label>
          )}
          <label className="block">
            <span className="block text-base font-medium mb-2">Correo</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-lg rounded-xl border-2 border-border bg-background focus:outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="block text-base font-medium mb-2">Contraseña</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full px-4 py-3 text-lg rounded-xl border-2 border-border bg-background focus:outline-none focus:border-primary"
            />
          </label>
          <button disabled={busy} className="btn-a11y btn-a11y-primary w-full">
            {busy ? "Un momento..." : mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="w-full text-center text-base underline underline-offset-4"
          >
            {mode === "login" ? "¿Aún no tienes cuenta? Crear una" : "Ya tengo cuenta"}
          </button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground text-center">
          La primera persona que se registre será la <strong>Dueña</strong>. Las siguientes cuentas serán <strong>Gestoras</strong>.
        </p>
      </div>
    </div>
  );
}