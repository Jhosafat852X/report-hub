import type { AppRole } from "@/hooks/useUserData";

export const DEMO_PASSWORD = "Demo123456";

export const DEMO_ACCOUNTS: Array<{
  matricula: string;
  password: string;
  name: string;
  area: string;
  roles: AppRole[];
  label: string;
  description: string;
}> = [
  {
    matricula: "ADMIN01",
    password: DEMO_PASSWORD,
    name: "Administrador Demo",
    area: "Coordinacion administrativa",
    roles: ["admin"],
    label: "Administrador",
    description: "Gestiona usuarios, roles y ve todo el sistema.",
  },
  {
    matricula: "MANT01",
    password: DEMO_PASSWORD,
    name: "Mantenimiento Demo",
    area: "Mantenimiento",
    roles: ["mantenimiento"],
    label: "Mantenimiento",
    description: "Atiende reportes desde el mural y revisa historial.",
  },
  {
    matricula: "ENC01",
    password: DEMO_PASSWORD,
    name: "Encargado Demo",
    area: "Laboratorio de computo 2",
    roles: ["encargado"],
    label: "Encargado",
    description: "Crea reportes y consulta sus solicitudes.",
  },
];

export function matriculaToDemoEmail(matricula: string) {
  return `${matricula.trim().toLowerCase()}@unistmo.local`;
}
