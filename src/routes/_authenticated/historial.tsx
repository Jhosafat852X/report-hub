import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UrgenciaBadge, EstadoBadge } from "@/components/Badges";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { History } from "lucide-react";

export const Route = createFileRoute("/_authenticated/historial")({
  component: Historial,
});

function Historial() {
  const { data, isLoading } = useQuery({
    queryKey: ["historial"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reportes")
        .select("*")
        .eq("estado", "finalizado")
        .order("fecha_finalizado", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-md bg-primary/10 text-primary grid place-items-center">
          <History className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Historial de reportes</h1>
          <p className="text-sm text-muted-foreground">Reportes ya finalizados.</p>
        </div>
      </div>

      <div className="card-elevated overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asunto</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Urgencia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Reportado por</TableHead>
              <TableHead>Atendido por</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead>Finalizado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">Cargando…</TableCell></TableRow>
            ) : !data?.length ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">No hay reportes finalizados aún.</TableCell></TableRow>
            ) : data.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium max-w-[260px] truncate">{r.asunto}</TableCell>
                <TableCell className="text-muted-foreground">{r.area || "—"}</TableCell>
                <TableCell><UrgenciaBadge value={r.urgencia} /></TableCell>
                <TableCell><EstadoBadge value={r.estado} /></TableCell>
                <TableCell className="text-muted-foreground">{r.creado_por_nombre}</TableCell>
                <TableCell className="text-muted-foreground">{r.atendido_por_nombre || "—"}</TableCell>
                <TableCell className="text-xs">{format(new Date(r.created_at), "d MMM yyyy", { locale: es })}</TableCell>
                <TableCell className="text-xs">{r.fecha_finalizado ? format(new Date(r.fecha_finalizado), "d MMM yyyy", { locale: es }) : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
