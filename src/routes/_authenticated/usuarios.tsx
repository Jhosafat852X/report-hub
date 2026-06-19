import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";
import type { AppRole } from "@/hooks/useUserData";

export const Route = createFileRoute("/_authenticated/usuarios")({
  component: Usuarios,
});

const ROLES: AppRole[] = ["encargado", "mantenimiento", "admin"];

function Usuarios() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const [{ data: profiles, error: e1 }, { data: roles, error: e2 }] = await Promise.all([
        supabase.from("profiles").select("*").order("nombre_completo"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (e1) throw e1; if (e2) throw e2;
      const byUser = new Map<string, AppRole[]>();
      (roles ?? []).forEach((r: any) => {
        const arr = byUser.get(r.user_id) || [];
        arr.push(r.role);
        byUser.set(r.user_id, arr);
      });
      return (profiles ?? []).map((p) => ({ ...p, roles: byUser.get(p.id) || [] }));
    },
  });

  const toggleRole = useMutation({
    mutationFn: async ({ userId, role, has }: { userId: string; role: AppRole; has: boolean }) => {
      if (has) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["usuarios"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-md bg-primary/10 text-primary grid place-items-center">
          <UsersIcon className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Usuarios y roles</h1>
          <p className="text-sm text-muted-foreground">Asigna o quita roles a los usuarios registrados.</p>
        </div>
      </div>

      <div className="card-elevated overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Roles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Cargando…</TableCell></TableRow>
            ) : data?.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.nombre_completo || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{u.email || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{u.area || "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {ROLES.map((r) => {
                      const has = u.roles.includes(r);
                      return (
                        <Button
                          key={r}
                          size="sm"
                          variant={has ? "default" : "outline"}
                          className={has ? "gradient-primary h-7" : "h-7"}
                          onClick={() => toggleRole.mutate({ userId: u.id, role: r, has })}
                          disabled={toggleRole.isPending}
                        >
                          {r}
                        </Button>
                      );
                    })}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Al registrarse, cada usuario recibe el rol <strong>encargado</strong> por defecto.
      </p>
    </div>
  );
}
