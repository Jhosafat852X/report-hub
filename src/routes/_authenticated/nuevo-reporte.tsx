import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, useUserProfile } from "@/hooks/useUserData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { uploadReporteFoto } from "@/lib/reportes";
import { toast } from "sonner";
import { ImagePlus, X, Loader2 } from "lucide-react";

const Schema = z.object({
  asunto: z.string().trim().min(4, "Mínimo 4 caracteres").max(120),
  descripcion: z.string().trim().min(10, "Describe con más detalle").max(2000),
  area: z.string().trim().max(120).optional(),
  urgencia: z.enum(["baja", "media", "alta"]),
});
type FormVals = z.infer<typeof Schema>;

export const Route = createFileRoute("/_authenticated/nuevo-reporte")({
  component: NuevoReporte,
});

function NuevoReporte() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { data: profile } = useUserProfile();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormVals>({
    resolver: zodResolver(Schema),
    defaultValues: { asunto: "", descripcion: "", urgencia: "media", area: profile?.area || "" },
    values: { asunto: "", descripcion: "", urgencia: "media", area: profile?.area || "" },
  });

  function handleFile(f: File | null) {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function onSubmit(values: FormVals) {
    if (!user) return;
    setSubmitting(true);
    try {
      let foto_url: string | null = null;
      if (file) foto_url = await uploadReporteFoto(user.id, file);
      const { error } = await supabase.from("reportes").insert({
        asunto: values.asunto,
        descripcion: values.descripcion,
        urgencia: values.urgencia,
        area: values.area || profile?.area || null,
        foto_url,
        creado_por: user.id,
        creado_por_nombre: profile?.nombre_completo || user.email || "Sin nombre",
      });
      if (error) throw error;
      toast.success("Reporte enviado al equipo de mantenimiento");
      navigate({ to: "/mis-reportes" });
    } catch (e: any) {
      toast.error(e.message || "No se pudo enviar el reporte");
    } finally {
      setSubmitting(false);
    }
  }

  const urgencia = form.watch("urgencia");

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Nuevo reporte</CardTitle>
          <CardDescription>
            Describe la falla o necesidad para que el equipo de mantenimiento pueda atenderla.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="asunto">Asunto *</Label>
              <Input id="asunto" placeholder="Ej: Foco fundido en aula 12" {...form.register("asunto")} />
              {form.formState.errors.asunto && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.asunto.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="area">Sala / Área</Label>
              <Input id="area" placeholder="Ej: Lab. Cómputo 2" {...form.register("area")} />
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción del desperfecto *</Label>
              <Textarea id="descripcion" rows={5} placeholder="Detalla qué está fallando, desde cuándo y cualquier riesgo asociado." {...form.register("descripcion")} />
              {form.formState.errors.descripcion && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.descripcion.message}</p>
              )}
            </div>

            <div>
              <Label>Nivel de urgencia *</Label>
              <RadioGroup
                value={urgencia}
                onValueChange={(v) => form.setValue("urgencia", v as any)}
                className="grid grid-cols-3 gap-2 mt-2"
              >
                {([
                  { v: "baja", label: "Baja", desc: "Puede esperar", cls: "border-[var(--urgencia-baja)] data-[state=checked]:bg-[color-mix(in_oklab,var(--urgencia-baja)_15%,transparent)]" },
                  { v: "media", label: "Media", desc: "Atención pronta", cls: "border-[var(--urgencia-media)] data-[state=checked]:bg-[color-mix(in_oklab,var(--urgencia-media)_15%,transparent)]" },
                  { v: "alta", label: "Alta", desc: "Urgente", cls: "border-[var(--urgencia-alta)] data-[state=checked]:bg-[color-mix(in_oklab,var(--urgencia-alta)_15%,transparent)]" },
                ] as const).map((o) => (
                  <label key={o.v} htmlFor={`u-${o.v}`} className={`cursor-pointer rounded-md border-2 p-3 transition-colors ${urgencia === o.v ? o.cls : "border-border"}`}>
                    <RadioGroupItem id={`u-${o.v}`} value={o.v} className="sr-only" />
                    <div className="font-semibold text-sm">{o.label}</div>
                    <div className="text-xs text-muted-foreground">{o.desc}</div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label>Fotografía (opcional)</Label>
              {preview ? (
                <div className="relative mt-2 rounded-md overflow-hidden border border-border">
                  <img src={preview} alt="Vista previa" className="w-full max-h-64 object-cover" />
                  <button type="button" onClick={() => handleFile(null)} className="absolute top-2 right-2 size-7 rounded-full bg-background/90 grid place-items-center hover:bg-background">
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <label className="mt-2 flex items-center justify-center gap-2 rounded-md border-2 border-dashed border-border p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                  <ImagePlus className="size-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Adjuntar imagen</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
                </label>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/inicio" })}>Cancelar</Button>
              <Button type="submit" disabled={submitting} className="gradient-primary">
                {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                Enviar reporte
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
