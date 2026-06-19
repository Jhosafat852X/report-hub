import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, useUserProfile } from "@/hooks/useUserData";
import { UrgenciaBadge, EstadoBadge, urgenciaRank } from "@/components/Badges";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { getSignedUrl } from "@/lib/reportes";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarCheck, CheckCircle2, LayoutGrid, MapPin, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/mural")({
  component: Mural,
});

type Reporte = {
  id: string; asunto: string; descripcion: string; urgencia: "baja" | "media" | "alta";
  estado: "pendiente" | "programado" | "finalizado"; foto_url: string | null;
  area: string | null; creado_por_nombre: string; created_at: string;
  fecha_programada: string | null;
};

function Mural() {
  const qc = useQueryClient();
  const { data: reportes, isLoading } = useQuery({
    queryKey: ["mural"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reportes")
        .select("*")
        .in("estado", ["pendiente", "programado"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Reporte[];
    },
    refetchInterval: 30_000,
  });

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel("mural-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "reportes" }, () => {
        qc.invalidateQueries({ queryKey: ["mural"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const sorted = (reportes ?? []).slice().sort((a, b) => urgenciaRank(a.urgencia) - urgenciaRank(b.urgencia));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-md bg-primary/10 text-primary grid place-items-center">
          <LayoutGrid className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Mural de reportes activos</h1>
          <p className="text-sm text-muted-foreground">Organizados por urgencia. Se actualiza en tiempo real.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando…</div>
      ) : !sorted.length ? (
        <div className="card-elevated p-10 text-center">
          <CheckCircle2 className="size-10 mx-auto text-success" />
          <p className="mt-3 text-muted-foreground">No hay reportes activos. ¡Todo en orden!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((r) => <ReporteCard key={r.id} r={r} />)}
        </div>
      )}
    </div>
  );
}

function ReporteCard({ r }: { r: Reporte }) {
  const qc = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: profile } = useUserProfile();
  const [open, setOpen] = useState(false);
  const [fecha, setFecha] = useState(r.fecha_programada || "");
  const [notas, setNotas] = useState("");
  const [signed, setSigned] = useState<string | null>(null);

  useEffect(() => {
    if (open && r.foto_url) getSignedUrl(r.foto_url).then(setSigned);
  }, [open, r.foto_url]);

  const programar = useMutation({
    mutationFn: async () => {
      if (!fecha) throw new Error("Selecciona una fecha");
      const { error } = await supabase.from("reportes").update({
        estado: "programado", fecha_programada: fecha,
        atendido_por: user?.id, atendido_por_nombre: profile?.nombre_completo || user?.email,
      }).eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Reporte programado"); qc.invalidateQueries({ queryKey: ["mural"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const finalizar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("reportes").update({
        estado: "finalizado", fecha_finalizado: new Date().toISOString(),
        notas_mantenimiento: notas || null,
        atendido_por: user?.id, atendido_por_nombre: profile?.nombre_completo || user?.email,
      }).eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Reporte finalizado"); qc.invalidateQueries({ queryKey: ["mural"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const borderTone =
    r.urgencia === "alta" ? "border-l-4 border-l-[var(--urgencia-alta)]" :
    r.urgencia === "media" ? "border-l-4 border-l-[var(--urgencia-media)]" :
    "border-l-4 border-l-[var(--urgencia-baja)]";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={`card-elevated text-left p-4 ${borderTone} hover:ring-accent transition-shadow w-full`}>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight line-clamp-2">{r.asunto}</h3>
            <UrgenciaBadge value={r.urgencia} />
          </div>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{r.descripcion}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><User className="size-3" />{r.creado_por_nombre}</span>
            {r.area && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{r.area}</span>}
            <span>{format(new Date(r.created_at), "d MMM, HH:mm", { locale: es })}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <EstadoBadge value={r.estado} />
            {r.fecha_programada && (
              <span className="text-xs text-primary inline-flex items-center gap-1">
                <CalendarCheck className="size-3" />
                {format(new Date(r.fecha_programada), "d MMM", { locale: es })}
              </span>
            )}
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{r.asunto}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="flex flex-wrap gap-2">
            <UrgenciaBadge value={r.urgencia} />
            <EstadoBadge value={r.estado} />
          </div>
          <p className="whitespace-pre-wrap">{r.descripcion}</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Reportado por: <span className="text-foreground">{r.creado_por_nombre}</span></div>
            {r.area && <div>Área: <span className="text-foreground">{r.area}</span></div>}
            <div>Creado: {format(new Date(r.created_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}</div>
          </div>
          {r.foto_url && signed && (
            <img src={signed} alt="Foto del reporte" className="rounded-md w-full max-h-72 object-cover border border-border" />
          )}
          <div className="grid gap-2 pt-2 border-t border-border">
            <Label htmlFor={`fecha-${r.id}`}>Fecha de atención</Label>
            <Input id={`fecha-${r.id}`} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            <Label htmlFor={`notas-${r.id}`}>Notas (opcional)</Label>
            <Textarea id={`notas-${r.id}`} rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Observaciones del trabajo realizado…" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => programar.mutate()} disabled={programar.isPending}>
            <CalendarCheck className="size-4 mr-2" /> Programar
          </Button>
          <Button className="gradient-primary" onClick={() => finalizar.mutate()} disabled={finalizar.isPending}>
            <CheckCircle2 className="size-4 mr-2" /> Finalizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
