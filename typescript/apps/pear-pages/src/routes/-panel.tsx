import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

// The one layout every public page on this server shares: a narrow panel with
// the instance's name where a product would put its own. The instance is what
// the member is actually signing in to, so it is what the page is titled by.

export type Instance = { name: string; inviteRequired: boolean };

export function useInstance(): Instance | undefined {
  const { data } = useQuery({
    queryKey: ["instance"],
    queryFn: async (): Promise<Instance> => {
      const res = await fetch("/xrpc/network.habitat.instance.describeInstance");
      if (!res.ok) throw new Error("describeInstance failed");
      return (await res.json()) as Instance;
    },
    staleTime: 5 * 60 * 1000,
  });
  return data;
}

export function Panel({
  title,
  lede,
  children,
  footer,
}: {
  title: string;
  lede?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex w-full max-w-sm flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {lede && <p className="text-sm text-muted-foreground">{lede}</p>}
      </header>
      {children && (
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">{children}</section>
      )}
      {footer && <footer className="text-xs text-muted-foreground">{footer}</footer>}
    </main>
  );
}
