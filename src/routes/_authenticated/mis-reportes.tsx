import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useUserData";
import { UrgenciaBadge, EstadoBadge } from "@/components/Badges";
import { Button } from "@/components/ui/button";
import { ClipboardPlus, Inbox } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/mis-reportes")({
  component: MisReportes,
});

function MisReportes() {
  const { data: user } = useCurrentUser();
  const { data: reportes, isLoading } = useQuery({
    queryKey: ["mis-reportes", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reportes")
        .select("*")
        .eq("creado_por", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mis reportes</h1>
          <p className="text-sm text-muted-foreground">Historial completo de tus solicitudes.</p>
        </div>
        <Link to="/nuevo-reporte">
          <Button className="gradient-primary"><ClipboardPlus className="size-4 mr-2" />Nuevo reporte</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Cargando…</div>
      ) : !reportes?.length ? (
        <div className="card-elevated p-10 text-center">
          <Inbox className="size-10 mx-auto text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">Aún no has enviado reportes.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {reportes.map((r) => (
            <div key={r.id} className="card-elevated p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold truncate">{r.asunto}</h3>
                  <UrgenciaBadge value={r.urgencia} />
                  <EstadoBadge value={r.estado} />
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.descripcion}</p>
                <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Creado: {format(new Date(r.created_at), "d 'de' MMM yyyy, HH:mm", { locale: es })}</span>
                  {r.fecha_programada && <span>Programado para: {format(new Date(r.fecha_programada), "d MMM yyyy", { locale: es })}</span>}
                  {r.fecha_finalizado && <span>Finalizado: {format(new Date(r.fecha_finalizado), "d MMM yyyy", { locale: es })}</span>}
                  {r.area && <span>Área: {r.area}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
