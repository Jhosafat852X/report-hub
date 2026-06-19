import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Iniciar sesión — Mural de Mantenimiento" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
  }, [navigate]);

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Signup state
  const [sName, setSName] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sPass, setSPass] = useState("");
  const [sArea, setSArea] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bienvenido");
    navigate({ to: "/app" });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: sEmail,
      password: sPass,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { nombre_completo: sName, area: sArea },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Cuenta creada. Ya puedes iniciar sesión.");
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/app",
    });
    if (result.error) {
      setLoading(false);
      toast.error("No se pudo iniciar sesión con Google");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/app" });
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative gradient-primary p-12 flex-col justify-between text-primary-foreground">
        <Link to="/" className="inline-flex items-center gap-2 text-sm opacity-80 hover:opacity-100">
          <ArrowLeft className="size-4" /> Volver al inicio
        </Link>
        <div>
          <div className="size-14 rounded-xl bg-white/10 grid place-items-center backdrop-blur">
            <Wrench className="size-7" />
          </div>
          <h2 className="mt-6 text-4xl font-bold leading-tight">
            Universidad del Istmo<br />Campus Ixtepec
          </h2>
          <p className="mt-3 text-primary-foreground/80 max-w-md">
            Mural digital para reportes de mantenimiento. Comunicación clara,
            seguimiento puntual, espacios siempre operativos.
          </p>
        </div>
        <div className="text-xs text-primary-foreground/70">
          PRY-003 · Sistema de Gestión Interna
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowLeft className="size-4" /> Inicio
            </Link>
          </div>

          <h1 className="text-2xl font-semibold">Acceso al sistema</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Usa tus credenciales autorizadas para continuar.
          </p>

          <Tabs defaultValue="login" className="mt-6">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-5">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Correo institucional</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="pwd">Contraseña</Label>
                  <Input id="pwd" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" disabled={loading} className="w-full gradient-primary">
                  {loading ? "Ingresando..." : "Ingresar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-5">
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="sname">Nombre completo</Label>
                  <Input id="sname" required value={sName} onChange={(e) => setSName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="sarea">Sala / Área asignada</Label>
                  <Input id="sarea" placeholder="Ej: Lab. Cómputo 2" value={sArea} onChange={(e) => setSArea(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="semail">Correo</Label>
                  <Input id="semail" type="email" required value={sEmail} onChange={(e) => setSEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="spwd">Contraseña</Label>
                  <Input id="spwd" type="password" required minLength={6} value={sPass} onChange={(e) => setSPass(e.target.value)} />
                </div>
                <Button type="submit" disabled={loading} className="w-full gradient-primary">
                  {loading ? "Creando..." : "Crear cuenta"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Por defecto se asigna rol <strong>Encargado</strong>. Un administrador puede actualizar tu rol.
                </p>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> o continúa con <div className="h-px flex-1 bg-border" />
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
            <svg className="size-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google
          </Button>
        </div>
      </div>
    </div>
  );
}
