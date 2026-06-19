import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useUserRoles, useUserProfile, hasAnyRole } from "@/hooks/useUserData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ClipboardPlus, ListChecks, LayoutGrid, History, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/inicio")({
  component: Inicio,
});

function Inicio() {
  const { data: profile } = useUserProfile();
  const { data: roles, isLoading } = useUserRoles();

  const isManto = hasAnyRole(roles, ["mantenimiento", "admin"]);
  const isEncargado = hasAnyRole(roles, ["encargado", "admin"]);

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reportes")
        .select("estado, urgencia");
      if (error) throw error;
      const arr = data ?? [];
      return {
        pendientes: arr.filter((r) => r.estado === "pendiente").length,
        programados: arr.filter((r) => r.estado === "programado").length,
        finalizados: arr.filter((r) => r.estado === "finalizado").length,
        altas: arr.filter((r) => r.estado !== "finalizado" && r.urgencia === "alta").length,
      };
    },
  });

  if (isLoading) return null;
  if (!roles || roles.length === 0) {
    return (
      <div className="max-w-xl mx-auto card-elevated p-6">
        <h2 className="font-semibold">Sin rol asignado</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Contacta a un administrador para que te asigne un rol.
        </p>
      </div>
    );
  }

  // If user is ONLY mantenimiento, send to mural directly
  if (isManto && !isEncargado) return <Navigate to="/mural" replace />;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Hola, {profile?.nombre_completo?.split(" ")[0] || "bienvenido"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Panel general del sistema de reportes de mantenimiento.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Pendientes" value={stats?.pendientes ?? 0} tone="warning" />
        <StatCard label="Programados" value={stats?.programados ?? 0} tone="primary" />
        <StatCard label="Finalizados" value={stats?.finalizados ?? 0} tone="success" />
        <StatCard label="Urgencia alta" value={stats?.altas ?? 0} tone="destructive" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {isEncargado && (
          <ActionCard icon={ClipboardPlus} to="/nuevo-reporte" title="Nuevo reporte" desc="Reporta una falla o desperfecto en tu sala." />
        )}
        {isEncargado && (
          <ActionCard icon={ListChecks} to="/mis-reportes" title="Mis reportes" desc="Consulta el estado de los reportes que has enviado." />
        )}
        {isManto && (
          <ActionCard icon={LayoutGrid} to="/mural" title="Mural" desc="Atiende los reportes activos organizados por urgencia." />
        )}
        {isManto && (
          <ActionCard icon={History} to="/historial" title="Historial" desc="Reportes ya finalizados con fechas y responsables." />
        )}
        {hasAnyRole(roles, ["admin"]) && (
          <ActionCard icon={Users} to="/usuarios" title="Usuarios" desc="Gestiona roles y permisos del personal." />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "warning" | "primary" | "success" | "destructive" }) {
  const colors = {
    warning: "from-warning/20 to-warning/5 text-warning-foreground border-warning/30",
    primary: "from-primary/15 to-primary/5 text-primary border-primary/30",
    success: "from-success/15 to-success/5 text-success border-success/30",
    destructive: "from-destructive/15 to-destructive/5 text-destructive border-destructive/30",
  }[tone];
  return (
    <div className={`card-elevated bg-gradient-to-br ${colors} p-4`}>
      <div className="text-xs uppercase tracking-wide opacity-80">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}

function ActionCard({ icon: Icon, to, title, desc }: { icon: any; to: string; title: string; desc: string }) {
  return (
    <Link to={to as any}>
      <Card className="card-elevated hover:ring-accent transition-shadow h-full">
        <CardHeader>
          <div className="size-10 rounded-md bg-primary/10 text-primary grid place-items-center">
            <Icon className="size-5" />
          </div>
          <CardTitle className="mt-3">{title}</CardTitle>
          <CardDescription>{desc}</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </Link>
  );
}
