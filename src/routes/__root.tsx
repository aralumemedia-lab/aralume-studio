import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "@/components/layout/AppShell";
import { ChannelProvider } from "@/components/aralume/channel-context";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-semibold text-foreground tracking-tight">404</h1>
        <h2 className="mt-3 text-sm font-medium text-foreground">Página não encontrada</h2>
        <p className="mt-1.5 text-xs text-muted-foreground">
          A rota solicitada não existe no painel Aralume.
        </p>
        <a
          href="/dashboard"
          className="mt-5 inline-flex items-center justify-center rounded-sm bg-primary px-3 h-8 text-xs font-medium text-primary-foreground hover:opacity-95"
        >
          Ir para o Dashboard
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-base font-semibold tracking-tight text-foreground">Esta página não carregou</h1>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Algo inesperado aconteceu. Você pode tentar novamente ou voltar para o Dashboard.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-sm bg-primary px-3 h-8 text-xs font-medium text-primary-foreground hover:opacity-95"
          >
            Tentar novamente
          </button>
          <a href="/dashboard" className="inline-flex items-center justify-center rounded-sm border border-border bg-surface px-3 h-8 text-xs font-medium text-foreground hover:bg-accent">
            Ir para o Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Aralume — Fábrica editorial multicanal com IA" },
      { name: "description", content: "Aralume é uma plataforma SaaS empresarial para operação de uma fábrica editorial multicanal baseada em agentes de IA, com governança, aprovação humana e rastreabilidade." },
      { name: "author", content: "Aralume" },
      { property: "og:title", content: "Aralume — Fábrica editorial multicanal com IA" },
      { property: "og:description", content: "Operação editorial supervisionada por multiagentes, com governança e rastreabilidade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ChannelProvider>
        <AppShell>
          <Outlet />
        </AppShell>
      </ChannelProvider>
    </QueryClientProvider>
  );
}
