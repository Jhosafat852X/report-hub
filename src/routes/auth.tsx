import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

const MATRICULA_DOMAIN = "unistmo.local";
function matriculaToEmail(matricula: string) {
  return `${matricula.trim().toLowerCase()}@${MATRICULA_DOMAIN}`;
}
function isValidMatricula(m: string) {
  return /^[a-zA-Z0-9]{4,15}$/.test(m.trim());
}

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/inicio" });
    });
  }, [navigate]);

  const [matricula, setMatricula] = useState("");
  const [password, setPassword] = useState("");
  const [sName, setSName] = useState("");
  const [sMatricula, setSMatricula] = useState("");
  const [sPass, setSPass] = useState("");
  const [sArea, setSArea] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidMatricula(matricula)) return toast.error("Matrícula inválida");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: matriculaToEmail(matricula),
      password,
    });
    setLoading(false);
    if (error) return toast.error("Matrícula o contraseña incorrecta");
    toast.success("Bienvenido");
    navigate({ to: "/inicio" });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidMatricula(sMatricula)) return toast.error("Matrícula inválida (4-15 caracteres alfanuméricos)");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: matriculaToEmail(sMatricula),
      password: sPass,
      options: {
        emailRedirectTo: `${window.location.origin}/inicio`,
        data: {
          nombre_completo: sName,
          area: sArea,
          matricula: sMatricula.trim().toLowerCase(),
        },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Cuenta creada. Ya puedes iniciar sesión.");
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
            Ingresa con tu matrícula institucional.
          </p>

          <Tabs defaultValue="login" className="mt-6">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-5">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="matricula">Matrícula</Label>
                  <Input
                    id="matricula"
                    required
                    autoComplete="username"
                    placeholder="Ej: 2021A0123"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="pwd">Contraseña</Label>
                  <Input id="pwd" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
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
                  <Label htmlFor="smatricula">Matrícula</Label>
                  <Input
                    id="smatricula"
                    required
                    placeholder="Ej: 2021A0123"
                    value={sMatricula}
                    onChange={(e) => setSMatricula(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="sarea">Sala / Área asignada</Label>
                  <Input id="sarea" placeholder="Ej: Lab. Cómputo 2" value={sArea} onChange={(e) => setSArea(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="spwd">Contraseña</Label>
                  <Input id="spwd" type="password" autoComplete="new-password" required minLength={6} value={sPass} onChange={(e) => setSPass(e.target.value)} />
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
        </div>
      </div>
    </div>
  );
}
