import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CheckCircle2, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEMO_ACCOUNTS, matriculaToDemoEmail } from "@/lib/demo-accounts";

const seedDemoAccounts = createServerFn({ method: "POST" })
  .inputValidator((data: { token?: string }) => data)
  .handler(async ({ data }: { data: { token?: string } }) => {
    const expectedToken = process.env.DEMO_SEED_TOKEN;
    if (expectedToken && data.token !== expectedToken) {
      throw new Error("Token demo incorrecto.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { DEMO_ACCOUNTS, matriculaToDemoEmail } = await import("@/lib/demo-accounts");
    const prepared: Array<{ matricula: string; role: string; email: string }> = [];

    for (const account of DEMO_ACCOUNTS) {
      const email = matriculaToDemoEmail(account.matricula);
      const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      if (listError) throw listError;
      const existingUser = existingUsers.users.find((user) => user.email?.toLowerCase() === email);
      let userId = existingUser?.id;

      if (userId) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: account.password,
          email_confirm: true,
          user_metadata: {
            nombre_completo: account.name,
            area: account.area,
            matricula: account.matricula.toLowerCase(),
          },
        });
        if (error) throw error;
      } else {
        const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: account.password,
          email_confirm: true,
          user_metadata: {
            nombre_completo: account.name,
            area: account.area,
            matricula: account.matricula.toLowerCase(),
          },
        });
        if (error) throw error;
        userId = created.user?.id;
      }

      if (!userId) throw new Error(`No se pudo preparar ${account.matricula}.`);

      const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
        id: userId,
        nombre_completo: account.name,
        email,
        area: account.area,
      });
      if (profileError) throw profileError;

      const { error: deleteRolesError } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      if (deleteRolesError) throw deleteRolesError;

      const { error: rolesError } = await supabaseAdmin
        .from("user_roles")
        .insert(account.roles.map((role) => ({ user_id: userId, role })));
      if (rolesError) throw rolesError;

      prepared.push({ matricula: account.matricula, role: account.roles.join(", "), email });
    }

    return { prepared, tokenRequired: Boolean(expectedToken) };
  });

export const Route = createFileRoute("/demo-access")({
  component: DemoAccessPage,
});

function DemoAccessPage() {
  const seedDemoAccountsFn = useServerFn(seedDemoAccounts);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSeed() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await seedDemoAccountsFn({ data: { token: token || undefined } });
      setResult(`Cuentas listas: ${response.prepared.map((item: { matricula: string }) => item.matricula).join(", ")}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron preparar las cuentas demo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
              <ShieldCheck className="size-4" />
              Acceso para capturas
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Cuentas demo por rol</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Prepara usuarios de administrador, mantenimiento y encargado para entrar rapido desde
              Vercel.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/auth">Ir a iniciar sesion</Link>
          </Button>
        </div>

        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <label htmlFor="seed-token" className="text-sm font-medium">
                Token demo
              </label>
              <Input
                id="seed-token"
                className="mt-2"
                placeholder="Opcional si DEMO_SEED_TOKEN no esta configurado"
                value={token}
                onChange={(event) => setToken(event.target.value)}
              />
            </div>
            <Button onClick={handleSeed} disabled={loading} className="gradient-primary">
              {loading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 size-4" />
              )}
              Preparar cuentas demo
            </Button>
          </div>
          {result && (
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="size-4" />
              {result}
            </p>
          )}
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {DEMO_ACCOUNTS.map((account) => (
            <article key={account.matricula} className="rounded-lg border bg-card p-4 shadow-sm">
              <h2 className="text-lg font-semibold">{account.label}</h2>
              <p className="mt-1 min-h-10 text-sm text-muted-foreground">{account.description}</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Matricula</dt>
                  <dd className="font-mono font-medium">{account.matricula}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Contrasena</dt>
                  <dd className="font-mono font-medium">{account.password}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Correo interno</dt>
                  <dd className="break-all font-mono text-xs">
                    {matriculaToDemoEmail(account.matricula)}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
