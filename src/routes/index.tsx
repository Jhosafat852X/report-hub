import { createFileRoute, Link } from "@tanstack/react-router";
import { Wrench, ClipboardList, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mural de Mantenimiento — UNISTMO Ixtepec" },
      { name: "description", content: "Reporta fallas en salas y aulas y da seguimiento en tiempo real al equipo de mantenimiento." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-lg gradient-primary grid place-items-center">
              <Wrench className="size-5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Mural de Mantenimiento</div>
              <div className="text-[11px] text-muted-foreground">UNISTMO Campus Ixtepec</div>
            </div>
          </div>
          <Link to="/auth">
            <Button variant="default" className="gap-2">
              Iniciar sesión <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent-foreground">
              <span className="size-1.5 rounded-full bg-accent" /> PRY-003 · Sistema interno
            </span>
            <h1 className="mt-4 text-4xl md:text-6xl font-bold tracking-tight text-foreground">
              Reporta. Programa.<br />
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Resuelve.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              Plataforma digital para que encargados de sala notifiquen fallas
              y el equipo de mantenimiento las atienda con orden, prioridad y trazabilidad.
            </p>
            <div className="mt-8 flex gap-3">
              <Link to="/auth">
                <Button size="lg" className="gradient-primary">Acceder al sistema</Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            {[
              { icon: ClipboardList, title: "Formulario de reporte", desc: "Asunto, descripción, foto y nivel de urgencia en un solo paso." },
              { icon: Wrench, title: "Mural en tiempo real", desc: "Todos los pendientes visibles para mantenimiento, ordenados por urgencia." },
              { icon: ShieldCheck, title: "Acceso controlado", desc: "Roles diferenciados para encargados, mantenimiento y administración." },
            ].map((f) => (
              <div key={f.title} className="card-elevated p-5 flex gap-4">
                <div className="size-10 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
                  <f.icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Universidad del Istmo Campus Ixtepec · Área de Mantenimiento
      </footer>
    </div>
  );
}
