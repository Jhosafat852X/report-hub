import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, Info, Clock, CalendarCheck, CheckCircle2 } from "lucide-react";

type Urgencia = "baja" | "media" | "alta";
type Estado = "pendiente" | "programado" | "finalizado";

const URG: Record<Urgencia, { label: string; cls: string; icon: any }> = {
  baja: { label: "Baja", cls: "bg-[color-mix(in_oklab,var(--urgencia-baja)_18%,transparent)] text-[var(--urgencia-baja)] border border-[color-mix(in_oklab,var(--urgencia-baja)_30%,transparent)]", icon: Info },
  media: { label: "Media", cls: "bg-[color-mix(in_oklab,var(--urgencia-media)_18%,transparent)] text-[color-mix(in_oklab,var(--urgencia-media)_55%,black)] border border-[color-mix(in_oklab,var(--urgencia-media)_30%,transparent)]", icon: AlertCircle },
  alta: { label: "Alta", cls: "bg-[color-mix(in_oklab,var(--urgencia-alta)_18%,transparent)] text-[var(--urgencia-alta)] border border-[color-mix(in_oklab,var(--urgencia-alta)_35%,transparent)]", icon: AlertTriangle },
};

const EST: Record<Estado, { label: string; cls: string; icon: any }> = {
  pendiente: { label: "Pendiente", cls: "bg-muted text-foreground border border-border", icon: Clock },
  programado: { label: "Programado", cls: "bg-primary/10 text-primary border border-primary/30", icon: CalendarCheck },
  finalizado: { label: "Finalizado", cls: "bg-success/15 text-success border border-success/30", icon: CheckCircle2 },
};

export function UrgenciaBadge({ value, className }: { value: Urgencia; className?: string }) {
  const c = URG[value];
  const Icon = c.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", c.cls, className)}>
      <Icon className="size-3" /> {c.label}
    </span>
  );
}

export function EstadoBadge({ value, className }: { value: Estado; className?: string }) {
  const c = EST[value];
  const Icon = c.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", c.cls, className)}>
      <Icon className="size-3" /> {c.label}
    </span>
  );
}

export function urgenciaRank(u: Urgencia) {
  return { alta: 0, media: 1, baja: 2 }[u];
}
