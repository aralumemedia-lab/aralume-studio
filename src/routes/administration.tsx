import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";
import { Card, SectionHeader } from "@/components/ui/data-card";
import { CompactTable, type Column } from "@/components/ui/compact-table";
import { StatusBadge } from "@/components/status/badges";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "invited" | "blocked";
  lastAccess: string;
};

const users: User[] = [
  {
    id: "u_01",
    name: "Ana Ribeiro",
    email: "ana@aralume.com",
    role: "Editora-chefe",
    status: "active",
    lastAccess: "hoje",
  },
  {
    id: "u_02",
    name: "Marcos Lima",
    email: "marcos@aralume.com",
    role: "Operador editorial",
    status: "active",
    lastAccess: "ontem",
  },
  {
    id: "u_03",
    name: "Júlia Costa",
    email: "julia@aralume.com",
    role: "Analista de conformidade",
    status: "active",
    lastAccess: "há 2 dias",
  },
  {
    id: "u_04",
    name: "Bruno Sato",
    email: "bruno@aralume.com",
    role: "Somente leitura",
    status: "invited",
    lastAccess: "—",
  },
];

export const Route = createFileRoute("/administration")({
  head: () => ({
    meta: [
      { title: "Administração — Aralume" },
      {
        name: "description",
        content: "Usuários, permissões, integrações e configurações globais.",
      },
    ],
  }),
  component: function AdministrationPage() {
    const cols: Column<User>[] = [
      {
        key: "name",
        header: "Usuário",
        render: (r) => <span className="font-medium">{r.name}</span>,
      },
      {
        key: "email",
        header: "E-mail",
        render: (r) => <span className="text-muted-foreground">{r.email}</span>,
      },
      { key: "role", header: "Perfil", render: (r) => <span>{r.role}</span> },
      {
        key: "status",
        header: "Status",
        render: (r) => (
          <StatusBadge
            tone={r.status === "active" ? "ok" : r.status === "invited" ? "attention" : "critical"}
            dot
          >
            {r.status}
          </StatusBadge>
        ),
      },
      {
        key: "last",
        header: "Último acesso",
        render: (r) => <span className="text-muted-foreground">{r.lastAccess}</span>,
      },
    ];
    return (
      <div>
        <PageHeader
          eyebrow="Plataforma"
          title="Administração"
          description="Gestão de usuários, perfis, integrações futuras e configurações operacionais."
        />
        <div className="p-4 space-y-4">
          <Card padded={false}>
            <div className="p-4 pb-2">
              <SectionHeader
                title="Usuários e permissões"
                description="Perfis e papéis operacionais. Autenticação real será conectada no backend."
              />
            </div>
            <CompactTable rows={users} columns={cols} className="border-0 rounded-none" />
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <SectionHeader title="Integrações futuras" />
              <ul className="text-[12px] text-muted-foreground space-y-1.5">
                <li>YouTube Data API (planejado)</li>
                <li>TikTok for Business (planejado)</li>
                <li>Instagram Graph API (planejado)</li>
                <li>LinkedIn Marketing (planejado)</li>
              </ul>
            </Card>
            <Card>
              <SectionHeader
                title="Modo operacional"
                description="Governança de execução real vs. simulada."
              />
              <ul className="text-[12px] space-y-1.5">
                <li className="flex items-center justify-between">
                  <span>Modo atual</span>
                  <StatusBadge tone="info">Demo</StatusBadge>
                </li>
                <li className="flex items-center justify-between">
                  <span>IA real</span>
                  <StatusBadge tone="muted">Desabilitada</StatusBadge>
                </li>
                <li className="flex items-center justify-between">
                  <span>Publicação externa</span>
                  <StatusBadge tone="muted">Desabilitada</StatusBadge>
                </li>
                <li className="flex items-center justify-between">
                  <span>Aprovação humana</span>
                  <StatusBadge tone="ok">Obrigatória</StatusBadge>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    );
  },
});
