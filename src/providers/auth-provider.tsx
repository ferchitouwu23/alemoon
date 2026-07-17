import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "dueno" | "gestora" | null;

type Perfil = {
  id: string;
  nombre: string;
};

type AuthContextValue = {
  loading: boolean;
  initialized: boolean;
  session: Session | null;
  user: User | null;
  role: AppRole;
  perfil: Perfil | null;
  refreshAuth: () => Promise<Session | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useProvideAuth();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}

function useProvideAuth(): AuthContextValue {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const syncSession = async (nextSession: Session | null) => {
      if (!mounted) return nextSession;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setRole(null);
        setPerfil(null);
        setLoading(false);
        setInitialized(true);
        return nextSession;
      }

      setLoading(true);

      const [{ data: perfilData, error: perfilError }, { data: roleData, error: roleError }] =
        await Promise.all([
          supabase
            .from("perfiles")
            .select("id, nombre")
            .eq("id", nextSession.user.id)
            .maybeSingle(),
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", nextSession.user.id)
            .maybeSingle(),
        ]);

      if (!mounted) return nextSession;

      if (perfilError) {
        console.error("No se pudo cargar el perfil del usuario.", perfilError);
      }

      if (roleError) {
        console.error("No se pudo cargar el rol del usuario.", roleError);
      }

      setPerfil(perfilData ?? null);
      setRole((roleData?.role as AppRole) ?? null);
      setLoading(false);
      setInitialized(true);
      return nextSession;
    };

    const refreshAuth = async () => {
      const {
        data: { session: latestSession },
      } = await supabase.auth.getSession();
      return syncSession(latestSession);
    };

    void refreshAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshAuth = async () => {
    const {
      data: { session: latestSession },
    } = await supabase.auth.getSession();

    setSession(latestSession);
    setUser(latestSession?.user ?? null);

    if (!latestSession?.user) {
      setRole(null);
      setPerfil(null);
      setLoading(false);
      setInitialized(true);
      return latestSession;
    }

    setLoading(true);

    const [{ data: perfilData, error: perfilError }, { data: roleData, error: roleError }] =
      await Promise.all([
        supabase
          .from("perfiles")
          .select("id, nombre")
          .eq("id", latestSession.user.id)
          .maybeSingle(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", latestSession.user.id)
          .maybeSingle(),
      ]);

    if (perfilError) {
      console.error("No se pudo cargar el perfil del usuario.", perfilError);
    }

    if (roleError) {
      console.error("No se pudo cargar el rol del usuario.", roleError);
    }

    setPerfil(perfilData ?? null);
    setRole((roleData?.role as AppRole) ?? null);
    setLoading(false);
    setInitialized(true);
    return latestSession;
  };

  return { loading, initialized, session, user, role, perfil, refreshAuth };
}
