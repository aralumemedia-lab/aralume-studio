import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Radio,
  Users,
  Workflow,
  Lightbulb,
  BookOpen,
  FileText,
  Images,
  Film,
  Scissors,
  CheckSquare,
  Send,
  BarChart3,
  Wallet,
  ShieldCheck,
  Settings,
  ScrollText,
  Search,
  Bell,
  AlertTriangle,
  ChevronDown,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
} from "lucide-react";
import { AralumeLogo } from "@/components/aralume/AralumeLogo";
import { useChannelContext } from "@/components/aralume/channel-context";
import { cn } from "@/lib/utils";
import { ChannelStatusBadge } from "@/components/status/badges";
import { formatCurrencyCents } from "@/lib/format";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
};
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: "Operação",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/channels", label: "Canais", icon: Radio },
      { to: "/agent-office", label: "Escritório de Agentes", icon: Users },
      { to: "/production", label: "Produção", icon: Workflow },
    ],
  },
  {
    label: "Editorial",
    items: [
      { to: "/ideas", label: "Pautas", icon: Lightbulb },
      { to: "/research", label: "Pesquisas", icon: BookOpen },
      { to: "/scripts", label: "Roteiros", icon: FileText },
      { to: "/media-assets", label: "Ativos de Mídia", icon: Images },
      { to: "/videos", label: "Vídeos", icon: Film },
      { to: "/clips", label: "Cortes", icon: Scissors },
    ],
  },
  {
    label: "Governança",
    items: [
      { to: "/approvals", label: "Aprovações", icon: CheckSquare },
      { to: "/publications", label: "Publicações", icon: Send },
      { to: "/metrics", label: "Métricas", icon: BarChart3 },
      { to: "/costs", label: "Custos", icon: Wallet },
      { to: "/compliance", label: "Conformidade", icon: ShieldCheck },
    ],
  },
  {
    label: "Plataforma",
    items: [
      { to: "/administration", label: "Administração", icon: Settings },
      { to: "/audit-logs", label: "Logs e Auditoria", icon: ScrollText },
    ],
  },
];

function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  return (
    <aside
      className={cn(
        "flex flex-col shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 scrollbar-thin",
        collapsed ? "w-[56px]" : "w-[248px]",
      )}
    >
      <div
        className={cn(
          "flex items-center h-14 px-3 border-b border-sidebar-border",
          collapsed && "justify-center px-0",
        )}
      >
        <AralumeLogo compact={collapsed} iconClassName="text-primary-soft" />
      </div>
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-3">
            {!collapsed && (
              <div className="px-3 mb-1 text-[10px] font-medium uppercase tracking-[0.1em] text-sidebar-muted">
                {group.label}
              </div>
            )}
            <ul>
              {group.items.map((item) => {
                const active = pathname === item.to || pathname.startsWith(item.to + "/");
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={cn(
                        "flex items-center gap-2.5 mx-1.5 my-0.5 rounded-sm h-8 px-2 text-[12.5px] transition-colors",
                        active
                          ? "bg-sidebar-active text-sidebar-active-foreground"
                          : "text-sidebar-foreground/85 hover:bg-sidebar-active/60 hover:text-sidebar-active-foreground",
                        collapsed && "justify-center px-0",
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon size={15} className="shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div
        className={cn(
          "border-t border-sidebar-border px-3 py-2 text-[10.5px] text-sidebar-muted",
          collapsed && "text-center px-1",
        )}
      >
        {collapsed ? "v0.1" : "Aralume · v0.1 · Modo demo"}
      </div>
    </aside>
  );
}

function ChannelSwitcher() {
  const { channels, activeChannelId, setActiveChannelId, activeChannel } = useChannelContext();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-sm border border-border bg-surface px-2.5 h-8 text-[12px] hover:bg-accent/50"
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            activeChannel?.status === "active"
              ? "bg-ok"
              : activeChannel?.status === "warning"
                ? "bg-warning"
                : "bg-muted-foreground",
          )}
        />
        <span className="font-medium text-foreground truncate max-w-[180px]">
          {activeChannel?.name ?? "Selecionar canal"}
        </span>
        <ChevronDown size={13} className="text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-9 z-20 w-[280px] rounded-md border border-border bg-popover shadow-lg p-1">
            <div className="px-2 pt-1.5 pb-1 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
              Canais
            </div>
            <button
              onClick={() => {
                setActiveChannelId(undefined);
                setOpen(false);
              }}
              className={cn(
                "flex items-center gap-2 w-full text-left rounded-sm px-2 h-8 text-[12px] hover:bg-accent/60",
                !activeChannelId && "bg-accent/50",
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-info" />
              <span className="flex-1">Todos os canais</span>
              {!activeChannelId && <Check size={13} className="text-info" />}
            </button>
            <div className="my-1 h-px bg-border" />
            {channels.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveChannelId(c.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 w-full text-left rounded-sm px-2 py-1.5 hover:bg-accent/60",
                  activeChannelId === c.id && "bg-accent/50",
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-foreground truncate">
                      {c.name}
                    </span>
                    <ChannelStatusBadge status={c.status} />
                  </div>
                  <div className="text-[10.5px] text-muted-foreground mt-0.5 truncate">
                    {c.niche} · {formatCurrencyCents(c.monthlyCostUsedCents)} /{" "}
                    {formatCurrencyCents(c.monthlyBudgetCents)}
                  </div>
                </div>
                {activeChannelId === c.id && <Check size={13} className="text-info" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Topbar({
  onToggleSidebar,
  collapsed,
}: {
  onToggleSidebar: () => void;
  collapsed: boolean;
}) {
  return (
    <header className="flex items-center gap-3 h-14 px-4 border-b border-border bg-surface">
      <button
        onClick={onToggleSidebar}
        className="inline-flex items-center justify-center h-8 w-8 rounded-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        aria-label="Alternar sidebar"
      >
        {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </button>
      <ChannelSwitcher />
      <div className="relative flex-1 max-w-[420px]">
        <Search
          size={13}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          placeholder="Buscar conteúdos, agentes, workflows..."
          className="h-8 w-full rounded-sm border border-border bg-surface pl-7 pr-3 text-[12px] outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <button className="inline-flex items-center gap-1.5 h-8 px-2 rounded-sm text-[12px] text-muted-foreground hover:bg-accent/50 hover:text-foreground">
          <AlertTriangle size={14} /> <span>3 alertas</span>
        </button>
        <button
          className="inline-flex items-center justify-center h-8 w-8 rounded-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          aria-label="Notificações"
        >
          <Bell size={14} />
        </button>
        <button className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-sm bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-95">
          <Plus size={14} /> Nova pauta
        </button>
        <div className="ml-2 flex items-center gap-2 h-8 pl-2 pr-1 rounded-sm">
          <div className="h-6 w-6 rounded-full bg-primary/15 text-primary text-[11px] font-semibold flex items-center justify-center">
            AR
          </div>
          <div className="text-[11px] leading-tight hidden md:block">
            <div className="font-medium text-foreground">Ana Ribeiro</div>
            <div className="text-muted-foreground">Editora-chefe</div>
          </div>
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar collapsed={collapsed} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar onToggleSidebar={() => setCollapsed((v) => !v)} collapsed={collapsed} />
        <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="border-b border-border bg-surface">
      <div className="px-6 py-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <div className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              {eyebrow}
            </div>
          )}
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground leading-tight mt-0.5">
            {title}
          </h1>
          {description && (
            <p className="text-[12.5px] text-muted-foreground mt-1 max-w-3xl">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
