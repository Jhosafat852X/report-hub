import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel,
  SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarHeader, SidebarFooter, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import {
  Wrench, ClipboardPlus, ListChecks, LayoutGrid, History, Users, LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, useUserProfile, useUserRoles, hasAnyRole, type AppRole } from "@/hooks/useUserData";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQueryClient } from "@tanstack/react-query";

type NavItem = { title: string; to: string; icon: any; roles: AppRole[] };

const NAV: NavItem[] = [
  { title: "Nuevo reporte", to: "/app/nuevo-reporte", icon: ClipboardPlus, roles: ["encargado", "admin"] },
  { title: "Mis reportes", to: "/app/mis-reportes", icon: ListChecks, roles: ["encargado", "admin"] },
  { title: "Mural", to: "/app/mural", icon: LayoutGrid, roles: ["mantenimiento", "admin"] },
  { title: "Historial", to: "/app/historial", icon: History, roles: ["mantenimiento", "admin"] },
  { title: "Usuarios", to: "/app/usuarios", icon: Users, roles: ["admin"] },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border bg-background/70 backdrop-blur flex items-center px-3 gap-3 sticky top-0 z-30">
            <SidebarTrigger />
            <div className="flex-1" />
          </header>
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: roles } = useUserRoles();
  const { data: profile } = useUserProfile();
  const { data: user } = useCurrentUser();
  const router = useRouter();
  const qc = useQueryClient();

  const items = NAV.filter((i) => hasAnyRole(roles, i.roles));
  const initials = (profile?.nombre_completo || user?.email || "?")
    .split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/app" className="flex items-center gap-2 px-2 py-2">
          <div className="size-9 rounded-md bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center shrink-0">
            <Wrench className="size-5" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold text-sidebar-foreground">Mural</div>
              <div className="text-[10px] text-sidebar-foreground/70">UNISTMO Ixtepec</div>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Navegación</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.to || pathname.startsWith(item.to + "/");
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={item.to} className="flex items-center gap-2">
                        <item.icon className="size-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-1 py-1">
          <Avatar className="size-8">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-sidebar-foreground truncate">
                {profile?.nombre_completo || user?.email}
              </div>
              <div className="text-[10px] text-sidebar-foreground/60 truncate">
                {roles?.join(", ") || "—"}
              </div>
            </div>
          )}
          <Button
            variant="ghost" size="icon"
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground size-8"
            onClick={signOut}
            title="Cerrar sesión"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
